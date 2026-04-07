/**
 * Maps companion archetype IDs to their ElevenLabs Conversational AI Agent IDs.
 * 
 * Only companions with a dedicated agent are listed here.
 * Companions without an agent ID will fall back to turn-based voice mode.
 */

const companionAgentIds: Record<string, string> = {
  mira: "agent_6601kkex1s8ae4fbw0hmepa061rx",
  noah: "agent_6701kkeyt2x9evkvgzc0xqd3yz8e",
  elena: "agent_0801kkf6e7gbfq5tdsyem7hvtsqz",
  kai: "agent_2301kkf70703ez49knbvxy9qfkqa",
  lina: "agent_1501kkf797stf09rca11bfc013ry",
  theo: "agent_2901kkf7d8eted39d7650sbypk25",
  ava: "agent_7501kkf7g7x2f8jbagkrfyb2e17p",
  jonas: "agent_0901kkf7nqwnf1r8f6ts0bk1x6qb",
  sofia: "agent_6701kkf7s00qfvjbkvev7cqq7c5q",
  arin: "agent_5601kkf7vnpxf7ct7paqkdgecytq",
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
