import { Router } from 'express';
import { createOrder, updatePaymentStatus, verifyPayment } from '../controllers/paymentController.js';

const router = Router();
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/payment-status', updatePaymentStatus);
export default router;
