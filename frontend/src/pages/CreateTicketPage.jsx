import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiFile,
  FiHelpCircle,
  FiMessageSquare,
  FiPackage,
  FiPaperclip,
  FiSend,
  FiX,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  fetchOrder,
  fetchOrders,
} from "../services/orderService";

import {
  createTicket,
} from "../services/ticketService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  ticketCategoryOptions,
  ticketPriorityOptions,
  validateTicketFiles,
} from "../utils/tickets";


function getProductId(item) {
  if (
    item.product
    && typeof item.product === "object"
  ) {
    return item.product.id;
  }

  return item.product;
}


function CreateTicketPage() {
  const navigate = useNavigate();

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    category,
    setCategory,
  ] = useState("ORDER_ISSUE");

  const [
    priority,
    setPriority,
  ] = useState("MEDIUM");

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    selectedOrderNumber,
    setSelectedOrderNumber,
  ] = useState("");

  const [
    productId,
    setProductId,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isLoadingOrder,
    setIsLoadingOrder,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);

      try {
        const orderData =
          await fetchOrders({
            ordering: "-created_at",
          });

        if (isActive) {
          setOrders(orderData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load your orders.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrderNumber) {
      setSelectedOrder(null);
      setProductId("");

      return undefined;
    }

    let isActive = true;

    async function loadSelectedOrder() {
      setIsLoadingOrder(true);
      setErrorMessage("");

      try {
        const orderData =
          await fetchOrder(
            selectedOrderNumber,
          );

        if (isActive) {
          setSelectedOrder(orderData);
          setProductId("");
        }
      } catch (error) {
        if (isActive) {
          setSelectedOrder(null);

          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load the selected order.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingOrder(false);
        }
      }
    }

    loadSelectedOrder();

    return () => {
      isActive = false;
    };
  }, [selectedOrderNumber]);

  const productOptions = useMemo(
    () => {
      const productMap = new Map();

      selectedOrder?.items?.forEach(
        (item) => {
          const itemProductId =
            getProductId(item);

          if (!itemProductId) {
            return;
          }

          if (
            !productMap.has(
              String(itemProductId),
            )
          ) {
            productMap.set(
              String(itemProductId),
              {
                id: itemProductId,
                name: item.product_name,
                sku: item.product_sku,
              },
            );
          }
        },
      );

      return Array.from(
        productMap.values(),
      );
    },
    [selectedOrder],
  );

  const selectedOrderId =
    selectedOrder?.id ?? "";

  const handleFilesChange = (
    event,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || [],
      );

    const validation =
      validateTicketFiles(
        selectedFiles,
      );

    if (!validation.valid) {
      setErrorMessage(
        validation.message,
      );

      event.target.value = "";
      return;
    }

    setAttachments(selectedFiles);
    setErrorMessage("");
  };

  const removeAttachment = (
    fileIndex,
  ) => {
    setAttachments(
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== fileIndex,
        ),
    );
  };

  const validateForm = () => {
    if (!category) {
      setErrorMessage(
        "Please select a ticket category.",
      );

      return false;
    }

    if (!subject.trim()) {
      setErrorMessage(
        "Ticket subject is required.",
      );

      return false;
    }

    if (!message.trim()) {
      setErrorMessage(
        "Please describe your issue.",
      );

      return false;
    }

    const attachmentValidation =
      validateTicketFiles(attachments);

    if (!attachmentValidation.valid) {
      setErrorMessage(
        attachmentValidation.message,
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result =
        await createTicket({
          category,
          priority,
          subject: subject.trim(),
          orderId: selectedOrderId,
          productId,
          message: message.trim(),
          attachments,
        });

      navigate(
        `/tickets/${
          result.ticket.ticket_number
        }`,
        {
          replace: true,

          state: {
            message:
              result.message
              ?? (
                "Support ticket created "
                + "successfully."
              ),
          },
        },
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to create support ticket.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ticket-page">
      <div className="ticket-page-header">
        <div className="container">
          <Link
            to="/tickets"
            className="ticket-back-link"
          >
            <FiArrowLeft />
            Back to Support Tickets
          </Link>

          <span className="section-label">
            Customer support
          </span>

          <h1>Create Support Ticket</h1>

          <p>
            Describe your issue and attach
            relevant screenshots or documents.
          </p>
        </div>
      </div>

      <form
        className="container create-ticket-layout"
        onSubmit={handleSubmit}
      >
        <main className="create-ticket-main">
          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          <section className="ticket-card">
            <div className="ticket-card-heading">
              <FiHelpCircle />

              <div>
                <span>Step 1</span>
                <h2>Issue Information</h2>
              </div>
            </div>

            <div className="ticket-field-grid">
              <label className="ticket-form-field">
                Category

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                >
                  {ticketCategoryOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="ticket-form-field">
                Priority

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value,
                    )
                  }
                >
                  {ticketPriorityOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="ticket-form-field">
              Subject

              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value,
                  )
                }
                placeholder={
                  "Briefly summarize your issue"
                }
                maxLength="255"
                required
              />
            </label>
          </section>

          <section className="ticket-card">
            <div className="ticket-card-heading">
              <FiPackage />

              <div>
                <span>Optional</span>
                <h2>Related Order</h2>
              </div>
            </div>

            <label className="ticket-form-field">
              Select order

              <select
                value={selectedOrderNumber}
                onChange={(event) =>
                  setSelectedOrderNumber(
                    event.target.value,
                  )
                }
                disabled={isLoading}
              >
                <option value="">
                  No related order
                </option>

                {orders.map((order) => (
                  <option
                    key={order.id}
                    value={
                      order.order_number
                    }
                  >
                    {order.order_number}
                    {" — "}
                    {order.status}
                  </option>
                ))}
              </select>
            </label>

            {isLoadingOrder && (
              <p className="ticket-loading-text">
                Loading order products...
              </p>
            )}

            {selectedOrder
              && !isLoadingOrder && (
                <label className="ticket-form-field">
                  Related product

                  <select
                    value={productId}
                    onChange={(event) =>
                      setProductId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      No specific product
                    </option>

                    {productOptions.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                          {product.sku
                            ? ` — ${product.sku}`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
          </section>

          <section className="ticket-card">
            <div className="ticket-card-heading">
              <FiMessageSquare />

              <div>
                <span>Step 2</span>
                <h2>Describe Your Issue</h2>
              </div>
            </div>

            <label className="ticket-form-field">
              Message

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value,
                  )
                }
                rows="9"
                maxLength="5000"
                placeholder={
                  "Explain what happened and "
                  + "how our support team can help."
                }
                required
              />

              <small>
                {message.length}
                {" / 5000 characters"}
              </small>
            </label>

            <label className="ticket-file-picker">
              <input
                type="file"
                multiple
                accept={
                  ".jpg,.jpeg,.png,"
                  + ".webp,.pdf"
                }
                onChange={
                  handleFilesChange
                }
              />

              <FiPaperclip />

              <div>
                <strong>
                  Add Attachments
                </strong>

                <span>
                  Up to 5 JPG, PNG, WEBP or
                  PDF files. Maximum 5 MB each.
                </span>
              </div>
            </label>

            {attachments.length > 0 && (
              <div className="ticket-attachment-list">
                {attachments.map(
                  (file, index) => (
                    <div
                      key={
                        `${file.name}-${index}`
                      }
                      className="ticket-selected-file"
                    >
                      <FiFile />

                      <div>
                        <strong>
                          {file.name}
                        </strong>

                        <span>
                          {(
                            file.size
                            / 1024
                            / 1024
                          ).toFixed(2)}
                          {" MB"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeAttachment(index)
                        }
                        aria-label={
                          "Remove attachment"
                        }
                      >
                        <FiX />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="ticket-submit-card">
          <span className="section-label">
            Ticket summary
          </span>

          <h2>
            {subject.trim()
              || "New Support Ticket"}
          </h2>

          <div className="ticket-submit-summary">
            <div>
              <span>Category</span>

              <strong>
                {ticketCategoryOptions.find(
                  (option) =>
                    option.value
                    === category,
                )?.label}
              </strong>
            </div>

            <div>
              <span>Priority</span>

              <strong>{priority}</strong>
            </div>

            <div>
              <span>Related Order</span>

              <strong>
                {selectedOrderNumber
                  || "None"}
              </strong>
            </div>

            <div>
              <span>Attachments</span>

              <strong>
                {attachments.length}
              </strong>
            </div>
          </div>

          <p>
            A support agent will review your
            issue and respond inside the ticket
            conversation.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating Ticket..."
              : "Submit Support Ticket"}

            {!isSubmitting && <FiSend />}
          </button>
        </aside>
      </form>
    </section>
  );
}


export default CreateTicketPage;