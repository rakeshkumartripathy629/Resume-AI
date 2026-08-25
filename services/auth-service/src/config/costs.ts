export const COIN_COSTS = {
  resume_score: 5,
  interview_start: 10,
  roadmap_generate: 8,
} as const;

export type CoinAction = keyof typeof COIN_COSTS;

export function isCoinAction(value: unknown): value is CoinAction {
  return typeof value === 'string' && value in COIN_COSTS;
}

export const STARTING_COINS = 50;
