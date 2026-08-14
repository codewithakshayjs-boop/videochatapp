import { io } from 'socket.io-client';
let socket;
export const createSocket = () => socket ||= io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { transports: ['websocket'] });
