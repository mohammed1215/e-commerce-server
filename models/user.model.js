import mongoose from "mongoose";


const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'MERCHANT'], default: 'USER' },
  imgPath: { type: String }
}, { timestamps: true })

const User = mongoose.model('user', UserSchema)

export default User