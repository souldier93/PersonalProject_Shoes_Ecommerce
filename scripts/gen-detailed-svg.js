// Generate detailed SVG use case diagrams per category
// Matches the hand-crafted "Master Detailed Use Case" style
const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");
const ucs = gen.ucs;
const { fs, path } = gen;

const BASE = path.join(__dirname, "..", "docs", "design", "usecase-detailed");
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

// ===== LAYOUT CONSTANTS =====
const COL_X = [760, 1465, 2170, 2875]; // 4 column X centers
const UC_RX = 270, UC_RY = 41;          // ellipse size
const ROW_H = 144;                       // vertical spacing between UC rows
const LANE_PAD_TOP = 60;                 // padding from lane top to first UC center
const LANE_PAD_BOT = 60;                 // padding after last UC center to lane bottom
const LANE_X = 422, LANE_W = 3056;       // lane rect
const TITLE_X = 454;                     // lane title X
const ACTOR_LX = 150;                    // left actors X
const ACTOR_RX = 3720;                   // right actors X
const SVG_W = 3900;

// Actor y-positions (center of figure)
const ACTOR_POS = {
  "Guest": { x: ACTOR_LX, y: 475 },
  "Registered User": { x: ACTOR_LX, y: 1135 },
  "Admin": { x: ACTOR_LX, y: 2335 },
  "Manager": { x: ACTOR_LX, y: 3215 },
  "PayOS Gateway": { x: ACTOR_RX, y: 1125 },
  "Stripe Gateway": { x: ACTOR_RX, y: 1315 },
  "System": { x: ACTOR_RX, y: 1735 },
  "Gmail SMTP": { x: ACTOR_RX, y: 1860 },
};

// Map our actor names to display names in the SVG
const ACTOR_DISPLAY = {
  "Guest": "Guest",
  "User": "Registered User",
  "Manager": "Manager",
  "Admin": "Admin",
  "PayOS Gateway": "PayOS Gateway",
  "Stripe Gateway": "Stripe Gateway",
  "System": "System",
};

// ===== RELATIONSHIP DEFINITIONS =====
function getRelationships() {
  const r = [];
  function inc(from, to) { r.push({ from: from, to: to, type: "include" }); }
  function ext(from, to) { r.push({ from: from, to: to, type: "extend" }); }

  inc("UC-03", "UC-04");
  inc("UC-03", "UC-05");
  inc("UC-07", "UC-06");
  inc("UC-09", "UC-07");
  inc("UC-09", "UC-08");
  inc("UC-18", "UC-07");
  inc("UC-18", "UC-17");
  ext("UC-09", "UC-10");
  ext("UC-09", "UC-11");
  ext("UC-18", "UC-10");
  ext("UC-18", "UC-11");
  inc("UC-10", "UC-12");
  inc("UC-11", "UC-12");
  inc("UC-12", "UC-38");
  ext("UC-19", "UC-13");
  inc("UC-14", "UC-15");
  inc("UC-21", "UC-19");
  inc("UC-22", "UC-21");
  inc("UC-25", "UC-28");
  inc("UC-25", "UC-29");
  inc("UC-26", "UC-28");
  inc("UC-26", "UC-29");
  inc("UC-29", "UC-30");
  inc("UC-25", "UC-31");
  ext("UC-32", "UC-33");
  inc("UC-34", "UC-35");
  ext("UC-35", "UC-36");
  ext("UC-35", "UC-37");
  inc("UC-35", "UC-38");
  inc("UC-39", "UC-38");
  inc("UC-40", "UC-41");
  ext("UC-40", "UC-42");
  ext("UC-42", "UC-43");
  inc("UC-43", "UC-44");
  ext("UC-40", "UC-45");
  inc("UC-47", "UC-48");
  inc("UC-47", "UC-49");
  ext("UC-48", "UC-50");
  ext("UC-50", "UC-51");
  inc("UC-48", "UC-52");
  inc("UC-49", "UC-52");
  inc("UC-51", "UC-52");
  inc("UC-72", "UC-73");
  inc("UC-72", "UC-74");
  ext("UC-72", "UC-75");
  return r;
}

