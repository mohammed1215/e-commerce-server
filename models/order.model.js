import mongoose, { Types } from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: Types.ObjectId, ref: "Product", required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      color: { type: Types.ObjectId, required: true },
      size: { type: Types.ObjectId, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'] },
  transactionId: String,
  payerEmail: String,
  paypalOrderId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
})
const Order = mongoose.model('order', OrderSchema)

export default Order