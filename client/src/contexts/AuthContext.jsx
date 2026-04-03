import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getMe } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await getMe();
          setUser(data);
        } catch {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await registerUser({ name, email, password, role });
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  // For Google OAuth callback
  const loginWithToken = async (token) => {
    localStorage.setItem("token", token);
    try {
      const { data } = await getMe();
      setUser(data);
    } catch {
      localStorage.removeItem("token");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

    return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);