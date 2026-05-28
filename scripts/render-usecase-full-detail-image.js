const fs = require("fs");
const path = require("path");

const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "design", "usecase-images");
fs.mkdirSync(outDir, { recursive: true });

const cp1252Bytes = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function repairMojibake(value) {
  const text = String(value ?? "");
  if (!/[ÃÄÂÆâ]|á[º»]/.test(text)) return text;
  const bytes = Uint8Array.from(
    Array.from(text).map((char) => {
      const code = char.codePointAt(0);
      if (code <= 0xff) return code;
      return cp1252Bytes[code] ?? (code & 0xff);
    })
  );
  return Buffer.from(bytes).toString("utf8");
}

function repairUseCase(uc) {
  return {
    ...uc,
    name: repairMojibake(uc.name),
    pri: repairMojibake(uc.pri),
    pre: repairMojibake(uc.pre),
    post: repairMojibake(uc.post),
    cat: repairMojibake(uc.cat),
    actors: uc.actors.map(repairMojibake),
    mf: uc.mf.map(repairMojibake),
    af: (uc.af || []).map(repairMojibake),
  };
}

const extraUseCase = {
  id: "UC-76",
  name: "Cancel Paid Order and Request Refund",
  actors: ["Guest", "User", "Stripe Gateway", "System"],
  pri: "High",
  pre: "Order is PAID and fulfillment status is CONFIRMED or PACKING",
  post: "Order is CANCELLED and refund is REFUNDED or REFUND_PENDING",
  mf: [
    "Customer opens order detail from My Orders or guest order lookup",
    "System checks order ownership by userId or guest email",
    "System verifies payment status is PAID and fulfillment is still being prepared",
    "Customer enters cancellation reason and confirms Cancel & Refund",
    "System calls POST /payments/orders/:orderCode/cancel-refund",
    "System restores product stock for cancelled items",
    "Stripe card order is automatically refunded through Stripe",
    "Bank transfer order is marked REFUND_PENDING for manual refund",
    "System sets fulfillment status to CANCELLED",
    "System sends cancellation and refund email",
  ],
  af: [
    "Order already SHIPPING or DELIVERED -> cancellation/refund is blocked",
    "Order is not PAID -> request is rejected",
    "Stripe refund fails -> order remains unchanged and error is shown",
  ],
  cat: "Order Tracking",
};

const ucs = [...gen.ucs.map(repairUseCase), extraUseCase];

const relationRows = [
  ["include", "UC-03", "UC-04"],
  ["include", "UC-03", "UC-05"],
  ["include", "UC-07", "UC-06"],
  ["include", "UC-09", "UC-07"],
  ["include", "UC-09", "UC-08"],
  ["include", "UC-18", "UC-07"],
  ["include", "UC-18", "UC-17"],
  ["extend", "UC-09", "UC-10"],
  ["extend", "UC-09", "UC-11"],
  ["extend", "UC-18", "UC-10"],
  ["extend", "UC-18", "UC-11"],
  ["include", "UC-10", "UC-12"],
  ["include", "UC-11", "UC-12"],
  ["include", "UC-12", "UC-38"],
  ["extend", "UC-19", "UC-13"],
  ["extend", "UC-19", "UC-76"],
  ["include", "UC-76", "UC-38"],
  ["extend", "UC-76", "UC-11"],
  ["include", "UC-14", "UC-15"],
  ["include", "UC-21", "UC-19"],
  ["include", "UC-22", "UC-21"],
  ["include", "UC-25", "UC-28"],
  ["include", "UC-25", "UC-29"],
  ["include", "UC-26", "UC-28"],
  ["include", "UC-26", "UC-29"],
  ["include", "UC-29", "UC-30"],
  ["include", "UC-25", "UC-31"],
  ["extend", "UC-32", "UC-33"],
  ["include", "UC-34", "UC-35"],
  ["extend", "UC-35", "UC-36"],
  ["extend", "UC-35", "UC-37"],
  ["include", "UC-35", "UC-38"],
  ["include", "UC-39", "UC-38"],
  ["include", "UC-40", "UC-41"],
  ["extend", "UC-40", "UC-42"],
  ["extend", "UC-42", "UC-43"],
  ["include", "UC-43", "UC-44"],
  ["extend", "UC-40", "UC-45"],
  ["include", "UC-47", "UC-48"],
  ["include", "UC-47", "UC-49"],
  ["extend", "UC-48", "UC-50"],
  ["extend", "UC-50", "UC-51"],
  ["include", "UC-48", "UC-52"],
  ["include", "UC-49", "UC-52"],
  ["include", "UC-51", "UC-52"],
  ["include", "UC-72", "UC-73"],
  ["include", "UC-72", "UC-74"],
  ["extend", "UC-72", "UC-75"],
];

