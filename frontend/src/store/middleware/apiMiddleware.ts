import { Middleware } from 'redux';
import { apiClient } from '../../services/apiClient';
import { refreshToken, logout } from '../slices/userSlice';
import { RootState } from '../index';

export const apiMiddleware: Middleware<{}, RootState> = ({ dispatch, getState }) => next => async action => {
  if (action.type !== 'api/request') {
    return next(action);
  }

  const { url, method, data, onSuccess, onError } = action.payload;

  try {
    const response = await apiClient.request({
      url,
      method,
      data,
    });

    dispatch({ type: onSuccess, payload: response.data });
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      const { token } = getState().user;
      if (token) {
        try {
          await dispatch(refreshToken());
          // Retry the original request
          const retryResponse = await apiClient.request({
            url,
            method,
            data,
          });
          dispatch({ type: onSuccess, payload: retryResponse.data });
        } catch (refreshError) {
          dispatch(logout());
          dispatch({ type: onError, payload: 'Session expired. Please login again.' });
        }
      } else {
        dispatch(logout());
        dispatch({ type: onError, payload: 'Authentication required.' });
      }
    } else {
      dispatch({
        type: onError,
        payload: error.response ? error.response.data : 'An unexpected error occurred.',
      });
    }
  }
};

export const apiRequest = (config: {
  url: string;
  method: string;
  data?: any;
  onSuccess: string;
  onError: string;
}) => ({
  type: 'api/request',
  payload: config,
});
