const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "design", "usecase-images");
fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 1600;
const HEIGHT = 1180;
const SYS = { x: 235, y: 95, w: 1115, h: 980 };

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const actors = [
  { id: "guest", name: "Guest", x: 90, y: 210 },
  { id: "user", name: "Registered User", x: 90, y: 470 },
  { id: "admin", name: "Admin", x: 90, y: 770 },
  { id: "manager", name: "Manager", x: 90, y: 970 },
  { id: "payos", name: "PayOS Gateway", x: 1490, y: 445 },
  { id: "stripe", name: "Stripe Gateway", x: 1490, y: 550 },
  { id: "gmail", name: "Gmail SMTP", x: 1490, y: 805 },
];

const ucs = [
  { id: "browse", code: "UC-01", name: "Browse Products", x: 330, y: 150, w: 210, h: 62 },
  { id: "search", code: "UC-02", name: "Search / Filter Products", x: 605, y: 150, w: 240, h: 62 },
  { id: "detail", code: "UC-03", name: "View Product Detail", x: 910, y: 150, w: 230, h: 62 },
  { id: "stock", code: "UC-04", name: "Check Stock", x: 1165, y: 110, w: 165, h: 54 },
  { id: "reviews", code: "UC-05", name: "View Reviews", x: 1165, y: 190, w: 165, h: 54 },

  { id: "cart", code: "UC-07", name: "Manage Shopping Cart", x: 360, y: 320, w: 250, h: 62 },
  { id: "coupon", code: "UC-08", name: "Apply Coupon", x: 675, y: 320, w: 190, h: 56 },
  { id: "wishlist", code: "UC-23", name: "Manage Wishlist", x: 950, y: 320, w: 220, h: 56 },

  { id: "guestCheckout", code: "UC-09", name: "Guest Checkout", x: 350, y: 500, w: 220, h: 62 },
  { id: "userCheckout", code: "UC-18", name: "Logged-in Checkout", x: 645, y: 500, w: 240, h: 62 },
  { id: "payosPay", code: "UC-10", name: "PayOS Payment", x: 980, y: 455, w: 205, h: 56 },
  { id: "stripePay", code: "UC-11", name: "Stripe / Visa Payment", x: 980, y: 545, w: 230, h: 56 },
  { id: "webhook", code: "UC-12", name: "Receive Payment Webhook", x: 1185, y: 500, w: 250, h: 60 },

  { id: "guestTrack", code: "UC-13", name: "Track Guest Order", x: 340, y: 685, w: 230, h: 58 },
  { id: "history", code: "UC-19", name: "View Order History", x: 640, y: 685, w: 230, h: 58 },
  { id: "cancelRefund", code: "UC-76", name: "Cancel Order & Request Refund", x: 935, y: 680, w: 290, h: 66, extension: "Only while preparing" },
  { id: "email", code: "UC-38", name: "Send Order Status Email", x: 1100, y: 805, w: 260, h: 60 },

  { id: "products", code: "UC-25", name: "Manage Product Catalog", x: 340, y: 900, w: 260, h: 62, extension: "extension points\\nImages, Colors, Sizes" },
  { id: "orders", code: "UC-32", name: "Manage Orders", x: 670, y: 900, w: 220, h: 62 },
  { id: "inventory", code: "UC-40", name: "Manage Inventory", x: 955, y: 900, w: 220, h: 62 },
  { id: "analytics", code: "UC-61", name: "View Dashboard Analytics", x: 340, y: 1010, w: 270, h: 58 },
  { id: "support", code: "UC-71", name: "Manage Customer Chat", x: 675, y: 1010, w: 255, h: 58 },
  { id: "couponsUsers", code: "UC-53", name: "Manage Coupons & Users", x: 990, y: 1010, w: 275, h: 58 },
];

const links = [
  ["guest", "browse"], ["user", "browse"], ["guest", "cart"], ["user", "cart"],
  ["guest", "guestCheckout"], ["user", "userCheckout"], ["guest", "guestTrack"],
  ["user", "history"], ["user", "cancelRefund"], ["user", "wishlist"],
  ["admin", "products"], ["admin", "orders"], ["admin", "inventory"], ["admin", "analytics"], ["admin", "support"], ["admin", "couponsUsers"],
  ["manager", "orders"], ["manager", "inventory"], ["manager", "support"], ["manager", "analytics"],
  ["payos", "payosPay"], ["stripe", "stripePay"], ["gmail", "email"],
];

