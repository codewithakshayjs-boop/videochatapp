import ChatSession from '../models/ChatSession.js';
export async function createChat(req, res) { const chat = await ChatSession.create({ user1: req.body.user1, user2: req.body.user2 }); res.status(201).json({ success: true, chat }); }
export async function endChat(req, res) { const chat = await ChatSession.findByIdAndUpdate(req.params.id, { status: 'ended', endedAt: new Date(), endReason: req.body.reason || 'user-ended' }, { new: true }); if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' }); res.json({ success: true, chat }); }
