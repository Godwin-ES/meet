'use client';

import { useState } from 'react';
import { AudioLines, Bot, Mic2, RadioTower, Wrench } from 'lucide-react';

export type PipelineStage = 'you' | 'stt' | 'agent' | 'tools' | 'tts';

const STAGES = [
  {
    id: 'you',
    label: 'You',
    detail: 'Your microphone or typed message starts the turn.',
    tech: 'WebRTC input',
    icon: Mic2,
  },
  {
    id: 'stt',
    label: 'Speech to text',
    detail: 'Streaming transcription keeps the exchange fast and interruptible.',
    tech: 'Deepgram',
    icon: AudioLines,
  },
  {
    id: 'agent',
    label: 'Agno agent',
    detail: 'The agent reasons over your request, conversation, and saved memories.',
    tech: 'Agno + Groq gpt-oss',
    icon: Bot,
  },
  {
    id: 'tools',
    label: 'Tools',
    detail: 'Real services fetch weather, markets, knowledge, news, notes, and more.',
    tech: 'Agno toolkits + custom APIs',
    icon: Wrench,
  },
  {
    id: 'tts',
    label: 'Text to speech',
    detail: 'A concise answer becomes low-latency natural speech.',
    tech: 'Deepgram',
    icon: RadioTower,
  },
] as const;

export function Pipeline({
  active,
  compact = false,
}: {
  active?: PipelineStage;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<PipelineStage>(active ?? 'agent');
  const visible = STAGES.find((stage) => stage.id === (active ?? selected)) ?? STAGES[2];

  return (
    <div className={compact ? 'pipeline pipeline--compact' : 'pipeline'}>
      <div className="pipeline__track" aria-label="Voice agent pipeline">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === (active ?? selected);
          return (
            <div className="pipeline__step-wrap" key={stage.id}>
              <button
                className="pipeline__step"
                data-active={isActive}
                onClick={() => setSelected(stage.id)}
                onMouseEnter={() => !active && setSelected(stage.id)}
                type="button"
              >
                <span className="pipeline__icon">
                  <Icon size={compact ? 15 : 18} />
                </span>
                <span>{stage.label}</span>
              </button>
              {index < STAGES.length - 1 && <span className="pipeline__line" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="pipeline__detail" aria-live="polite">
          <span className="eyebrow">{visible.tech}</span>
          <p>{visible.detail}</p>
        </div>
      )}
    </div>
  );
}
