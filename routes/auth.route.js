import { Router } from 'express'
import { login, register, authMe } from '../controllers/auth.controllers.js';
import { upload } from '../config/multer.js';


const router = Router();

// auth/...
router.post('/signup', upload.single('image'), register)
router.post('/login', login)
router.get('/me', authMe)

export default router