const categoryOrder = [
  "Browsing & Discovery",
  "Shopping Cart",
  "Checkout & Payment",
  "Order Tracking",
  "Account Management",
  "Reviews & Returns",
  "Wishlist",
  "Live Chat",
  "Admin - Product Management",
  "Admin - Order & Inventory",
  "Admin - Inventory",
  "Admin - Returns",
  "Admin - Coupons & Users",
  "Admin - Analytics",
  "Admin - Chat",
];

const leftActors = [
  { name: "Guest", y: 420 },
  { name: "User", label: "Registered User", y: 1080 },
  { name: "Admin", y: 2280 },
  { name: "Manager", y: 3160 },
];
const rightActors = [
  { name: "PayOS Gateway", y: 1070 },
  { name: "Stripe Gateway", y: 1260 },
  { name: "System", y: 1680 },
  { name: "Gmail SMTP", y: 1860 },
];

const WIDTH = 3900;
const LEFT_X = 150;
const RIGHT_X = 3720;
const SYSTEM = { x: 380, y: 120, w: 3140, h: 0 };
const COLS = 4;
const UC_W = 540;
const UC_H = 82;
const COL_GAP = 165;
const ROW_GAP = 62;
const LANE_TOP_PAD = 82;
const LANE_SIDE = 70;
const FIRST_COL_X = SYSTEM.x + 110;

let cursorY = SYSTEM.y + 86;
const positioned = new Map();
const lanes = [];

for (const category of categoryOrder) {
  const items = ucs.filter((uc) => uc.cat === category);
  if (!items.length) continue;
  const rows = Math.ceil(items.length / COLS);
  const laneH = LANE_TOP_PAD + rows * UC_H + Math.max(0, rows - 1) * ROW_GAP + 50;
  const lane = { category, x: SYSTEM.x + 42, y: cursorY, w: SYSTEM.w - 84, h: laneH };
  lanes.push(lane);

  items.forEach((uc, index) => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const x = FIRST_COL_X + col * (UC_W + COL_GAP);
    const y = lane.y + LANE_TOP_PAD + row * (UC_H + ROW_GAP);
    positioned.set(uc.id, { ...uc, x, y, w: UC_W, h: UC_H });
  });
  cursorY += laneH + 46;
}

SYSTEM.h = cursorY - SYSTEM.y + 40;
const HEIGHT = SYSTEM.y + SYSTEM.h + 120;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function actorShape(actor, side) {
  const x = side === "left" ? LEFT_X : RIGHT_X;
  const y = actor.y;
  const label = actor.label || actor.name;
  const labelX = x;
  return `
    <g class="actor">
      <circle cx="${x}" cy="${y}" r="15"/>
      <line x1="${x}" y1="${y + 15}" x2="${x}" y2="${y + 70}"/>
      <line x1="${x - 42}" y1="${y + 42}" x2="${x + 42}" y2="${y + 42}"/>
      <line x1="${x}" y1="${y + 70}" x2="${x - 38}" y2="${y + 116}"/>
      <line x1="${x}" y1="${y + 70}" x2="${x + 38}" y2="${y + 116}"/>
      <text x="${labelX}" y="${y + 148}" text-anchor="middle">${esc(label)}</text>
    </g>`;
}

