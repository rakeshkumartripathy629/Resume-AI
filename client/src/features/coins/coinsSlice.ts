import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api, apiErrorMessage } from "../../lib/api";

interface CoinsState {
  balance: number | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

interface BalanceResponse {
  success: boolean;
  data: { balance: number };
}

export const fetchCoinBalance = createAsyncThunk(
  "coins/fetchBalance",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<BalanceResponse>("/coins/balance");
      return response.data.data.balance;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error));
    }
  },
);

const initialState: CoinsState = {
  balance: null,
  status: "idle",
  error: null,
};

const coinsSlice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    /** Optimistic local decrement after a successful spend. */
    coinSpent(state, action: PayloadAction<number>) {
      if (state.balance !== null) {
        state.balance = Math.max(state.balance - action.payload, 0);
      }
    },
    clearCoins() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoinBalance.pending, (state) => {
        state.status = state.balance === null ? "loading" : state.status;
      })
      .addCase(fetchCoinBalance.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload;
      })
      .addCase(fetchCoinBalance.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string | undefined) ?? "Failed to load coins";
      });
  },
});

export const { coinSpent, clearCoins } = coinsSlice.actions;
export default coinsSlice.reducer;
