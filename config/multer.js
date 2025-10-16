import multer from "multer"
import path from 'path'
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images/')
//   },
//   filename: (req, file, cb) => {
//     const fileExt = path.extname(file.originalname)
//     const filename = Date.now() + "_" + crypto.randomUUID() + fileExt
//     cb(null, filename)
//   }
// })
const storage = multer.memoryStorage()
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})