export const ROOM_NAME_PATTERN = /^[a-z0-9-]{1,64}$/;

export function isValidRoomName(roomName: string): boolean {
  return ROOM_NAME_PATTERN.test(roomName);
}

export function normalizeParticipantName(value: string | null): string {
  return value?.trim().slice(0, 48) || 'Guest';
}
