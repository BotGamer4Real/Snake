export const COLOR = {
  void: 0x070b14,
  field: 0x0a1220,
  wall: 0x64748b,
  paddle: 0xe0f2fe,
  paddleGlow: 0x38bdf8,
  ball: 0xf8fafc,
  ballGlow: 0x7dd3fc,
} as const;

/** Top rows are warmer and worth more, like the old rainbow walls. */
export const BRICK_COLOR = [
  0xf43f5e, 0xfb7185, 0xf97316, 0xfbbf24, 0xa3e635, 0x22d3ee, 0x38bdf8, 0xa78bfa,
] as const;
