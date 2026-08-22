import type { PieceId } from "./engine";

export const COLOR = {
  void: 0x070b14,
  board: 0x0c1424,
  grid: 0x1a2740,
  well: 0x243352,
  panel: 0x101827,
  flash: 0xf8fafc,
  text: 0xe2e8f0,
  muted: 0x64748b,
} as const;

export const PIECE_COLOR: Record<PieceId, number> = {
  I: 0x2ee6e6,
  O: 0xf5d031,
  T: 0xc46bff,
  S: 0x3dde6a,
  Z: 0xff4d5c,
  J: 0x3b82f6,
  L: 0xff9f2e,
};

export const PIECE_HEX: Record<PieceId, string> = {
  I: "#2ee6e6",
  O: "#f5d031",
  T: "#c46bff",
  S: "#3dde6a",
  Z: "#ff4d5c",
  J: "#3b82f6",
  L: "#ff9f2e",
};

export function shade(color: number, amount: number): number {
  const r = Math.min(255, Math.max(0, ((color >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((color >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (color & 255) + amount));
  return (r << 16) | (g << 8) | b;
}
