function getOptionLabel(option) {
  const attribute =
    option.attribute
    || option.attribute_name
    || "";

  const value =
    option.value
    || option.display_value
    || "";

  if (attribute && value) {
    return `${attribute}: ${value}`;
  }

  return value || attribute;
}


function ReturnItemsTable({
  items = [],
  formatMoney,
}) {
  return (
    <section className="admin-return-card">
      <div className="admin-return-card__heading">
        <div>
          <span>Returned products</span>
          <h2>Return items</h2>
        </div>

        <strong>
          {items.length} item
          {items.length === 1 ? "" : "s"}
        </strong>
      </div>

      <div className="admin-return-items-shell">
        <table className="admin-return-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Unit price</th>
              <th>Quantity</th>
              <th>Refund subtotal</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const optionLabels =
                Array.isArray(
                  item.variant_options,
                )
                  ? item.variant_options
                    .map(getOptionLabel)
                    .filter(Boolean)
                  : [];

              return (
                <tr key={item.id}>
                  <td>
                    <div className="admin-return-item-name">
                      <strong>
                        {item.variant_name
                          || item.product_name}
                      </strong>

                      {optionLabels.length > 0 && (
                        <span>
                          {optionLabels.join(" · ")}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    {item.variant_sku
                      || item.product_sku}
                  </td>

                  <td>
                    {formatMoney(
                      item.unit_price,
                    )}
                  </td>

                  <td>{item.quantity}</td>

                  <td>
                    <strong>
                      {formatMoney(
                        item.line_total,
                      )}
                    </strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}


export default ReturnItemsTable;