import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MarketerProfile } from "@/src/types/marketer";

type SessionStatus =
  | "booting"
  | "authenticated"
  | "preview"
  | "error";

type SessionState = {
  status: SessionStatus;
  accessToken: string | null;
  profile: MarketerProfile | null;
  error: string | null;
};

const initialState: SessionState = {
  status: "booting",
  accessToken: null,
  profile: null,
  error: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setAuthenticated(
      state,
      action: PayloadAction<{
        accessToken: string;
        profile: MarketerProfile;
      }>,
    ) {
      state.status = "authenticated";
      state.accessToken = action.payload.accessToken;
      state.profile = action.payload.profile;
      state.error = null;
    },
    setProfile(state, action: PayloadAction<MarketerProfile>) {
      state.profile = action.payload;
    },
    setPreview(state) {
      state.status = "preview";
      state.accessToken = null;
      state.error = null;
    },
    setSessionError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.accessToken = null;
      state.profile = null;
      state.error = action.payload;
    },
    resetSession(state) {
      state.status = "booting";
      state.accessToken = null;
      state.profile = null;
      state.error = null;
    },
  },
});

export const {
  resetSession,
  setAuthenticated,
  setPreview,
  setProfile,
  setSessionError,
} = sessionSlice.actions;
export default sessionSlice.reducer;

