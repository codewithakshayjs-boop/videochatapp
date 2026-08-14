import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  username: { type: String, trim: true, lowercase: true, unique: true, sparse: true, minlength: 3, maxlength: 30 },
  passwordHash: { type: String, select: false },
  gender: { type: String, enum: ['male', 'female'], required: true },
  dateOfBirth: { type: Date, required: true },
  lastLogin: Date
}, { timestamps: true });
export default mongoose.model('User', UserSchema);
