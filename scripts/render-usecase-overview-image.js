const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "docs", "design", "visual-paradigm", "overview-usecase-data.tsv");
const outDir = path.join(root, "docs", "design", "usecase-images");
fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 2200;
const HEIGHT = 1680;
const SYSTEM = { x: 300, y: 70, w: 1580, h: 1500 };

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
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
  return lines.slice(0, 3);
}

function actorSvg(actor) {
  const { name, x, y } = actor;
  const label = wrapText(name, 16);
  const labelSvg = label
    .map((line, index) => `<text x="${x}" y="${y + 100 + index * 18}" text-anchor="middle" class="actor-label">${esc(line)}</text>`)
    .join("");
  return `
    <g class="actor" data-name="${esc(name)}">
      <circle cx="${x}" cy="${y}" r="11"/>
      <line x1="${x}" y1="${y + 11}" x2="${x}" y2="${y + 48}"/>
      <line x1="${x - 28}" y1="${y + 28}" x2="${x + 28}" y2="${y + 28}"/>
      <line x1="${x}" y1="${y + 48}" x2="${x - 26}" y2="${y + 78}"/>
      <line x1="${x}" y1="${y + 48}" x2="${x + 26}" y2="${y + 78}"/>
      ${labelSvg}
    </g>`;
}

function useCaseSvg(uc) {
  const cx = uc.x + uc.w / 2;
  const cy = uc.y + uc.h / 2;
  const rx = uc.w / 2;
  const ry = uc.h / 2;
  const lines = wrapText(`${uc.id} - ${uc.name}`, Math.max(14, Math.floor(uc.w / 13)));
  const startY = cy - ((lines.length - 1) * 15) / 2;
  const textSvg = lines
    .map((line, index) => `<text x="${cx}" y="${startY + index * 18}" text-anchor="middle" dominant-baseline="middle">${esc(line)}</text>`)
    .join("");
  return `
    <g class="usecase category-${esc(uc.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}" data-id="${esc(uc.id)}">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
      ${textSvg}
    </g>`;
}

function pointForActor(actor, target) {
  const ax = actor.x;
  const ay = actor.y + 42;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  return {
    x1: ax,
    y1: ay,
    x2: cx < WIDTH / 2 ? target.x : target.x + target.w,
    y2: cy,
  };
}

function pointForUseCase(from, to) {
  const fromCx = from.x + from.w / 2;
  const fromCy = from.y + from.h / 2;
  const toCx = to.x + to.w / 2;
  const toCy = to.y + to.h / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  const fromScale = 1 / Math.sqrt((dx * dx) / ((from.w / 2) ** 2) + (dy * dy) / ((from.h / 2) ** 2));
  const toScale = 1 / Math.sqrt((dx * dx) / ((to.w / 2) ** 2) + (dy * dy) / ((to.h / 2) ** 2));
  return {
    x1: fromCx + dx * fromScale,
    y1: fromCy + dy * fromScale,
    x2: toCx - dx * toScale,
    y2: toCy - dy * toScale,
  };
}

const lines = fs.readFileSync(sourcePath, "utf8").trim().split(/\r?\n/);
const actors = new Map();
const useCases = new Map();
const relations = [];

for (const line of lines) {
  const parts = line.split("\t");
  if (parts[0] === "ACTOR") {
    actors.set(parts[1], { name: parts[1], x: Number(parts[2]), y: Number(parts[3]) });
  } else if (parts[0] === "USECASE") {
    useCases.set(parts[1], {
      id: parts[1],
      name: parts[2],
      category: parts[3],
      x: Number(parts[4]),
      y: Number(parts[5]),
      w: Number(parts[6]),
      h: Number(parts[7]),
      actors: parts[8] ? parts[8].split(";").filter(Boolean) : [],
    });
  } else if (parts[0] === "REL") {
    relations.push({ type: parts[1], from: parts[2], to: parts[3] });
  }
}

const categoryBands = [
  { name: "Browsing", y: 80, h: 120 },
  { name: "Shopping", y: 245, h: 110 },
  { name: "Checkout", y: 390, h: 150 },
  { name: "Orders", y: 600, h: 140 },
  { name: "Returns / Reviews / Chat", y: 790, h: 125 },
  { name: "Admin Operations", y: 960, h: 390 },
  { name: "Analytics / Support", y: 1400, h: 100 },
];

const associations = [];
for (const uc of useCases.values()) {
  for (const actorName of uc.actors) {
    const actor = actors.get(actorName);
    if (!actor) continue;
    associations.push({ actor, uc });
  }
}

const categorySvg = categoryBands
  .map(
    (band) => `
      <rect x="${SYSTEM.x + 25}" y="${band.y}" width="${SYSTEM.w - 50}" height="${band.h}" rx="14" class="band"/>
      <text x="${SYSTEM.x + 42}" y="${band.y + 25}" class="band-label">${esc(band.name)}</text>`
  )
  .join("");

