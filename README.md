# [Sole Chat](https://chat.harzh.xyz)

Anonymous ephemeral 2-person chat rooms with end-to-end encryption and self-destruction.

**Problem**: Traditional chat apps require accounts, store conversation history indefinitely, and expose messages to servers.
**Solution**: A zero-trust chat platform where rooms exist for 10 minutes only, support just 2 people, and messages are encrypted so the server cannot read them.

## Features

- **Anonymous**: No registration required - get a random username
- **Ephemeral**: Rooms auto-expire after 10 minutes of inactivity
- **Private**: 2 users per room maximum
- **Encrypted**: E2EE using ECDH P-256 key exchange and AES-GCM-256
- **Self-destruct**: Either user can destroy the room instantly

## Technical Achievements

- **End-to-End Encryption**: Implemented ECDH P-256 key exchange with AES-GCM-256 encryption entirely client-side; server only handles ciphertext
- **Atomic Room Joining**: Custom Lua script ensures strict 2-user limit with race-condition protection
- **Ephemeral Architecture**: Redis TTL with 10-minute expiration, synced on every message; zero persistent storage
- **Realtime Messaging**: Sub-100ms message delivery via Upstash Realtime (managed WebSocket infrastructure)
- **Zero Server Trust**: Server never sees plaintext messages, private keys, or derived shared secrets
- **Edge-Optimized**: Deployed on Vercel Edge Network with Elysia API running in Next.js catch-all routes

## How E2EE Works

1. Room creator generates an ECDH P-256 keypair, stores private key locally
2. Public key is stored on the server when room is created
3. When another user joins, they generate their own keypair
4. Joiner fetches creator's public key, derives shared secret via ECDH
5. Joiner stores their public key on server for creator to fetch
6. Both parties now have identical shared secrets for AES-GCM encryption
7. All messages are encrypted client-side before transmission via Upstash Realtime
8. Server only sees ciphertext - cannot read message contents

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19 with React Compiler
- **API**: Elysia (via catch-all route)
- **Realtime**: Upstash Realtime (managed WebSocket)
- **Database**: Upstash Redis
- **Styling**: TailwindCSS v4

## Development

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