function useCaseShape(uc) {
  const cx = uc.x + uc.w / 2;
  const cy = uc.y + uc.h / 2;
  const lines = wrapText(`${uc.id} - ${uc.name}`, 36, 3);
  const startY = cy - ((lines.length - 1) * 19) / 2;
  const text = lines
    .map((line, index) => `<text x="${cx}" y="${startY + index * 21}" text-anchor="middle" dominant-baseline="middle">${esc(line)}</text>`)
    .join("");
  return `<g class="uc"><ellipse cx="${cx}" cy="${cy}" rx="${uc.w / 2}" ry="${uc.h / 2}"/>${text}</g>`;
}

function actorEndpoint(actorName, uc) {
  const left = leftActors.find((actor) => actor.name === actorName);
  if (left) {
    return { x1: LEFT_X, y1: left.y + 55, x2: uc.x, y2: uc.y + uc.h / 2 };
  }
  const right = rightActors.find((actor) => actor.name === actorName);
  if (right) {
    return { x1: RIGHT_X, y1: right.y + 55, x2: uc.x + uc.w, y2: uc.y + uc.h / 2 };
  }
  return null;
}

function ucEndpoint(from, to) {
  const fx = from.x + from.w / 2;
  const fy = from.y + from.h / 2;
  const tx = to.x + to.w / 2;
  const ty = to.y + to.h / 2;
  const dx = tx - fx || 1;
  const dy = ty - fy || 1;
  const fs = 1 / Math.sqrt((dx * dx) / ((from.w / 2) ** 2) + (dy * dy) / ((from.h / 2) ** 2));
  const ts = 1 / Math.sqrt((dx * dx) / ((to.w / 2) ** 2) + (dy * dy) / ((to.h / 2) ** 2));
  return {
    x1: fx + dx * fs,
    y1: fy + dy * fs,
    x2: tx - dx * ts,
    y2: ty - dy * ts,
  };
}

const laneSvg = lanes
  .map(
    (lane) => `
      <rect x="${lane.x}" y="${lane.y}" width="${lane.w}" height="${lane.h}" rx="24" class="lane"/>
      <text x="${lane.x + 32}" y="${lane.y + 42}" class="lane-title">${esc(lane.category)}</text>`
  )
  .join("");

const associationSvg = [];
for (const uc of positioned.values()) {
  for (const actorName of uc.actors) {
    const endpoint = actorEndpoint(actorName, uc);
    if (!endpoint) continue;
    associationSvg.push(
      `<line x1="${endpoint.x1}" y1="${endpoint.y1}" x2="${endpoint.x2}" y2="${endpoint.y2}" class="association"/>`
    );
  }
}

