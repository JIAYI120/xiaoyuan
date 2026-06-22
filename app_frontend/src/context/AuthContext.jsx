import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

const defaultProfile = {
  nickname: '',
  identity: '学生',
  bio: '用文字记录校园生活的每一刻',
  gender: '',
  birthday: '',
  location: '',
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ ...defaultProfile });
  const initRef = useRef(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (token && !initRef.current) {
      initRef.current = true;
      apiClient.get('/users/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiClient.get('/profile');
      const data = res.data;
      setProfile({
        nickname: data.nickname || '',
        identity: data.identity || defaultProfile.identity,
        bio: data.bio || defaultProfile.bio,
        gender: data.gender || '',
        birthday: data.birthday || '',
        location: data.location || '',
      });
    } catch {
      setProfile({ ...defaultProfile });
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchProfile();
    } else if (!token) {
      setProfile({ ...defaultProfile });
    }
  }, [token, user, fetchProfile]);

  const updateProfile = useCallback(async (newProfile) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
    try {
      await apiClient.put('/profile', {
        nickname: newProfile.nickname,
        identity: newProfile.identity,
        bio: newProfile.bio,
        gender: newProfile.gender,
        birthday: newProfile.birthday,
        location: newProfile.location,
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  }, []);

  const login = (newToken) => {
    initRef.current = false;
    setToken(newToken);
    setUser(null);
  };

  const logout = () => {
    initRef.current = false;
    setToken(null);
    setUser(null);
    setProfile({ ...defaultProfile });
  };

  const value = { token, user, login, logout, profile, updateProfile, fetchProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
