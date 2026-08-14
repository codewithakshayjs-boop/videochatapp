import mongoose from 'mongoose';
const ChatSessionSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, default: Date.now }, endedAt: Date,
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'active' },
  endReason: { type: String, enum: ['user-ended', 'next', 'disconnect', 'error'] }
}, { timestamps: true });
export default mongoose.model('ChatSession', ChatSessionSchema);
