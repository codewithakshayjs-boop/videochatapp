const waiting = new Map();
export function enqueue(socket) { if (waiting.has(socket.id)) return null; const candidates = [...waiting.values()].filter((person) => person.socket.id !== socket.id && compatible(socket, person.socket)); const match = candidates[Math.floor(Math.random() * candidates.length)]; if (!match) { waiting.set(socket.id, { socket }); return null; } waiting.delete(match.socket.id); return match.socket; }
export function remove(socketId) { waiting.delete(socketId); }
function compatible(a, b) { return a.data.mode === b.data.mode && (process.env.MATCHING_MODE !== 'opposite' || a.data.gender !== b.data.gender); }
