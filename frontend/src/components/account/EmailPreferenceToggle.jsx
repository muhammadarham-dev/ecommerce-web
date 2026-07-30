function EmailPreferenceToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className="email-preference-toggle">
      <div className="email-preference-toggle__icon">
        <Icon />
      </div>

      <div className="email-preference-toggle__content">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <div className="email-preference-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
          disabled={disabled}
        />

        <span />
      </div>
    </label>
  );
}


export default EmailPreferenceToggle;