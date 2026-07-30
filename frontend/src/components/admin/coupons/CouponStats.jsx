import {
  FiActivity,
  FiCheckCircle,
  FiPercent,
  FiUsers,
} from "react-icons/fi";


function CouponStats({
  totalCount = 0,
  visibleCoupons = [],
}) {
  const activeCount =
    visibleCoupons.filter(
      (coupon) => coupon.is_active,
    ).length;

  const validCount =
    visibleCoupons.filter(
      (coupon) =>
        coupon.is_currently_valid,
    ).length;

  const usageCount =
    visibleCoupons.reduce(
      (total, coupon) =>
        total
        + Number(
          coupon.current_usage_count || 0,
        ),
      0,
    );

  const cards = [
    {
      label: "Total Coupons",
      value: totalCount,
      icon: FiPercent,
    },
    {
      label: "Visible Active",
      value: activeCount,
      icon: FiActivity,
    },
    {
      label: "Visible Valid",
      value: validCount,
      icon: FiCheckCircle,
    },
    {
      label: "Visible Uses",
      value: usageCount,
      icon: FiUsers,
    },
  ];

  return (
    <div className="admin-coupon-stats">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="admin-coupon-stat-card"
          >
            <span>
              <Icon />
            </span>

            <div>
              <small>{card.label}</small>

              <strong>
                {Number(
                  card.value,
                ).toLocaleString("en-US")}
              </strong>
            </div>
          </article>
        );
      })}
    </div>
  );
}


export default CouponStats;
