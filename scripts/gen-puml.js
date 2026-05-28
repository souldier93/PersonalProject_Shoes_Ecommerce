// Generate PlantUML .puml files for Visual Paradigm import
const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");
const ucs = gen.ucs;
const { fs, path } = gen;

const BASE = path.join(__dirname, "..", "docs", "design", "usecase-puml");
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

// ===== CATEGORY GROUPING (legacy UC-01..UC-75 source set) =====
// category -> file prefix
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

// Group UCs by category
const groups = {};
ucs.forEach(function(uc) {
  if (!groups[uc.cat]) groups[uc.cat] = [];
  groups[uc.cat].push(uc);
});

// All unique actors across all UCs
const allActorSet = {};
ucs.forEach(function(uc) {
  uc.actors.forEach(function(a) { allActorSet[a] = true; });
});
const allActors = Object.keys(allActorSet);

// Actor aliases for PlantUML
const actorAlias = {
  "Guest": "Guest",
  "User": "User",
  "Manager": "Manager",
  "Admin": "Admin",
  "PayOS Gateway": "PayOS",
  "Stripe Gateway": "Stripe",
  "System": "System"
};

// ===== 1. MASTER OVERVIEW (legacy UC-01..UC-75 source set) =====
function genMaster() {
  let out = [];
  out.push("@startuml Master_All_75_UseCases");
  out.push("left to right direction");
  out.push("skinparam packageStyle rectangle");
  out.push("skinparam usecaseFontSize 11");
  out.push("");

  // Actor hierarchy
  out.push("actor Guest");
  out.push("actor User");
  out.push("actor Manager");
  out.push("actor Admin");
  out.push("actor \"PayOS Gateway\" as PayOS");
  out.push("actor \"Stripe Gateway\" as Stripe");
  out.push("actor \"System\" as SystemActor <<System>>");
  out.push("");
  out.push("User --|> Guest");
  out.push("Manager --|> User");
  out.push("Admin --|> Manager");
  out.push("");

  // Rectangle per category
  out.push('rectangle "Shoes Ecommerce System (Legacy UC-01..UC-75)" {');
  out.push("");

  const catOrder = Object.keys(catMap);
  const ucsById = {};
  ucs.forEach(function(u) { ucsById[u.id] = u; });

  // Declare all use cases
  Object.entries(groups).forEach(function(entry) {
    const cat = entry[0];
    const list = entry[1];
    out.push("  ' --- " + cat + " ---");
    list.forEach(function(u) {
      const safeId = u.id.replace(/-/g, "_");
      out.push("  usecase (" + safeId + "\\n" + escapePuml(u.name) + ") as " + safeId);
    });
    out.push("");
  });

  // Actor -> UC associations
  ucs.forEach(function(u) {
    const safeId = u.id.replace(/-/g, "_");
    u.actors.forEach(function(a) {
      if (a === "Guest" || a === "User" || a === "Manager" || a === "Admin") {
        out.push("  " + a + " --> " + safeId);
      } else if (a === "PayOS Gateway") {
        out.push("  " + safeId + " --> PayOS");
      } else if (a === "Stripe Gateway") {
        out.push("  " + safeId + " --> Stripe");
      } else if (a === "System") {
        // handled separately
      }
    });
  });

  // Include/Extend relationships
  const rels = buildRelationships();
  rels.forEach(function(r) {
    out.push("  " + r.from + " ..> " + r.to + " : " + r.label);
  });

  out.push("}");
  out.push("@enduml");

  return out.join("\n");
}

// ===== PER-CATEGORY DIAGRAMS =====
function genCategory(cat, list) {
  let out = [];
  const prefix = catMap[cat];
  out.push("@startuml " + prefix + "_UseCases");
  out.push("left to right direction");
  out.push("skinparam usecaseFontSize 12");
  out.push("");

  // Relevant actors
  const actorsInCat = {};
  list.forEach(function(u) { u.actors.forEach(function(a) { actorsInCat[a] = true; }); });

  if (actorsInCat["Guest"]) out.push("actor Guest");
  if (actorsInCat["User"]) out.push("actor User");
  if (actorsInCat["Manager"]) out.push("actor Manager");
  if (actorsInCat["Admin"]) out.push("actor Admin");
  if (actorsInCat["PayOS Gateway"]) out.push('actor "PayOS Gateway" as PayOS');
  if (actorsInCat["Stripe Gateway"]) out.push('actor "Stripe Gateway" as Stripe');
  if (actorsInCat["System"]) out.push('actor System <<system>>');
  out.push("");

  if (actorsInCat["User"] && actorsInCat["Guest"]) out.push("User --|> Guest");
  if (actorsInCat["Manager"] && actorsInCat["User"]) out.push("Manager --|> User");
  if (actorsInCat["Admin"] && actorsInCat["Manager"]) out.push("Admin --|> Manager");
  out.push("");

  out.push('rectangle "' + cat + '" {');
  list.forEach(function(u) {
    const safeId = u.id.replace(/-/g, "_");
    out.push("  usecase (" + safeId + "\\n" + escapePuml(u.name) + ") as " + safeId);
  });
  out.push("");

  // Actor -> UC
  list.forEach(function(u) {
    const safeId = u.id.replace(/-/g, "_");
    u.actors.forEach(function(a) {
      if (a === "Guest" || a === "User" || a === "Manager" || a === "Admin") {
        out.push("  " + a + " --> " + safeId);
      } else if (a === "PayOS Gateway") {
        out.push("  " + safeId + " --> PayOS");
      } else if (a === "Stripe Gateway") {
        out.push("  " + safeId + " --> Stripe");
      }
    });
  });

  // Include/Extend relationships within this category
  const ucIdsInCat = {};
  list.forEach(function(u) { ucIdsInCat[u.id.replace(/-/g, "_")] = true; });

  const rels = buildRelationships();
  rels.forEach(function(r) {
    if (ucIdsInCat[r.from] && ucIdsInCat[r.to]) {
      out.push("  " + r.from + " ..> " + r.to + " : " + r.label);
    }
  });

  out.push("");
  out.push("}");
  out.push("@enduml");

  return out.join("\n");
}