// ===== CATEGORY GROUPING =====
const catMap = {
  "Browsing & Discovery": "01_Browsing",
  "Shopping Cart": "02_Cart",
  "Checkout & Payment": "03_Checkout",
  "Order Tracking": "04_OrderTracking",
  "Account Management": "05_Account",
  "Reviews & Returns": "06_ReviewsReturns",
  "Wishlist": "07_Wishlist",
  "Live Chat": "08_Chat",
  "Admin - Product Management": "09_Admin_Product",
  "Admin - Order & Inventory": "10_Admin_Orders",
  "Admin - Inventory": "11_Admin_Inventory",
  "Admin - Returns": "12_Admin_Returns",
  "Admin - Coupons & Users": "13_Admin_Coupons",
  "Admin - Analytics": "14_Admin_Analytics",
  "Admin - Chat": "15_Admin_Chat"
};

const groups = {};
ucs.forEach(function(uc) {
  if (!groups[uc.cat]) groups[uc.cat] = [];
  groups[uc.cat].push(uc);
});

// ===== SVG GENERATOR =====
function genSvg(cat, list, outPath) {
  const svgName = catMap[cat] || cat.replace(/[^a-zA-Z0-9]/g, "_");
  const allRels = getRelationships();

  // Map UC ID to its position in this category
  const ucPos = {}; // UC-ID -> {x: number, y: number}
  const ucIdsInCat = {};
  list.forEach(function(uc, idx) {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const cx = COL_X[col];
    const cy = 300 + row * ROW_H + LANE_PAD_TOP;
    ucPos[uc.id] = { x: cx, y: cy };
    ucIdsInCat[uc.id] = true;
  });

  // Calculate SVG height
  const numRows = Math.ceil(list.length / 4);
  const lastUCY = 300 + (numRows - 1) * ROW_H + LANE_PAD_TOP;
  const contentHeight = lastUCY + LANE_PAD_BOT;
  const laneH = contentHeight - 300 + 60;
  const SVG_H = contentHeight + 100;

  // Determine which actors to show
  const actorsToShow = {};
  list.forEach(function(u) {
    u.actors.forEach(function(a) {
      if (ACTOR_DISPLAY[a]) actorsToShow[a] = ACTOR_DISPLAY[a];
    });
  });

  // Also include actors referenced by relationships
  allRels.forEach(function(r) {
    if (ucIdsInCat[r.from] && !ucIdsInCat[r.to]) {
      // Cross-category target - check if that UC has an actor
      const targetUC = ucs.find(function(u) { return u.id === r.to; });
      if (targetUC) {
        targetUC.actors.forEach(function(a) {
          if (ACTOR_DISPLAY[a]) actorsToShow[a] = ACTOR_DISPLAY[a];
        });
      }
    }
  });

  // Sort actors vertically
  const actorOrder = ["Guest", "User", "Admin", "Manager", "PayOS Gateway", "Stripe Gateway", "System", "Gmail SMTP"];
  const visibleActors = actorOrder.filter(function(a) { return actorsToShow[a]; });

  // Assign fixed Y positions for visible actors - spread them
  const actorSpread = contentHeight / (visibleActors.length + 1);
  const actorYPos = {};
  visibleActors.forEach(function(a, idx) {
    actorYPos[a] = 300 + actorSpread * (idx + 1);
  });

  // Fix gateway actors to specific positions for the full master style
  // For per-category, just spread them

  let svg = '';
  svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += '<!doctype html><html><head><meta charset="utf-8"><title>' + escXml(cat) + '</title><style>body{margin:0;background:#fff}svg{display:block;max-width:100%;height:auto}</style></head><body>';
  svg += '<svg xmlns="http://www.w3.org/2000/svg" width="' + SVG_W + '" height="' + SVG_H + '" viewBox="0 0 ' + SVG_W + ' ' + SVG_H + '">\n';

  // Defs
  svg += '<defs>\n';
  svg += '<marker id="arrow-include" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L11,4 z" fill="#111827"/></marker>\n';
  svg += '<marker id="arrow-extend" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L11,4 z" fill="#d95c54"/></marker>\n';
  svg += '</defs>\n';

  svg += '<style>\n';
  svg += 'svg{background:#fff;font-family:Arial,Helvetica,sans-serif}\n';
  svg += '.page-title{font-size:48px;font-weight:800;fill:#111827}\n';
  svg += '.page-subtitle{font-size:22px;fill:#475569}\n';
  svg += '.system{fill:#f8fbff;stroke:#111827;stroke-width:2.5}\n';
  svg += '.system-title{font-size:30px;font-weight:800;fill:#111827}\n';
  svg += '.lane{fill:#f1f7fd;stroke:#cbd5e1;stroke-width:1.4;opacity:.88}\n';
  svg += '.lane-title{font-size:24px;font-weight:800;fill:#475569}\n';
  svg += '.actor circle{fill:#78c7ec;stroke:#111827;stroke-width:2.6}\n';
  svg += '.actor line{stroke:#111827;stroke-width:2.8}\n';
  svg += '.actor text{font-size:23px;fill:#111827}\n';
  svg += '.uc ellipse{fill:#82cff0;stroke:#111827;stroke-width:2.2}\n';
  svg += '.uc text{font-size:21px;fill:#07101d}\n';
  svg += '.association{stroke:#111827;stroke-width:1.3;opacity:.34}\n';
  svg += '.include{stroke:#111827;stroke-width:2.1;stroke-dasharray:11 8;fill:none}\n';
  svg += '.extend{stroke:#d95c54;stroke-width:2.2;stroke-dasharray:12 8;fill:none}\n';
  svg += '.rel-label{font-size:19px;font-weight:800;fill:#111827;paint-order:stroke;stroke:#fff;stroke-width:7px}\n';
  svg += '.count{font-size:20px;fill:#475569}\n';
  svg += '</style>\n';

  svg += '<rect width="' + SVG_W + '" height="' + SVG_H + '" fill="#fff"/>\n';

  // Title
  svg += '<text x="75" y="70" class="page-title">Shoes Ecommerce - ' + escXml(cat) + '</text>\n';
  svg += '<text x="75" y="108" class="page-subtitle">' + list.length + ' use cases - actors, include and extend relationships</text>\n';

  // System boundary
  const sysW = 3100;
  const sysH = contentHeight - 240;
  svg += '<rect x="380" y="180" width="' + sysW + '" height="' + sysH + '" rx="32" class="system"/>\n';
  svg += '<text x="426" y="228" class="system-title">PTT Style / Shoes Ecommerce System</text>\n';
  svg += '<text x="426" y="262" class="count">' + escXml(cat) + '</text>\n';

  // Lane
  svg += '<rect x="422" y="276" width="' + LANE_W + '" height="' + (contentHeight - 276) + '" rx="24" class="lane"/>\n';
  svg += '<text x="' + TITLE_X + '" y="318" class="lane-title">' + escXml(cat) + '</text>\n';

  // Use Cases
  list.forEach(function(uc) {
    const pos = ucPos[uc.id];
    const label = uc.id + " - " + uc.name;
    svg += '<g class="uc"><ellipse cx="' + pos.x + '" cy="' + pos.y + '" rx="' + UC_RX + '" ry="' + UC_RY + '"/>\n';
    // Split long text into 2 lines if needed
    if (label.length > 28) {
      const mid = Math.floor(label.length / 2);
      let split = mid;
      while (split < label.length && label[split] !== ' ') split++;
      if (split >= label.length) split = 32;
      const line1 = label.substring(0, split).trim();
      const line2 = label.substring(split).trim();
      svg += '<text x="' + pos.x + '" y="' + (pos.y - 10) + '" text-anchor="middle" dominant-baseline="middle">' + escXml(line1) + '</text>\n';
      svg += '<text x="' + pos.x + '" y="' + (pos.y + 11) + '" text-anchor="middle" dominant-baseline="middle">' + escXml(line2) + '</text>\n';
    } else {
      svg += '<text x="' + pos.x + '" y="' + pos.y + '" text-anchor="middle" dominant-baseline="middle">' + escXml(label) + '</text>\n';
    }
    svg += '</g>\n';
  });

  // Include/Extend relationships within category
  allRels.forEach(function(r) {
    if (ucPos[r.from] && ucPos[r.to]) {
      const from = ucPos[r.from];
      const to = ucPos[r.to];
      const rClass = r.type === "include" ? "include" : "extend";
      const marker = r.type === "include" ? "url(#arrow-include)" : "url(#arrow-extend)";
      svg += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" class="' + rClass + '" marker-end="' + marker + '"/>\n';
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      svg += '<text x="' + mx + '" y="' + (my - 8) + '" text-anchor="middle" class="rel-label">&lt;&lt;' + r.type + '&gt;&gt;</text>\n';
    }
  });

  // Actors
  visibleActors.forEach(function(a) {
    const ay = actorYPos[a];
    const roleLabel = actorsToShow[a];
    svg += '<g class="actor">\n';
    svg += '<circle cx="' + ACTOR_LX + '" cy="' + (ay - 55) + '" r="15"/>\n';
    svg += '<line x1="' + ACTOR_LX + '" y1="' + (ay - 40) + '" x2="' + ACTOR_LX + '" y2="' + (ay + 15) + '"/>\n';
    svg += '<line x1="' + (ACTOR_LX - 42) + '" y1="' + (ay - 13) + '" x2="' + (ACTOR_LX + 42) + '" y2="' + (ay - 13) + '"/>\n';
    svg += '<line x1="' + ACTOR_LX + '" y1="' + (ay + 15) + '" x2="' + (ACTOR_LX - 38) + '" y2="' + (ay + 61) + '"/>\n';
    svg += '<line x1="' + ACTOR_LX + '" y1="' + (ay + 15) + '" x2="' + (ACTOR_LX + 38) + '" y2="' + (ay + 61) + '"/>\n';
    svg += '<text x="' + ACTOR_LX + '" y="' + (ay + 90) + '" text-anchor="middle">' + escXml(roleLabel) + '</text>\n';
    svg += '</g>\n';

    // Association lines: actor -> UCs for this actor
    list.forEach(function(uc) {
      if (uc.actors.indexOf(a) !== -1) {
        const pos = ucPos[uc.id];
        if (pos) {
          svg += '<line x1="' + ACTOR_LX + '" y1="' + ay + '" x2="' + (pos.x - UC_RX) + '" y2="' + pos.y + '" class="association"/>\n';
        }
      }
    });
  });

  svg += '</svg></body></html>\n';

  const fname = svgName + "_Detailed.svg";
  fs.writeFileSync(path.join(BASE, fname), svg, "utf8");
  console.log("Generated: " + fname + " (" + list.length + " UCs, " + visibleActors.length + " actors)");
}

