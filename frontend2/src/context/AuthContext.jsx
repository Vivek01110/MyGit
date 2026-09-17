import { createContext, useContext, useState, useEffect } from "react";
import { api, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial verification if token exists
    const storedToken = getAuthToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setUser(storedUser);
      setToken(storedToken);
      // Fetch latest profile from backend to ensure everything is in sync
      api.users
        .getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            setStoredUser(res.user);
          }
        })
        .catch(() => {
          // Token might be expired or invalid
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    const receivedToken = data.token;
    const receivedUser = data.user || { id: data.userId, email, username: email.split("@")[0] };

    setAuthToken(receivedToken);
    setStoredUser(receivedUser);
    setToken(receivedToken);
    setUser(receivedUser);
    return data;
  };

  const signup = async (username, email, password) => {
    const data = await api.auth.signup({ username, email, password });
    const receivedToken = data.token;
    const receivedUser = data.user || { id: data.userId, email, username };

    setAuthToken(receivedToken);
    setStoredUser(receivedUser);
    setToken(receivedToken);
    setUser(receivedUser);
    return data;
  };

  const updateUser = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    setStoredUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
