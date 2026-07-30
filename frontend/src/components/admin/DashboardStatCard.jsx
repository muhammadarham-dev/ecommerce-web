function DashboardStatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "default",
}) {
  return (
    <article
      className={`admin-stat-card admin-stat-card--${tone}`}
    >
      <div className="admin-stat-card__header">
        <span className="admin-stat-card__icon">
          <Icon />
        </span>

        <span className="admin-stat-card__label">
          {label}
        </span>
      </div>

      <strong className="admin-stat-card__value">
        {value}
      </strong>

      {helper && (
        <span className="admin-stat-card__helper">
          {helper}
        </span>
      )}
    </article>
  );
}


export default DashboardStatCard;