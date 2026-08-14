import { Router } from 'express';
import { currentUser, login, logout, register } from '../controllers/authController.js';
const router = Router();
router.post('/register', register); router.post('/login', login); router.post('/logout', logout); router.get('/me', currentUser);
export default router;