const associationSvg = associations
  .map(({ actor, uc }) => {
    const p = pointForActor(actor, uc);
    return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="association"/>`;
  })
  .join("");

const relationSvg = relations
  .filter((rel) => useCases.has(rel.from) && useCases.has(rel.to))
  .map((rel) => {
    const p = pointForUseCase(useCases.get(rel.from), useCases.get(rel.to));
    const mx = (p.x1 + p.x2) / 2;
    const my = (p.y1 + p.y2) / 2 - 8;
    const cls = rel.type === "include" ? "include" : "extend";
    return `
      <line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="${cls}" marker-end="url(#arrow-${cls})"/>
      <text x="${mx}" y="${my}" text-anchor="middle" class="rel-label">&lt;&lt;${rel.type}&gt;&gt;</text>`;
  })
  .join("");

const actorSvgAll = Array.from(actors.values()).map(actorSvg).join("");
const useCaseSvgAll = Array.from(useCases.values()).map(useCaseSvg).join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <marker id="arrow-include" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#111827"/>
    </marker>
    <marker id="arrow-extend" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#d95c54"/>
    </marker>
    <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".12"/>
    </filter>
  </defs>
  <style>
    svg { background: #ffffff; font-family: Arial, Helvetica, sans-serif; }
    .title { font-size: 30px; font-weight: 700; fill: #111827; }
    .subtitle { font-size: 15px; fill: #4b5563; }
    .system { fill: #f8fafc; stroke: #94a3b8; stroke-width: 2.5; }
    .system-title { font-size: 22px; font-weight: 700; fill: #111827; }
    .band { fill: #f1f5f9; stroke: #dbe3ee; stroke-width: 1; opacity: .75; }
    .band-label { font-size: 15px; font-weight: 700; fill: #64748b; }
    .actor circle, .actor line { stroke: #111827; stroke-width: 2.2; fill: #78c7ec; }
    .actor-label { font-size: 16px; fill: #111827; }
    .usecase ellipse { fill: #87d5f3; stroke: #111827; stroke-width: 1.8; filter: url(#soft-shadow); }
    .usecase text { font-size: 14px; fill: #0f172a; pointer-events: none; }
    .association { stroke: #111827; stroke-width: 1.35; opacity: .55; }
    .include { stroke: #111827; stroke-width: 1.5; stroke-dasharray: 7 5; fill: none; }
    .extend { stroke: #d95c54; stroke-width: 1.6; stroke-dasharray: 7 5; fill: none; }
    .rel-label { font-size: 13px; font-weight: 700; fill: #111827; paint-order: stroke; stroke: #fff; stroke-width: 4; }
    .legend-text { font-size: 15px; fill: #111827; }
    .legend-title { font-size: 16px; font-weight: 700; fill: #d95c54; }
  </style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
  <text x="55" y="42" class="title">Shoes Ecommerce - Overall Use Case Diagram</text>
  <text x="55" y="68" class="subtitle">High-level UC overview generated from project requirements; detailed UC specs are in docs/design/visual-paradigm/usecases.</text>

  <g class="legend">
    <text x="1560" y="35" class="legend-title">Legend</text>
    <line x1="1560" y1="58" x2="1635" y2="58" class="association"/>
    <text x="1650" y="63" class="legend-text">Association</text>
    <line x1="1560" y1="86" x2="1635" y2="86" class="include" marker-end="url(#arrow-include)"/>
    <text x="1650" y="91" class="legend-text">&lt;&lt;include&gt;&gt;</text>
    <line x1="1560" y1="114" x2="1635" y2="114" class="extend" marker-end="url(#arrow-extend)"/>
    <text x="1650" y="119" class="legend-text">&lt;&lt;extend&gt;&gt;</text>
  </g>

  <rect x="${SYSTEM.x}" y="${SYSTEM.y}" width="${SYSTEM.w}" height="${SYSTEM.h}" rx="20" class="system"/>
  <text x="${SYSTEM.x + 28}" y="${SYSTEM.y + 34}" class="system-title">PTT Style / Shoes Ecommerce System</text>

  ${categorySvg}
  ${associationSvg}
  ${relationSvg}
  ${useCaseSvgAll}
  ${actorSvgAll}
</svg>
`;

const svgPath = path.join(outDir, "Shoes_Ecommerce_UseCase_Overview.svg");
const htmlPath = path.join(outDir, "Shoes_Ecommerce_UseCase_Overview.html");
fs.writeFileSync(svgPath, svg, "utf8");
fs.writeFileSync(
  htmlPath,
  `<!doctype html><html><head><meta charset="utf-8"><title>Use Case Overview</title><style>body{margin:0;background:#fff}svg{display:block;max-width:100%;height:auto}</style></head><body>${svg}</body></html>`,
  "utf8"
);

console.log(svgPath);
console.log(htmlPath);
