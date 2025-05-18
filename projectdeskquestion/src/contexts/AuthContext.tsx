import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  fitnessGoal?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const storedUser = localStorage.getItem('fitnessUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // For demo purposes, we'll use localStorage to simulate auth
  // In a real app, you would use Firebase or another auth provider
  const login = async (email: string, password: string) => {
    // In a real app, validate credentials with backend
    setLoading(true);
    try {
      const users = localStorage.getItem('fitnessUsers') 
        ? JSON.parse(localStorage.getItem('fitnessUsers') || '[]') 
        : [];
      
      const user = users.find((u: User & { password: string }) => 
        u.email === email && u.password === password
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('fitnessUser', JSON.stringify(userWithoutPassword));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const users = localStorage.getItem('fitnessUsers') 
        ? JSON.parse(localStorage.getItem('fitnessUsers') || '[]') 
        : [];
      
      // Check if email already exists
      if (users.some((u: User) => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In a real app, this would be hashed
        name,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('fitnessUsers', JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('fitnessUser', JSON.stringify(userWithoutPassword));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fitnessUser');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    localStorage.setItem('fitnessUser', JSON.stringify(updatedUser));
    
    // Update in users array too
    const users = JSON.parse(localStorage.getItem('fitnessUsers') || '[]');
    const updatedUsers = users.map((user: User & { password: string }) => {
      if (user.id === currentUser.id) {
        return { ...user, ...userData };
      }
      return user;
    });
    
    localStorage.setItem('fitnessUsers', JSON.stringify(updatedUsers));
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}