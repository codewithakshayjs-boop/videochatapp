import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
const VideoPlayer = forwardRef(function VideoPlayer({ stream, muted = false, className = '', label, blurred = false }, forwardedRef) {
  const ref = useRef();
  useImperativeHandle(forwardedRef, () => ref.current);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return <div className={`video-frame ${className}${blurred ? ' safety-blurred' : ''}`}><video ref={ref} autoPlay playsInline muted={muted} />{!stream && <div className="video-empty">{label}</div>}</div>;
});
export default VideoPlayer;
