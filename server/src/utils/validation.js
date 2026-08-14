import { z } from 'zod';
export const userSchema = z.object({ name: z.string().trim().min(2).max(50), gender: z.enum(['male', 'female']), dateOfBirth: z.string().date() });
export const authSchema = z.object({ username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_.-]+$/, 'Use letters, numbers, dots, dashes or underscores only.'), password: z.string().min(8).max(128) });
export function isAdult(value) { const dob = new Date(value); const now = new Date(); let age = now.getFullYear() - dob.getFullYear(); const offset = now.getMonth() - dob.getMonth(); if (offset < 0 || (offset === 0 && now.getDate() < dob.getDate())) age--; return age >= 18; }
