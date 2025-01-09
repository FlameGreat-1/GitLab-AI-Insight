// src/integration/pages/AnalyticsPage.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../styles/theme';
import AnalyticsPage from '../../pages/AnalyticsPage';
import { fetchAnalyticsData } from '../../store/actions/analyticsActions';

// Mock the analytics actions
jest.mock('../../store/actions/analyticsActions', () => ({
  fetchAnalyticsData: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('AnalyticsPage Integration Tests', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      analytics: {
        data: null,
        loading: false,
        error: null,
      },
      auth: {
        user: { id: '1', name: 'Test User', role: 'admin' },
      },
    });

    (fetchAnalyticsData as jest.Mock).mockClear();
  });

  const renderComponent = () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <MemoryRouter>
            <AnalyticsPage />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders the AnalyticsPage and fetches data on mount', async () => {
    (fetchAnalyticsData as jest.Mock).mockResolvedValue({
      type: 'FETCH_ANALYTICS_DATA_SUCCESS',
      payload: { someData: 'test data' },
    });

    renderComponent();

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchAnalyticsData).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error message when data fetching fails', async () => {
    (fetchAnalyticsData as jest.Mock).mockRejectedValue(new Error('Failed to fetch data'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch data')).toBeInTheDocument();
    });
  });

  it('allows user to change date range', async () => {
    (fetchAnalyticsData as jest.Mock).mockResolvedValue({
      type: 'FETCH_ANALYTICS_DATA_SUCCESS',
      payload: { someData: 'test data' },
    });

    renderComponent();

    const dateRangeSelect = screen.getByLabelText('Date Range');
    userEvent.selectOptions(dateRangeSelect, 'last30Days');

    await waitFor(() => {
      expect(fetchAnalyticsData).toHaveBeenCalledWith('last30Days');
    });
  });

  it('renders all expected analytics components', async () => {
    (fetchAnalyticsData as jest.Mock).mockResolvedValue({
      type: 'FETCH_ANALYTICS_DATA_SUCCESS',
      payload: {
        commitActivity: [{ date: '2023-01-01', count: 5 }],
        issueResolutionTime: 24,
        codeQualityScore: 85,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Commit Activity')).toBeInTheDocument();
      expect(screen.getByText('Issue Resolution Time')).toBeInTheDocument();
      expect(screen.getByText('Code Quality Score')).toBeInTheDocument();
    });
  });
});