// ===== RELATIONSHIP BUILDER =====
function buildRelationships() {
  const r = [];

  function inc(from, to) { r.push({ from: from, to: to, label: "<<include>>" }); }
  function ext(from, to) { r.push({ from: from, to: to, label: "<<extend>>" }); }

  // Browse -> Product Detail includes Stock Check + View Reviews
  inc("UC_03", "UC_04");
  inc("UC_03", "UC_05");

  // Product Detail includes Stock Check + View Reviews
  inc("UC_03", "UC_04");
  inc("UC_03", "UC_05");

  // Manage Cart includes Add to Cart
  inc("UC_07", "UC_06");

  // Cart -> Checkout
  inc("UC_09", "UC_07");
  inc("UC_09", "UC_08");
  inc("UC_18", "UC_07");
  inc("UC_18", "UC_17");

  // Checkout extends to PayOS/Stripe
  ext("UC_09", "UC_10");
  ext("UC_09", "UC_11");
  ext("UC_18", "UC_10");
  ext("UC_18", "UC_11");
  inc("UC_10", "UC_12");
  inc("UC_11", "UC_12");

  // Payment includes Send Email (UC_38)
  inc("UC_12", "UC_38");

  // Order Tracking
  ext("UC_19", "UC_13");

  // Account: Login after Register
  inc("UC_14", "UC_15");

  // Reviews & Returns depends on order history
  inc("UC_21", "UC_19");
  inc("UC_22", "UC_21");

  // Admin Product management includes
  inc("UC_25", "UC_28");
  inc("UC_25", "UC_29");
  inc("UC_26", "UC_28");
  inc("UC_26", "UC_29");
  inc("UC_29", "UC_30");
  inc("UC_25", "UC_31");

  // Admin Orders
  ext("UC_32", "UC_33");
  inc("UC_34", "UC_35");
  ext("UC_35", "UC_36");
  ext("UC_35", "UC_37");
  inc("UC_35", "UC_38");
  inc("UC_39", "UC_38");

  // Admin Inventory
  inc("UC_40", "UC_41");
  ext("UC_40", "UC_42");
  ext("UC_42", "UC_43");
  inc("UC_43", "UC_44");
  ext("UC_40", "UC_45");

  // Admin Returns
  inc("UC_47", "UC_48");
  inc("UC_47", "UC_49");
  ext("UC_48", "UC_50");
  ext("UC_50", "UC_51");
  inc("UC_48", "UC_52");
  inc("UC_49", "UC_52");
  inc("UC_51", "UC_52");

  // Admin Chat
  inc("UC_72", "UC_73");
  inc("UC_72", "UC_74");
  ext("UC_72", "UC_75");

  return r;
}

// Escape PlantUML special chars (no XML escaping needed for PlantUML labels)
function escapePuml(s) {
  return String(s)
    .replace(/"/g, '\\"')
    .replace(/\(/g, '[')
    .replace(/\)/g, ']');
}

// ===== WRITE FILES =====

// Master
fs.writeFileSync(path.join(BASE, "00_Master_All_UseCases.puml"), genMaster(), "utf8");
console.log("Written: 00_Master_All_UseCases.puml");

// Per-category
Object.entries(groups).forEach(function(entry) {
  const cat = entry[0];
  const list = entry[1];
  const fname = catMap[cat] + "_UseCases.puml";
  fs.writeFileSync(path.join(BASE, fname), genCategory(cat, list), "utf8");
  console.log("Written: " + fname + " (" + list.length + " UCs)");
});

// ===== EXTRA: Copy PlantUML blocks from use-case-model.md =====
// Read the existing markdown and extract embedded PlantUML
const mdPath = path.join(__dirname, "..", "docs", "requirements", "use-case-model.md");
const mdContent = fs.readFileSync(mdPath, "utf8");

// Extract all @startuml ... @enduml blocks
const blocks = mdContent.match(/@startuml[\s\S]*?@enduml/g);
if (blocks) {
  const pumlBase2 = path.join(__dirname, "..", "docs", "design", "usecase-puml-from-md");
  if (!fs.existsSync(pumlBase2)) fs.mkdirSync(pumlBase2, { recursive: true });

  blocks.forEach(function(block, idx) {
    // Get diagram name from first line after @startuml
    const nameMatch = block.match(/@startuml\s+(\S+)/);
    let fname = (nameMatch ? nameMatch[1] : "diagram_" + (idx + 1)) + ".puml";
    fname = fname.replace(/[\\/:*?"<>|]/g, "_");
    fs.writeFileSync(path.join(pumlBase2, fname), block.trim(), "utf8");
    console.log("Extracted from md: " + fname);
  });
}

console.log("\nDone! All PlantUML files generated in:\n  " + BASE);
