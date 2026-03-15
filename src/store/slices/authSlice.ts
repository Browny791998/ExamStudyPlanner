import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Ensure cookies are sent/received for same-origin API calls
axios.defaults.withCredentials = true;
import type { RegisterFormData, LoginFormData } from "@/validations/authSchema";
import type { RootState } from "@/store";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  examType: string | null;
  hasCompletedOnboarding: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData: RegisterFormData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post("/api/auth/register", formData);
      return data.data.user as AuthUser;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? "Registration failed");
      }
      return rejectWithValue("Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData: LoginFormData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post("/api/auth/login", formData);
      return data.data.user as AuthUser;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? "Login failed");
      }
      return rejectWithValue("Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await axios.post("/api/auth/logout", {});
});

export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/api/auth/me");
      return data.data.user as AuthUser;
    } catch {
      return rejectWithValue(null);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // Legacy / manual override
    setCredentials(state, action: PayloadAction<{ user: AuthUser }>) {
      state.user = action.payload.user;
    },
    patchUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // Legacy logout action (middleware still handles redirect)
    logout(state) {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
      });
  },
});

export const { clearError, setCredentials, patchUser, logout } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) => state.auth.user !== null;
export const selectHasCompletedOnboarding = (state: RootState) =>
  state.auth.user?.hasCompletedOnboarding ?? false;
