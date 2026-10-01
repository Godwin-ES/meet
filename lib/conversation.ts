import type { ReceivedChatMessage, TextStreamData } from '@livekit/components-react';

export type ConversationLine = {
  key: string;
  fromAgent: boolean;
  typed: boolean;
  text: string;
  at: number;
};

/**
 * Voice transcripts and typed chat arrive on separate streams. Merged into
 * one list, ordered by when each started, so a typed question sits before
 * the spoken answer it got rather than in a separate block at the end.
 */
export function mergeConversation(
  transcriptions: TextStreamData[],
  chatMessages: ReceivedChatMessage[],
  agentIdentity: string | undefined,
): ConversationLine[] {
  const spoken = transcriptions.map((item, index) => ({
    key: `voice-${item.streamInfo.id}-${index}`,
    fromAgent: item.participantInfo.identity === agentIdentity,
    typed: false,
    text: item.text,
    at: item.streamInfo.timestamp,
    order: index,
  }));
  const typed = chatMessages.map((item, index) => ({
    key: `chat-${item.id ?? item.timestamp}-${index}`,
    fromAgent: item.from?.identity === agentIdentity,
    typed: true,
    text: item.message,
    at: item.timestamp,
    order: transcriptions.length + index,
  }));
  // Stable: lines with the same timestamp keep their arrival order.
  return [...spoken, ...typed]
    .sort((a, b) => a.at - b.at || a.order - b.order)
    .map(({ order: _order, ...line }) => line);
}
