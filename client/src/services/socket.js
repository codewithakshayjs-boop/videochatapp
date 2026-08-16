import { io } from 'socket.io-client';
let socket;
// Use VITE_SOCKET_URL to point to your realtime server (must support WebSockets).
// Allow polling fallback so the client can still connect when websocket upgrade fails.
export const createSocket = () =>
    socket ||= io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
    });
