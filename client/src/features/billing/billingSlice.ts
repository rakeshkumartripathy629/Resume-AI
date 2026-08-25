import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'

export interface CoinPack {
  id: string
  name: string
  description: string
  amountInPaise: number
  coinAmount: number
  popular?: boolean
}

export interface OrderInfo {
  orderId: string
  amount: number
  currency: string
  keyId: string
  planId: string
  coinAmount: number
  paymentDocId: string
}

interface BillingState {
  packs: CoinPack[]
  configured: boolean
  keyId: string | null
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: BillingState = {
  packs: [],
  configured: false,
  keyId: null,
  status: 'idle',
  error: null,
}

export const fetchPlans = createAsyncThunk('billing/fetchPlans', async (_: void, { rejectWithValue }) => {
  try {
    const response = await api.get<{
      success: boolean
      data: { configured: boolean; keyId: string | null; packs: CoinPack[] }
    }>('/billing/plans')
    return response.data.data
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error))
  }
})

export const createOrder = createAsyncThunk(
  'billing/createOrder',
  async (planId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ success: boolean; data: OrderInfo }>(
        '/billing/orders',
        { planId }
      )
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const verifyPayment = createAsyncThunk(
  'billing/verifyPayment',
  async (
    payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<{
        success: boolean
        data: { status: string; coinAmount: number; coinsCredited: boolean }
      }>('/billing/verify', payload)
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.status = 'idle'
        state.packs = action.payload.packs
        state.configured = action.payload.configured
        state.keyId = action.payload.keyId
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? 'Failed to load plans'
      })
  },
})

export default billingSlice.reducer

/* Razorpay Checkout loader */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
