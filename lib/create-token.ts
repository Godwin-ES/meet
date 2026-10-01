import {
  AccessToken,
  AccessTokenOptions,
  RoomAgentDispatch,
  RoomConfiguration,
  VideoGrant,
} from 'livekit-server-sdk';

type TokenEnvironment = {
  apiKey?: string;
  apiSecret?: string;
  agentName: string;
};

export async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  environment: TokenEnvironment,
): Promise<string> {
  const token = new AccessToken(environment.apiKey, environment.apiSecret, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  token.addGrant(grant);
  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: environment.agentName })],
  });
  return token.toJwt();
}
