import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";


function normalizeMessage(message) {
  return String(message ?? "")
    .trim();
}


function findFirstError(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return normalizeMessage(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findFirstError(item);

      if (message) {
        return message;
      }
    }

    return "";
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "non_field_errors",
      "identifier",
      "email",
      "username",
      "password",
      "detail",
      "message",
      "error",
    ];

    for (const key of preferredKeys) {
      if (key in value) {
        const message = findFirstError(
          value[key],
        );

        if (message) {
          return message;
        }
      }
    }

    for (const nestedValue of Object.values(
      value,
    )) {
      const message = findFirstError(
        nestedValue,
      );

      if (message) {
        return message;
      }
    }
  }

  return "";
}


function isGenericValidationMessage(message) {
  const normalizedMessage = normalizeMessage(
    message,
  ).toLowerCase();

  return [
    "request validation failed",
    "validation failed",
    "invalid request",
    "bad request",
  ].some((text) =>
    normalizedMessage.includes(text),
  );
}


function isCredentialError(message) {
  const normalizedMessage = normalizeMessage(
    message,
  ).toLowerCase();

  const credentialMessages = [
    "invalid credential",
    "invalid login",
    "incorrect password",
    "wrong password",
    "unable to log in",
    "unable to login",
    "no active account",
    "user not found",
    "account not found",
    "invalid username",
    "invalid email",
    "provided credentials",
    "authentication failed",
  ];

  return credentialMessages.some((text) =>
    normalizedMessage.includes(text),
  );
}


function getErrorMessage(error) {
  if (!error?.response) {
    return (
      "Unable to connect with the server. "
      + "Please ensure the backend is running."
    );
  }

  const statusCode =
    error.response.status;

  const responseData =
    error.response.data;

  const detailedError =
    findFirstError(
      responseData?.error?.details,
    );

  if (
    detailedError
    && !isGenericValidationMessage(
      detailedError,
    )
  ) {
    if (
      statusCode === 401
      || isCredentialError(
        detailedError,
      )
    ) {
      return (
        "Incorrect email, username, "
        + "or password."
      );
    }

    return detailedError;
  }

  const directError =
    findFirstError(responseData);

  if (
    statusCode === 401
    || isCredentialError(directError)
  ) {
    return (
      "Incorrect email, username, "
      + "or password."
    );
  }

  if (
    directError
    && !isGenericValidationMessage(
      directError,
    )
  ) {
    return directError;
  }

  if (statusCode === 400) {
    return (
      "Please enter a valid email or username "
      + "and password."
    );
  }

  if (statusCode === 403) {
    return (
      "Your account does not have permission "
      + "to sign in."
    );
  }

  if (statusCode === 429) {
    return (
      "Too many login attempts. "
      + "Please try again later."
    );
  }

  if (statusCode >= 500) {
    return (
      "The server encountered an error. "
      + "Please try again shortly."
    );
  }

  return (
    "Unable to sign in. "
    + "Please check your credentials."
  );
}


function isManagementUser(user) {
  if (!user) {
    return false;
  }

  if (user.is_superuser === true) {
    return true;
  }

  const normalizedRole = String(
    user.role ?? "",
  )
    .trim()
    .toUpperCase();

  return [
    "ADMIN",
    "ORDER_MANAGER",
  ].includes(normalizedRole);
}


function getLoginDestination(user) {
  if (isManagementUser(user)) {
    return "/admin/dashboard";
  }

  return "/";
}


function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    user,
    isAuthenticated,
  } = useAuth();

  const [
    formData,
    setFormData,
  ] = useState({
    identifier: "",
    password: "",
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const registrationSuccess =
    location.state?.registrationSuccess
    || "";

  useEffect(() => {
    if (
      isAuthenticated
      && user
    ) {
      navigate(
        getLoginDestination(user),
        {
          replace: true,
        },
      );
    }
  }, [
    isAuthenticated,
    navigate,
    user,
  ]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value,
      }),
    );

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const identifier =
      formData.identifier.trim();

    const password =
      formData.password;

    if (!identifier) {
      setErrorMessage(
        "Please enter your email or username.",
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const authenticationData =
        await login({
          identifier,
          password,
        });

      const loggedInUser =
        authenticationData?.user;

      navigate(
        getLoginDestination(
          loggedInUser,
        ),
        {
          replace: true,
        },
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-showcase">
          <div>
            <span className="auth-badge">
              Premium shopping experience
            </span>

            <h1>
              Welcome back to ShopSphere.
            </h1>

            <p>
              Access your orders, saved
              products, secure payments and
              personalized recommendations.
            </p>
          </div>

          <div className="auth-testimonial">
            <div className="auth-stars">
              ★★★★★
            </div>

            <p>
              “A clean and reliable shopping
              experience with fast delivery and
              excellent customer support.”
            </p>

            <strong>
              Verified Customer
            </strong>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-heading">
            <span>
              Welcome back
            </span>

            <h2>
              Sign in to your account
            </h2>

            <p>
              Enter your credentials to
              continue.
            </p>
          </div>

          {registrationSuccess && (
            <div className="auth-success">
              <FiCheck />

              <span>
                {registrationSuccess}
              </span>
            </div>
          )}

          {errorMessage && (
            <div
              className="auth-error"
              role="alert"
              aria-live="polite"
            >
              <FiAlertCircle />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label>
              Email or username

              <div className="input-group">
                <FiMail />

                <input
                  type="text"
                  name="identifier"
                  value={
                    formData.identifier
                  }
                  onChange={handleChange}
                  placeholder={
                    "Enter email or username"
                  }
                  autoComplete="username"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </label>

            <label>
              Password

              <div className="input-group">
                <FiLock />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  placeholder={
                    "Enter your password"
                  }
                  autoComplete={
                    "current-password"
                  }
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className={
                    "password-toggle"
                  }
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  disabled={isSubmitting}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? <FiEyeOff />
                    : <FiEye />}
                </button>
              </div>
            </label>

            <div className="auth-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  disabled={isSubmitting}
                />

                <span>
                  Remember me
                </span>
              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={
                "auth-submit-button"
              }
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Signing In..."
                : "Sign In"}

              {!isSubmitting && (
                <FiArrowRight />
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>
              New to ShopSphere?
            </span>
          </div>

          <Link
            to="/register"
            className={
              "auth-secondary-button"
            }
          >
            Create New Account
          </Link>
        </div>
      </div>
    </section>
  );
}


export default LoginPage;