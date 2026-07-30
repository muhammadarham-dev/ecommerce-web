import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiPackage,
  FiSearch,
  FiShoppingBag,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  fetchReturns,
} from "../services/returnService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  formatOrderDate,
} from "../utils/order";

import {
  formatReturnValue,
  getReturnStatusClass,
} from "../utils/returns";


function MyReturnsPage() {
  const [
    returnRequests,
    setReturnRequests,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadReturns() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const returnData =
          await fetchReturns();

        if (isActive) {
          setReturnRequests(returnData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load return requests.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReturns();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredReturns = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return returnRequests.filter(
        (returnRequest) => {
          const matchesStatus =
            !statusFilter
            || returnRequest.status
              === statusFilter;

          const searchableText = [
            returnRequest.return_number,
            returnRequest.order_number,
            returnRequest.reason,
            ...(
              returnRequest.items?.map(
                (item) =>
                  item.product_name,
              )
              ?? []
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch
            || searchableText.includes(
              normalizedSearch,
            );

          return (
            matchesStatus
            && matchesSearch
          );
        },
      );
    },
    [
      returnRequests,
      searchTerm,
      statusFilter,
    ],
  );

  return (
    <section className="returns-page">
      <div className="return-page-header">
        <div className="container">
          <span className="section-label">
            Returns and refunds
          </span>

          <h1>My Returns</h1>

          <p>
            Track product returns, approvals
            and refund progress.
          </p>
        </div>
      </div>

      <div className="container returns-content">
        <div className="returns-toolbar">
          <div className="returns-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder={
                "Search returns, orders "
                + "or products"
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >
            <option value="">
              All Statuses
            </option>

            <option value="REQUESTED">
              Requested
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

            <option value="PRODUCT_RECEIVED">
              Product Received
            </option>

            <option value="REFUNDED">
              Refunded
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="returns-empty">
            <div className="loading-spinner" />
            <p>Loading return requests...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="returns-empty">
            <FiShoppingBag />

            <h2>No Returns Found</h2>

            <p>
              You do not currently have any
              matching return requests.
            </p>

            <Link
              to="/orders"
              className="primary-button"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="returns-list">
            {filteredReturns.map(
              (returnRequest) => (
                <article
                  key={returnRequest.id}
                  className="return-list-card"
                >
                  <div className="return-list-header">
                    <div>
                      <span>Return Number</span>

                      <h2>
                        {
                          returnRequest
                            .return_number
                        }
                      </h2>

                      <small>
                        {formatOrderDate(
                          returnRequest
                            .created_at,
                        )}
                      </small>
                    </div>

                    <span
                      className={
                        "return-status-badge "
                        + getReturnStatusClass(
                          returnRequest.status,
                        )
                      }
                    >
                      {formatReturnValue(
                        returnRequest.status,
                      )}
                    </span>
                  </div>

                  <div className="return-list-body">
                    <div>
                      <FiPackage />

                      <span>
                        <small>Order Number</small>

                        <strong>
                          {
                            returnRequest
                              .order_number
                          }
                        </strong>
                      </span>
                    </div>

                    <div>
                      <span>
                        <small>Reason</small>

                        <strong>
                          {formatReturnValue(
                            returnRequest.reason,
                          )}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <span>
                        <small>Products</small>

                        <strong>
                          {
                            returnRequest
                              .items?.length
                            ?? 0
                          }
                        </strong>
                      </span>
                    </div>

                    <div>
                      <span>
                        <small>
                          Refund Amount
                        </small>

                        <strong>
                          {formatCurrency(
                            returnRequest
                              .refund_amount,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="return-list-footer">
                    <p>
                      {returnRequest.items
                        ?.map(
                          (item) =>
                            item.variant_name
                            || item.product_name,
                        )
                        .join(", ")}
                    </p>

                    <Link
                      to={
                        `/returns/${
                          returnRequest
                            .return_number
                        }`
                      }
                    >
                      View Details
                      <FiArrowRight />
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default MyReturnsPage;