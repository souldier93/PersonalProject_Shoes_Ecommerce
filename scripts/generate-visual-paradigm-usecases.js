const fs = require("fs");
const path = require("path");

const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "design", "visual-paradigm");
const specDir = path.join(outDir, "usecases");
fs.mkdirSync(specDir, { recursive: true });

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const slug = (value) =>
  String(value)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

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

const repairMojibake = (value) => {
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
};

const repairUseCase = (uc) => ({
  ...uc,
  name: repairMojibake(uc.name),
  pri: repairMojibake(uc.pri),
  pre: repairMojibake(uc.pre),
  post: repairMojibake(uc.post),
  cat: repairMojibake(uc.cat),
  actors: uc.actors.map(repairMojibake),
  mf: uc.mf.map(repairMojibake),
  af: (uc.af || []).map(repairMojibake),
});

const ucs = [
  ...gen.ucs,
  {
    id: "UC-76",
    name: "Cancel Paid Order and Request Refund",
    actors: ["User", "Guest", "Stripe Gateway", "System"],
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
      "For Stripe card payment, system creates a Stripe refund from the PaymentIntent",
      "For bank transfer payment, system marks refund as REFUND_PENDING for manual processing",
      "System sets fulfillment status to CANCELLED",
      "System sends cancellation and refund email to customer",
    ],
    af: [
      "Order already SHIPPING or DELIVERED -> cancellation and refund are blocked",
      "Order is not PAID -> cancellation refund is rejected",
      "Stripe refund fails -> system returns error and keeps order unchanged",
    ],
    cat: "Order Tracking",
  },
].map(repairUseCase);

const relations = [
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
  ["extend", "UC-19", "UC-76"],
  ["include", "UC-76", "UC-38"],
  ["extend", "UC-76", "UC-11"],
];

const actors = Array.from(
  new Set(ucs.flatMap((uc) => uc.actors).concat(["Gmail SMTP"]))
).sort();

const actorId = new Map();
const ucId = new Map();
let counter = 0;
const id = (prefix, value) =>
  `${prefix}_${String(value).replace(/[^A-Za-z0-9]+/g, "_")}_${++counter}`;

for (const actor of actors) actorId.set(actor, id("actor", actor));
for (const uc of ucs) ucId.set(uc.id, id("usecase", uc.id));

