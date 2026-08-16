import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import ChatControls from '../components/ChatControls';
import Button from '../components/Button';

export default function VideoChat() {
  const { stream, stopStream, user } = useChat();
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

  useEffect(() => {
    if (!stream || !state || !user) return navigate('/');
    const onSignal = (payload) => receive(payload);
    const onLeft = () => { close(); setStatus('Your match left the call.'); setCallEnded(true); };
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
  const end = () => { socket.current.emit('end-call'); close(); setStatus('You ended this call.'); setCallEnded(true); };
  const leaveApp = () => { stopStream(); navigate('/'); };

  return <main className="chat-page">
    <header className="chat-header"><a href="/" className="brand small"><i>◔</i> spark<span>link</span></a><span><b>●</b> {remoteStream && !callEnded ? 'Connected' : status}</span><button onClick={leaveApp}>Leave chat</button></header>
    <section className="room">
      <VideoPlayer stream={remoteStream} label={status} className="remote" />
      <VideoPlayer stream={stream} muted label="You" className="local" />
      {callEnded ? <div className="call-ended"><div><span>✓</span><p>CALL ENDED</p><h1>Ready for someone new?</h1><small>Your profile details are saved for this session.</small><Button onClick={next}>Start next video chat →</Button></div></div> : <><div className="room-copy"><p>Matched with someone new</p><h1>Say hello 👋</h1></div><ChatControls muted={muted} cameraOff={cameraOff} flipping={flipping} onMute={toggleMute} onCamera={toggleCamera} onFlip={flipCamera} onNext={next} onEnd={end} /></>}
    </section>
  </main>;
}
