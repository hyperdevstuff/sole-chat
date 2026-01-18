# sole-chat

Anonymous ephemeral 2-person chat rooms with end-to-end encryption and self-destruction.

## Features

- **Anonymous**: No registration required - get a random username
- **Ephemeral**: Rooms auto-expire after 10 minutes of inactivity
- **Private**: 2 users per room maximum
- **Encrypted**: E2EE using ECDH P-256 key exchange and AES-GCM-256
- **Self-destruct**: Either user can destroy the room instantly

## How E2EE Works

1. Room creator generates an ECDH P-256 keypair, stores private key locally
2. Public key is stored on the server when room is created
3. When another user joins, they generate their own keypair
4. Joiner fetches creator's public key, derives shared secret via ECDH
5. Joiner stores their public key on server for creator to fetch
6. Both parties now have identical shared secrets for AES-GCM encryption
7. All messages are encrypted client-side before transmission
8. Server only sees ciphertext - cannot read message contents

## Environment Variables

Create a `.env.local` file with:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

Get these from [Upstash Console](https://console.upstash.com/).

## Development

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19 with React Compiler
- **API**: Elysia (via catch-all route)
- **Realtime**: Upstash Realtime (managed WebSocket)
- **Database**: Upstash Redis
- **Styling**: TailwindCSS v4

## Deployment

Deploy to Vercel:

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

The app will automatically build and deploy with zero configuration.
