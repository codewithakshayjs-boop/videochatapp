import { enqueue, remove } from '../services/matchmakingService.js';
export function registerSocketHandlers(io) {
 io.on('connection', (socket) => {
  socket.on('join-queue', ({ userId, gender }) => { socket.data.userId = userId; socket.data.gender = gender; const stranger = enqueue(socket); if (!stranger) return socket.emit('queue-status', { status: 'waiting' }); const roomId = [socket.id, stranger.id].sort().join(':'); socket.join(roomId); stranger.join(roomId); socket.data.roomId = stranger.data.roomId = roomId; socket.emit('match-found', { peerId: stranger.id, initiator: true }); stranger.emit('match-found', { peerId: socket.id, initiator: false }); });
  socket.on('leave-queue', () => remove(socket.id));
  socket.on('signal', ({ to, signal }) => io.to(to).emit('signal', { from: socket.id, signal }));
  const leave = (reason) => { remove(socket.id); if (socket.data.roomId) { socket.to(socket.data.roomId).emit('stranger-left', { reason }); socket.leave(socket.data.roomId); socket.data.roomId = null; } };
  socket.on('next-stranger', () => leave('next'));
  socket.on('end-call', () => leave('user-ended'));
  socket.on('disconnect', () => leave('disconnect'));
 });
}
