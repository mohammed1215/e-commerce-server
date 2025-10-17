import express from 'express'
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import authRouter from './routes/auth.route.js';
import productRouter from './routes/product.route.js';
import winston from 'winston';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import reviewRouter from './routes/review.route.js';
// import cloudinary from './config/cloudinary.js'
import { v2 as cloudinary } from 'cloudinary';
dotenv.config()

// cloudinary config
cloudinary.config({
  cloud_name: 'dfuu4nifi',
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return stack ?
        `${timestamp} [${level}]: ${stack}` :
        `${timestamp} [${level}]: ${message}`
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ]
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

//variables
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;

const app = express();



//mongoose config
mongoose.connect(DB_URL).then(() => {
  console.log(`db is connected`)
  app.listen(PORT, () => logger.info(`server is running on port ${PORT}`))
}).catch(err => {
  logger.error(err)
})

//static files
app.use("/images", express.static(path.join(__dirname, 'images')))

// parsing middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: [process.env.FRONTEND_SITE],
  credentials: true
}))
app.use(cookieParser(process.env.SECRET_COOKIE_KEY))

//routes
// {signup, login}
app.use("/auth", authRouter)
app.use(productRouter)
app.use('/reviews', reviewRouter)
