import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../hooks/useSocket';
import ChatDuration, { formatDuration } from '../components/ChatDuration';

export default function TextChat() {
  const { user } = useChat(); const { socket } = useSocket(); const { state } = useLocation(); const navigate = useNavigate();
  const [messages, setMessages] = useState([]); const [draft, setDraft] = useState(''); const [ended, setEnded] = useState(false);
  const [startedAt] = useState(() => Date.now()); const [endedAt, setEndedAt] = useState(null);
  useEffect(() => { if (!user || !state) return navigate('/'); const receive = ({ message }) => setMessages((items) => [...items, { body: message, mine: false }]); const left = () => { setEndedAt(Date.now()); setEnded(true); }; socket.current.on('stranger-message', receive); socket.current.on('stranger-left', left); return () => { socket.current.off('stranger-message', receive); socket.current.off('stranger-left', left); }; }, [user, state, socket, navigate]);
  const send = (event) => { event.preventDefault(); const body = draft.trim(); if (!body || ended) return; socket.current.emit('stranger-message', { message: body }); setMessages((items) => [...items, { body, mine: true }]); setDraft(''); };
  const next = () => { socket.current.emit('next-stranger'); navigate('/searching'); };
  const leave = () => { if (ended) return navigate('/'); socket.current.emit('end-call'); setEndedAt(Date.now()); setEnded(true); };
  const peerProfile = state?.peerProfile || { name: 'Chai friend', gender: '' };
  return <main className="text-chat-page"><header className="chat-header"><a href="/" className="brand small"><i>◔</i> CHAI<span>YO</span></a><span><b>●</b> {ended ? 'Chat ended' : 'Chai text chat'}</span><ChatDuration startedAt={startedAt} endedAt={endedAt} label="Text" /><button onClick={leave}>{ended ? 'Return home' : 'Leave chat'}</button></header><section className="message-room"><div className="message-intro"><span>☕</span><p>{ended ? `This chat lasted ${formatDuration((endedAt !== null ? endedAt : Date.now()) - startedAt)}.` : <>You matched with <strong>{peerProfile.name}</strong>{peerProfile.gender ? ` · ${peerProfile.gender}` : ''}. Start gently.</>}</p></div><div className="messages">{messages.map((item, index) => <p key={index} className={item.mine ? 'mine' : 'theirs'}>{item.body}</p>)}</div>{ended ? <button className="message-next" onClick={next}>Find another chai talk →</button> : <form className="message-form" onSubmit={send}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share what’s on your mind…" maxLength="1000" autoFocus /><button type="submit">Send</button></form>}</section></main>;
}
