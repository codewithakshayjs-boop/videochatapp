import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectDatabase } from './config/db.js';

const app = express();

// Configure Express trust proxy to support deployments behind proxies/load-balancers
// Set `TRUST_PROXY=true` in env to enable (or set to a number/string accepted by Express).
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1' || (process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === undefined)) {
    app.set('trust proxy', 1);
} else if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY);
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(directory, '../../client/dist');
// Allow all origins by reflecting the request origin (needed for cookies/credentials).
const corsOptions = { origin: true, credentials: true };

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            // NSFWJS and TensorFlow.js are loaded on demand for video moderation.
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        },
    },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.use('/api', rateLimit({ windowMs: 60_000, limit: 120 }));

// Ensure database is connected before handling API requests (serverless-friendly)
app.use('/api', async (req, res, next) => {
    if (!process.env.MONGO_URI) return next();
    if (mongoose.connection.readyState === 1) return next();
    try {
        await connectDatabase();
        return next();
    } catch (err) {
        console.error('Database unavailable for request:', err.message);
        return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// Public sitemap for SEO / Google bot
const sitemapPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/profile',
    '/profile/name',
    '/profile/dob',
    '/confirmation',
    '/searching',
    '/chat',
    '/messages',
];

app.get('/sitemap.xml', (req, res) => {
    // Prefer a built sitemap in clientDist if present (survives client build if produced there)
    const built = path.join(clientDist, 'sitemap.xml');
    if (fs.existsSync(built)) return res.sendFile(built);

    const base = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const lastmod = new Date().toISOString().slice(0, 10);
    const urlEntries = sitemapPaths
        .map((p) => `  <url>\n    <loc>${base}${p}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`)
        .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
    res.type('application/xml').send(xml);
});

app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
app.use(errorHandler);

export default app;
