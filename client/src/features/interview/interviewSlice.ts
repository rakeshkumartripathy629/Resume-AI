import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, apiErrorMessage } from "../../lib/api";
import type {
  AnswerEvaluation,
  Difficulty,
  Interview,
} from "../../types/interview";

interface InterviewState {
  current: Interview | null;
  startStatus: "idle" | "loading" | "succeeded" | "failed";
  answerStatus: "idle" | "loading" | "failed";
  completeStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

interface StartPayload {
  role: string;
  difficulty: Difficulty;
  jdText: string;
  coinBalance: number;
}

interface SubmitResult {
  evaluation: AnswerEvaluation;
  nextQuestionIndex: number | null;
  allAnswered: boolean;
}

const initialState: InterviewState = {
  current: null,
  startStatus: "idle",
  answerStatus: "idle",
  completeStatus: "idle",
  error: null,
};

export const startInterview = createAsyncThunk(
  "interview/start",
  async (
    payload: { role: string; difficulty: Difficulty; jdText: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<{
        success: boolean;
        data: StartPayload & Interview;
      }>("/interviews/start", payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error));
    }
  },
);

export const fetchInterview = createAsyncThunk(
  "interview/fetch",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ success: boolean; data: Interview }>(
        `/interviews/${id}`,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error));
    }
  },
);

export const submitAnswer = createAsyncThunk(
  "interview/submitAnswer",
  async (
    payload: { id: string; questionIndex: number; answer: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<{ success: boolean; data: SubmitResult }>(
        `/interviews/${payload.id}/answer`,
        { questionIndex: payload.questionIndex, answer: payload.answer },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error));
    }
  },
);

export const completeInterview = createAsyncThunk(
  "interview/complete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ success: boolean; data: Interview }>(
        `/interviews/${id}/complete`,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error));
    }
  },
);

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    clearCurrent() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startInterview.pending, (state) => {
        state.startStatus = "loading";
        state.error = null;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.startStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.startStatus = "failed";
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Failed to start interview";
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(submitAnswer.pending, (state) => {
        state.answerStatus = "loading";
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.answerStatus = "idle";
        if (
          state.current &&
          action.meta.arg.questionIndex < state.current.evaluations.length
        ) {
          state.current.evaluations[action.meta.arg.questionIndex] =
            action.payload.evaluation;
        }
        if (
          state.current &&
          !state.current.answers.some(
            (a) => a.questionIndex === action.meta.arg.questionIndex,
          )
        ) {
          state.current.answers.push({
            questionIndex: action.meta.arg.questionIndex,
            text: action.meta.arg.answer,
            submittedAt: new Date().toISOString(),
          });
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.answerStatus = "failed";
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Failed to submit answer";
      })
      .addCase(completeInterview.pending, (state) => {
        state.completeStatus = "loading";
        state.error = null;
      })
      .addCase(completeInterview.fulfilled, (state, action) => {
        state.completeStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(completeInterview.rejected, (state, action) => {
        state.completeStatus = "failed";
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          "Failed to complete interview";
      });
  },
});

export const { clearCurrent } = interviewSlice.actions;
export default interviewSlice.reducer;
