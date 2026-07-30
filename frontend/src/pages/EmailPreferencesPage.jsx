import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBell,
  FiCheckCircle,
  FiCreditCard,
  FiGift,
  FiMail,
  FiMessageCircle,
  FiRotateCcw,
  FiSave,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import EmailPreferenceToggle from
  "../components/account/EmailPreferenceToggle";

import useEmailNotifications from
  "../hooks/useEmailNotifications";

import {
  getApiErrorMessage,
} from "../utils/apiData";


const preferenceDefinitions = [
  {
    field: "order_updates",
    label: "Order Updates",
    description:
      "Receive emails when an order is placed, confirmed, processing or completed.",
    icon: FiShoppingBag,
  },
  {
    field: "payment_updates",
    label: "Payment Updates",
    description:
      "Receive payment confirmation, verification and payment status emails.",
    icon: FiCreditCard,
  },
  {
    field: "shipment_updates",
    label: "Shipment Updates",
    description:
      "Receive courier, tracking and delivery status notifications.",
    icon: FiTruck,
  },
  {
    field: "ticket_updates",
    label: "Support Ticket Updates",
    description:
      "Receive emails when support replies or changes your ticket status.",
    icon: FiMessageCircle,
  },
  {
    field: "return_updates",
    label: "Return and Refund Updates",
    description:
      "Receive emails regarding return approvals, refunds and status changes.",
    icon: FiRotateCcw,
  },
  {
    field: "promotional_emails",
    label: "Offers and Promotions",
    description:
      "Receive promotional offers, new arrivals and selected store announcements.",
    icon: FiGift,
  },
];


const initialPreferences = {
  order_updates: true,
  payment_updates: true,
  shipment_updates: true,
  ticket_updates: true,
  return_updates: true,
  promotional_emails: false,
};


function extractPreferenceValues(
  preferences,
) {
  return preferenceDefinitions.reduce(
    (result, preference) => ({
      ...result,
      [preference.field]:
        Boolean(
          preferences?.[
            preference.field
          ],
        ),
    }),
    {},
  );
}


function EmailPreferencesPage() {
  const {
    emailPreferences,
    isEmailPreferencesLoading,
    emailPreferencesError,
    refreshEmailPreferences,
    saveEmailPreferences,
    enableAllPreferences,
    disableAllPreferences,
  } = useEmailNotifications();

  const [
    formData,
    setFormData,
  ] = useState(initialPreferences);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    refreshEmailPreferences().catch(
      (error) => {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load email preferences.",
          ),
        );
      },
    );
  }, [refreshEmailPreferences]);

  useEffect(() => {
    if (!emailPreferences) {
      return;
    }

    setFormData(
      extractPreferenceValues(
        emailPreferences,
      ),
    );
  }, [emailPreferences]);

  const enabledCount = useMemo(
    () =>
      Object.values(formData).filter(
        Boolean,
      ).length,
    [formData],
  );

  const hasChanges = useMemo(
    () => {
      if (!emailPreferences) {
        return false;
      }

      return preferenceDefinitions.some(
        (preference) =>
          Boolean(
            formData[preference.field],
          )
          !== Boolean(
            emailPreferences[
              preference.field
            ],
          ),
      );
    },
    [
      emailPreferences,
      formData,
    ],
  );

  const handlePreferenceChange = (
    field,
    checked,
  ) => {
    setFormData(
      (currentData) => ({
        ...currentData,
        [field]: checked,
      }),
    );

    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSave = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result =
        await saveEmailPreferences(
          formData,
        );

      setFormData(
        extractPreferenceValues(
          result.preferences,
        ),
      );

      setSuccessMessage(
        result.message
        ?? (
          "Email preferences updated "
          + "successfully."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to save email preferences.",
        ),
      );
    }
  };

  const handleEnableAll = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result =
        await enableAllPreferences();

      setFormData(
        extractPreferenceValues(
          result.preferences,
        ),
      );

      setSuccessMessage(
        result.message
        ?? (
          "All email notifications "
          + "enabled successfully."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to enable notifications.",
        ),
      );
    }
  };

  const handleDisableAll = async () => {
    const confirmed = window.confirm(
      "Disable all email notifications?",
    );

    if (!confirmed) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const result =
        await disableAllPreferences();

      setFormData(
        extractPreferenceValues(
          result.preferences,
        ),
      );

      setSuccessMessage(
        result.message
        ?? (
          "All email notifications "
          + "disabled successfully."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to disable notifications.",
        ),
      );
    }
  };

  if (
    isEmailPreferencesLoading
    && !emailPreferences
  ) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Loading email preferences...
        </p>
      </section>
    );
  }

  return (
    <section className="email-preferences-page">
      <div className="email-preferences-header">
        <div className="container">
          <span className="section-label">
            Communication settings
          </span>

          <h1>Email Preferences</h1>

          <p>
            Choose which account and store
            updates you want to receive.
          </p>
        </div>
      </div>

      <div className="container email-preferences-content">
        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {(errorMessage
          || emailPreferencesError) && (
          <div className="store-message error">
            {errorMessage
              || emailPreferencesError}
          </div>
        )}

        <div className="email-preferences-summary">
          <div>
            <div className="email-preferences-summary__icon">
              <FiMail />
            </div>

            <div>
              <span>
                Active Categories
              </span>

              <strong>
                {enabledCount} of{" "}
                {preferenceDefinitions.length}
              </strong>
            </div>
          </div>

          <div className="email-preferences-summary__status">
            {enabledCount > 0 ? (
              <>
                <FiCheckCircle />
                Emails Enabled
              </>
            ) : (
              <>
                <FiXCircle />
                All Emails Disabled
              </>
            )}
          </div>
        </div>

        <section className="email-preferences-card">
          <div className="email-preferences-card__heading">
            <div>
              <FiBell />

              <span>
                Notification categories
              </span>

              <h2>
                Select Your Email Updates
              </h2>
            </div>

            <div className="email-preferences-bulk-actions">
              <button
                type="button"
                onClick={handleEnableAll}
                disabled={
                  isEmailPreferencesLoading
                }
              >
                <FiCheckCircle />
                Enable All
              </button>

              <button
                type="button"
                className="danger"
                onClick={handleDisableAll}
                disabled={
                  isEmailPreferencesLoading
                }
              >
                <FiXCircle />
                Disable All
              </button>
            </div>
          </div>

          <div className="email-preference-list">
            {preferenceDefinitions.map(
              (preference) => (
                <EmailPreferenceToggle
                  key={preference.field}
                  icon={preference.icon}
                  label={preference.label}
                  description={
                    preference.description
                  }
                  checked={
                    formData[
                      preference.field
                    ]
                  }
                  onChange={(checked) =>
                    handlePreferenceChange(
                      preference.field,
                      checked,
                    )
                  }
                  disabled={
                    isEmailPreferencesLoading
                  }
                />
              ),
            )}
          </div>

          <div className="email-preferences-save">
            <div>
              <strong>
                Save your changes
              </strong>

              <span>
                Preference changes apply to
                future emails.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                isEmailPreferencesLoading
                || !hasChanges
              }
            >
              <FiSave />

              {isEmailPreferencesLoading
                ? "Saving..."
                : "Save Preferences"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}


export default EmailPreferencesPage;