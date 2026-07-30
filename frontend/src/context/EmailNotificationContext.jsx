import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  disableAllEmailPreferences,
  enableAllEmailPreferences,
  fetchEmailPreferences,
  updateEmailPreferences,
} from "../services/emailNotificationService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


const EmailNotificationContext =
  createContext(null);


export function EmailNotificationProvider({
  children,
}) {
  const authContext = useAuth();

  const isAuthenticated = Boolean(
    authContext.isAuthenticated
    ?? authContext.user
    ?? authContext.currentUser,
  );

  const [
    emailPreferences,
    setEmailPreferences,
  ] = useState(null);

  const [
    isEmailPreferencesLoading,
    setIsEmailPreferencesLoading,
  ] = useState(false);

  const [
    emailPreferencesError,
    setEmailPreferencesError,
  ] = useState("");

  const refreshEmailPreferences =
    useCallback(async () => {
      if (!isAuthenticated) {
        setEmailPreferences(null);
        setEmailPreferencesError("");

        return null;
      }

      setIsEmailPreferencesLoading(true);
      setEmailPreferencesError("");

      try {
        const preferences =
          await fetchEmailPreferences();

        setEmailPreferences(preferences);

        return preferences;
      } catch (error) {
        setEmailPreferencesError(
          getApiErrorMessage(
            error,
            "Unable to load email preferences.",
          ),
        );

        throw error;
      } finally {
        setIsEmailPreferencesLoading(false);
      }
    }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEmailPreferences(null);
      setEmailPreferencesError("");

      return;
    }

    refreshEmailPreferences().catch(
      () => {
        // Preferences can be loaded again
        // from the preferences page.
      },
    );
  }, [
    isAuthenticated,
    refreshEmailPreferences,
  ]);

  const saveEmailPreferences =
    useCallback(
      async (preferenceData) => {
        setIsEmailPreferencesLoading(true);
        setEmailPreferencesError("");

        try {
          const result =
            await updateEmailPreferences(
              preferenceData,
            );

          setEmailPreferences(
            result.preferences,
          );

          return result;
        } catch (error) {
          setEmailPreferencesError(
            getApiErrorMessage(
              error,
              "Unable to save email preferences.",
            ),
          );

          throw error;
        } finally {
          setIsEmailPreferencesLoading(false);
        }
      },
      [],
    );

  const enableAllPreferences =
    useCallback(async () => {
      setIsEmailPreferencesLoading(true);
      setEmailPreferencesError("");

      try {
        const result =
          await enableAllEmailPreferences();

        setEmailPreferences(
          result.preferences,
        );

        return result;
      } catch (error) {
        setEmailPreferencesError(
          getApiErrorMessage(
            error,
            "Unable to enable email notifications.",
          ),
        );

        throw error;
      } finally {
        setIsEmailPreferencesLoading(false);
      }
    }, []);

  const disableAllPreferences =
    useCallback(async () => {
      setIsEmailPreferencesLoading(true);
      setEmailPreferencesError("");

      try {
        const result =
          await disableAllEmailPreferences();

        setEmailPreferences(
          result.preferences,
        );

        return result;
      } catch (error) {
        setEmailPreferencesError(
          getApiErrorMessage(
            error,
            "Unable to disable email notifications.",
          ),
        );

        throw error;
      } finally {
        setIsEmailPreferencesLoading(false);
      }
    }, []);

  const contextValue = useMemo(
    () => ({
      emailPreferences,
      isEmailPreferencesLoading,
      emailPreferencesError,
      refreshEmailPreferences,
      saveEmailPreferences,
      enableAllPreferences,
      disableAllPreferences,
    }),
    [
      emailPreferences,
      isEmailPreferencesLoading,
      emailPreferencesError,
      refreshEmailPreferences,
      saveEmailPreferences,
      enableAllPreferences,
      disableAllPreferences,
    ],
  );

  return (
    <EmailNotificationContext.Provider
      value={contextValue}
    >
      {children}
    </EmailNotificationContext.Provider>
  );
}


export default EmailNotificationContext;