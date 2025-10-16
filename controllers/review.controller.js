import { logger } from "../index.js";
import Review from "../models/comment.model.js"

export const getReviewsPerProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId })
      .select('comment rating userName userAvatar createdAt')
    const reviewsCount = await Review.countDocuments()
    return res.json({ data: reviews, reviewsCount })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}

export const createReviewForProduct = async (req, res) => {
  try {

    const { comment, rating } = req.body;
    const { imgPath, fullname } = req.user;
    const { productId } = req.params;

    const createdReview = await Review.create({
      userId: req.user._id,
      comment,
      productId,
      rating,
      userAvatar: imgPath,
      userName: fullname
    })

    const projectedReview = await Review.findById(createdReview._id)
      .select('comment rating userName userAvatar createdAt')


    return res.status(201).json({ review: projectedReview, message: "comment created successfully" })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ message: error.message });
  }
}