import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useChat } from '../context/ChatContext';
import api from '../services/api';

export default function Payment() {
    const { user, setUser } = useChat();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(user?.paymentStatus || 'pending');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => script.remove();
    }, []);

    const updateStatus = async (nextStatus) => {
        setStatus(nextStatus);
        await api.post('/payment-status', { status: nextStatus }).catch(() => {});
    };

    const startPayment = async () => {
        setBusy(true);
        setMessage('');
        try {
            const { data: order } = await api.post('/create-order', { amount: 900, currency: 'INR' });
            if (!window.Razorpay) throw new Error('Payment checkout is still loading. Please try again.');
            let paymentFinished = false;
            const checkout = new window.Razorpay({
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'CHAIYO',
                description: 'Lifetime access',
                order_id: order.order_id,
                prefill: { name: user?.name },
                method: { upi: true, wallet: true, card: true, netbanking: true, emi: true, paylater: true },
                theme: { color: '#cf175e' },
                handler: async (response) => {
                    paymentFinished = true;
                    try {
                        const { data } = await api.post('/verify-payment', response);
                        setStatus(data.paymentStatus);
                        setUser((current) => ({ ...current, paymentStatus: data.paymentStatus }));
                        setMessage(data.message);
                        navigate('/');
                    } catch (error) {
                        await updateStatus('failed');
                        setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support.');
                    }
                },
                modal: { ondismiss: async () => { if (!paymentFinished) { await updateStatus('pending'); setMessage('Payment was cancelled. Your access is still locked until payment succeeds.'); } } },
            });
            checkout.on('payment.failed', async (response) => { paymentFinished = true; await updateStatus('failed'); setMessage(response.error?.description || 'Payment failed. Please try again.'); });
            checkout.open();
        } catch (error) {
            setMessage(error.response?.data?.message || error.message || 'Unable to start payment. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return <main className="setup-page payment-page"><a href="/" className="brand small"><i>☕</i> CHAI<span>YO</span></a><section className="setup-card payment-card"><p className="payment-kicker">ONE-TIME MEMBERSHIP</p><h1>Keep the chai flowing.</h1><p>Pay ₹9 once for lifetime access to audio, video, and text chat on CHAIYO.</p><p>Choose UPI, Google Pay, PhonePe, another UPI app, wallet, card, or any payment method available in Razorpay Checkout.</p><div className={`payment-status ${status}`}><strong>Payment status: {status}</strong><small>{status === 'paid' ? 'Your lifetime membership is active.' : 'Access unlocks as soon as payment is verified.'}</small></div>{message && <p className={status === 'paid' ? 'success' : 'error'}>{message}</p>}{status === 'paid' ? <Button onClick={() => navigate('/')}>Go to CHAIYO</Button> : <Button disabled={busy} onClick={startPayment}>{busy ? 'Opening secure checkout…' : 'Pay ₹9 now'}</Button>}</section></main>;
}
