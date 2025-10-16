import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {

    const token = req.cookies.token
    console.log(token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded._id)

    req.user = user;
    next()
  } catch (error) {

    if (jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'token is expired' });
    } else if (jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'invalid token' });

    } else {
      logger.error(error)
      return res.status(500).json({ message: error.message });
    }

  }
}