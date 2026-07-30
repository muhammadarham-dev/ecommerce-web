import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
} from "../services/authService";

import {
  clearAuthentication,
  getAccessToken,
  getStoredUser,
  saveAuthentication,
  updateStoredUser,
} from "../utils/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    getStoredUser,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const isAuthenticated = Boolean(
    user && getAccessToken(),
  );

  const loadCurrentUser = useCallback(
    async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await fetchCurrentUser();

        setUser(currentUser);
        updateStoredUser(currentUser);
      } catch {
        clearAuthentication();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(
    async ({ identifier, password }) => {
      const authenticationData =
        await loginUser({
          identifier,
          password,
        });

      saveAuthentication({
        access: authenticationData.access,
        refresh: authenticationData.refresh,
        user: authenticationData.user,
      });

      setUser(authenticationData.user);

      return authenticationData;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearAuthentication();
      setUser(null);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      refreshUser: loadCurrentUser,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      loadCurrentUser,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}