const rels = [
  ["include", "detail", "stock"],
  ["include", "detail", "reviews"],
  ["include", "guestCheckout", "cart"],
  ["include", "userCheckout", "cart"],
  ["include", "guestCheckout", "coupon"],
  ["include", "userCheckout", "coupon"],
  ["extend", "guestCheckout", "payosPay"],
  ["extend", "guestCheckout", "stripePay"],
  ["extend", "userCheckout", "payosPay"],
  ["extend", "userCheckout", "stripePay"],
  ["include", "payosPay", "webhook"],
  ["include", "stripePay", "webhook"],
  ["extend", "history", "cancelRefund"],
  ["include", "cancelRefund", "email"],
  ["include", "webhook", "email"],
  ["include", "orders", "email"],
  ["extend", "products", "inventory"],
];

function actorShape(a) {
  return `
    <g class="actor">
      <circle cx="${a.x}" cy="${a.y}" r="12"/>
      <line x1="${a.x}" y1="${a.y + 12}" x2="${a.x}" y2="${a.y + 56}"/>
      <line x1="${a.x - 32}" y1="${a.y + 32}" x2="${a.x + 32}" y2="${a.y + 32}"/>
      <line x1="${a.x}" y1="${a.y + 56}" x2="${a.x - 30}" y2="${a.y + 92}"/>
      <line x1="${a.x}" y1="${a.y + 56}" x2="${a.x + 30}" y2="${a.y + 92}"/>
      <text x="${a.x}" y="${a.y + 116}" text-anchor="middle">${esc(a.name)}</text>
    </g>`;
}

function wrap(text, limit) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > limit && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function ucShape(uc) {
  const cx = uc.x + uc.w / 2;
  const cy = uc.y + uc.h / 2;
  const text = wrap(`${uc.code} - ${uc.name}`, Math.max(18, Math.floor(uc.w / 12))).slice(0, 3);
  const startY = cy - ((text.length - 1) * 16) / 2;
  const textSvg = text.map((line, i) => `<text x="${cx}" y="${startY + i * 17}" text-anchor="middle" dominant-baseline="middle">${esc(line)}</text>`).join("");
  const ext = uc.extension
    ? `<text x="${cx}" y="${cy + uc.h / 2 - 19}" text-anchor="middle" class="extension">${esc(uc.extension).replace(/\\n/g, "</text><text x=\"" + cx + "\" y=\"" + (cy + uc.h / 2 - 4) + "\" text-anchor=\"middle\" class=\"extension\">")}</text>`
    : "";
  return `<g class="uc"><ellipse cx="${cx}" cy="${cy}" rx="${uc.w / 2}" ry="${uc.h / 2}"/>${textSvg}${ext}</g>`;
}

const ucMap = Object.fromEntries(ucs.map((uc) => [uc.id, uc]));
const actorMap = Object.fromEntries(actors.map((actor) => [actor.id, actor]));

function edgePointToUc(actor, uc) {
  const left = uc.x < WIDTH / 2;
  return { x1: actor.x, y1: actor.y + 45, x2: left ? uc.x : uc.x + uc.w, y2: uc.y + uc.h / 2 };
}

function edgeUseCase(from, to) {
  const fcx = from.x + from.w / 2;
  const fcy = from.y + from.h / 2;
  const tcx = to.x + to.w / 2;
  const tcy = to.y + to.h / 2;
  const dx = tcx - fcx;
  const dy = tcy - fcy;
  const fs = 1 / Math.sqrt((dx * dx) / ((from.w / 2) ** 2) + (dy * dy) / ((from.h / 2) ** 2));
  const ts = 1 / Math.sqrt((dx * dx) / ((to.w / 2) ** 2) + (dy * dy) / ((to.h / 2) ** 2));
  return { x1: fcx + dx * fs, y1: fcy + dy * fs, x2: tcx - dx * ts, y2: tcy - dy * ts };
}

