import mongoose, { Types } from "mongoose";


const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  sizes: [
    {
      size: { type: String, enum: ['S', 'M', 'L', 'XL'] },
      available: { type: Boolean, default: true }
    }
  ],
  price: { type: Number, required: true, min: 0 },
  colors: [{ name: String, hex: String }],
  imgPath: { type: String, required: true },
  category: { type: String, enum: ['T-Shirts', 'Shorts', 'Shirts', 'Hoodies', 'Jeans'], required: true },
  stock: { type: Number, default: 0 },
  userId: { type: Types.ObjectId, required: true }
}, { timestamps: true })

const Product = mongoose.model('Product', ProductSchema)

export default Product