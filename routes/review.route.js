import { Router } from "express";
import { createReviewForProduct, getReviewsPerProduct } from "../controllers/review.controller.js";
import { isAuth } from "../middlewares/isAuth.js";
const router = Router();

// /reviews/...
router.get('/:productId', getReviewsPerProduct)
router.post('/:productId', isAuth, createReviewForProduct)

export default router