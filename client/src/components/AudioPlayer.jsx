import { useEffect, useRef } from 'react';

export default function AudioPlayer({ stream }) {
  const ref = useRef();
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}
