# EchoRun web

EchoRun is a voice-first agent interface that exposes what the agent is doing—not
just what it says. It pairs a LiveKit room with an Agno agent and renders tool
calls, structured results, memory updates, notes, and turn latency as they happen.

## Design system

The product name **EchoRun** combines voice (“Echo”) with action (“Run”). The
identity uses near-black ink (`#0a0d0c`), warm paper neutrals, and one signal-lime
accent (`#b7f34a`). The accent means “live or active”; it is never decorative.
Manrope carries the product voice while IBM Plex Mono labels systems and metrics.
Concentric signal rings are the core motif: spacious on the landing page,
audio-reactive in a session, and reduced to a dot in status UI. The visual system
deliberately avoids stock AI gradients, excessive glass effects, and chat bubbles.

## Experience

- Landing page with an interactive voice pipeline and prompt-driven capability tour
- Direct microphone entry with a typed-message fallback
- Live transcripts and `lk.chat` typed messages
- Audio-reactive agent state with the active pipeline stage
- Tool timeline with weather, time, currency, math, search, article, stock, and notes cards
- Persistent Agno memory, user notes, and STT/LLM/TTS/end-to-end latency
- Responsive three-panel desktop layout and focused mobile tabs
- Explicit named-agent dispatch and a stable `visitor_id` participant attribute

## Architecture

```text
Browser microphone / chat
        │
        ▼
LiveKit room ───── audio ────▶ Deepgram STT ─▶ Agno + Groq ─▶ tools + SQLite memory
        ▲                                                │
        ├──── captions + agent audio ◀── Deepgram TTS ◀──┘
        └──── reliable data topic `agent.events` ◀── tool, memory, and metric events
```

Protocol version `v: 1` is mirrored in `lib/agent-events.ts`. Unknown event types
and newer versions are ignored, so backend additions do not break current clients.

## Local development

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Required variables:

```dotenv
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
AGENT_NAME=echorun-agent
```

The backend worker must register the same `AGENT_NAME`. The token route keeps all
LiveKit credentials server-side, validates room names, sets a one-year HTTP-only
visitor cookie, and dispatches the named agent in the room configuration.

## Verification

```bash
pnpm test
pnpm lint
pnpm build
```

The app uses Next.js 15, React 18, Tailwind CSS 4, Motion, Lucide, LiveKit
Components, and the LiveKit client/server SDKs.
