import mongoose, { Types } from "mongoose";


const ReviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  productId: {
    type: Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  userName: String,
  userAvatar: String,
  comment: { type: String, trim: true }
}, { timestamps: true })

// prevent one user from reviewing same product twice
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Review = mongoose.model('Review', ReviewSchema)

export default Review