'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight,
  AudioLines,
  CloudSun,
  Clock3,
  Database,
  Landmark,
  NotebookPen,
  Search,
} from 'lucide-react';
import { Pipeline } from '@/components/Pipeline';
import { APP_NAME, APP_PITCH, REPOSITORIES } from '@/lib/app-config';
import { generateRoomId } from '@/lib/client-utils';

const CAPABILITIES = [
  { icon: CloudSun, title: 'Weather & time', example: "What's the weather in Lagos this weekend?" },
  { icon: Search, title: 'Search & read', example: "What's the latest news on SpaceX?" },
  { icon: Landmark, title: 'Markets', example: "How's Nvidia doing today?" },
  { icon: Database, title: 'Knowledge', example: 'Explain quantum entanglement simply.' },
  { icon: NotebookPen, title: 'Notes', example: 'Add a note to email Sam tomorrow.' },
  { icon: Clock3, title: 'Memory', example: 'Remember that I prefer Celsius.' },
] as const;

export default function Page() {
  const router = useRouter();
  const start = (prompt?: string) => {
    void navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => stream.getTracks().forEach((track) => track.stop()))
      .catch(() => undefined);
    const query = prompt ? `?prompt=${encodeURIComponent(prompt)}` : '';
    router.push(`/rooms/${generateRoomId()}${query}`);
  };

  return (
    <main className="landing-shell">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="wordmark" href="/">
          <span className="wordmark__mark" />
          {APP_NAME}
        </Link>
        <div className="nav-shell__links">
          <a href="#how-it-works">How it works</a>
          <a href={REPOSITORIES.backend} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> Live voice · real tools · persistent memory
          </p>
          <h1>
            Ask out loud.
            <br />
            <span>Watch it work.</span>
          </h1>
          <p className="hero-copy__lede">{APP_PITCH}</p>
          <div className="hero-actions">
            <button className="button button--primary" onClick={() => start()} type="button">
              <Mic2Icon /> Start talking <ArrowUpRight size={18} />
            </button>
            <span>Uses your microphone. No sign-up.</span>
          </div>
        </div>
        <div className="hero-orb" aria-label="EchoRun voice signal visualization">
          <div className="signal-orb signal-orb--hero">
            <span className="signal-orb__ring signal-orb__ring--one" />
            <span className="signal-orb__ring signal-orb__ring--two" />
            <span className="signal-orb__core">
              <AudioLines size={40} />
            </span>
          </div>
          <div className="floating-callout floating-callout--top">
            <span /> Agno is choosing a tool
          </div>
          <div className="floating-callout floating-callout--bottom">
            <b>640</b> ms to first token
          </div>
        </div>
      </section>

      <section className="section-shell" id="how-it-works">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The live pipeline</p>
            <h2>Every step, out in the open.</h2>
          </div>
          <p>
            EchoRun makes the voice stack visible—from the first sound to the tool result and spoken
            answer.
          </p>
        </div>
        <Pipeline />
      </section>

      <section className="section-shell capabilities-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Built to do things</p>
            <h2>One voice. A useful toolbelt.</h2>
          </div>
          <p>Try a prompt to enter a live room with the first message ready.</p>
        </div>
        <div className="capability-grid">
          {CAPABILITIES.map(({ icon: Icon, title, example }) => (
            <button
              className="capability-card"
              key={title}
              onClick={() => start(example)}
              type="button"
            >
              <span className="capability-card__icon">
                <Icon size={20} />
              </span>
              <span className="capability-card__title">{title}</span>
              <span className="capability-card__example">“{example}”</span>
              <span className="capability-card__try">
                Try saying <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <Link className="wordmark" href="/">
          <span className="wordmark__mark" />
          {APP_NAME}
        </Link>
        <p>Agno · LiveKit · Groq · Deepgram · Next.js</p>
        <div>
          <a href={REPOSITORIES.frontend}>Frontend</a>
          <a href={REPOSITORIES.backend}>Agent</a>
        </div>
      </footer>
    </main>
  );
}

function Mic2Icon() {
  return (
    <span className="button__mic" aria-hidden="true">
      <span />
    </span>
  );
}
