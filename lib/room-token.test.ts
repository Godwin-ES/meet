import { describe, expect, it } from 'vitest';
import { isValidRoomName, normalizeParticipantName } from './room-token';

describe('room token input rules', () => {
  it.each(['abc', 'voice-room-42', 'a'.repeat(64)])('accepts safe room name %s', (name) => {
    expect(isValidRoomName(name)).toBe(true);
  });

  it.each(['', 'UPPER', 'has space', '../escape', 'a'.repeat(65)])(
    'rejects unsafe room name %s',
    (name) => expect(isValidRoomName(name)).toBe(false),
  );

  it('uses Guest for a missing name and bounds user-supplied names', () => {
    expect(normalizeParticipantName(null)).toBe('Guest');
    expect(normalizeParticipantName('   ')).toBe('Guest');
    expect(normalizeParticipantName(`  ${'A'.repeat(80)}  `)).toBe('A'.repeat(48));
  });
});
