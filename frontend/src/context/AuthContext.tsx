import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: any;
  login: (token: string, userData: any) => Promise<void>;
  updateUserData: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  updateUserData: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      console.log('Loading user from storage...', { hasToken: !!token });
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments.some(s => s.includes('(auth)'));
    const inPublicGroup = segments.some(s => s.includes('public'));
    
    console.log('Auth Navigation Check:', { 
      hasUser: !!user, 
      inAuthGroup, 
      inPublicGroup, 
      segments 
    });

    if (!user && !inAuthGroup && !inPublicGroup) {
      console.log('Not logged in. Redirecting to login...');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      console.log('Already logged in. Redirecting to app...');
      router.replace('/(app)');
    }
  }, [user, segments, isLoading]);

  const login = async (token: string, userData: any) => {
    console.log('Logging in user:', userData.username);
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUserData = async (userData: any) => {
    const currentUserData = await AsyncStorage.getItem('userData');
    const updated = { ...(currentUserData ? JSON.parse(currentUserData) : {}), ...userData };
    await AsyncStorage.setItem('userData', JSON.stringify(updated));
    setUser(updated);
  };

  const logout = async () => {
    console.log('Logging out user...');
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUserData, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
