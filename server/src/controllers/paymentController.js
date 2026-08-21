import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import User from '../models/User.js';

const amountInPaise = 900;

function getSessionUserId(req) {
    const token = req.cookies.sparklink_session;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'development-only-secret-change-me').sub;
    } catch {
        return null;
    }
}

async function requireUser(req, res) {
    const userId = getSessionUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: 'Please sign in to continue.' });
        return null;
    }
    const user = await User.findById(userId);
    if (!user) {
        res.status(401).json({ success: false, message: 'Session expired.' });
        return null;
    }
    return user;
}

export async function createOrder(req, res) {
    const user = await requireUser(req, res);
    if (!user) return;
    const requestedAmount = Number(req.body?.amount ?? amountInPaise);
    if (!Number.isInteger(requestedAmount) || requestedAmount < 100 || requestedAmount !== amountInPaise)
        return res.status(400).json({ success: false, message: 'Payment amount must be 900 paise.' });
    if (user.paymentStatus === 'paid')
        return res.status(409).json({ success: false, message: 'This account already has lifetime access.' });
    try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const order = await razorpay.orders.create({ amount: amountInPaise, currency: 'INR', receipt: `chaiyo_${user._id}_${Date.now()}` });
        user.paymentStatus = 'pending';
        user.razorpayOrderId = order.id;
        await user.save();
        res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        const status = error.statusCode === 401 ? 401 : 500;
        res.status(status).json({ success: false, message: status === 401 ? 'Razorpay authentication failed.' : 'Unable to create payment order.' });
    }
}

export async function verifyPayment(req, res) {
    const user = await requireUser(req, res);
    if (!user) return;
    const { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = req.body || {};
    if (!paymentId || !orderId || !signature) return res.status(400).json({ success: false, message: 'Payment verification details are incomplete.' });
    if (user.razorpayOrderId !== orderId) return res.status(400).json({ success: false, message: 'Payment order does not belong to this account.' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) {
        user.paymentStatus = 'failed';
        await user.save();
        return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }
    user.paymentStatus = 'paid';
    user.razorpayPaymentId = paymentId;
    user.razorpaySignature = signature;
    user.paidAt = new Date();
    await user.save();
    res.json({ success: true, message: 'Payment successful. Lifetime access is now active.', paymentStatus: user.paymentStatus });
}

export async function updatePaymentStatus(req, res) {
    const user = await requireUser(req, res);
    if (!user) return;
    const { status } = req.body || {};
    if (!['pending', 'failed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    if (user.paymentStatus !== 'paid') {
        user.paymentStatus = status;
        await user.save();
    }
    res.json({ success: true, paymentStatus: user.paymentStatus });
}
