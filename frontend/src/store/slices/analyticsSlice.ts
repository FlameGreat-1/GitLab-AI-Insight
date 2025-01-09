import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NetworkData, AnalyticsTimeRange, AnalyticsMetric, CodeQualityData, CodeQualityPrediction, SentimentEntry } from '../../types/analytics';
import { RootState } from '../index';
import axios from 'axios';

interface AnalyticsState {
  networkData: NetworkData | null;
  codeQualityData: CodeQualityData[] | null;
  sentimentData: SentimentEntry[] | null;
  timeRange: AnalyticsTimeRange;
  selectedMetric: AnalyticsMetric;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  sentimentSettings: {
    source: string;
    dateRange: [string, string];
  };
}

const initialState: AnalyticsState = {
  networkData: null,
  codeQualityData: null,
  sentimentData: null,
  timeRange: 'LAST_30_DAYS',
  selectedMetric: 'COMMITS',
  loading: false,
  error: null,
  lastUpdated: null,
  sentimentSettings: {
    source: 'all',
    dateRange: [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    ],
  },
};

export const fetchNetworkData = createAsyncThunk<
  NetworkData,
  void,
  { state: RootState }
>('analytics/fetchNetworkData', async (_, { getState, rejectWithValue }) => {
  try {
    const { analytics } = getState();
    const response = await axios.get('/analytics/network', {
      params: {
        timeRange: analytics.timeRange,
        metric: analytics.selectedMetric,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch network data');
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const fetchCodeQualityData = createAsyncThunk<
  CodeQualityData[],
  { startDate: string; endDate: string },
  { state: RootState }
>('analytics/fetchCodeQualityData', async ({ startDate, endDate }, { rejectWithValue }) => {
  try {
    const response = await axios.get('/analytics/code-quality', {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch code quality data');
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const predictCodeQuality = createAsyncThunk<
  CodeQualityPrediction,
  string,
  { state: RootState }
>('analytics/predictCodeQuality', async (codeSnippet, { rejectWithValue }) => {
  try {
    const response = await axios.post('/analytics/predict-code-quality', { codeSnippet });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message || 'Failed to predict code quality');
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const fetchSentimentData = createAsyncThunk(
  'analytics/fetchSentimentData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { analytics } = getState() as RootState;
      const response = await axios.get('/analytics/sentiment', {
        params: analytics.sentimentSettings,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch sentiment data');
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<AnalyticsTimeRange>) => {
      state.timeRange = action.payload;
    },
    setSelectedMetric: (state, action: PayloadAction<AnalyticsMetric>) => {
      state.selectedMetric = action.payload;
    },
    clearNetworkData: (state) => {
      state.networkData = null;
      state.lastUpdated = null;
    },
    updateNetworkSettings: (state, action: PayloadAction<Partial<AnalyticsState>>) => {
      return { ...state, ...action.payload };
    },
    updateSentimentSettings: (state, action: PayloadAction<Partial<AnalyticsState['sentimentSettings']>>) => {
      state.sentimentSettings = { ...state.sentimentSettings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNetworkData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNetworkData.fulfilled, (state, action) => {
        state.networkData = action.payload;
        state.loading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchNetworkData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCodeQualityData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCodeQualityData.fulfilled, (state, action) => {
        state.codeQualityData = action.payload;
        state.loading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCodeQualityData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(predictCodeQuality.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(predictCodeQuality.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(predictCodeQuality.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSentimentData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSentimentData.fulfilled, (state, action) => {
        state.sentimentData = action.payload;
        state.loading = false;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchSentimentData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setTimeRange, setSelectedMetric, clearNetworkData, updateNetworkSettings, updateSentimentSettings } = analyticsSlice.actions;
export default analyticsSlice.reducer;

// Selectors
export const selectNetworkData = (state: RootState) => state.analytics.networkData;
export const selectCodeQualityData = (state: RootState) => state.analytics.codeQualityData;
export const selectSentimentData = (state: RootState) => state.analytics.sentimentData;
export const selectAnalyticsLoading = (state: RootState) => state.analytics.loading;
export const selectAnalyticsError = (state: RootState) => state.analytics.error;
export const selectAnalyticsLastUpdated = (state: RootState) => state.analytics.lastUpdated;
export const selectSentimentSettings = (state: RootState) => state.analytics.sentimentSettings;