const relationSvg = relationRows
  .filter(([, from, to]) => positioned.has(from) && positioned.has(to))
  .map(([type, from, to]) => {
    const p = ucEndpoint(positioned.get(from), positioned.get(to));
    const mx = (p.x1 + p.x2) / 2;
    const my = (p.y1 + p.y2) / 2 - 10;
    const cls = type === "include" ? "include" : "extend";
    return `
      <line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="${cls}" marker-end="url(#arrow-${cls})"/>
      <text x="${mx}" y="${my}" text-anchor="middle" class="rel-label">&lt;&lt;${type}&gt;&gt;</text>`;
  })
  .join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <marker id="arrow-include" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,8 L11,4 z" fill="#111827"/>
    </marker>
    <marker id="arrow-extend" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,8 L11,4 z" fill="#d95c54"/>
    </marker>
  </defs>
  <style>
    svg { background: #fff; font-family: Arial, Helvetica, sans-serif; }
    .page-title { font-size: 48px; font-weight: 800; fill: #111827; }
    .page-subtitle { font-size: 22px; fill: #475569; }
    .system { fill: #f8fbff; stroke: #111827; stroke-width: 2.5; }
    .system-title { font-size: 30px; font-weight: 800; fill: #111827; }
    .lane { fill: #f1f7fd; stroke: #cbd5e1; stroke-width: 1.4; opacity: .88; }
    .lane-title { font-size: 24px; font-weight: 800; fill: #475569; }
    .actor circle { fill: #78c7ec; stroke: #111827; stroke-width: 2.6; }
    .actor line { stroke: #111827; stroke-width: 2.8; }
    .actor text { font-size: 23px; fill: #111827; }
    .uc ellipse { fill: #82cff0; stroke: #111827; stroke-width: 2.2; }
    .uc text { font-size: 21px; fill: #07101d; }
    .association { stroke: #111827; stroke-width: 1.3; opacity: .34; }
    .include { stroke: #111827; stroke-width: 2.1; stroke-dasharray: 11 8; fill: none; }
    .extend { stroke: #d95c54; stroke-width: 2.2; stroke-dasharray: 12 8; fill: none; }
    .rel-label { font-size: 19px; font-weight: 800; fill: #111827; paint-order: stroke; stroke: #fff; stroke-width: 7px; }
    .legend-title { font-size: 24px; font-weight: 800; fill: #d95c54; }
    .legend-text { font-size: 22px; fill: #111827; }
    .count { font-size: 20px; fill: #475569; }
  </style>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
  <text x="75" y="70" class="page-title">Shoes Ecommerce - Detailed Master Use Case Diagram</text>
  <text x="75" y="108" class="page-subtitle">Full UC tổng: ${positioned.size} use cases, actor associations, include and extend relationships. Open the PNG/SVG and zoom to read details.</text>

  <g class="legend">
    <text x="2790" y="60" class="legend-title">Legend</text>
    <line x1="2790" y1="92" x2="2925" y2="92" class="association"/>
    <text x="2950" y="100" class="legend-text">Association</text>
    <line x1="2790" y1="132" x2="2925" y2="132" class="include" marker-end="url(#arrow-include)"/>
    <text x="2950" y="140" class="legend-text">&lt;&lt;include&gt;&gt;</text>
    <line x1="2790" y1="172" x2="2925" y2="172" class="extend" marker-end="url(#arrow-extend)"/>
    <text x="2950" y="180" class="legend-text">&lt;&lt;extend&gt;&gt;</text>
  </g>

  <rect x="${SYSTEM.x}" y="${SYSTEM.y}" width="${SYSTEM.w}" height="${SYSTEM.h}" rx="32" class="system"/>
  <text x="${SYSTEM.x + 46}" y="${SYSTEM.y + 48}" class="system-title">PTT Style / Shoes Ecommerce System</text>
  <text x="${SYSTEM.x + 46}" y="${SYSTEM.y + 82}" class="count">All customer, payment, order, refund, admin, inventory, analytics and support functions</text>

  ${laneSvg}
  ${associationSvg.join("\n")}
  ${relationSvg}
  ${Array.from(positioned.values()).map(useCaseShape).join("\n")}
  ${leftActors.map((actor) => actorShape(actor, "left")).join("\n")}
  ${rightActors.map((actor) => actorShape(actor, "right")).join("\n")}
</svg>`;

const svgPath = path.join(outDir, "Master_Detailed_All_76_UseCases.svg");
const htmlPath = path.join(outDir, "Master_Detailed_All_76_UseCases.html");
fs.writeFileSync(svgPath, svg, "utf8");
fs.writeFileSync(
  htmlPath,
  `<!doctype html><html><head><meta charset="utf-8"><title>Detailed Master Use Case</title><style>body{margin:0;background:#fff}svg{display:block;max-width:100%;height:auto}</style></head><body>${svg}</body></html>`,
  "utf8"
);

console.log(`usecases=${positioned.size}`);
console.log(`height=${HEIGHT}`);
console.log(svgPath);
console.log(htmlPath);
