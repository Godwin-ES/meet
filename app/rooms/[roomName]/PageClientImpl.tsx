'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Brain,
  ChevronRight,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Send,
  Wrench,
} from 'lucide-react';
import {
  BarVisualizer,
  MediaDeviceSelect,
  RoomAudioRenderer,
  RoomContext,
  useChat,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant,
} from '@livekit/components-react';
import { Room, RoomEvent } from 'livekit-client';
import { Pipeline, PipelineStage } from '@/components/Pipeline';
import { ResultCard } from '@/components/cards/ResultCard';
import { APP_NAME } from '@/lib/app-config';
import { useAgentEvents } from '@/lib/agent-events';
import { mergeConversation } from '@/lib/conversation';
import { ConnectionDetails } from '@/lib/types';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';

type MobileTab = 'conversation' | 'activity' | 'memory';

export function PageClientImpl({
  roomName,
  initialPrompt,
}: {
  roomName: string;
  initialPrompt?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [details, setDetails] = useState<ConnectionDetails>();
  const [error, setError] = useState('');
  const [micError, setMicError] = useState('');
  const [ended, setEnded] = useState(false);
  const room = useMemo(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    setDetails(undefined);
    setError('');
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.set('roomName', roomName);
    url.searchParams.set('participantName', 'Guest');
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not create the room.');
        setDetails(body);
      })
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message || 'Could not connect.');
      });
    return () => controller.abort();
  }, [roomName, attempt]);

  useEffect(() => {
    if (!details) return;
    let active = true;
    const onDisconnected = () => active && setEnded(true);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room
      .connect(details.serverUrl, details.participantToken, { autoSubscribe: true })
      .then(async () => {
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
          setMicError('Allow microphone access to talk, or type instead.');
        }
      })
      .catch((reason) => active && setError(reason.message || 'The room could not connect.'));
    return () => {
      active = false;
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.disconnect();
    };
  }, [details, room]);

  const retry = () => {
    setEnded(false);
    setAttempt((value) => value + 1);
  };

  if (error) return <ConnectionState title="Connection lost" detail={error} onRetry={retry} />;
  if (!details)
    return (
      <ConnectionState
        title="Connecting to your agent…"
        detail="Preparing a private LiveKit room and waking EchoRun."
      />
    );

  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <AgentSessionView
        initialPrompt={initialPrompt}
        micError={micError}
        ended={ended}
        onEnd={() => {
          setEnded(true);
          room.disconnect();
        }}
        onRetry={retry}
      />
    </RoomContext.Provider>
  );
}

function ConnectionState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <main className="connection-state">
      <div className="connection-card">
        <div className="skeleton-orb" />
        <h1>{title}</h1>
        <p>{detail}</p>
        {onRetry && (
          <button className="button button--primary" onClick={onRetry}>
            <RotateCcw size={17} /> Retry
          </button>
        )}
      </div>
    </main>
  );
}

