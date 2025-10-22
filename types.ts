export type RiskLevel = 'Low' | 'Medium' | 'High';

export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export type Mode = 'Manual' | 'Auto';

export interface ProfitHistoryEntry {
  game: number;
  profit: number;
}

export interface BallType {
  id: number;
  x: number; // Initial x position
  betAmount: number;
  color: string;
}

export interface PayoutAnimationType {
  id: number;
  x: number;
  y: number;
  multiplier: number;
  payout: number;
  betAmount: number;
}

export interface GlowEffectType {
  id: number;
  x: number;
  y: number;
  color: string;
}


export interface Stats {
  profit: number;
  wins: number;
  losses: number;
  history: ProfitHistoryEntry[];
}