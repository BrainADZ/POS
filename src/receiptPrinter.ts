import type { CartLine, Order, OrderType } from './types';
import { computeTotals, discountLabel, lineTotal } from './utils';

type ReceiptTotals = ReturnType<typeof computeTotals>;

interface ReceiptInput {
  title: string;
  lines: CartLine[];
  totals: ReceiptTotals;
  orderType: OrderType;
  gstRate: number;
  couponCode?: string | null;
  tableNumber?: string;
  customerName?: string;
  token?: number;
  orderId?: string;
  paymentMode?: string;
  createdAt?: number;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value: number): string {
  return `Rs ${value.toLocaleString('en-IN', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts?: number): string {
  return new Date(ts ?? Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function receiptHtml(input: ReceiptInput): string {
  const itemRows = input.lines
    .map((line) => {
      const details = [line.variant, line.spiceLevel, ...line.addons.map((a) => `${a.name}${a.price ? ` +${money(a.price)}` : ''}`), line.note]
        .filter(Boolean)
        .join(', ');
      return `
        <div class="item">
          <div class="item-main">
            <span>${esc(line.qty)} x ${esc(line.name)}</span>
            <strong>${esc(money(lineTotal(line)))}</strong>
          </div>
          <div class="item-meta">${esc(details || `${money(line.unitPrice)} each`)}</div>
        </div>
      `;
    })
    .join('');

  const discount = input.totals.discount > 0 ? `<div><span>Discount${input.couponCode ? ` (${esc(discountLabel(input.couponCode))})` : ''}</span><b>-${esc(money(input.totals.discount))}</b></div>` : '';
  const customer = input.customerName ? `<div><span>Customer</span><b>${esc(input.customerName.split(' (')[0])}</b></div>` : '';
  const table = input.tableNumber ? `<div><span>Table</span><b>${esc(input.tableNumber)}</b></div>` : '';
  const token = input.token ? `<div><span>Token</span><b>T-${String(input.token).padStart(3, '0')}</b></div>` : '';
  const orderId = input.orderId ? `<div><span>Order</span><b>${esc(input.orderId)}</b></div>` : '';
  const payment = input.paymentMode ? `<div><span>Payment</span><b>${esc(input.paymentMode)}</b></div>` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${esc(input.title)}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #fff;
        color: #111;
        font-family: "Courier New", monospace;
        font-size: 11px;
        line-height: 1.28;
      }
      .receipt {
        width: 72mm;
        padding: 5mm 4mm 6mm;
      }
      .center { text-align: center; }
      .brand {
        font-size: 21px;
        font-weight: 900;
        letter-spacing: 0;
        font-family: Georgia, "Times New Roman", serif;
      }
      .muted { color: #333; }
      .rule {
        border-top: 1px dashed #111;
        margin: 8px 0;
      }
      .meta div,
      .totals div,
      .item-main {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .meta span,
      .totals span,
      .item-main span { min-width: 0; }
      .meta b,
      .totals b,
      .item-main strong {
        flex-shrink: 0;
        font-weight: 800;
      }
      .item { margin: 7px 0; }
      .item-main span { font-weight: 700; }
      .item-meta {
        margin-top: 2px;
        padding-left: 12px;
        color: #444;
        font-size: 10px;
      }
      .total {
        margin-top: 4px;
        padding-top: 5px;
        border-top: 1px solid #111;
        font-size: 15px;
        font-weight: 900;
      }
      .footer {
        margin-top: 12px;
        text-align: center;
        font-size: 10px;
      }
      @media screen {
        body {
          background: #f3f4f6;
        }
        .receipt {
          margin: 16px auto;
          background: #fff;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        <div class="brand">Scran</div>
        <div class="muted">Restaurant POS - Kiosk 1</div>
        <div>Tax Invoice / Bill</div>
      </div>
      <div class="rule"></div>
      <div class="meta">
        <div><span>Date</span><b>${esc(formatDate(input.createdAt))}</b></div>
        <div><span>Type</span><b>${esc(input.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway')}</b></div>
        ${token}
        ${orderId}
        ${table}
        ${customer}
        ${payment}
      </div>
      <div class="rule"></div>
      ${itemRows}
      <div class="rule"></div>
      <div class="totals">
        <div><span>Subtotal</span><b>${esc(money(input.totals.subtotal))}</b></div>
        ${discount}
        <div><span>GST (${Math.round(input.gstRate * 1000) / 10}%)</span><b>${esc(money(input.totals.gst))}</b></div>
        <div class="total"><span>Total</span><b>${esc(money(input.totals.total))}</b></div>
      </div>
      <div class="footer">
        <div>Thank you. Please visit again.</div>
        <div class="muted">Powered by Scran POS</div>
      </div>
    </div>
  </body>
</html>`;
}

function printHtml(html: string): boolean {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  }, 150);

  return true;
}

export function printCartBill(input: {
  lines: CartLine[];
  orderType: OrderType;
  couponCode: string | null;
  gstRate: number;
  tableNumber?: string;
  customerName?: string;
}): boolean {
  return printHtml(
    receiptHtml({
      title: 'Scran Bill',
      lines: input.lines,
      totals: computeTotals(input.lines, input.couponCode, input.gstRate),
      orderType: input.orderType,
      couponCode: input.couponCode,
      gstRate: input.gstRate,
      tableNumber: input.tableNumber,
      customerName: input.customerName,
    })
  );
}

export function printOrderReceipt(order: Order, gstRate: number): boolean {
  return printHtml(
    receiptHtml({
      title: `Scran Receipt ${order.id}`,
      lines: order.lines,
      totals: {
        subtotal: order.subtotal,
        discount: order.discount,
        gst: order.gst,
        total: order.total,
      },
      orderType: order.orderType,
      couponCode: order.couponCode,
      gstRate,
      tableNumber: order.table,
      customerName: order.customerName,
      token: order.token,
      orderId: order.id,
      paymentMode: order.paymentMode,
      createdAt: order.createdAt,
    })
  );
}
