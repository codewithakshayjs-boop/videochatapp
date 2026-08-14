import User from '../models/User.js';
import { isAdult, userSchema } from '../utils/validation.js';
export async function createUser(req, res) { const data = userSchema.parse(req.body); if (!isAdult(data.dateOfBirth)) return res.status(422).json({ success: false, message: 'You must be 18 or older to use video chat.' }); const user = await User.create(data); res.status(201).json({ success: true, user }); }
export async function getUser(req, res) { const user = await User.findById(req.params.id); if (!user) return res.status(404).json({ success: false, message: 'User not found.' }); res.json({ success: true, user }); }
