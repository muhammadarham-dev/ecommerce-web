import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  registerUser,
} from "../services/authService";


const initialFormData = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone_number: "",
  password: "",
  password_confirm: "",
};


function getRegistrationErrors(error) {
  const responseData = error.response?.data;

  const details =
    responseData?.error?.details
    ?? responseData
    ?? {};

  const fieldErrors = {};

  if (
    details
    && typeof details === "object"
    && !Array.isArray(details)
  ) {
    Object.entries(details).forEach(
      ([fieldName, fieldValue]) => {
        if (Array.isArray(fieldValue)) {
          fieldErrors[fieldName] = String(
            fieldValue[0] ?? "",
          );
          return;
        }

        if (
          typeof fieldValue === "string"
        ) {
          fieldErrors[fieldName] =
            fieldValue;
        }
      },
    );
  }

  let message =
    responseData?.error?.message
    ?? responseData?.detail
    ?? "";

  if (!error.response) {
    message =
      "Unable to connect with the server. "
      + "Please ensure the Django backend is running.";
  }

  if (!message) {
    message =
      "Unable to create your account. "
      + "Please review the form and try again.";
  }

  return {
    message,
    fieldErrors,
  };
}


function RegisterPage() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const [formData, setFormData] = useState(
    initialFormData,
  );

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showPasswordConfirmation,
    setShowPasswordConfirmation,
  ] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    isAuthenticated,
    navigate,
  ]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;

    let strength = 0;

    if (password.length >= 8) {
      strength += 1;
    }

    if (/[A-Z]/.test(password)) {
      strength += 1;
    }

    if (/[a-z]/.test(password)) {
      strength += 1;
    }

    if (/\d/.test(password)) {
      strength += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }

    return strength;
  }, [formData.password]);

  const passwordStrengthLabel = [
    "Enter a password",
    "Very weak",
    "Weak",
    "Fair",
    "Strong",
    "Excellent",
  ][passwordStrength];

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));

    setErrorMessage("");
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.first_name.trim()) {
      validationErrors.first_name =
        "First name is required.";
    }

    if (!formData.last_name.trim()) {
      validationErrors.last_name =
        "Last name is required.";
    }

    if (!formData.username.trim()) {
      validationErrors.username =
        "Username is required.";
    }

    if (!formData.email.trim()) {
      validationErrors.email =
        "Email address is required.";
    }

    if (formData.password.length < 8) {
      validationErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (
      formData.password
      !== formData.password_confirm
    ) {
      validationErrors.password_confirm =
        "Password confirmation does not match.";
    }

    setFieldErrors(validationErrors);

    return (
      Object.keys(validationErrors).length
      === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      await registerUser({
        first_name:
          formData.first_name.trim(),

        last_name:
          formData.last_name.trim(),

        username:
          formData.username.trim(),

        email:
          formData.email.trim(),

        phone_number:
          formData.phone_number.trim(),

        password:
          formData.password,

        password_confirm:
          formData.password_confirm,
      });

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess:
            "Your account was created successfully. "
            + "Sign in to continue shopping.",
        },
      });
    } catch (error) {
      const {
        message,
        fieldErrors:
          backendFieldErrors,
      } = getRegistrationErrors(error);

      setErrorMessage(message);
      setFieldErrors(
        backendFieldErrors,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="register-page">
      <div className="container register-layout">
        <aside className="register-showcase">
          <div>
            <Link
              to="/"
              className="register-brand"
            >
              <span>
                <FiShoppingBag />
              </span>

              ShopSphere
            </Link>

            <span className="auth-badge">
              Premium customer account
            </span>

            <h1>
              Create your account and start
              shopping smarter.
            </h1>

            <p>
              Save products, manage orders,
              receive notifications and enjoy
              a secure personalized shopping
              experience.
            </p>
          </div>

          <div className="register-benefits">
            <div>
              <span>
                <FiShield />
              </span>

              <div>
                <strong>Secure Account</strong>

                <p>
                  JWT authentication and protected
                  customer information.
                </p>
              </div>
            </div>

            <div>
              <span>
                <FiCheck />
              </span>

              <div>
                <strong>Fast Checkout</strong>

                <p>
                  Save your details for a smoother
                  checkout experience.
                </p>
              </div>
            </div>

            <div>
              <span>
                <FiMail />
              </span>

              <div>
                <strong>Order Updates</strong>

                <p>
                  Receive important payment,
                  shipping and order notifications.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="register-form-section">
          <div className="register-heading">
            <span>Create account</span>

            <h2>Join ShopSphere</h2>

            <p>
              Enter your information to create
              a customer account.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-error">
              {errorMessage}
            </div>
          )}

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >
            <div className="register-field-grid">
              <label>
                First name

                <div
                  className={
                    fieldErrors.first_name
                      ? "input-group input-error"
                      : "input-group"
                  }
                >
                  <FiUser />

                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Muhammad"
                    autoComplete="given-name"
                  />
                </div>

                {fieldErrors.first_name && (
                  <small className="field-error">
                    {fieldErrors.first_name}
                  </small>
                )}
              </label>

              <label>
                Last name

                <div
                  className={
                    fieldErrors.last_name
                      ? "input-group input-error"
                      : "input-group"
                  }
                >
                  <FiUser />

                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Hamza"
                    autoComplete="family-name"
                  />
                </div>

                {fieldErrors.last_name && (
                  <small className="field-error">
                    {fieldErrors.last_name}
                  </small>
                )}
              </label>
            </div>

            <label>
              Username

              <div
                className={
                  fieldErrors.username
                    ? "input-group input-error"
                    : "input-group"
                }
              >
                <FiUser />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                  autoComplete="username"
                />
              </div>

              {fieldErrors.username && (
                <small className="field-error">
                  {fieldErrors.username}
                </small>
              )}
            </label>

            <label>
              Email address

              <div
                className={
                  fieldErrors.email
                    ? "input-group input-error"
                    : "input-group"
                }
              >
                <FiMail />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              {fieldErrors.email && (
                <small className="field-error">
                  {fieldErrors.email}
                </small>
              )}
            </label>

            <label>
              Phone number
              <span className="optional-label">
                Optional
              </span>

              <div
                className={
                  fieldErrors.phone_number
                    ? "input-group input-error"
                    : "input-group"
                }
              >
                <FiPhone />

                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                  autoComplete="tel"
                />
              </div>

              {fieldErrors.phone_number && (
                <small className="field-error">
                  {fieldErrors.phone_number}
                </small>
              )}
            </label>

            <div className="register-field-grid">
              <label>
                Password

                <div
                  className={
                    fieldErrors.password
                      ? "input-group input-error"
                      : "input-group"
                  }
                >
                  <FiLock />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (currentValue) =>
                          !currentValue,
                      )
                    }
                    aria-label="Toggle password visibility"
                  >
                    {showPassword
                      ? <FiEyeOff />
                      : <FiEye />}
                  </button>
                </div>

                {fieldErrors.password && (
                  <small className="field-error">
                    {fieldErrors.password}
                  </small>
                )}
              </label>

              <label>
                Confirm password

                <div
                  className={
                    fieldErrors.password_confirm
                      ? "input-group input-error"
                      : "input-group"
                  }
                >
                  <FiLock />

                  <input
                    type={
                      showPasswordConfirmation
                        ? "text"
                        : "password"
                    }
                    name="password_confirm"
                    value={
                      formData.password_confirm
                    }
                    onChange={handleChange}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPasswordConfirmation(
                        (currentValue) =>
                          !currentValue,
                      )
                    }
                    aria-label={
                      "Toggle password confirmation visibility"
                    }
                  >
                    {showPasswordConfirmation
                      ? <FiEyeOff />
                      : <FiEye />}
                  </button>
                </div>

                {fieldErrors.password_confirm && (
                  <small className="field-error">
                    {
                      fieldErrors
                        .password_confirm
                    }
                  </small>
                )}
              </label>
            </div>

            {formData.password && (
              <div className="password-strength">
                <div>
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        index < passwordStrength
                          ? "active"
                          : ""
                      }
                    />
                  ))}
                </div>

                <small>
                  Password strength:
                  {" "}
                  <strong>
                    {passwordStrengthLabel}
                  </strong>
                </small>
              </div>
            )}

            <label className="terms-option">
              <input
                type="checkbox"
                required
              />

              <span>
                I agree to the
                {" "}
                <a href="#terms">
                  Terms of Service
                </a>
                {" "}
                and
                {" "}
                <a href="#privacy">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              className="register-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}

              {!isSubmitting && (
                <FiArrowRight />
              )}
            </button>
          </form>

          <div className="register-login-link">
            Already have an account?

            <Link to="/login">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;