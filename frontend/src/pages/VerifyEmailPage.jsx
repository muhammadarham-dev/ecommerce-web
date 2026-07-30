import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiMail,
} from "react-icons/fi";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  confirmEmailVerification,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function VerifyEmailPage() {
  const [
    searchParams,
  ] = useSearchParams();

  const token =
    searchParams.get("token") ?? "";

  const [
    status,
    setStatus,
  ] = useState("loading");

  const [
    message,
    setMessage,
  ] = useState(
    "Confirming your email address...",
  );

  useEffect(() => {
    let isActive = true;

    async function verifyEmail() {
      if (!token) {
        setStatus("error");

        setMessage(
          "The email verification token is missing.",
        );

        return;
      }

      try {
        const result =
          await confirmEmailVerification(
            token,
          );

        if (isActive) {
          setStatus("success");

          setMessage(
            result.message
            ?? (
              "Email address verified "
              + "successfully."
            ),
          );
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");

          setMessage(
            getApiErrorMessage(
              error,
              "Unable to verify email address.",
            ),
          );
        }
      }
    }

    verifyEmail();

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <section className="security-form-page">
      <div className="security-form-container">
        <div className="security-form-card security-verification-card">
          {status === "loading" && (
            <>
              <div className="loading-spinner" />

              <h1>Verifying Email</h1>

              <p>{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <FiCheckCircle className="verification-success-icon" />

              <h1>Email Verified</h1>

              <p>{message}</p>

              <Link to="/account">
                Continue to My Account
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <FiAlertCircle className="verification-error-icon" />

              <h1>Verification Failed</h1>

              <p>{message}</p>

              <Link to="/security">
                <FiMail />
                Open Security Center
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


export default VerifyEmailPage;