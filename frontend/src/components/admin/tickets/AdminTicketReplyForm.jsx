import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiFile,
  FiLock,
  FiSend,
  FiX,
} from "react-icons/fi";


const maximumFiles = 5;
const maximumFileSize =
  5 * 1024 * 1024;

const allowedExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
]);


function getFileExtension(fileName) {
  const parts = String(fileName)
    .toLowerCase()
    .split(".");

  return parts.length > 1
    ? parts.pop()
    : "";
}


function AdminTicketReplyForm({
  disabled = false,
  isSubmitting = false,
  onSubmit,
}) {
  const [
    body,
    setBody,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    isInternalNote,
    setIsInternalNote,
  ] = useState(false);

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  const fileInputRef = useRef(null);

  const remainingCharacters = useMemo(
    () => 5000 - body.length,
    [body.length],
  );

  const handleFiles = (
    event,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || [],
      );

    setValidationMessage("");

    if (
      attachments.length
      + selectedFiles.length
      > maximumFiles
    ) {
      setValidationMessage(
        "A maximum of five attachments is allowed.",
      );

      event.target.value = "";
      return;
    }

    const invalidType = selectedFiles.find(
      (file) =>
        !allowedExtensions.has(
          getFileExtension(file.name),
        ),
    );

    if (invalidType) {
      setValidationMessage(
        "Only JPG, JPEG, PNG, WEBP and PDF files are allowed.",
      );

      event.target.value = "";
      return;
    }

    const oversizedFile =
      selectedFiles.find(
        (file) =>
          file.size > maximumFileSize,
      );

    if (oversizedFile) {
      setValidationMessage(
        "Each attachment must be 5 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setAttachments(
      (current) => [
        ...current,
        ...selectedFiles,
      ],
    );

    event.target.value = "";
  };

  const removeAttachment = (
    index,
  ) => {
    setAttachments(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    );
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const normalizedBody =
      body.trim();

    if (!normalizedBody) {
      setValidationMessage(
        "Enter a reply before submitting.",
      );
      return;
    }

    setValidationMessage("");

    const wasSuccessful =
      await onSubmit({
        body: normalizedBody,
        attachments,
        isInternalNote,
      });

    if (wasSuccessful !== false) {
      setBody("");
      setAttachments([]);
      setIsInternalNote(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="admin-ticket-card">
      <div className="admin-ticket-card__heading">
        <div>
          <span>Support response</span>
          <h2>Add reply or internal note</h2>
        </div>

        <FiSend />
      </div>

      <form
        className="admin-ticket-reply-form"
        onSubmit={handleSubmit}
      >
        <label>
          Message

          <textarea
            value={body}
            onChange={(event) =>
              setBody(
                event.target.value,
              )
            }
            placeholder={
              isInternalNote
                ? (
                  "Write a private note for "
                  + "support staff"
                )
                : (
                  "Write a clear response "
                  + "to the customer"
                )
            }
            maxLength="5000"
            disabled={
              disabled
              || isSubmitting
            }
          />

          <small>
            {remainingCharacters} characters
            remaining
          </small>
        </label>

        <label className="admin-ticket-internal-option">
          <input
            type="checkbox"
            checked={isInternalNote}
            onChange={(event) =>
              setIsInternalNote(
                event.target.checked,
              )
            }
            disabled={
              disabled
              || isSubmitting
            }
          />

          <span>
            <FiLock />
            Save as internal note
          </span>
        </label>

        <label className="admin-ticket-file-picker">
          <FiFile />

          <span>
            Add attachments
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept={
              ".jpg,.jpeg,.png,.webp,.pdf"
            }
            multiple
            onChange={handleFiles}
            disabled={
              disabled
              || isSubmitting
              || attachments.length
                >= maximumFiles
            }
          />
        </label>

        {attachments.length > 0 && (
          <div className="admin-ticket-selected-files">
            {attachments.map(
              (file, index) => (
                <div
                  key={
                    `${file.name}-${file.size}-${index}`
                  }
                >
                  <span>{file.name}</span>

                  <button
                    type="button"
                    onClick={() =>
                      removeAttachment(index)
                    }
                    disabled={isSubmitting}
                    aria-label={
                      `Remove ${file.name}`
                    }
                  >
                    <FiX />
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {validationMessage && (
          <div className="admin-ticket-warning">
            {validationMessage}
          </div>
        )}

        {disabled && (
          <div className="admin-ticket-warning">
            Claim this ticket before adding a
            reply, or the ticket is already
            closed.
          </div>
        )}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={
            disabled
            || isSubmitting
            || !body.trim()
          }
        >
          <FiSend />

          {isSubmitting
            ? "Submitting..."
            : (
              isInternalNote
                ? "Add Internal Note"
                : "Send Reply"
            )}
        </button>
      </form>
    </section>
  );
}


export default AdminTicketReplyForm;