import {
  useState,
} from "react";

import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  changePassword,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function ChangePasswordPage() {
  const navigate = useNavigate();

  const authContext = useAuth();

  const logoutAction =
    authContext.logout
    ?? authContext.signOut;

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPasswords,
    setShowPasswords,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setErrorMessage(
        "New password must contain at least 8 characters.",
      );

      return;
    }

    if (
      newPassword
      !== confirmPassword
    ) {
      setErrorMessage(
        "Password confirmation does not match.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result =
        await changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });

      if (
        typeof logoutAction
        === "function"
      ) {
        try {
          await logoutAction();
        } catch {
          // Password change already revoked
          // active sessions.
        }
      }

      navigate("/login", {
        replace: true,
        state: {
          message:
            result.message
            ?? (
              "Password changed successfully. "
              + "Please sign in again."
            ),
        },
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to change password.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordType =
    showPasswords
      ? "text"
      : "password";

  return (
    <section className="security-form-page">
      <div className="security-form-container">
        <Link
          to="/security"
          className="security-form-back"
        >
          <FiArrowLeft />
          Back to Security Center
        </Link>

        <div className="security-form-card">
          <div className="security-form-icon">
            <FiKey />
          </div>

          <span className="section-label">
            Password security
          </span>

          <h1>Change Password</h1>

          <p>
            Changing your password will sign
            out all currently active sessions.
          </p>

          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Current Password

              <div className="security-password-input">
                <FiLock />

                <input
                  type={passwordType}
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>
            </label>

            <label>
              New Password

              <div className="security-password-input">
                <FiLock />

                <input
                  type={passwordType}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value,
                    )
                  }
                  minLength="8"
                  required
                />
              </div>
            </label>

            <label>
              Confirm New Password

              <div className="security-password-input">
                <FiLock />

                <input
                  type={passwordType}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  minLength="8"
                  required
                />
              </div>
            </label>

            <button
              type="button"
              className="security-show-password"
              onClick={() =>
                setShowPasswords(
                  (current) => !current,
                )
              }
            >
              {showPasswords
                ? <FiEyeOff />
                : <FiEye />}

              {showPasswords
                ? "Hide Passwords"
                : "Show Passwords"}
            </button>

            <button
              type="submit"
              className="security-submit-button"
              disabled={isSubmitting}
            >
              <FiKey />

              {isSubmitting
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}


export default ChangePasswordPage;