import { describe, expect, it } from 'vitest';
import { TokenVerifier } from 'livekit-server-sdk';
import { createParticipantToken } from '../../../lib/create-token';

describe('connection token', () => {
  it('carries the stable visitor id and explicitly dispatches the named agent', async () => {
    const token = await createParticipantToken(
      {
        identity: 'Guest__visitor-1',
        name: 'Guest',
        attributes: { visitor_id: 'visitor-1' },
      },
      'voice-room',
      {
        apiKey: 'test-key',
        apiSecret: 'test-secret-that-is-long-enough',
        agentName: 'echorun-agent',
      },
    );

    const claims = await new TokenVerifier('test-key', 'test-secret-that-is-long-enough').verify(
      token,
    );

    expect(claims.attributes).toEqual({ visitor_id: 'visitor-1' });
    expect(claims.roomConfig?.agents).toEqual([
      expect.objectContaining({ agentName: 'echorun-agent' }),
    ]);
    expect(claims.video).toEqual(
      expect.objectContaining({ room: 'voice-room', roomJoin: true, canPublishData: true }),
    );
  });
});
