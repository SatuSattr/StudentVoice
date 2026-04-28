import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import { usersService, type User } from '@/services/users.service';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Hydrate from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('@sv_token');
        const userStr = await AsyncStorage.getItem('@sv_user');
        if (token && userStr) {
          setState({
            token,
            user: JSON.parse(userStr),
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    const token = data.access_token || data.token;
    await AsyncStorage.setItem('@sv_token', token);
    // Fetch user profile
    const me = await usersService.getMe();
    await AsyncStorage.setItem('@sv_user', JSON.stringify(me));
    setState({ token, user: me, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (payload: any) => {
    const data = await authService.register(payload);
    const token = data.access_token || data.token;
    await AsyncStorage.setItem('@sv_token', token);
    const me = await usersService.getMe();
    await AsyncStorage.setItem('@sv_user', JSON.stringify(me));
    setState({ token, user: me, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    await AsyncStorage.removeItem('@sv_token');
    await AsyncStorage.removeItem('@sv_user');
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await usersService.getMe();
      await AsyncStorage.setItem('@sv_user', JSON.stringify(me));
      setState((s) => ({ ...s, user: me }));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
