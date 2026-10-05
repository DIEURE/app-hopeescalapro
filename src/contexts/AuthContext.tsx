import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface UsuarioLogado {
  id?: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'VOLUNTARIO' | string;
  role?: string;
  empresaId: number;
  nomeEmpresa: string;
  telefone?: string;
}

interface AuthContextData {
  usuario: UsuarioLogado | null;
  token: string | null;
  loading: boolean;
  login: (token: string, usuario: UsuarioLogado) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = '@HopeEscala:token';
const USER_KEY = '@HopeEscala:user';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getStorage = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const val = localStorage.getItem(key);
        if (val) return val;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const setStorage = async (key: string, val: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(key, val);
      }
      await AsyncStorage.setItem(key, val);
    } catch (e) {
      console.warn('Erro ao salvar storage:', e);
    }
  };

  const removeStorage = async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Erro ao remover storage:', e);
    }
  };

  useEffect(() => {
    async function carregarSessao() {
      try {
        const storedToken = await getStorage(TOKEN_KEY);
        const storedUser = await getStorage(USER_KEY);

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUsuario(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn('Falha ao restaurar sessão:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarSessao();
  }, []);

  const login = async (novoToken: string, novoUsuario: UsuarioLogado) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${novoToken}`;
    await setStorage(TOKEN_KEY, novoToken);
    await setStorage(USER_KEY, JSON.stringify(novoUsuario));
    setToken(novoToken);
    setUsuario(novoUsuario);
  };

  const logout = async () => {
    delete api.defaults.headers.common['Authorization'];
    await removeStorage(TOKEN_KEY);
    await removeStorage(USER_KEY);
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
}