import { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'admin@dealtock.com'; // Updated admin email

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('dealtock_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.email === ADMIN_EMAIL) {
          parsedUser.isAdmin = true;
        } else {
          parsedUser.isAdmin = false; 
        }
        setUser(parsedUser);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (email, password) => {
    // Password validation (simple check for demo)
    // In a real app, this would be handled by the backend
    if (!password || password.length < 1) { // Basic check, real validation on registration
        return Promise.reject(new Error("Password is required"));
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const isAdminUser = email === ADMIN_EMAIL;
        
        const userData = {
          id: isAdminUser ? 'admin001' : 'user' + Date.now(),
          email,
          name: isAdminUser ? 'Admin Dealtock' : email.split('@')[0],
          company: isAdminUser ? 'Dealtock HQ' : 'Entreprise Cliente',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          isAdmin: isAdminUser,
        };
        
        localStorage.setItem('dealtock_user', JSON.stringify(userData));
        setUser(userData);
        resolve(userData);
      }, 500); 
    });
  };

  const logout = () => {
    localStorage.removeItem('dealtock_user');
    setUser(null);
  };
  
  // Placeholder for actual registration logic
  const register = (email, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API call for registration
      setTimeout(() => {
        // For now, just "succeed" and let login handle it
        // In a real app: create user, send confirmation email etc.
        console.log(`Simulating registration for ${email}`);
        // You might want to auto-login after registration or redirect to login
        resolve({ message: "Registration simulated. Please login." });
      }, 1000);
    });
  };


  return {
    user,
    isLoading,
    login,
    logout,
    register, // Expose register
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };
}