for (const uc of ucs) {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<UseCase id="${escapeXml(uc.id)}" name="${escapeXml(uc.name)}" category="${escapeXml(uc.cat)}">\n` +
    `  <Actors>\n` +
    uc.actors.map((actor) => `    <Actor>${escapeXml(actor)}</Actor>\n`).join("") +
    `  </Actors>\n` +
    `  <Priority>${escapeXml(uc.pri)}</Priority>\n` +
    `  <Precondition>${escapeXml(uc.pre)}</Precondition>\n` +
    `  <Postcondition>${escapeXml(uc.post)}</Postcondition>\n` +
    `  <MainFlow>\n` +
    uc.mf.map((step, index) => `    <Step number="${index + 1}">${escapeXml(step)}</Step>\n`).join("") +
    `  </MainFlow>\n` +
    `  <AlternativeFlows>\n` +
    (uc.af || []).map((step, index) => `    <Alternative id="${index + 1}">${escapeXml(step)}</Alternative>\n`).join("") +
    `  </AlternativeFlows>\n` +
    `</UseCase>\n`;
  fs.writeFileSync(path.join(specDir, `${uc.id}-${slug(uc.name)}.xml`), xml, "utf8");
}

const categories = Array.from(new Set(ucs.map((uc) => uc.cat)));
const relationBySource = new Map();
for (const [type, from, to] of relations) {
  if (!relationBySource.has(from)) relationBySource.set(from, []);
  relationBySource.get(from).push({ type, to });
}

const packages = categories
  .map((category) => {
    const elements = ucs
      .filter((uc) => uc.cat === category)
      .map((uc) => {
        const nested = (relationBySource.get(uc.id) || [])
          .filter((rel) => ucId.has(rel.to))
          .map((rel) => {
            if (rel.type === "include") {
              return `        <include xmi:id="${id("include", `${uc.id}_${rel.to}`)}" addition="${ucId.get(rel.to)}"/>\n`;
            }
            return `        <extend xmi:id="${id("extend", `${uc.id}_${rel.to}`)}" extendedCase="${ucId.get(rel.to)}"/>\n`;
          })
          .join("");

        const comment = [
          `Category: ${uc.cat}`,
          `Priority: ${uc.pri}`,
          `Precondition: ${uc.pre}`,
          `Postcondition: ${uc.post}`,
          `Main flow: ${uc.mf.join(" | ")}`,
          `Alternative flow: ${(uc.af || []).join(" | ")}`,
        ].join("\n");

        return (
          `      <packagedElement xmi:type="uml:UseCase" xmi:id="${ucId.get(uc.id)}" name="${escapeXml(`${uc.id} - ${uc.name}`)}">\n` +
          nested +
          `        <ownedRule xmi:type="uml:Constraint" xmi:id="${id("constraint", uc.id)}" name="precondition">\n` +
          `          <specification xmi:type="uml:OpaqueExpression" body="${escapeXml(uc.pre)}"/>\n` +
          `        </ownedRule>\n` +
          `        <ownedRule xmi:type="uml:Constraint" xmi:id="${id("constraint", uc.id)}" name="postcondition">\n` +
          `          <specification xmi:type="uml:OpaqueExpression" body="${escapeXml(uc.post)}"/>\n` +
          `        </ownedRule>\n` +
          `        <ownedComment xmi:type="uml:Comment" xmi:id="${id("comment", uc.id)}" body="${escapeXml(comment)}"/>\n` +
          `      </packagedElement>\n`
        );
      })
      .join("");

    return (
      `    <packagedElement xmi:type="uml:Package" xmi:id="${id("package", category)}" name="${escapeXml(category)}">\n` +
      elements +
      `    </packagedElement>\n`
    );
  })
  .join("");

const actorPackage =
  `    <packagedElement xmi:type="uml:Package" xmi:id="${id("package", "actors")}" name="Actors">\n` +
  actors
    .map((actor) => `      <packagedElement xmi:type="uml:Actor" xmi:id="${actorId.get(actor)}" name="${escapeXml(actor)}"/>\n`)
    .join("") +
  `    </packagedElement>\n`;

const associationElements = ucs
  .flatMap((uc) =>
    uc.actors.map((actor) => {
      const assoc = id("association", `${actor}_${uc.id}`);
      const endA = id("end", `${actor}_${uc.id}_actor`);
      const endB = id("end", `${actor}_${uc.id}_usecase`);
      return (
        `    <packagedElement xmi:type="uml:Association" xmi:id="${assoc}" name="${escapeXml(`${actor} - ${uc.id}`)}" memberEnd="${endA} ${endB}">\n` +
        `      <ownedEnd xmi:id="${endA}" type="${actorId.get(actor)}" association="${assoc}"/>\n` +
        `      <ownedEnd xmi:id="${endB}" type="${ucId.get(uc.id)}" association="${assoc}"/>\n` +
        `    </packagedElement>\n`
      );
    })
  )
  .join("");

const xmi =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1">\n` +
  `  <xmi:Documentation exporter="Shoes-Ecommerce" exporterVersion="1.0">Visual Paradigm importable use case model</xmi:Documentation>\n` +
  `  <uml:Model xmi:id="${id("model", "shoes")}" name="Shoes Ecommerce Use Case Model">\n` +
  actorPackage +
  packages +
  associationElements +
  `  </uml:Model>\n` +
  `</xmi:XMI>\n`;

const xmiPath = path.join(outDir, "Shoes_Ecommerce_All_UseCases.xmi");
const xmlImportPath = path.join(outDir, "Shoes_Ecommerce_All_UseCases.xml");
fs.writeFileSync(xmiPath, xmi, "utf8");
fs.writeFileSync(xmlImportPath, xmi, "utf8");

const overviewLines = [
  ["ACTOR", "Guest", "70", "180"],
  ["ACTOR", "Registered User", "70", "520"],
  ["ACTOR", "Admin", "70", "940"],
  ["ACTOR", "Manager", "70", "1220"],
  ["ACTOR", "PayOS Gateway", "1920", "520"],
  ["ACTOR", "Stripe Gateway", "1920", "700"],
  ["ACTOR", "Gmail SMTP", "1920", "980"],
  ["USECASE", "OV-01", "Browse Products", "Browsing", "360", "90", "220", "54", "Guest;Registered User;Admin;Manager"],
  ["USECASE", "OV-02", "Search and Filter Products", "Browsing", "650", "90", "240", "54", "Guest;Registered User;Admin;Manager"],
  ["USECASE", "OV-03", "View Product Detail", "Browsing", "940", "90", "230", "54", "Guest;Registered User;Admin;Manager"],
  ["USECASE", "OV-04", "Check Stock", "Browsing", "1240", "45", "180", "48", ""],
  ["USECASE", "OV-05", "View Reviews", "Browsing", "1240", "120", "180", "48", ""],
  ["USECASE", "OV-06", "Manage Cart", "Shopping", "360", "270", "220", "54", "Guest;Registered User"],
  ["USECASE", "OV-07", "Manage Wishlist", "Shopping", "650", "270", "220", "54", "Registered User"],
  ["USECASE", "OV-08", "Apply Coupon", "Shopping", "940", "270", "190", "48", ""],
  ["USECASE", "OV-09", "Guest Checkout", "Checkout", "360", "450", "220", "54", "Guest"],
  ["USECASE", "OV-10", "User Checkout", "Checkout", "650", "450", "220", "54", "Registered User"],
  ["USECASE", "OV-11", "PayOS Payment", "Checkout", "980", "410", "210", "50", "PayOS Gateway"],
  ["USECASE", "OV-12", "Stripe Payment", "Checkout", "980", "500", "210", "50", "Stripe Gateway"],
  ["USECASE", "OV-13", "Receive Payment Webhook", "Checkout", "1290", "455", "260", "54", "PayOS Gateway;Stripe Gateway"],
  ["USECASE", "OV-14", "Track Guest Order", "Orders", "360", "650", "220", "54", "Guest"],
  ["USECASE", "OV-15", "View Order History", "Orders", "650", "650", "230", "54", "Registered User"],
  ["USECASE", "OV-16", "Cancel Order and Request Refund", "Orders", "960", "650", "300", "60", "Guest;Registered User;Stripe Gateway"],
  ["USECASE", "OV-17", "Verify Cancellation Eligibility", "Orders", "1330", "610", "300", "50", ""],
  ["USECASE", "OV-18", "Restore Stock", "Orders", "1330", "690", "190", "48", ""],
  ["USECASE", "OV-19", "Create Return Request", "Returns", "360", "820", "240", "54", "Registered User"],
  ["USECASE", "OV-20", "Write Product Review", "Reviews", "650", "820", "230", "54", "Registered User"],
  ["USECASE", "OV-21", "Chat with Support", "Chat", "960", "820", "230", "54", "Guest;Registered User"],
  ["USECASE", "OV-22", "Manage Product Catalog", "Admin", "360", "1030", "260", "54", "Admin"],
  ["USECASE", "OV-23", "Upload Product Images", "Admin", "670", "980", "240", "48", ""],
  ["USECASE", "OV-24", "Manage Colors and Sizes", "Admin", "670", "1060", "250", "48", ""],
  ["USECASE", "OV-25", "Manage Orders", "Admin", "990", "1030", "220", "54", "Admin;Manager"],
  ["USECASE", "OV-26", "View Order Detail", "Admin", "1280", "970", "220", "48", ""],
  ["USECASE", "OV-27", "Update Fulfillment Status", "Admin", "1280", "1050", "270", "48", ""],
  ["USECASE", "OV-28", "Add Tracking and Note", "Admin", "1590", "1050", "250", "48", ""],
  ["USECASE", "OV-29", "Manage Inventory", "Admin", "360", "1240", "230", "54", "Admin;Manager"],
  ["USECASE", "OV-30", "Adjust Stock", "Admin", "660", "1240", "190", "48", ""],
  ["USECASE", "OV-31", "Manage Returns", "Admin", "940", "1240", "230", "54", "Admin;Manager"],
  ["USECASE", "OV-32", "Manage Coupons and Users", "Admin", "1240", "1240", "270", "54", "Admin;Manager"],
  ["USECASE", "OV-33", "View Analytics Dashboard", "Admin", "360", "1430", "270", "54", "Admin;Manager"],
  ["USECASE", "OV-34", "Manage Customer Chat", "Admin", "690", "1430", "250", "54", "Admin;Manager"],
  ["USECASE", "OV-35", "Send Order Status Email", "System", "1290", "850", "270", "54", "Gmail SMTP"],
  ["REL", "include", "OV-03", "OV-04"],
  ["REL", "include", "OV-03", "OV-05"],
  ["REL", "include", "OV-09", "OV-06"],
  ["REL", "include", "OV-10", "OV-06"],
  ["REL", "include", "OV-09", "OV-08"],
  ["REL", "include", "OV-10", "OV-08"],
  ["REL", "extend", "OV-09", "OV-11"],
  ["REL", "extend", "OV-09", "OV-12"],
  ["REL", "extend", "OV-10", "OV-11"],
  ["REL", "extend", "OV-10", "OV-12"],
  ["REL", "include", "OV-11", "OV-13"],
  ["REL", "include", "OV-12", "OV-13"],
  ["REL", "extend", "OV-15", "OV-16"],
  ["REL", "include", "OV-16", "OV-17"],
  ["REL", "include", "OV-16", "OV-18"],
  ["REL", "include", "OV-16", "OV-35"],
  ["REL", "include", "OV-25", "OV-26"],
  ["REL", "include", "OV-25", "OV-27"],
  ["REL", "extend", "OV-27", "OV-28"],
  ["REL", "include", "OV-27", "OV-35"],
  ["REL", "include", "OV-22", "OV-23"],
  ["REL", "include", "OV-22", "OV-24"],
  ["REL", "include", "OV-29", "OV-30"],
  ["REL", "include", "OV-13", "OV-35"],
];

fs.writeFileSync(
  path.join(outDir, "overview-usecase-data.tsv"),
  overviewLines.map((line) => line.join("\t")).join("\n") + "\n",
  "utf8"
);

const readme =
  `# Visual Paradigm Use Case Package\n\n` +
  `- Open \`Shoes_Ecommerce_UseCase_Overview.vpp\` directly in Visual Paradigm for the drawn overview diagram.\n` +
  `- If you want to re-import the UML model, use \`Shoes_Ecommerce_All_UseCases.xmi\` via Project > Import > XMI.\n` +
  `- \`Shoes_Ecommerce_All_UseCases.xml\` contains the same XMI content with an XML extension.\n` +
  `- \`usecases/\` contains one XML file per use case.\n`;
fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");

console.log(`Generated ${ucs.length} use case XML files in ${specDir}`);
console.log(`Generated Visual Paradigm import files in ${outDir}`);
