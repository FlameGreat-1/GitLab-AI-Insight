import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import jwtDecode from 'jwt-decode';
import { AppDispatch, RootState } from '../store';
import { login, logout, refreshToken } from '../store/slices/userSlice';
import { User } from '../types/user'; // Assuming User type is defined in user.ts

// Define these types if they're not available in a separate file
interface ApiError {
  message: string;
  // Add other error properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const decodedToken = jwtDecode<{ exp: number }>(token);
          if (Date.now() >= decodedToken.exp * 1000) {
            await refreshAuth();
          } else {
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
          await logoutHandler();
        }
      }
    };

    initAuth();
  }, [token]);

  const loginHandler = async (email: string, password: string) => {
    try {
      const resultAction = await dispatch(login({ email, password }));
      if (login.fulfilled.match(resultAction)) {
        setIsAuthenticated(true);
      } else if (login.rejected.match(resultAction)) {
        throw new Error(resultAction.error.message || 'Login failed');
      }
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Login failed');
    }
  };

  const logoutHandler = () => {
    dispatch(logout());
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    try {
      const resultAction = await dispatch(refreshToken());
      if (refreshToken.fulfilled.match(resultAction)) {
        setIsAuthenticated(true);
      } else if (refreshToken.rejected.match(resultAction)) {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await logoutHandler();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: loginHandler,
        logout: logoutHandler,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
