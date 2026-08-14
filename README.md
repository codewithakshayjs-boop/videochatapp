# Sparklink — random video chat

Sparklink is a responsive, 18+ random video chat application with a fresh editorial interface. It uses browser-to-browser WebRTC for media, Socket.IO only for matchmaking/signalling, and MongoDB for the minimum profile and session metadata needed by the service. Video and audio are never stored or relayed by this server.

## Features

- Three-step profile onboarding: identity, date of birth and name
- Frontend and backend 18+ validation
- Camera/microphone permission feedback
- In-memory random matchmaking with configurable `MATCHING_MODE`
- WebRTC offer, answer and ICE candidate signalling
- Mute, camera toggle, next and end controls with media cleanup
- Express API, Mongoose schemas, Helmet, CORS and rate limiting
- Responsive desktop, tablet and mobile layouts

## Project layout

```
client/   React + Vite client
server/   Express + Socket.IO + Mongoose API
```

## Run locally

1. Install dependencies from the repository root:

   ```bash
   npm install
   npm run install:all
   ```

2. Copy the env templates and set values:

   ```bash
   Copy-Item server/.env.example server/.env
   Copy-Item client/.env.example client/.env
   ```

3. Start MongoDB locally (or replace `MONGO_URI` with a MongoDB Atlas URI), then start both apps:

   ```bash
   npm run dev
   ```

Open http://localhost:5173. The API is at http://localhost:5000.

## API

- `GET /api/health`
- `POST /api/users` — validates name, identity and 18+ DOB
- `GET /api/users/:id`
- `POST /api/chats`
- `PATCH /api/chats/:id/end`

## WebRTC and signalling

When two queued sockets are matched, the server sends each client a `match-found` event. The initiating peer creates an offer; offer/answer/ICE payloads pass through Socket.IO `signal` events. The media stream itself goes directly between browsers using `RTCPeerConnection` and the configured Google STUN server. For a real deployment, add a TURN relay to the client configuration using the values in `server/.env`; TURN is important for users behind restrictive NATs.

## Production notes

Deploy the client over HTTPS and configure `CLIENT_URL`, `VITE_API_URL`, and `VITE_SOCKET_URL` to their public HTTPS/WSS origins. Run the server with a shared Socket.IO adapter (such as Redis) before horizontally scaling: the supplied in-memory queue intentionally works per server process. Use a managed TURN service or self-hosted coturn for reliable connectivity. Restrict CORS to the deployed client origin and ensure MongoDB access is network-restricted.

## Troubleshooting

- Camera and microphone require HTTPS outside `localhost`; allow both permissions in the browser site settings.
- If one peer never connects, verify STUN/TURN access and firewall rules.
- If profile creation fails, verify MongoDB is running and `MONGO_URI` is valid.
