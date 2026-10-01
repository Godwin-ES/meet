import { describe, expect, it } from 'vitest';
import type { ReceivedChatMessage, TextStreamData } from '@livekit/components-react';
import { mergeConversation } from './conversation';

const voice = (identity: string, text: string, timestamp: number, id = text) =>
  ({
    text,
    participantInfo: { identity },
    streamInfo: { id, timestamp },
  }) as unknown as TextStreamData;
const chat = (identity: string, message: string, timestamp: number) =>
  ({ id: message, message, timestamp, from: { identity } }) as unknown as ReceivedChatMessage;

describe('mergeConversation', () => {
  it('orders spoken and typed lines by time, so a typed question precedes its spoken answer', () => {
    const lines = mergeConversation(
      [voice('me', 'Hi there', 1000), voice('agent', 'It is 29 degrees in Lagos', 3000)],
      [chat('me', 'Weather in Lagos?', 2000)],
      'agent',
    );

    expect(lines.map((line) => [line.text, line.fromAgent, line.typed])).toEqual([
      ['Hi there', false, false],
      ['Weather in Lagos?', false, true],
      ['It is 29 degrees in Lagos', true, false],
    ]);
  });

  it('keeps arrival order for lines with the same timestamp', () => {
    const lines = mergeConversation(
      [voice('me', 'first', 5), voice('me', 'second', 5)],
      [],
      'agent',
    );
    expect(lines.map((line) => line.text)).toEqual(['first', 'second']);
  });
});
