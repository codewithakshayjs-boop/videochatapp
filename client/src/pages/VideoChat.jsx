import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import AudioPlayer from '../components/AudioPlayer';
import ChatControls from '../components/ChatControls';
import ChatDuration, { formatDuration } from '../components/ChatDuration';
import Button from '../components/Button';

export default function VideoChat() {
  const { stream, stopStream, user, setChatMode } = useChat();
  const { socket } = useSocket();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { remoteStream, create, receive, replaceVideoTrack, close } = useWebRTC(socket, stream);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [flipping, setFlipping] = useState(false);
  const [status, setStatus] = useState('Connecting securely…');
  const [callEnded, setCallEnded] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState(null);
  const audioOnly = state?.mode === 'audio';
  const peerProfile = state?.peerProfile || { name: 'Chai friend', gender: '' };

  useEffect(() => {
    if (!stream || !state || !user) return navigate('/');
    const onSignal = (payload) => receive(payload);
    const onLeft = () => { close(); setStatus('Your match left the call.'); setEndedAt(Date.now()); setCallEnded(true); };
    socket.current.on('signal', onSignal);
    socket.current.on('stranger-left', onLeft);
    create(state.peerId, state.initiator).catch(() => { setStatus('Connection failed.'); setCallEnded(true); });
    return () => { socket.current.off('signal', onSignal); socket.current.off('stranger-left', onLeft); close(); };
  }, [stream, state, user, socket, create, receive, close, navigate]);

  const toggleMute = () => {
    const track = stream?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };
  const toggleCamera = () => {
    const track = stream?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); }
  };
  const flipCamera = async () => {
    const oldTrack = stream?.getVideoTracks()[0];
    if (!oldTrack || flipping || !navigator.mediaDevices?.getUserMedia) return;
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setFlipping(true);
    let cameraStream;
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: nextFacing } }, audio: false });
      const newTrack = cameraStream.getVideoTracks()[0];
      newTrack.enabled = oldTrack.enabled;
      await replaceVideoTrack(oldTrack, newTrack);
      stream.removeTrack(oldTrack);
      stream.addTrack(newTrack);
      oldTrack.stop();
      setCameraFacing(nextFacing);
    } catch (error) {
      cameraStream?.getTracks().forEach((track) => track.stop());
      setStatus(nextFacing === 'environment' ? 'Back camera is not available on this device.' : 'Front camera is not available on this device.');
    } finally {
      setFlipping(false);
    }
  };
  const next = () => { socket.current.emit('next-stranger'); close(); navigate('/searching'); };
  const chooseNextMode = (mode) => { setChatMode(mode); socket.current.emit('next-stranger'); close(); if (mode === 'text') stopStream(); navigate('/searching'); };
  const end = () => { socket.current.emit('end-call'); close(); setStatus('You ended this call.'); setEndedAt(Date.now()); setCallEnded(true); };
  const leaveApp = () => { stopStream(); navigate('/'); };

  return <main className="chat-page">
    <header className="chat-header"><a href="/" className="brand small"><i>☕</i> CHAI<span>YO</span></a><span><b>●</b> {remoteStream && !callEnded ? 'Connected' : status}</span><ChatDuration startedAt={startedAt} endedAt={endedAt} label={audioOnly ? 'Audio' : 'Video'} /><button onClick={leaveApp}>Leave chat</button></header>
    <section className="room">
      {audioOnly ? <div className="audio-call"><AudioPlayer stream={remoteStream} /><span>☕</span><p>{remoteStream ? 'You’re connected — let the conversation steep.' : status}</p><h1>Audio chai talk</h1></div> : <><VideoPlayer stream={remoteStream} label={status} className="remote" /><VideoPlayer stream={stream} muted label="You" className="local" /></>}
      {callEnded ? <div className="call-ended"><div><span>✓</span><p>CHAI TALK ENDED</p><h1>How would you like to connect next?</h1><small>You chatted for {formatDuration((endedAt || Date.now()) - startedAt)}. Choose a mode and we’ll find someone looking for the same kind of conversation.</small><div className="call-mode-options"><button onClick={() => chooseNextMode('text')}><b>⌁</b>Text chat</button><button onClick={() => chooseNextMode('audio')}><b>◉</b>Audio call</button><button onClick={() => chooseNextMode('video')}><b>◔</b>Video call</button></div></div></div> : <><div className="room-copy"><p>Chai talk with someone new</p><h1>{audioOnly ? 'Listen, share, connect' : 'Say hello 👋'}</h1><div className="peer-details"><b>{peerProfile.name}</b>{peerProfile.gender && <span>{peerProfile.gender}</span>}</div></div><ChatControls muted={muted} cameraOff={cameraOff} flipping={flipping} audioOnly={audioOnly} onMute={toggleMute} onCamera={toggleCamera} onFlip={flipCamera} onNext={next} onEnd={end} /></>}
    </section>
  </main>;
}
