import { Router } from 'express'
import { login, register } from '../controllers/auth.controllers.js';
import { upload } from '../config/multer.js';


const router = Router();

// auth/...
router.post('/signup', upload.single('image'), register)
router.post('/login', login)

export default router