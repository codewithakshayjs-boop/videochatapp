import { useEffect, useState } from 'react';

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = seconds % 60;
  return `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes % 60).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export default function ChatDuration({ startedAt, endedAt = null, label = 'Chat time' }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (endedAt !== null) return undefined; const interval = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(interval); }, [endedAt]);
  const duration = (endedAt !== null ? endedAt : now) - startedAt;
  return <span className="chat-duration">◷ {label} {formatDuration(duration)}</span>;
}

export { formatDuration };
