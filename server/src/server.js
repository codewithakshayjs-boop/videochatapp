import 'dotenv/config'; import { createServer } from 'node:http'; import { Server } from 'socket.io'; import app from './app.js'; import { connectDatabase } from './config/db.js'; import { registerSocketHandlers } from './socket/socketHandler.js';

const allowedOrigins = process.env.CLIENT_URL?.split(',') || ['http://localhost:5173', 'http://localhost:5000'];
const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === 'true';
const ioCors = allowAllOrigins
    ? { origin: true, methods: ['GET', 'POST'], credentials: true }
    : { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true };

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: ioCors });

(async function start() {
    try {
        await connectDatabase();
        registerSocketHandlers(io);
        const port = process.env.PORT || 5000;
        httpServer.listen(port, () => console.log(`Sparklink is running on http://localhost:${port}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();


