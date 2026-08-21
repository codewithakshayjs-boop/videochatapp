import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../hooks/useSocket';

export default function PresenceBar() {
    const { user } = useChat();
    const { socket } = useSocket();
    const [presence, setPresence] = useState({ online: 0, offline: 0 });

    useEffect(() => {
        const currentSocket = socket.current;
        const updatePresence = (nextPresence) => setPresence({
            online: Number(nextPresence?.online) || 0,
            offline: Number(nextPresence?.offline) || 0,
        });
        const requestPresence = () => {
            currentSocket.emit('presence-auth', user?._id || user?.id || null);
            currentSocket.emit('request-presence');
        };
        currentSocket.on('presence-update', updatePresence);
        currentSocket.on('connect', requestPresence);
        if (currentSocket.connected) requestPresence();
        return () => {
            currentSocket.off('presence-update', updatePresence);
            currentSocket.off('connect', requestPresence);
        };
    }, [socket, user]);

    return <div className="presence-bar" aria-live="polite" aria-label="Portal user status">
        <span className="presence-item online-item"><i className="presence-dot online" /><b>{presence.online}</b><span>Online</span></span>
        <span className="presence-divider" aria-hidden="true" />
        <span className="presence-item offline-item"><i className="presence-dot offline" /><b>{presence.offline}</b><span>Offline</span></span>
    </div>;
}
