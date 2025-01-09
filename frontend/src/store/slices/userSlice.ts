import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { RootState } from '../index';
import { User, LoginCredentials, ApiError } from '../../types/user';

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { rejectValue: ApiError }
>('user/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    return { user, token };
  } catch (err: any) {
    return rejectWithValue(err.response.data as ApiError);
  }
});

export const logout = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
  try {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
  } catch (err: any) {
    return rejectWithValue(err.response.data as ApiError);
  }
});

export const refreshToken = createAsyncThunk<
  { token: string },
  void,
  { state: RootState; rejectValue: ApiError }
>('user/refreshToken', async (_, { getState, rejectWithValue }) => {
  try {
    const { token } = getState().user;
    const response = await apiClient.post('/auth/refresh', { token });
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    return { token: newToken };
  } catch (err: any) {
    return rejectWithValue(err.response.data as ApiError);
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError } = userSlice.actions;

export default userSlice.reducer;
