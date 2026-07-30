import {
  useEffect,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiKey,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiShield,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  fetchSecurityStatus,
  logoutAllDevices,
  sendVerificationEmail,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function SecurityPage() {
  const navigate = useNavigate();

  const authContext = useAuth();

  const logoutAction =
    authContext.logout
    ?? authContext.signOut;

  const [
    securityStatus,
    setSecurityStatus,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSendingVerification,
    setIsSendingVerification,
  ] = useState(false);

  const [
    isLoggingOutAll,
    setIsLoggingOutAll,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSecurityStatus() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const statusData =
          await fetchSecurityStatus();

        if (isActive) {
          setSecurityStatus(
            statusData,
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load security status.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSecurityStatus();

    return () => {
      isActive = false;
    };
  }, []);

  const handleVerification =
    async () => {
      setIsSendingVerification(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const result =
          await sendVerificationEmail();

        setSuccessMessage(
          result.message
          ?? "Verification email sent.",
        );

        const updatedStatus =
          await fetchSecurityStatus();

        setSecurityStatus(
          updatedStatus,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to send verification email.",
          ),
        );
      } finally {
        setIsSendingVerification(false);
      }
    };

  const handleLogoutAll =
    async () => {
      const confirmed =
        window.confirm(
          "Sign out from all active devices?",
        );

      if (!confirmed) {
        return;
      }

      setIsLoggingOutAll(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        await logoutAllDevices();

        if (
          typeof logoutAction
          === "function"
        ) {
          try {
            await logoutAction();
          } catch {
            // The backend has already revoked
            // all active refresh tokens.
          }
        }

        navigate("/login", {
          replace: true,
          state: {
            message: (
              "All active sessions have "
              + "been signed out."
            ),
          },
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to sign out all devices.",
          ),
        );
      } finally {
        setIsLoggingOutAll(false);
      }
    };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Loading security center...
        </p>
      </section>
    );
  }

  return (
    <section className="security-center-page">
      <div className="account-center-header">
        <div className="container">
          <span className="section-label">
            Account protection
          </span>

          <h1>Security Center</h1>

          <p>
            Protect your account, password
            and active login sessions.
          </p>
        </div>
      </div>

      <div className="container security-center-content">
        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        <div className="security-center-grid">
          {/* Email Verification */}

          <article className="security-action-card">
            <div className="security-action-icon">
              <FiMail />
            </div>

            <div>
              <span>Email protection</span>

              <h2>
                {securityStatus
                  ?.is_email_verified
                  ? "Email Verified"
                  : "Verify Email Address"}
              </h2>

              <p>
                {securityStatus
                  ?.is_email_verified
                  ? (
                    "Your current email address "
                    + "has been verified."
                  )
                  : (
                    "Verify your email to improve "
                    + "account recovery security."
                  )}
              </p>
            </div>

            {securityStatus
              ?.is_email_verified ? (
              <span className="security-success-badge">
                <FiCheckCircle />
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={
                  handleVerification
                }
                disabled={
                  isSendingVerification
                }
              >
                {isSendingVerification
                  ? "Sending..."
                  : "Send Verification"}
              </button>
            )}
          </article>

          {/* Email Preferences */}

          <article className="security-action-card">
            <div className="security-action-icon">
              <FiMail />
            </div>

            <div>
              <span>
                Communication settings
              </span>

              <h2>Email Preferences</h2>

              <p>
                Select which account, order,
                payment, shipment and promotional
                emails you want to receive.
              </p>
            </div>

            <Link to="/email-preferences">
              Manage Preferences
            </Link>
          </article>

          {/* Change Password */}

          <article className="security-action-card">
            <div className="security-action-icon">
              <FiKey />
            </div>

            <div>
              <span>Password security</span>

              <h2>Change Password</h2>

              <p>
                Update your password. All active
                sessions will be signed out after
                the password changes.
              </p>
            </div>

            <Link to="/change-password">
              Change Password
            </Link>
          </article>

          {/* Logout All Devices */}

          <article className="security-action-card danger">
            <div className="security-action-icon">
              <FiMonitor />
            </div>

            <div>
              <span>Active sessions</span>

              <h2>Logout All Devices</h2>

              <p>
                Revoke all active refresh tokens
                and sign out your account from
                every device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
            >
              <FiLogOut />

              {isLoggingOutAll
                ? "Signing Out..."
                : "Logout All Devices"}
            </button>
          </article>
        </div>

        <div className="security-information-note">
          <FiShield />

          <div>
            <strong>
              Login Activity
            </strong>

            <p>
              Detailed login attempts and
              security summaries are restricted
              to platform security administrators.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


export default SecurityPage;