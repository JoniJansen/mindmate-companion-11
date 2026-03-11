/**
 * Maps companion archetype IDs to their ElevenLabs Conversational AI Agent IDs.
 * 
 * Only companions with a dedicated agent are listed here.
 * Companions without an agent ID will fall back to turn-based voice mode.
 */

const companionAgentIds: Record<string, string> = {
  arin: "agent_5601kkf7vnpxf7ct7paqkdgecytq",
  sofia: "agent_6701kkf7s00qfvjbkvev7cqq7c5q",
  jonas: "agent_0901kkf7nqwnf1r8f6ts0bk1x6qb",
};

/**
 * Get the ElevenLabs Agent ID for a companion archetype.
 * Returns undefined if no agent is configured (fallback to turn-based).
 */
export function getCompanionAgentId(archetypeId: string): string | undefined {
  return companionAgentIds[archetypeId];
}

/**
 * Check if a companion has a real-time agent available.
 */
export function hasRealtimeAgent(archetypeId: string): boolean {
  return archetypeId in companionAgentIds;
}
