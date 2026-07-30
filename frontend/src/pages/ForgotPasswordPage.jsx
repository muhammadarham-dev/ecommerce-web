import {
  useState,
} from "react";

import {
  FiArrowLeft,
  FiMail,
  FiSend,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  requestPasswordReset,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function ForgotPasswordPage() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await requestPasswordReset(
          email.trim().toLowerCase(),
        );

      setSuccessMessage(
        result.message,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to request password reset.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="security-form-page">
      <div className="security-form-container">
        <Link
          to="/login"
          className="security-form-back"
        >
          <FiArrowLeft />
          Back to Login
        </Link>

        <div className="security-form-card">
          <div className="security-form-icon">
            <FiMail />
          </div>

          <span className="section-label">
            Account recovery
          </span>

          <h1>Forgot Password?</h1>

          <p>
            Enter your account email address
            to receive a password reset link.
          </p>

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

          <form onSubmit={handleSubmit}>
            <label>
              Email Address

              <div className="security-password-input">
                <FiMail />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              className="security-submit-button"
              disabled={isSubmitting}
            >
              <FiSend />

              {isSubmitting
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}


export default ForgotPasswordPage;