import { Router } from 'express'
import { upload } from '../config/multer.js';
import { createProduct, deleteProduct, getOneProduct, getProducts, updateProduct, searchProduct } from '../controllers/product.controllers.js';
import { isAuth } from '../middlewares/isAuth.js';
import { isAdmin } from '../middlewares/isAdmin.js';


const router = Router();

// auth/...
router.get('/products', getProducts)
router.get('/products/:_id', getOneProduct)
router.post('/products', isAuth, isAdmin, upload.single('image'), createProduct)
router.post('/products/search', searchProduct)
router.patch('/products/:_id', isAuth, isAdmin, upload.single('image'), updateProduct)
router.delete('/products/:_id', isAuth, isAdmin, deleteProduct)

export default router