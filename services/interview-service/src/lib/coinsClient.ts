import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

interface CoinEnvelope {
  success: boolean
  data?: { balance: number; cost: number; transactionId: string }
  error?: string
}

async function callAuthCoins(
  path: string,
  body: Record<string, unknown>
): Promise<{ balance: number; cost: number; transactionId: string }> {
  let response: Response
  try {
    response = await fetch(`${env.authServiceUrl}/internal/coins/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
  } catch (err) {
    throw new HttpError(
      502,
      `Coin service unreachable: ${err instanceof Error ? err.message : 'unknown error'}`
    )
  }

  const payload = (await response.json().catch(() => null)) as CoinEnvelope | null

  if (!response.ok || !payload?.success || !payload.data) {
    if (response.status === 402) {
      throw new HttpError(402, payload?.error ?? 'Insufficient coins')
    }
    if (response.status === 404) {
      throw new HttpError(404, payload?.error ?? 'User not found in coin service')
    }
    throw new HttpError(502, payload?.error ?? 'Coin service error')
  }

  const data = payload.data
  return { balance: data.balance, cost: data.cost, transactionId: data.transactionId }
}

export async function consumeCoins(
  uid: string,
  action: string,
  meta?: Record<string, unknown>
): Promise<{ balance: number; cost: number; transactionId: string }> {
  const data = await callAuthCoins('consume', { uid, action, meta })
  return { balance: data.balance, cost: data.cost, transactionId: data.transactionId }
}

/** Best-effort refund when downstream work fails after coins were consumed. */
export async function refundCoins(
  uid: string,
  amount: number,
  reason: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await callAuthCoins('credit', { uid, amount, reason, meta })
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'agent-service',
        msg: 'Refund failed — manual reconciliation needed',
        uid,
        amount,
        reason,
        message: err instanceof Error ? err.message : String(err),
      })
    )
  }
}
