'use client';

import { useCallback, useReducer } from 'react';
import { useDataChannel } from '@livekit/components-react';

export const AGENT_EVENT_VERSION = 1 as const;
export const AGENT_EVENT_TOPIC = 'agent.events';

type JsonRecord = Record<string, unknown>;

export type ToolStartedEvent = {
  v: 1;
  type: 'tool.started';
  id: string;
  turn: number;
  tool: string;
  args: JsonRecord;
  at: number;
};

export type ToolCompletedEvent = {
  v: 1;
  type: 'tool.completed';
  id: string;
  turn: number;
  tool: string;
  ms: number;
  result: JsonRecord;
  at: number;
};

export type ToolFailedEvent = {
  v: 1;
  type: 'tool.failed';
  id: string;
  turn: number;
  tool: string;
  ms: number;
  error: string;
  at: number;
};

export type MemoryUpdatedEvent = {
  v: 1;
  type: 'memory.updated';
  memories: string[];
  at: number;
};

export type TurnMetricsEvent = {
  v: 1;
  type: 'turn.metrics';
  turn: number;
  /** null when not measured: a typed turn has no STT, and end to end needs every stage. */
  stt_ms: number | null;
  llm_ttft_ms: number | null;
  tts_ttfb_ms: number | null;
  e2e_ms: number | null;
  tools: number;
  at: number;
};

export type AgentEvent =
  | ToolStartedEvent
  | ToolCompletedEvent
  | ToolFailedEvent
  | MemoryUpdatedEvent
  | TurnMetricsEvent;

export type ToolActivity = {
  id: string;
  turn: number;
  tool: string;
  args: JsonRecord;
  startedAt: number;
  status: 'running' | 'completed' | 'failed';
  ms?: number;
  result?: JsonRecord;
  error?: string;
};

export type AgentEventState = {
  tools: ToolActivity[];
  memories: string[];
  notes: string[];
  metrics?: TurnMetricsEvent;
};

export const INITIAL_AGENT_EVENT_STATE: AgentEventState = {
  tools: [],
  memories: [],
  notes: [],
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || isNumber(value);

export function parseAgentEvent(value: unknown): AgentEvent | null {
  if (!isRecord(value) || value.v !== AGENT_EVENT_VERSION || typeof value.type !== 'string') {
    return null;
  }
  const at = value.at;
  if (!isNumber(at)) return null;

  if (value.type === 'memory.updated') {
    return Array.isArray(value.memories) && value.memories.every((item) => typeof item === 'string')
      ? (value as MemoryUpdatedEvent)
      : null;
  }
  if (value.type === 'turn.metrics') {
    const timings = ['stt_ms', 'llm_ttft_ms', 'tts_ttfb_ms', 'e2e_ms'];
    return isNumber(value.turn) &&
      isNumber(value.tools) &&
      timings.every((key) => isNumberOrNull(value[key]))
      ? (value as TurnMetricsEvent)
      : null;
  }

  const commonIsValid =
    typeof value.id === 'string' && typeof value.tool === 'string' && isNumber(value.turn);
  if (!commonIsValid) return null;
  if (value.type === 'tool.started') {
    return isRecord(value.args) ? (value as ToolStartedEvent) : null;
  }
  if (value.type === 'tool.completed') {
    return isNumber(value.ms) && isRecord(value.result) ? (value as ToolCompletedEvent) : null;
  }
  if (value.type === 'tool.failed') {
    return isNumber(value.ms) && typeof value.error === 'string'
      ? (value as ToolFailedEvent)
      : null;
  }
  return null;
}

function upsertTool(tools: ToolActivity[], event: ToolCompletedEvent | ToolFailedEvent) {
  const index = tools.findIndex((tool) => tool.id === event.id);
  const previous: ToolActivity =
    index >= 0
      ? tools[index]
      : {
          id: event.id,
          turn: event.turn,
          tool: event.tool,
          args: {},
          startedAt: event.at - event.ms,
          status: 'running',
        };
  const next: ToolActivity =
    event.type === 'tool.completed'
      ? { ...previous, status: 'completed', ms: event.ms, result: event.result }
      : { ...previous, status: 'failed', ms: event.ms, error: event.error };
  if (index < 0) return [...tools, next];
  return tools.map((tool, toolIndex) => (toolIndex === index ? next : tool));
}

export function reduceAgentEvent(state: AgentEventState, event: AgentEvent): AgentEventState {
  switch (event.type) {
    case 'tool.started':
      return {
        ...state,
        tools: [
          ...state.tools.filter((tool) => tool.id !== event.id),
          {
            id: event.id,
            turn: event.turn,
            tool: event.tool,
            args: event.args,
            startedAt: event.at,
            status: 'running',
          },
        ],
      };
    case 'tool.completed': {
      const notes =
        event.result.kind === 'notes' &&
        Array.isArray(event.result.notes) &&
        event.result.notes.every((note) => typeof note === 'string')
          ? (event.result.notes as string[])
          : state.notes;
      return { ...state, tools: upsertTool(state.tools, event), notes };
    }
    case 'tool.failed':
      return { ...state, tools: upsertTool(state.tools, event) };
    case 'memory.updated':
      return { ...state, memories: event.memories };
    case 'turn.metrics':
      return { ...state, metrics: event };
  }
}

export function useAgentEvents(): AgentEventState {
  const [state, dispatch] = useReducer(reduceAgentEvent, INITIAL_AGENT_EVENT_STATE);
  const onMessage = useCallback((message: { payload: Uint8Array }) => {
    try {
      const parsed = parseAgentEvent(JSON.parse(new TextDecoder().decode(message.payload)));
      if (parsed) dispatch(parsed);
    } catch {
      // A malformed or newer event must not affect the room UI.
    }
  }, []);
  useDataChannel(AGENT_EVENT_TOPIC, onMessage);
  return state;
}
