import { describe, expect, it } from 'vitest';
import { INITIAL_AGENT_EVENT_STATE, parseAgentEvent, reduceAgentEvent } from './agent-events';

describe('agent event protocol', () => {
  it('tracks a tool from start through structured completion', () => {
    const started = parseAgentEvent({
      v: 1,
      type: 'tool.started',
      id: 'call_1',
      turn: 2,
      tool: 'get_weather',
      args: { city: 'Lagos' },
      at: 100,
    });
    const completed = parseAgentEvent({
      v: 1,
      type: 'tool.completed',
      id: 'call_1',
      turn: 2,
      tool: 'get_weather',
      ms: 412,
      result: { kind: 'weather', temperature: 29, say: 'Warm.' },
      at: 512,
    });

    expect(started).not.toBeNull();
    expect(completed).not.toBeNull();
    const running = reduceAgentEvent(INITIAL_AGENT_EVENT_STATE, started!);
    const done = reduceAgentEvent(running, completed!);

    expect(done.tools).toEqual([
      expect.objectContaining({
        id: 'call_1',
        status: 'completed',
        tool: 'get_weather',
        ms: 412,
        result: { kind: 'weather', temperature: 29, say: 'Warm.' },
      }),
    ]);
  });

  it('updates memories, notes, metrics, and failed tools', () => {
    const events = [
      { v: 1, type: 'memory.updated', memories: ['Prefers Celsius'], at: 1 },
      {
        v: 1,
        type: 'tool.started',
        id: 'note',
        turn: 1,
        tool: 'add_note',
        args: { text: 'Email Sam' },
        at: 2,
      },
      {
        v: 1,
        type: 'tool.completed',
        id: 'note',
        turn: 1,
        tool: 'add_note',
        ms: 4,
        result: { kind: 'notes', notes: ['Email Sam'], say: 'Added.' },
        at: 6,
      },
      {
        v: 1,
        type: 'tool.failed',
        id: 'search',
        turn: 2,
        tool: 'web_search',
        ms: 4000,
        error: 'timed out',
        at: 7,
      },
      {
        v: 1,
        type: 'turn.metrics',
        turn: 2,
        stt_ms: 180,
        llm_ttft_ms: 640,
        tts_ttfb_ms: 210,
        e2e_ms: 1450,
        tools: 1,
        at: 8,
      },
    ].map(parseAgentEvent);

    const state = events.reduce(
      (current, event) => (event ? reduceAgentEvent(current, event) : current),
      INITIAL_AGENT_EVENT_STATE,
    );

    expect(state.memories).toEqual(['Prefers Celsius']);
    expect(state.notes).toEqual(['Email Sam']);
    expect(state.tools.at(-1)).toEqual(
      expect.objectContaining({ id: 'search', status: 'failed', error: 'timed out' }),
    );
    expect(state.metrics?.e2e_ms).toBe(1450);
  });

  it('ignores unknown event types and future protocol versions', () => {
    expect(parseAgentEvent({ v: 2, type: 'tool.started' })).toBeNull();
    expect(parseAgentEvent({ v: 1, type: 'system.secret' })).toBeNull();
    expect(parseAgentEvent('not an object')).toBeNull();
  });
});
