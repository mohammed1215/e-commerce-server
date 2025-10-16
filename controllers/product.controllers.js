import { isValidObjectId } from "mongoose"
import { logger } from "../index.js"
import Product from "../models/product.model.js"
import cloudinary from 'cloudinary'
import { Readable } from 'stream'


export const getProducts = async (req, res, next) => {
  try {
    const page = req.query.page;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const {
      size,
      color,
      category,
      price_min: rawMin,
      price_max: rawMax,
    } = req.query;

    //helper
    const present = v => v !== undefined && v !== null && String(v).trim() !== '';

    // coerce numeric query params
    const price_min = present(rawMin) ? Number(rawMin) : undefined;
    const price_max = present(rawMax) ? Number(rawMax) : undefined;

    // build filter explicitly (safer than blind fromEntries)
    const filter = {};
    if (present(size)) filter['sizes.size'] = size;
    if (present(color)) filter['colors.name'] = color;
    if (present(category)) filter.category = category;
    if (price_min !== undefined || price_max !== undefined) {
      filter.price = {};
      if (price_min !== undefined) filter.price.$gte = price_min; // >=
      if (price_max !== undefined) filter.price.$lte = price_max; // <=
    }

    console.log(filter)

    const products = await Product.find(filter).limit(limit).skip(skip)

    const productCounts = await Product.countDocuments();

    return res.json({ data: products, productCounts })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}

export const getOneProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    if (!isValidObjectId(_id)) return res.status(404).json({ message: "Product Not Found" })
    const product = await Product.findById(_id)
    return res.json({ data: product })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}
/**
 * 
 * @param {import("express").Request} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
export const createProduct = async (req, res, next) => {
  try {
    let { title, description, price, colors, stock, category, sizes } = req.body;

    if (!title || !description || !price || !category)
      return res.status(400).json({ message: "Missing required fields" });

    if (sizes) sizes = JSON.parse(req.body.sizes);
    if (colors) colors = JSON.parse(req.body.colors)


    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const stream = cloudinary.v2.uploader.upload_stream({
      folder: "products",
      resource_type: "image",        // use auto to detect png/jpg/webp
      // allowed_formats: ["jpg", "png", "webp"]
    }, async (err, result) => {
      const createdProduct = await Product.create({
        title,
        description,
        price,
        category,
        colors,
        stock,
        imgPath: result.secure_url,
        sizes,
        userId: req.user._id
      })

      return res.json({ data: createdProduct })
    })
    Readable.from(req.file.buffer).pipe(stream)
  } catch (error) {
    logger.error(error.message)
    return res.status(500).json({ message: error });
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    let { title, description, price, category, colors, stock, sizes } = req.body;

    if (!isValidObjectId(_id)) return res.status(404).json({ message: "Product Not Found" })

    if (sizes) sizes = JSON.parse(req.body.sizes);
    if (colors) colors = JSON.parse(req.body.colors)


    const file = req.file?.filename
    const imgPath = file ? `/images/${file}` : null;

    const stream = cloudinary.v2.uploader.upload_stream({
      folder: "products",
      resource_type: "image",        // use auto to detect png/jpg/webp
      // allowed_formats: ["jpg", "png", "webp"]
    }, async (err, result) => {
      const updatedProduct = await Product.findByIdAndUpdate(_id, {
        title,
        description,
        price,
        category,
        colors,
        stock,
        imgPath: result.secure_url,
        sizes,
        userId: req.user._id
      }, { new: true })
      return res.json({ data: updatedProduct })
    })

    Readable.from(req.file.buffer).pipe(stream)
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}

export const deleteProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    if (!isValidObjectId(_id)) return res.status(404).json({ message: "Product Not Found" })

    const deleteResult = await Product.findByIdAndDelete(_id);

    return res.json({ message: "deleted successfully" })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}

export const searchProduct = async (req, res) => {
  try {
    const { title } = req.body;
    const { page = 1, limit = 10 } = req.query;
    if (!title) {
      return res.status(400).json({ message: "title must not be empty" })
    }

    const regex = new RegExp(`^.*${title}.*$`, 'i')

    const searchQuery = Product.find({ $or: [{ title: regex }, { description: regex }] }, {
      stock: 0
    })
    const searchResult = await searchQuery.limit(limit).skip((page - 1) * limit).sort({ createdAt: "asc" })

    const numberOfProducts = await searchQuery.clone().countDocuments()

    return res.json({ searchResult, numberOfProducts })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
} // title , price , !todo: rating , imgPath , category 