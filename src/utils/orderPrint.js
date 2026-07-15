const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const addressText = (address) => [
  address?.line1,
  address?.line2,
  address?.city,
  address?.state,
  address?.postalCode,
].filter(Boolean).join(", ");

const itemRows = (order, showPrices) => (order.items || []).map((item) => {
  const sides = item.selectedSideDishes?.length
    ? `<div class="muted small">Side: ${escapeHtml(item.selectedSideDishes.map((sd) => `${sd.name} (${formatCurrency(sd.price)})`).join(", "))}</div>`
    : "";
  const notes = item.notes ? `<div class="note">Note: ${escapeHtml(item.notes)}</div>` : "";
  const priceCell = showPrices
    ? `<td class="right">${formatCurrency(item.totalPrice || Number(item.unitPrice || 0) * Number(item.quantity || 0))}</td>`
    : "";

  return `<tr>
    <td>${Number(item.quantity || 0)}x</td>
    <td><strong>${escapeHtml(item.menuItem?.name || item.name || "Item")}</strong>${item.size ? ` <span class="muted">(${escapeHtml(item.size)})</span>` : ""}${sides}${notes}</td>
    ${priceCell}
  </tr>`;
}).join("");

const printOrderDocument = (order, type = "bill") => {
  const isBill = type === "bill";
  const title = isBill ? "Customer Bill" : "Kitchen Ticket";
  const instructions = [order.restaurantInstructions, order.notes].filter(Boolean).join(" | ");
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} #${escapeHtml(order.id?.slice(-6) || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
    .ticket { width: 320px; margin: 0 auto; padding: 16px; }
    h1 { margin: 0; font-size: 20px; text-align: center; }
    h2 { margin: 4px 0 12px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: .08em; color: #4f46e5; }
    .meta { border-top: 1px dashed #9ca3af; border-bottom: 1px dashed #9ca3af; padding: 10px 0; margin: 10px 0; font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td, th { padding: 7px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; }
    .right { text-align: right; }
    .muted { color: #6b7280; font-weight: 400; }
    .small { font-size: 11px; margin-top: 3px; }
    .note { margin-top: 4px; border-left: 3px solid #f59e0b; padding-left: 6px; font-size: 12px; font-weight: 700; }
    .instructions { margin-top: 12px; padding: 10px; border: 1px dashed #f59e0b; font-size: 12px; font-weight: 700; }
    .totals { margin-top: 12px; font-size: 12px; }
    .totals div { display: flex; justify-content: space-between; margin-top: 5px; }
    .grand { border-top: 1px solid #111827; padding-top: 8px; font-size: 16px; font-weight: 800; }
    @media print { body { margin: 0; } .ticket { width: 100%; } }
  </style>
</head>
<body>
  <main class="ticket">
    <h1>${escapeHtml(order.restaurant?.name || "DODAGO")}</h1>
    <h2>${escapeHtml(title)}</h2>
    <section class="meta">
      <div><strong>Order:</strong> #${escapeHtml(order.id?.slice(-6) || "")}</div>
      <div><strong>Time:</strong> ${escapeHtml(new Date(order.createdAt || Date.now()).toLocaleString("en-IN"))}</div>
      <div><strong>Status:</strong> ${escapeHtml(String(order.status || "").replaceAll("_", " "))}</div>
      ${isBill ? `<div><strong>Customer:</strong> ${escapeHtml(order.customer?.name || "Customer")}</div>` : ""}
      ${isBill ? `<div><strong>Address:</strong> ${escapeHtml(addressText(order.address) || "NA")}</div>` : ""}
      ${isBill ? `<div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || "NA")}</div>` : ""}
    </section>
    <table>
      <thead><tr><th>Qty</th><th>Item</th>${isBill ? `<th class="right">Amount</th>` : ""}</tr></thead>
      <tbody>${itemRows(order, isBill)}</tbody>
    </table>
    ${instructions ? `<section class="instructions">${escapeHtml(instructions)}</section>` : ""}
    ${isBill ? `<section class="totals">
      <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div><span>Delivery</span><span>${formatCurrency(order.deliveryFee)}</span></div>
      <div><span>Packaging</span><span>${formatCurrency(order.packagingFee)}</span></div>
      <div><span>Tax</span><span>${formatCurrency(order.totalTax)}</span></div>
      <div><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>
      <div class="grand"><span>Total</span><span>${formatCurrency(order.totalAmount)}</span></div>
    </section>` : ""}
  </main>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body>
</html>`);
  win.document.close();
};

export { printOrderDocument };
