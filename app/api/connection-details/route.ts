import { randomUUID } from 'node:crypto';
import { createParticipantToken } from '@/lib/create-token';
import { isValidRoomName, normalizeParticipantName } from '@/lib/room-token';
import { ConnectionDetails } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_KEY = 'echorun-visitor-id';
const AGENT_NAME = process.env.AGENT_NAME ?? 'echorun-agent';

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName');
  if (!roomName || !isValidRoomName(roomName)) {
    return NextResponse.json(
      { error: 'roomName must contain only lowercase letters, numbers, or hyphens.' },
      { status: 400 },
    );
  }

  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit is not configured.' }, { status: 500 });
  }

  const participantName = normalizeParticipantName(
    request.nextUrl.searchParams.get('participantName'),
  );
  const visitorId = request.cookies.get(COOKIE_KEY)?.value || randomUUID();
  const participantToken = await createParticipantToken(
    {
      identity: `${participantName}__${visitorId.slice(0, 12)}`,
      name: participantName,
      attributes: { visitor_id: visitorId },
    },
    roomName,
    { apiKey, apiSecret, agentName: AGENT_NAME },
  );

  const data: ConnectionDetails = {
    serverUrl: livekitUrl,
    roomName,
    participantToken,
    participantName,
  };
  const response = NextResponse.json(data);
  response.cookies.set(COOKIE_KEY, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
