import { enqueue, remove } from '../services/matchmakingService.js';
export function registerSocketHandlers(io) {
 io.on('connection', (socket) => {
  socket.on('join-queue', ({ userId, name, gender, mode = 'video' }) => { socket.data.userId = userId; socket.data.gender = gender; socket.data.profile = { name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 50) : 'Chai friend', gender: typeof gender === 'string' ? gender : '' }; socket.data.mode = ['text', 'audio', 'video'].includes(mode) ? mode : 'video'; const stranger = enqueue(socket); if (!stranger) return socket.emit('queue-status', { status: 'waiting' }); const roomId = [socket.id, stranger.id].sort().join(':'); socket.join(roomId); stranger.join(roomId); socket.data.roomId = stranger.data.roomId = roomId; socket.emit('match-found', { peerId: stranger.id, initiator: true, mode: socket.data.mode, peerProfile: stranger.data.profile, peerName: stranger.data.profile.name, peerGender: stranger.data.profile.gender }); stranger.emit('match-found', { peerId: socket.id, initiator: false, mode: stranger.data.mode, peerProfile: socket.data.profile, peerName: socket.data.profile.name, peerGender: socket.data.profile.gender }); });
  socket.on('leave-queue', () => remove(socket.id));
  socket.on('signal', ({ to, signal }) => io.to(to).emit('signal', { from: socket.id, signal }));
  socket.on('stranger-message', ({ message }) => { if (!socket.data.roomId || socket.data.mode !== 'text' || typeof message !== 'string') return; const clean = message.trim().slice(0, 1000); if (clean) socket.to(socket.data.roomId).emit('stranger-message', { message: clean }); });
  const leave = (reason) => { remove(socket.id); if (socket.data.roomId) { socket.to(socket.data.roomId).emit('stranger-left', { reason }); socket.leave(socket.data.roomId); socket.data.roomId = null; } };
  socket.on('next-stranger', () => leave('next'));
  socket.on('end-call', () => leave('user-ended'));
  socket.on('disconnect', () => leave('disconnect'));
 });
}
