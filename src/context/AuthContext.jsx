import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import apiClient from "@/api/axios";

const AuthContext = createContext(null);

const getStoredToken = () => {
  try {
    return localStorage.getItem("authToken");
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAuthToken(token);
    } else {
      setAuthToken(null);
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!authToken) return null;
    try {
      setIsLoadingUser(true);
      const { data } = await apiClient.get("/users/me");
      const userProfile = data?.user || data;
      if (userProfile) {
        setCurrentUser(userProfile);
        localStorage.setItem("currentUser", JSON.stringify(userProfile));
      }
      return userProfile;
    } catch (error) {
      console.error("Failed to load current user", error);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken && !currentUser) {
      fetchCurrentUser();
    }
  }, [authToken, currentUser, fetchCurrentUser]);

  const login = async (token, userProfile = null) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
    if (userProfile) {
      setCurrentUser(userProfile);
      localStorage.setItem("currentUser", JSON.stringify(userProfile));
      return userProfile;
    }
    return fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    setAuthToken(null);
    setCurrentUser(null);
  };

  const value = {
    authToken,
    currentUser,
    login,
    logout,
    refreshUser: fetchCurrentUser,
    isAuthenticated: !!authToken,
    isLoadingUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
