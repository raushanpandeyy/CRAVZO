import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

const fmt = (value) => {
  const n = Number(value || 0);
  return `&#8377;${Number.isFinite(n) ? (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)) : "0"}`;
};

const fmtDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return String(value); }
};

const row = (label, value, bold = false, color = "#0f172a") =>
  `<tr>
    <td style="padding:7px 4px;color:#64748b;font-size:13px;">${label}</td>
    <td style="padding:7px 4px;text-align:right;font-size:13px;font-weight:${bold ? "700" : "400"};color:${color};">${value}</td>
  </tr>`;

export const generateAndShareInvoice = async (order) => {
  if (!order) return;

  const items = (order.items || [])
    .map((item) => {
      const name = item.name || item.menuItem?.name || "Item";
      const qty  = item.quantity || 1;
      const price = Number(item.unitPrice || item.price || 0);
      const total = Number(item.totalPrice || price * qty || 0);
      const size  = item.size ? ` <span style="color:#6366f1;font-size:11px;">[${item.size}]</span>` : "";
      return `<tr>
        <td style="padding:7px 4px;font-size:13px;">${name}${size}</td>
        <td style="padding:7px 4px;text-align:center;font-size:13px;color:#64748b;">${qty}</td>
        <td style="padding:7px 4px;text-align:right;font-size:13px;">${fmt(price)}</td>
        <td style="padding:7px 4px;text-align:right;font-size:13px;font-weight:600;">${fmt(total)}</td>
      </tr>`;
    })
    .join("");

  const discount     = Number(order.discount || 0);
  const promoDiscount = Number(order.promoCodeDiscount || 0);
  const referralDiscount = Number(order.referralVoucherDiscount || 0);
  const totalDiscount = discount + promoDiscount + referralDiscount;

  const restaurantName = order.restaurant?.name || order.restaurantName || "Restaurant";
  const restaurantAddr = [
    order.restaurant?.addressLine1,
    order.restaurant?.city,
    order.restaurant?.state,
  ].filter(Boolean).join(", ") || "";

  const deliveryAddr = order.address
    ? [order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode]
        .filter(Boolean).join(", ")
    : "—";

  const paymentStatusColor = order.paymentStatus === "PAID" ? "#059669" : "#d97706";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    .page { max-width: 600px; margin: 0 auto; background: #fff; padding: 32px 28px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .brand { font-size: 26px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.5px; }
    .brand span { color: #6366f1; }
    .invoice-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .invoice-id { font-size: 15px; font-weight: 800; color: #1e1b4b; text-align: right; margin-top: 2px; }
    .divider { height: 1px; background: #e2e8f0; margin: 18px 0; }
    .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 10px; }
    .info-grid { display: flex; gap: 16px; margin-bottom: 20px; }
    .info-box { flex: 1; background: #f8fafc; border-radius: 12px; padding: 14px; }
    .info-box .label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
    .info-box .value { font-size: 13px; color: #0f172a; font-weight: 600; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f1f5f9; }
    thead th { padding: 9px 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: left; }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr td { border-bottom: 1px solid #f1f5f9; }
    .totals-table td { border: none !important; }
    .grand-total td { font-size: 15px !important; font-weight: 900 !important; color: #1e1b4b !important; border-top: 2px solid #e2e8f0 !important; padding-top: 12px !important; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 800; }
    .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">Do<span>da</span>go</div>
      <div style="font-size:12px;color:#64748b;margin-top:3px;">Tax Invoice / Receipt</div>
    </div>
    <div>
      <div class="invoice-label">Order ID</div>
      <div class="invoice-id">#${(order.id || "").slice(-8).toUpperCase()}</div>
      <div style="font-size:11px;color:#94a3b8;text-align:right;margin-top:3px;">${fmtDate(order.deliveredAt || order.createdAt)}</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-box">
      <div class="label">From</div>
      <div class="value">${restaurantName}</div>
      ${restaurantAddr ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;">${restaurantAddr}</div>` : ""}
    </div>
    <div class="info-box">
      <div class="label">Deliver to</div>
      <div class="value" style="font-size:12px;">${deliveryAddr}</div>
    </div>
  </div>

  <!-- Payment status -->
  <div style="margin-bottom:20px;display:flex;align-items:center;gap:10px;">
    <span class="status-badge" style="background:${order.paymentStatus === "PAID" ? "#ecfdf5" : "#fff7ed"};color:${paymentStatusColor};">
      ${order.paymentStatus || "PENDING"}
    </span>
    <span style="font-size:12px;color:#64748b;">${order.paymentMethod || ""}</span>
    ${order.gatewayPaymentId ? `<span style="font-size:11px;color:#94a3b8;">Ref: ${order.gatewayPaymentId}</span>` : ""}
  </div>

  <!-- Items table -->
  <div class="section-title">Items Ordered</div>
  <table style="margin-bottom:20px;">
    <thead>
      <tr>
        <th style="width:50%;">Item</th>
        <th style="width:10%;">Qty</th>
        <th style="width:20%;">Rate</th>
        <th style="width:20%;">Amount</th>
      </tr>
    </thead>
    <tbody>${items || `<tr><td colspan="4" style="padding:12px;text-align:center;color:#94a3b8;">No items</td></tr>`}</tbody>
  </table>

  <div class="divider"></div>

  <!-- Totals -->
  <div class="section-title">Bill Summary</div>
  <table class="totals-table">
    <tbody>
      ${row("Food Subtotal", fmt(order.subtotal))}
      ${Number(order.packagingFee || 0) > 0 ? row("Packaging", fmt(order.packagingFee)) : ""}
      ${row("Delivery Charge", fmt(order.deliveryFeeBase || order.deliveryFee))}
      ${Number(order.deliveryTax || 0) > 0 ? row("Delivery GST (18%)", fmt(order.deliveryTax)) : ""}
      ${Number(order.platformFee || 0) > 0 ? row("Platform Fee", fmt(order.platformFee)) : ""}
      ${Number(order.gatewayFee || 0) > 0 ? row("Payment Gateway Fee", fmt(order.gatewayFee)) : ""}
      ${Number(order.codCharge || 0) > 0 ? row("COD Charge", fmt(order.codCharge)) : ""}
      ${Number(order.tipAmount || 0) > 0 ? row("Tip (Thank you! 🙏)", fmt(order.tipAmount)) : ""}
      ${Number(order.rainCharge || 0) > 0 ? row("Rain Surcharge", fmt(order.rainCharge)) : ""}
      ${totalDiscount > 0 ? row("Discount / Voucher", `−${fmt(totalDiscount)}`, false, "#059669") : ""}
    </tbody>
    <tbody class="grand-total">
      ${row("Grand Total", fmt(order.totalAmount), true)}
    </tbody>
  </table>

  ${Number(order.deliveryTax || 0) > 0 || Number(order.totalTax || 0) > 0 ? `
  <div class="divider"></div>
  <div class="section-title">Tax Breakdown</div>
  <table class="totals-table">
    <tbody>
      ${Number(order.totalTax || 0) > 0 ? row("CGST (50% of tax)", fmt(Number(order.totalTax || 0) / 2)) : ""}
      ${Number(order.totalTax || 0) > 0 ? row("SGST (50% of tax)", fmt(Number(order.totalTax || 0) / 2)) : ""}
    </tbody>
  </table>` : ""}

  <div class="divider"></div>

  <div class="footer">
    <p>Thank you for ordering on Dodago!</p>
    <p style="margin-top:4px;">This is a computer-generated invoice and does not require a signature.</p>
    <p style="margin-top:8px;color:#cbd5e1;">Dodago Food Delivery · support@dodago.shop</p>
  </div>

</div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const orderId = (order.id || "order").slice(-8).toUpperCase();
    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert("Invoice saved", `Invoice saved to: ${uri}`);
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Invoice #${orderId}`,
      UTI: "com.adobe.pdf",
    });
  } catch (err) {
    Alert.alert("Could not generate invoice", err.message || "Please try again.");
  }
};