function AgentSessionView({
  initialPrompt,
  micError,
  ended,
  onEnd,
  onRetry,
}: {
  initialPrompt?: string;
  micError: string;
  ended: boolean;
  onEnd: () => void;
  onRetry: () => void;
}) {
  const router = useRouter();
  const { state, audioTrack, agent } = useVoiceAssistant();
  const events = useAgentEvents();
  const transcriptions = useTranscriptions();
  const { chatMessages, send, isSending } = useChat();
  const { localParticipant, isMicrophoneEnabled, lastMicrophoneError } = useLocalParticipant();
  const [message, setMessage] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('conversation');
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const sentInitialPrompt = useRef(false);
  const duration = useCallDuration(ended);
  const runningTool = [...events.tools].reverse().find((tool) => tool.status === 'running');

  useEffect(() => {
    if (agent) {
      setWaitingSeconds(0);
      return;
    }
    const timer = window.setInterval(() => setWaitingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [agent]);

  useEffect(() => {
    if (!agent || !initialPrompt || sentInitialPrompt.current) return;
    sentInitialPrompt.current = true;
    send(initialPrompt).catch(() => setMessage(initialPrompt));
  }, [agent, initialPrompt, send]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = message.trim();
    if (!next) return;
    setMessage('');
    try {
      await send(next);
    } catch {
      setMessage(next);
    }
  };

  const conversation = useMemo(
    () => mergeConversation(transcriptions, chatMessages, agent?.identity),
    [transcriptions, chatMessages, agent?.identity],
  );

  // When the user grants microphone access in the browser after joining,
  // turn the mic on without making them find the button.
  useEffect(() => {
    if (isMicrophoneEnabled || !navigator.permissions?.query) return;
    let status: PermissionStatus | undefined;
    let cancelled = false;
    const onChange = () => {
      if (status?.state === 'granted') localParticipant.setMicrophoneEnabled(true).catch(() => {});
    };
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        result.addEventListener('change', onChange);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      status?.removeEventListener('change', onChange);
    };
  }, [isMicrophoneEnabled, localParticipant]);

  const toggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      /* surfaced below */
    }
  }, [isMicrophoneEnabled, localParticipant]);

  const stage: PipelineStage = runningTool
    ? 'tools'
    : state === 'speaking'
      ? 'tts'
      : state === 'thinking'
        ? 'agent'
        : state === 'listening'
          ? 'stt'
          : 'you';
  const label = runningTool
    ? `Using ${friendlyToolName(runningTool.tool)}`
    : state === 'speaking'
      ? 'Speaking'
      : state === 'thinking'
        ? 'Thinking'
        : state === 'listening'
          ? 'Listening'
          : waitingSeconds >= 10
            ? 'Waking up'
            : 'Connecting';
  // Cleared as soon as the microphone is actually on, e.g. after the user
  // allows access and unmutes, or the permission listener above enables it.
  const visibleMicError = isMicrophoneEnabled ? '' : micError || lastMicrophoneError?.message || '';

  if (ended) {
    return (
      <SessionSummary
        duration={duration}
        toolCount={events.tools.length}
        memoryCount={events.memories.length}
        noteCount={events.notes.length}
        onRestart={() => router.push('/')}
      />
    );
  }

  return (
    <main className="session-shell">
      <header className="session-topbar">
        <Link className="wordmark" href="/">
          <span className="wordmark__mark" />
          {APP_NAME}
        </Link>
        <div className="session-topbar__status">
          <span className="status-dot" /> LIVE · {formatDuration(duration)}
        </div>
      </header>
      {(visibleMicError || waitingSeconds >= 25) && (
        <div className="inline-notice" role="status" style={{ margin: '10px 14px 0' }}>
          {waitingSeconds >= 25 ? (
            <>
              The agent is taking too long to join. <button onClick={onRetry}>Retry</button>
            </>
          ) : (
            visibleMicError
          )}
        </div>
      )}
      <div className="session-grid">
        <section className="session-panel" data-mobile-active={mobileTab === 'conversation'}>
          <div className="panel-heading">
            <h2>Conversation</h2>
            <span>Live transcript</span>
          </div>
          <div className="conversation-feed">
            {!conversation.length ? (
              <div className="conversation-empty">
                Your conversation will appear here.
                <br />
                Try asking about the weather.
              </div>
            ) : (
              <>
                {conversation.map((line) => (
                  <div className="transcript-line" data-agent={line.fromAgent} key={line.key}>
                    <span className="transcript-line__who">
                      {line.fromAgent ? APP_NAME : line.typed ? 'You · typed' : 'You'}
                    </span>
                    <p>{line.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <form className="chat-form" onSubmit={submit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message…"
              aria-label="Message EchoRun"
            />
            <button
              className="icon-button"
              data-active={Boolean(message.trim())}
              disabled={isSending}
              type="submit"
              aria-label="Send"
            >
              <Send size={17} />
            </button>
          </form>
        </section>

        <section className="session-panel session-panel--agent">
          <div className="panel-heading">
            <h2>Agent</h2>
            <span>{agent ? 'Online' : 'Joining'}</span>
          </div>
          <div className="agent-stage">
            <div className="agent-orb-wrap">
              <div className="signal-orb agent-orb" data-state={state}>
                <span className="signal-orb__ring signal-orb__ring--one" />
                <span className="signal-orb__ring signal-orb__ring--two" />
                <span className="signal-orb__core">
                  {audioTrack ? (
                    <BarVisualizer
                      className="agent-visualizer"
                      state={state}
                      trackRef={audioTrack}
                      barCount={5}
                    />
                  ) : (
                    <Activity size={32} />
                  )}
                </span>
              </div>
            </div>
            <div className="agent-state">
              <h1>{label}</h1>
              <p>
                {runningTool
                  ? 'A live tool call is in progress'
                  : 'Interrupt anytime—EchoRun is listening'}
              </p>
            </div>
            <div className="session-pipeline">
              <Pipeline compact active={stage} />
            </div>
          </div>
          <div className="session-controls">
            <button
              className="icon-button"
              data-active={isMicrophoneEnabled}
              onClick={toggleMic}
              aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <MediaDeviceSelect className="device-select" kind="audioinput" />
            <button
              className="icon-button icon-button--danger"
              onClick={onEnd}
              aria-label="End call"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </section>

        <section
          className="session-panel"
          data-mobile-active={mobileTab === 'activity' || mobileTab === 'memory'}
        >
          <div className="panel-heading">
            <h2>{mobileTab === 'memory' ? 'Memory' : 'Activity'}</h2>
            <span>{events.tools.length} tool calls</span>
          </div>
          {mobileTab !== 'memory' && (
            <div className="activity-feed">
              <AnimatePresence initial={false}>
                {events.tools.length ? (
                  events.tools.map((tool) => (
                    <motion.article
                      className="tool-entry"
                      key={tool.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="tool-entry__head">
                        <div className="tool-entry__name">
                          <Wrench size={13} />
                          <span>{friendlyToolName(tool.tool)}</span>
                        </div>
                        <span className="tool-entry__time">
                          {tool.status === 'running' ? 'running' : `${tool.ms ?? 0} ms`}
                        </span>
                      </div>
                      {tool.status === 'running' && (
                        <div className="tool-entry__pending">
                          <span className="spinner" /> Working with{' '}
                          {Object.values(tool.args).join(', ') || 'your request'}…
                        </div>
                      )}
                      {tool.result && <ResultCard result={tool.result} />}
                      {tool.error && (
                        <div className="result-card result-card__error">{tool.error}</div>
                      )}
                    </motion.article>
                  ))
                ) : (
                  <div className="activity-empty">
                    Tool calls appear here in real time.
                    <br />
                    Ask for weather, news, markets, or a calculation.
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
          <details className="activity-drawer" open={mobileTab === 'memory'}>
            <summary>
              <span>
                <Brain size={13} /> What I remember
              </span>
              <ChevronRight size={14} />
            </summary>
            <div className="activity-drawer__content">
              {events.memories.length ? (
                <ul className="memory-list">
                  {events.memories.map((memory) => (
                    <li key={memory}>{memory}</li>
                  ))}
                </ul>
              ) : (
                'Nothing saved yet. Tell EchoRun a stable preference to try memory.'
              )}
            </div>
          </details>
          <details className="activity-drawer" open={mobileTab === 'memory'}>
            <summary>
              <span>Notes</span>
              <ChevronRight size={14} />
            </summary>
            <div className="activity-drawer__content">
              {events.notes.length ? (
                <ul className="memory-list">
                  {events.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : (
                'No notes yet.'
              )}
            </div>
          </details>
          <details className="activity-drawer">
            <summary>
              <span>Under the hood</span>
              <ChevronRight size={14} />
            </summary>
            <div className="activity-drawer__content">
              <MetricStrip metrics={events.metrics} />
            </div>
          </details>
        </section>
      </div>
      <nav className="mobile-tabs" aria-label="Session panels">
        {(['conversation', 'activity', 'memory'] as MobileTab[]).map((tab) => (
          <button data-active={mobileTab === tab} onClick={() => setMobileTab(tab)} key={tab}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
    </main>
  );
}

function MetricStrip({ metrics }: { metrics: ReturnType<typeof useAgentEvents>['metrics'] }) {
  // null means "not measured this turn" (a typed message has no STT), so it
  // shows a dash rather than a misleading 0 ms.
  const items: [string, number | null][] = [
    ['STT', metrics?.stt_ms ?? null],
    ['LLM', metrics?.llm_ttft_ms ?? null],
    ['TTS', metrics?.tts_ttfb_ms ?? null],
    ['End to end', metrics?.e2e_ms ?? null],
  ];
  return (
    <div className="metric-strip">
      {items.map(([label, value]) => (
        <div className="metric" title={`${label} latency`} key={label}>
          <b>{value === null ? '—' : `${value} ms`}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function SessionSummary({
  duration,
  toolCount,
  memoryCount,
  noteCount,
  onRestart,
}: {
  duration: number;
  toolCount: number;
  memoryCount: number;
  noteCount: number;
  onRestart: () => void;
}) {
  return (
    <main className="session-shell">
      <div className="session-summary">
        <div className="summary-card">
          <p className="eyebrow">Session complete</p>
          <h1>Good conversation.</h1>
          <p>EchoRun has left the room. Your saved memories and notes will be ready next time.</p>
          <div className="summary-stats">
            <div>
              <b>{formatDuration(duration)}</b>Duration
            </div>
            <div>
              <b>{toolCount}</b>Tools used
            </div>
            <div>
              <b>{memoryCount + noteCount}</b>Saved items
            </div>
          </div>
          <button className="button button--primary" onClick={onRestart}>
            Start another
          </button>
        </div>
      </div>
    </main>
  );
}

function useCallDuration(paused: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);
  return seconds;
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
function friendlyToolName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
