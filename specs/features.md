# Feature Specification

## Core Features (Implemented)

### 1. Room Creation
- Single-click room creation from home page
- Generates unique room ID via nanoid
- Sets 10-minute TTL on creation
- Redirects creator to room

### 2. Room Joining
- Join via shared URL
- Atomic 2-user limit validation
- Auth token assigned on successful join
- Denied if room full or expired

### 3. Messaging
- Real-time message delivery via Upstash Realtime
- Messages stored in Redis list
- TTL refreshed on each message
- Anonymous sender identification

### 4. Room Destruction
- Hold-to-destroy button (2s hold time)
- Broadcasts `chat.destroy` to all participants
- Immediate Redis cleanup
- Redirects all users to home

### 5. Anonymous Identity
- Auto-generated username: `anon-{adjective}-{nanoid(4)}`
- Persisted in localStorage
- Displayed in chat UI

## UI Patterns

### Hold-to-Destroy
- Visual countdown during hold
- Cancellable by releasing
- Destructive action confirmation via duration

### Copy Link
- One-click room URL copy
- Visual feedback on success

## Acceptance Criteria

### Room Creation
- [ ] Room created in <500ms
- [ ] Unique ID generated each time
- [ ] Creator auto-joined to room

### Messaging
- [ ] Message delivery <100ms (local network)
- [ ] Messages visible to both participants
- [ ] Sender identity preserved

### Destruction
- [ ] 2-second hold requirement
- [ ] Both users redirected on destroy
- [ ] Room data fully cleared from Redis