const linkSvg = links.map(([actorId, ucId]) => {
  const p = edgePointToUc(actorMap[actorId], ucMap[ucId]);
  return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="assoc"/>`;
}).join("");

const relSvg = rels.map(([type, fromId, toId]) => {
  const p = edgeUseCase(ucMap[fromId], ucMap[toId]);
  const mx = (p.x1 + p.x2) / 2;
  const my = (p.y1 + p.y2) / 2 - 8;
  return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="${type}" marker-end="url(#arrow-${type})"/><text x="${mx}" y="${my}" text-anchor="middle" class="rel">&lt;&lt;${type}&gt;&gt;</text>`;
}).join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <marker id="arrow-include" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#111"/></marker>
    <marker id="arrow-extend" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#d95c54"/></marker>
  </defs>
  <style>
    svg { background:#fff; font-family: Arial, Helvetica, sans-serif; }
    .title { font-size: 28px; font-weight: 700; fill:#111827; }
    .hint { font-size: 15px; fill:#4b5563; }
    .system { fill:#f8fbff; stroke:#111827; stroke-width:1.5; }
    .system-title { font-size:20px; font-weight:700; fill:#111827; }
    .actor circle { fill:#78c7ec; stroke:#111; stroke-width:1.6; }
    .actor line { stroke:#111; stroke-width:1.8; }
    .actor text { font-size:15px; fill:#111; }
    .uc ellipse { fill:#82cff0; stroke:#111; stroke-width:1.4; }
    .uc text { font-size:13px; fill:#07101d; }
    .extension { font-size:10px !important; font-weight:700; }
    .assoc { stroke:#111; stroke-width:1.15; fill:none; }
    .include { stroke:#111; stroke-width:1.2; stroke-dasharray:6 5; fill:none; }
    .extend { stroke:#d95c54; stroke-width:1.3; stroke-dasharray:7 5; fill:none; }
    .rel { font-size:12px; font-weight:700; fill:#111; paint-order:stroke; stroke:#fff; stroke-width:4px; }
    .callout { font-size:18px; font-weight:700; fill:#d95c54; }
    .callout-small { font-size:14px; fill:#d95c54; font-weight:700; }
    .section { font-size:14px; font-weight:700; fill:#64748b; }
  </style>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
  <text x="40" y="42" class="title">Shoes Ecommerce - Use Case Tổng</text>
  <text x="40" y="66" class="hint">Bản xem nhanh theo style ảnh mẫu: actor, association, include, extend và extension point quan trọng.</text>

  <text x="410" y="32" class="callout">Use Case</text>
  <line x1="450" y1="42" x2="450" y2="80" class="extend" marker-end="url(#arrow-extend)"/>
  <text x="1120" y="32" class="callout">&lt;&lt;include&gt;&gt;</text>
  <line x1="1180" y1="42" x2="1180" y2="92" class="include" marker-end="url(#arrow-include)"/>
  <text x="1060" y="660" class="callout">Extend</text>
  <line x1="1118" y1="668" x2="1118" y2="710" class="extend" marker-end="url(#arrow-extend)"/>
  <text x="1040" y="735" class="callout-small">Extension Point</text>

  <rect x="${SYS.x}" y="${SYS.y}" width="${SYS.w}" height="${SYS.h}" class="system"/>
  <text x="${SYS.x + 25}" y="${SYS.y + 30}" class="system-title">PTT Style / Shoes Ecommerce System</text>
  <text x="255" y="135" class="section">Browsing &amp; Discovery</text>
  <text x="255" y="305" class="section">Shopping</text>
  <text x="255" y="485" class="section">Checkout &amp; Payment</text>
  <text x="255" y="670" class="section">Orders / Refund</text>
  <text x="255" y="885" class="section">Admin</text>

  ${linkSvg}
  ${relSvg}
  ${ucs.map(ucShape).join("")}
  ${actors.map(actorShape).join("")}
</svg>`;

const svgPath = path.join(outDir, "Shoes_Ecommerce_UseCase_Summary.svg");
const htmlPath = path.join(outDir, "Shoes_Ecommerce_UseCase_Summary.html");
fs.writeFileSync(svgPath, svg, "utf8");
fs.writeFileSync(htmlPath, `<!doctype html><meta charset="utf-8"><body style="margin:0">${svg}</body>`, "utf8");
console.log(svgPath);
console.log(htmlPath);
