import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [email, setEmail] = useState(localStorage.getItem("email"));

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const savedUsername = localStorage.getItem("username");
    const savedRole = localStorage.getItem("role");
    const savedEmail = localStorage.getItem("email");

    if (token) setAuthToken(token);
    if (savedUsername) setUsername(savedUsername);
    if (savedRole) setRole(savedRole);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
    if (userData) {
      localStorage.setItem("username", userData.username);
      setUsername(userData.username);

      localStorage.setItem("role", userData.roleCode);
      setRole(userData.role_code);

      localStorage.setItem("email", userData.email);
      setEmail(userData.email);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setAuthToken(null);
    setUsername(null);
    setRole(null);
    setEmail(null);
  };

  const value = {
    authToken,
    username,
    role,
    email,
    login,
    logout,
    isAuthenticated: !!authToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
