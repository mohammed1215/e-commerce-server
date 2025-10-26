import { Router } from 'express'
import { upload } from '../config/multer.js';
import { createProduct, deleteProduct, getOneProduct, getProducts, updateProduct, searchProduct } from '../controllers/product.controllers.js';
import { isAuth } from '../middlewares/isAuth.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import { body } from 'express-validator';

const CATEGORIES = ['T-Shirts', 'Shorts', 'Shirts', 'Hoodies', 'Jeans']
const router = Router();

// auth/...
router.get('/products', getProducts)
router.get('/products/:_id', getOneProduct)
router.post('/products', isAuth, isAdmin, upload.array('images', 4), [
  body('title')
    .notEmpty().withMessage('Field is required'),
  body('description')
    .notEmpty().withMessage('Field is required'),
  body('price')
    .notEmpty().withMessage('Field is required')
    .isFloat({ min: 0.1 }),
  body('colors')
    .customSanitizer((value) => {
      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    })
    .isArray({ min: 1 }).withMessage('Field is required'),
  body('colors.*.hex')
    .isHexColor().withMessage('Must be Hex'),
  body('colors.*.color')
    .notEmpty().withMessage('missing color attribute inside colors array'),
  body('stock')
    .notEmpty().withMessage('Field is required').isInt({ min: 1 }),
  body('category')
    .notEmpty().withMessage('Field is required')
    .custom((value) => {
      if (CATEGORIES.includes(value)) {
        return true
      }
      throw new Error("Field must be one of these categories('T-Shirts', 'Shorts', 'Shirts', 'Hoodies', 'Jeans')")
    }),
  body('sizes')
    .customSanitizer((value) => {
      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    })
    .isArray({ min: 1 }).withMessage('Field is required'),
  body('sizes.*.size')
    .notEmpty().withMessage("sizes doesn't have specific size"),
  body('images')
    .custom((value, { req }) => {
      console.log("files", req.files)
      if (!req.files || req.files.length === 0) {
        throw new Error("You should upload at least 1 image");
      }
      if (req.files.length > 4) {
        throw new Error("You can upload at most 4 images");
      }
      return true;
    })

], createProduct)
router.post('/products/search', searchProduct)
router.patch('/products/:_id', isAuth, isAdmin, upload.array('images', 4), updateProduct)
router.delete('/products/:_id', isAuth, isAdmin, deleteProduct)

export default router