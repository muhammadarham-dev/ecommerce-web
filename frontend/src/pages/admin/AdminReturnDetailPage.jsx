import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiClipboard,
  FiDollarSign,
  FiExternalLink,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import ReturnItemsTable from
  "../../components/admin/returns/ReturnItemsTable";

import ReturnStatusManager from
  "../../components/admin/returns/ReturnStatusManager";

import ReturnTimeline from
  "../../components/admin/returns/ReturnTimeline";

import useStoreSettings from
  "../../hooks/useStoreSettings";

import {
  fetchAdminReturn,
  updateAdminReturnStatus,
} from "../../services/adminReturnService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}


function AdminReturnDetailPage() {
  const {
    returnNumber,
  } = useParams();

  const {
    formatMoney,
  } = useStoreSettings();

  const [
    returnRequest,
    setReturnRequest,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const money = useMemo(
    () =>
      typeof formatMoney === "function"
        ? formatMoney
        : (value) =>
          new Intl.NumberFormat(
            "en-US",
            {
              style: "currency",
              currency: "USD",
            },
          ).format(
            Number(value || 0),
          ),
    [formatMoney],
  );

  const loadReturn = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data =
          await fetchAdminReturn(
            returnNumber,
          );

        setReturnRequest(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this return request.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [returnNumber],
  );

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  const handleStatusUpdate =
    async ({
      status,
      adminNote,
    }) => {
      if (
        status === "REFUNDED"
        && !window.confirm(
          "Confirm that the customer refund "
          + "has been processed?",
        )
      ) {
        return;
      }

      setIsUpdating(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await updateAdminReturnStatus(
            returnNumber,
            {
              status,
              adminNote,
            },
          );

        setReturnRequest(
          result.returnRequest,
        );

        setNoticeMessage(
          result.message
          || (
            "Return request updated "
            + "successfully."
          ),
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update this return request.",
          ),
        );
      } finally {
        setIsUpdating(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-returns-state">
        <div className="admin-loading-spinner" />
        <p>Loading return details...</p>
      </div>
    );
  }

  if (!returnRequest) {
    return (
      <section className="admin-returns-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Return request not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-return-detail-page">
      <div className="admin-return-detail-page__heading">
        <div>
          <Link
            to="/admin/returns"
            className="admin-return-back-link"
          >
            <FiArrowLeft />
            Back to Returns
          </Link>

          <span className="admin-returns-eyebrow">
            Return details
          </span>

          <h1>
            {returnRequest.return_number}
          </h1>

          <p>
            Created{" "}
            {formatDate(
              returnRequest.created_at,
            )}
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadReturn}
          disabled={isLoading}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-return-detail-summary">
        <div>
          <small>Return status</small>

          <span
            className={
              `admin-return-status admin-return-status--${
                String(
                  returnRequest.status,
                ).toLowerCase()
              }`
            }
          >
            {normalizeLabel(
              returnRequest.status,
            )}
          </span>
        </div>

        <div>
          <small>Return reason</small>

          <strong>
            {normalizeLabel(
              returnRequest.reason,
            )}
          </strong>
        </div>

        <div>
          <small>Refund amount</small>

          <strong>
            {money(
              returnRequest.refund_amount,
            )}
          </strong>
        </div>

        <div>
          <small>Items</small>

          <strong>
            {
              returnRequest.items?.length
              ?? 0
            }
          </strong>
        </div>
      </div>

      <div className="admin-return-detail-grid">
        <div className="admin-return-detail-main">
          <ReturnItemsTable
            items={
              returnRequest.items ?? []
            }
            formatMoney={money}
          />

          <section className="admin-return-card">
            <div className="admin-return-card__heading">
              <div>
                <span>
                  Customer explanation
                </span>

                <h2>Return details</h2>
              </div>

              <FiClipboard />
            </div>

            <div className="admin-return-description">
              <div>
                <small>Reason</small>

                <strong>
                  {normalizeLabel(
                    returnRequest.reason,
                  )}
                </strong>
              </div>

              <p>
                {returnRequest.details
                  || (
                    "The customer did not "
                    + "provide additional details."
                  )}
              </p>
            </div>
          </section>

          <section className="admin-return-card">
            <div className="admin-return-card__heading">
              <div>
                <span>Refund calculation</span>
                <h2>Refund summary</h2>
              </div>

              <FiDollarSign />
            </div>

            <div className="admin-return-refund-summary">
              <span>
                Total eligible refund
              </span>

              <strong>
                {money(
                  returnRequest.refund_amount,
                )}
              </strong>
            </div>
          </section>
        </div>

        <aside className="admin-return-detail-sidebar">
          <ReturnStatusManager
            returnRequest={returnRequest}
            isSubmitting={isUpdating}
            onSubmit={
              handleStatusUpdate
            }
          />

          <ReturnTimeline
            returnRequest={returnRequest}
          />

          <section className="admin-return-card">
            <div className="admin-return-card__heading">
              <div>
                <span>Customer</span>
                <h2>Request owner</h2>
              </div>

              <FiUser />
            </div>

            <div className="admin-return-info-list">
              <div>
                <small>Username</small>

                <strong>
                  {
                    returnRequest
                      .customer_username
                  }
                </strong>
              </div>

              <div>
                <small>Order number</small>

                <Link
                  to={
                    `/admin/orders/${
                      encodeURIComponent(
                        returnRequest
                          .order_number,
                      )
                    }`
                  }
                  className="admin-return-order-link"
                >
                  {
                    returnRequest.order_number
                  }
                  <FiExternalLink />
                </Link>
              </div>

              <div>
                <small>Reviewed by</small>

                <strong>
                  {
                    returnRequest
                      .reviewed_by_username
                    || "Not reviewed"
                  }
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-return-card">
            <div className="admin-return-card__heading">
              <div>
                <span>Administration</span>
                <h2>Admin note</h2>
              </div>
            </div>

            <p className="admin-return-admin-note">
              {returnRequest.admin_note
                || (
                  "No administrative note "
                  + "has been added."
                )}
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}


export default AdminReturnDetailPage;