// ===== GENERATE ALL =====
Object.entries(groups).forEach(function(entry) {
  genSvg(entry[0], entry[1]);
});

// ===== MASTER SVG =====
function genMasterSvg() {
  let svg = '';
  svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
  svg += '<!doctype html><html><head><meta charset="utf-8"><title>Master Detailed Use Case</title><style>body{margin:0;background:#fff}svg{display:block;max-width:100%;height:auto}</style></head><body>\n';

  // Calculate total height
  let totalH = 0;
  const laneInfo = [];
  const ucGlobalPos = {};

  let yOff = 300;
  Object.entries(groups).forEach(function(entry) {
    const cat = entry[0];
    const list = entry[1];
    const numRows = Math.ceil(list.length / 4);
    const laneH = numRows * ROW_H + LANE_PAD_TOP + LANE_PAD_BOT;
    const ucStartY = yOff + LANE_PAD_TOP;

    const positions = {};
    list.forEach(function(uc, idx) {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const cx = COL_X[col];
      const cy = yOff + LANE_PAD_TOP + row * ROW_H;
      positions[uc.id] = { x: cx, y: cy };
      ucGlobalPos[uc.id] = { x: cx, y: cy };
    });

    laneInfo.push({ cat: cat, list: list, yOff: yOff, yEnd: yOff + laneH, laneH: laneH, positions: positions });
    yOff += laneH;
  });

  const SVG_H = yOff + 100;

  svg += '<svg xmlns="http://www.w3.org/2000/svg" width="' + SVG_W + '" height="' + SVG_H + '" viewBox="0 0 ' + SVG_W + ' ' + SVG_H + '">\n';

  // Defs
  svg += '<defs>\n';
  svg += '<marker id="arrow-include" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L11,4 z" fill="#111827"/></marker>\n';
  svg += '<marker id="arrow-extend" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L11,4 z" fill="#d95c54"/></marker>\n';
  svg += '</defs>\n';

  svg += '<style>\n';
  svg += 'svg{background:#fff;font-family:Arial,Helvetica,sans-serif}\n';
  svg += '.page-title{font-size:48px;font-weight:800;fill:#111827}\n';
  svg += '.page-subtitle{font-size:22px;fill:#475569}\n';
  svg += '.system{fill:#f8fbff;stroke:#111827;stroke-width:2.5}\n';
  svg += '.system-title{font-size:30px;font-weight:800;fill:#111827}\n';
  svg += '.lane{fill:#f1f7fd;stroke:#cbd5e1;stroke-width:1.4;opacity:.88}\n';
  svg += '.lane-title{font-size:24px;font-weight:800;fill:#475569}\n';
  svg += '.actor circle{fill:#78c7ec;stroke:#111827;stroke-width:2.6}\n';
  svg += '.actor line{stroke:#111827;stroke-width:2.8}\n';
  svg += '.actor text{font-size:23px;fill:#111827}\n';
  svg += '.uc ellipse{fill:#82cff0;stroke:#111827;stroke-width:2.2}\n';
  svg += '.uc text{font-size:21px;fill:#07101d}\n';
  svg += '.association{stroke:#111827;stroke-width:1.3;opacity:.34}\n';
  svg += '.include{stroke:#111827;stroke-width:2.1;stroke-dasharray:11 8;fill:none}\n';
  svg += '.extend{stroke:#d95c54;stroke-width:2.2;stroke-dasharray:12 8;fill:none}\n';
  svg += '.rel-label{font-size:19px;font-weight:800;fill:#111827;paint-order:stroke;stroke:#fff;stroke-width:7px}\n';
  svg += '.count{font-size:20px;fill:#475569}\n';
  svg += '</style>\n';

  svg += '<rect width="' + SVG_W + '" height="' + SVG_H + '" fill="#fff"/>\n';

  // Title
  svg += '<text x="75" y="70" class="page-title">Shoes Ecommerce - Detailed Master Use Case Diagram</text>\n';
  svg += '<text x="75" y="108" class="page-subtitle">Full UC tổng: ' + ucs.length + ' use cases, actor associations, include and extend relationships</text>\n';

  // System boundary
  svg += '<rect x="380" y="180" width="3100" height="' + (yOff - 240) + '" rx="32" class="system"/>\n';
  svg += '<text x="426" y="228" class="system-title">PTT Style / Shoes Ecommerce System</text>\n';
  svg += '<text x="426" y="262" class="count">All customer, payment, order, refund, admin, inventory, analytics and support functions</text>\n';

  // Lanes + UCs
  laneInfo.forEach(function(info) {
    svg += '<rect x="422" y="' + info.yOff + '" width="' + LANE_W + '" height="' + info.laneH + '" rx="24" class="lane"/>\n';
    svg += '<text x="' + TITLE_X + '" y="' + (info.yOff + 42) + '" class="lane-title">' + escXml(info.cat) + '</text>\n';

    info.list.forEach(function(uc) {
      const p = info.positions[uc.id];
      const label = uc.id + " - " + uc.name;
      svg += '<g class="uc"><ellipse cx="' + p.x + '" cy="' + p.y + '" rx="' + UC_RX + '" ry="' + UC_RY + '"/>\n';
      if (label.length > 28) {
        const mid = Math.floor(label.length / 2);
        let split = mid;
        while (split < label.length && label[split] !== ' ') split++;
        if (split >= label.length) split = 32;
        const l1 = label.substring(0, split).trim();
        const l2 = label.substring(split).trim();
        svg += '<text x="' + p.x + '" y="' + (p.y - 10) + '" text-anchor="middle" dominant-baseline="middle">' + escXml(l1) + '</text>\n';
        svg += '<text x="' + p.x + '" y="' + (p.y + 11) + '" text-anchor="middle" dominant-baseline="middle">' + escXml(l2) + '</text>\n';
      } else {
        svg += '<text x="' + p.x + '" y="' + p.y + '" text-anchor="middle" dominant-baseline="middle">' + escXml(label) + '</text>\n';
      }
      svg += '</g>\n';
    });
  });

  // Include/Extend relationships
  const allRels = getRelationships();
  allRels.forEach(function(r) {
    if (ucGlobalPos[r.from] && ucGlobalPos[r.to]) {
      const from = ucGlobalPos[r.from];
      const to = ucGlobalPos[r.to];
      const rClass = r.type === "include" ? "include" : "extend";
      const marker = r.type === "include" ? "url(#arrow-include)" : "url(#arrow-extend)";
      svg += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" class="' + rClass + '" marker-end="' + marker + '"/>\n';
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      svg += '<text x="' + mx + '" y="' + (my - 8) + '" text-anchor="middle" class="rel-label">&lt;&lt;' + r.type + '&gt;&gt;</text>\n';
    }
  });

  // Actors
  function drawActor(name, ax, ay) {
    let s = '<g class="actor">\n';
    s += '<circle cx="' + ax + '" cy="' + (ay - 55) + '" r="15"/>\n';
    s += '<line x1="' + ax + '" y1="' + (ay - 40) + '" x2="' + ax + '" y2="' + (ay + 15) + '"/>\n';
    s += '<line x1="' + (ax - 42) + '" y1="' + (ay - 13) + '" x2="' + (ax + 42) + '" y2="' + (ay - 13) + '"/>\n';
    s += '<line x1="' + ax + '" y1="' + (ay + 15) + '" x2="' + (ax - 38) + '" y2="' + (ay + 61) + '"/>\n';
    s += '<line x1="' + ax + '" y1="' + (ay + 15) + '" x2="' + (ax + 38) + '" y2="' + (ay + 61) + '"/>\n';
    s += '<text x="' + ax + '" y="' + (ay + 90) + '" text-anchor="middle">' + escXml(name) + '</text>\n';
    s += '</g>\n';
    return s;
  }

  // Left actors: Guest, Registered User, Admin, Manager
  const leftActorY = [
    { name: "Guest", y: 475 },
    { name: "Registered User", y: 1135 },
    { name: "Admin", y: 2335 },
    { name: "Manager", y: 3215 },
  ];
  leftActorY.forEach(function(a) {
    svg += drawActor(a.name, ACTOR_LX, a.y);
  });

  // Right actors: PayOS, Stripe, System, Gmail
  const rightActorY = [
    { name: "PayOS Gateway", y: ACTOR_POS["PayOS Gateway"].y },
    { name: "Stripe Gateway", y: ACTOR_POS["Stripe Gateway"].y },
    { name: "System", y: ACTOR_POS["System"].y },
    { name: "Gmail SMTP", y: ACTOR_POS["Gmail SMTP"].y },
  ];
  rightActorY.forEach(function(a) {
    svg += drawActor(a.name, ACTOR_RX, a.y);
  });

  // Association lines: actor -> their UCs
  function actorAssoc(actorName, ay) {
    let lines = '';
    ucs.forEach(function(uc) {
      if (uc.actors.indexOf(actorName) !== -1 && ucGlobalPos[uc.id]) {
        const px = ucGlobalPos[uc.id];
        lines += '<line x1="' + ACTOR_LX + '" y1="' + ay + '" x2="' + (px.x - UC_RX) + '" y2="' + px.y + '" class="association"/>\n';
      }
    });
    return lines;
  }

  // Guest
  svg += actorAssoc("Guest", 475);
  svg += actorAssoc("User", 1135);
  svg += actorAssoc("Admin", 2335);
  svg += actorAssoc("Manager", 3215);

  // Right actors: draw associations to their UCs
  ucs.forEach(function(uc) {
    if (ucGlobalPos[uc.id]) {
      const px = ucGlobalPos[uc.id];
      if (uc.actors.indexOf("PayOS Gateway") !== -1)
        svg += '<line x1="' + ACTOR_RX + '" y1="' + ACTOR_POS["PayOS Gateway"].y + '" x2="' + (px.x + UC_RX) + '" y2="' + px.y + '" class="association"/>\n';
      if (uc.actors.indexOf("Stripe Gateway") !== -1)
        svg += '<line x1="' + ACTOR_RX + '" y1="' + ACTOR_POS["Stripe Gateway"].y + '" x2="' + (px.x + UC_RX) + '" y2="' + px.y + '" class="association"/>\n';
      if (uc.actors.indexOf("System") !== -1)
        svg += '<line x1="' + ACTOR_RX + '" y1="' + ACTOR_POS["System"].y + '" x2="' + (px.x + UC_RX) + '" y2="' + px.y + '" class="association"/>\n';
    }
  });

  svg += '</svg></body></html>\n';

  fs.writeFileSync(path.join(BASE, "00_Master_All_Detailed.svg"), svg, "utf8");
  console.log("Generated: 00_Master_All_Detailed.svg (" + ucs.length + " UCs total)");
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== RUN =====
Object.entries(groups).forEach(function(entry) {
  genSvg(entry[0], entry[1]);
});
genMasterSvg();
console.log("\nAll detailed SVG files generated in: " + BASE);
