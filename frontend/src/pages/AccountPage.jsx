import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiMail,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  fetchProfile,
  updateProfile,
} from "../services/accountService";

import {
  fetchSecurityStatus,
  sendVerificationEmail,
} from "../services/securityService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


const initialFormData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
};


function AccountPage() {
  const authContext = useAuth();

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);

  const [
    securityStatus,
    setSecurityStatus,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isSendingVerification,
    setIsSendingVerification,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadAccount() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          profileData,
          securityData,
        ] = await Promise.all([
          fetchProfile(),
          fetchSecurityStatus(),
        ]);

        if (!isActive) {
          return;
        }

        setFormData({
          username:
            profileData.username ?? "",
          email:
            profileData.email ?? "",
          first_name:
            profileData.first_name ?? "",
          last_name:
            profileData.last_name ?? "",
          phone_number:
            profileData.phone_number ?? "",
        });

        setSecurityStatus(securityData);
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load account information.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      isActive = false;
    };
  }, []);

  const handleInputChange = (
    event,
  ) => {
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
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !formData.username.trim()
      || !formData.email.trim()
    ) {
      setErrorMessage(
        "Username and email are required.",
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedProfile =
        await updateProfile({
          username:
            formData.username.trim(),
          email:
            formData.email
              .trim()
              .toLowerCase(),
          first_name:
            formData.first_name.trim(),
          last_name:
            formData.last_name.trim(),
          phone_number:
            formData.phone_number.trim(),
        });

      setFormData({
        username:
          updatedProfile.username ?? "",
        email:
          updatedProfile.email ?? "",
        first_name:
          updatedProfile.first_name ?? "",
        last_name:
          updatedProfile.last_name ?? "",
        phone_number:
          updatedProfile.phone_number ?? "",
      });

      const refreshUser =
        authContext.refreshUser
        ?? authContext.refreshCurrentUser
        ?? authContext.loadCurrentUser;

      if (
        typeof refreshUser
        === "function"
      ) {
        await refreshUser();
      }

      const updatedSecurityStatus =
        await fetchSecurityStatus();

      setSecurityStatus(
        updatedSecurityStatus,
      );

      setSuccessMessage(
        "Profile updated successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to update profile.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerification =
    async () => {
      setIsSendingVerification(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const result =
          await sendVerificationEmail();

        setSuccessMessage(
          result.message
          ?? (
            "Verification email sent "
            + "successfully."
          ),
        );

        const latestStatus =
          await fetchSecurityStatus();

        setSecurityStatus(latestStatus);
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

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Loading account information...
        </p>
      </section>
    );
  }

  return (
    <section className="account-center-page">
      <div className="account-center-header">
        <div className="container">
          <span className="section-label">
            Customer account
          </span>

          <h1>My Account</h1>

          <p>
            Manage your personal information
            and account security.
          </p>
        </div>
      </div>

      <div className="container account-center-layout">
        <main className="account-center-main">
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

          <form
            className="account-center-card"
            onSubmit={handleSubmit}
          >
            <div className="account-card-heading">
              <FiEdit3 />

              <div>
                <span>Profile settings</span>
                <h2>Personal Information</h2>
              </div>
            </div>

            <div className="account-form-grid">
              <label className="account-field">
                <span>
                  <FiUser />
                  Username
                </span>

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  maxLength="150"
                  required
                />
              </label>

              <label className="account-field">
                <span>
                  <FiMail />
                  Email Address
                </span>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label className="account-field">
                <span>
                  <FiUser />
                  First Name
                </span>

                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  maxLength="150"
                />
              </label>

              <label className="account-field">
                <span>
                  <FiUser />
                  Last Name
                </span>

                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  maxLength="150"
                />
              </label>

              <label className="account-field account-field--full">
                <span>
                  <FiPhone />
                  Phone Number
                </span>

                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  maxLength="20"
                  placeholder="+92 300 1234567"
                />
              </label>
            </div>

            <div className="account-form-actions">
              <button
                type="submit"
                disabled={isSaving}
              >
                <FiSave />

                {isSaving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </main>

        <aside className="account-center-sidebar">
          <section className="account-center-card">
            <div className="account-card-heading">
              <FiShield />

              <div>
                <span>Security status</span>
                <h2>Email Verification</h2>
              </div>
            </div>

            <div
              className={
                securityStatus
                  ?.is_email_verified
                  ? (
                    "account-verification-status "
                    + "verified"
                  )
                  : (
                    "account-verification-status "
                    + "unverified"
                  )
              }
            >
              {securityStatus
                ?.is_email_verified ? (
                <FiCheckCircle />
              ) : (
                <FiAlertCircle />
              )}

              <div>
                <strong>
                  {securityStatus
                    ?.is_email_verified
                    ? "Email Verified"
                    : "Email Not Verified"}
                </strong>

                <span>
                  {securityStatus?.email
                    ?? formData.email}
                </span>
              </div>
            </div>

            {!securityStatus
              ?.is_email_verified && (
              <button
                type="button"
                className="account-verification-button"
                onClick={
                  handleSendVerification
                }
                disabled={
                  isSendingVerification
                }
              >
                <FiMail />

                {isSendingVerification
                  ? "Sending Email..."
                  : "Send Verification Email"}
              </button>
            )}
          </section>

          <section className="account-security-links">
            <FiShield />


            <h3>Account Security</h3>

            <p>
              Change your password or sign out
              from other active devices.
            </p>


            <Link to="/security">
              Open Security Center
            </Link>
          </section>
          <section className="account-email-preferences-link">
  <FiMail />

  <h3>Email Preferences</h3>

  <p>
    Control order, payment, shipment,
    support and promotional emails.
  </p>

  <Link to="/email-preferences">
    Manage Email Preferences
  </Link>
</section>
        </aside>
      </div>
    </section>
  );
}


export default AccountPage;