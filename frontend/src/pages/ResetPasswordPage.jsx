import {
  useState,
} from "react";

import {
  FiCheckCircle,
  FiKey,
  FiLock,
} from "react-icons/fi";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  resetPassword,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function ResetPasswordPage() {
  const [
    searchParams,
  ] = useSearchParams();

  const uid =
    searchParams.get("uid") ?? "";

  const token =
    searchParams.get("token") ?? "";

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isComplete,
    setIsComplete,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!uid || !token) {
      setErrorMessage(
        "The password reset link is incomplete or invalid.",
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
      await resetPassword({
        uid,
        token,
        newPassword,
        confirmPassword,
      });

      setIsComplete(true);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to reset password.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="security-form-page">
      <div className="security-form-container">
        <div className="security-form-card">
          {isComplete ? (
            <div className="security-complete-state">
              <FiCheckCircle />

              <h1>Password Reset</h1>

              <p>
                Your password has been reset
                successfully. You can now sign
                in using your new password.
              </p>

              <Link to="/login">
                Continue to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="security-form-icon">
                <FiKey />
              </div>

              <span className="section-label">
                Account recovery
              </span>

              <h1>Create New Password</h1>

              <p>
                Enter and confirm your new
                account password.
              </p>

              {errorMessage && (
                <div className="store-message error">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label>
                  New Password

                  <div className="security-password-input">
                    <FiLock />

                    <input
                      type="password"
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
                  Confirm Password

                  <div className="security-password-input">
                    <FiLock />

                    <input
                      type="password"
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
                  type="submit"
                  className="security-submit-button"
                  disabled={isSubmitting}
                >
                  <FiKey />

                  {isSubmitting
                    ? "Resetting Password..."
                    : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


export default ResetPasswordPage;