import { Router } from 'express'
import { login, register, authMe, logout, updateUserData } from '../controllers/auth.controllers.js';
import { upload } from '../config/multer.js';
import { body } from 'express-validator';
import { isAuth } from '../middlewares/isAuth.js';

const VALID_ROLES = ['USER', 'MERCHANT']

const router = Router();
// fullname, email, password, role
// auth/...
router.post('/signup', upload.single('image'), [
  body('fullname')
    .notEmpty().withMessage('field must not be empty'),
  body('email')
    .notEmpty().withMessage('field must not be empty')
    .isEmail().withMessage('not valid email'),
  body('password')
    .notEmpty().withMessage('field must not be empty')
    .isLength({ min: 8 }).withMessage('the length must be at least 8'),
  body('role')
    .notEmpty({ ignore_whitespace: true }).withMessage('field must not be empty')
    .custom((value, { req }) => {
      if (VALID_ROLES.includes(value)) {
        return true
      }
      throw new Error('Role Must be MERCHANT or USER')
    }),

], register)
router.post('/login', login)
router.get('/me', authMe)
router.post('/logout', logout)
router.post('/update', isAuth, upload.single('image'), updateUserData)
export default router