const fs = require("fs");
const path = require("path");

const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");

const root = path.join(__dirname, "..");
const outRoot = path.join(root, "docs", "design", "uml");
const pumlDirs = {
  usecase: path.join(outRoot, "usecase-puml"),
  sequence: path.join(outRoot, "sequence-puml"),
  class: path.join(outRoot, "class-puml"),
};

Object.values(pumlDirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

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
  if (!/[ÃƒÃ„Ã‚Ã†Ã¢]|Ã¡[ÂºÂ»]/.test(text)) return text;
  const bytes = Uint8Array.from(
    Array.from(text).map((char) => {
      const code = char.codePointAt(0);
      if (code <= 0xff) return code;
      return cp1252Bytes[code] ?? (code & 0xff);
    }),
  );
  return Buffer.from(bytes).toString("utf8");
}

function alignFlowWithCurrentApi(value) {
  return String(value ?? "")
    .replace(/POST \/payment\/checkout\/payos.*?\/stripe/g, "POST /payments or POST /payments/stripe/create-intent")
    .replace(/POST \/payment\/webhook\/payos/g, "POST /payments/webhook")
    .replace(/POST \/payment\/webhook\/stripe/g, "POST /payments/stripe/webhook")
    .replace(/GET \/payment\/status\?orderCode=X/g, "GET /payments/check/:paymentLinkId or GET /payments/check-order/:orderCode")
    .replace(/GET \/payments\/status\?orderCode=X&email=Y/g, "POST /payments/guest/orders/lookup")
    .replace(/GET \/auth\/addresses/g, "GET /auth/users/:id/profile")
    .replace(/POST\/PUT\/DELETE \/auth\/addresses/g, "POST/PATCH/DELETE /auth/users/:id/addresses")
    .replace(/GET \/payments\/orders\/user\/:userId/g, "GET /payments/user/:userId/orders")
    .replace(/POST \/chat\/convs\/:id\/messages/g, "POST /chat/conversations/:id/messages")
    .replace(/GET \/chat\/convs\/:id/g, "GET /chat/conversations/:id")
    .replace(/PATCH \/chat\/convs\/:id\/read/g, "PATCH /chat/conversations/:id/read")
    .replace(/PATCH \/chat\/convs\/:id\/close/g, "PATCH /chat/conversations/:id/status")
    .replace(/POST \/r2\/upload/g, "R2 admin media pipeline; upload endpoint recommended")
    .replace(/GET \/r2\/media-folders.*?list objects/g, "GET /r2/folders, GET /r2/subfolders and GET /r2/media")
    .replace(/GET \/inventory\?filter=lowStock/g, "GET /inventory/overview; frontend filters low stock")
    .replace(/GET \/returns\/:id/g, "GET /returns or GET /returns?status=... then select by _id")
    .replace(/GET \/analytics\/dashboard/g, "GET /analytics/overview")
    .replace(/GET \/analytics\/revenue\?from=\.\.\.&to=\.\.\./g, "GET /analytics/overview; date range endpoint recommended")
    .replace(/GET \/analytics\/orders\?from=\.\.\.&to=\.\.\./g, "GET /analytics/overview; date range endpoint recommended")
    .replace(/PATCH \/payments\/orders\/:id\/fulfillment/g, "PATCH /payments/orders/:orderCode/fulfillment")
    .replace(/PATCH \/payments\/orders\/:id\/carrier/g, "PATCH /payments/orders/:orderCode/fulfillment")
    .replace(/POST \/payments\/orders\/:id\/notes/g, "PATCH /payments/orders/:orderCode/fulfillment")
    .replace(/POST \/payments\/orders\/:id\/cancel/g, "POST /payments/orders/:orderCode/cancel-refund");
}

function cleanText(value) {
  return alignFlowWithCurrentApi(repairMojibake(value));
}

function normalizeUc(uc) {
  return {
    ...uc,
    id: cleanText(uc.id),
    name: cleanText(uc.name),
    actors: (uc.actors || []).map(cleanText),
    pri: cleanText(uc.pri),
    pre: cleanText(uc.pre),
    post: cleanText(uc.post),
    mf: (uc.mf || []).map(cleanText),
    af: (uc.af || []).map(cleanText),
    cat: cleanText(uc.cat),
  };
}

const uc76 = {
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
};

const ucs = [...gen.ucs.map(normalizeUc), normalizeUc(uc76)].sort((a, b) =>
  a.id.localeCompare(b.id),
);

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

const categoryPrefix = new Map(
  categoryOrder.map((cat, index) => [
    cat,
    `${String(index + 1).padStart(2, "0")}_${slug(cat)}`,
  ]),
);

const relationships = [
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

const endpointMap = {
  "UC-01": "GET /shoes",
  "UC-02": "GET /shoes?category=&color=&price=",
  "UC-03": "GET /shoes/detail/:productId",
  "UC-04": "GET /shoes/:productId/stock/:colorName/:size",
  "UC-05": "GET /reviews/product/:productId",
  "UC-06": "Local cart + optional GET /shoes/:productId/stock/:colorName/:size",
  "UC-07": "Local cart storage",
  "UC-08": "GET /coupons/validate?code=&amount=",
  "UC-09": "POST /payments or POST /payments/stripe/create-intent",
  "UC-10": "POST /payments",
  "UC-11": "POST /payments/stripe/create-intent + POST /payments/stripe/confirm",
  "UC-12": "POST /payments/webhook or POST /payments/stripe/webhook",
  "UC-13": "POST /payments/guest/orders/lookup",
  "UC-14": "POST /auth/register",
  "UC-15": "POST /auth/login",
  "UC-16": "GET/PATCH /auth/users/:id/profile",
  "UC-17": "POST/PATCH/DELETE /auth/users/:id/addresses",
  "UC-18": "POST /payments or POST /payments/stripe/create-intent",
  "UC-19": "GET /payments/user/:userId/orders",
  "UC-20": "POST /reviews",
  "UC-21": "POST /returns",
  "UC-22": "GET /returns/user/:userId",
  "UC-23": "GET/POST/DELETE /wishlist",
  "UC-24": "POST /chat/conversations + POST /chat/conversations/:id/messages",
  "UC-25": "POST /shoes/product",
  "UC-26": "PUT /shoes/:styleCode",
  "UC-27": "POST /shoes/soft-delete/:productId",
  "UC-28": "POST /shoes/product or PUT /shoes/:styleCode",
  "UC-29": "R2 media workflow; upload endpoint recommended",
  "UC-30": "GET /r2/folders + GET /r2/media",
  "UC-31": "PUT /shoes/:styleCode",
  "UC-32": "GET /payments/orders",
  "UC-33": "GET /payments/orders?filters",
  "UC-34": "GET /payments/check-order/:orderCode",
  "UC-35": "PATCH /payments/orders/:orderCode/fulfillment",
  "UC-36": "PATCH /payments/orders/:orderCode/fulfillment",
  "UC-37": "PATCH /payments/orders/:orderCode/fulfillment",
  "UC-38": "OrderEmailService.send*Email",
  "UC-39": "POST /payments/orders/:orderCode/cancel-refund",
  "UC-40": "GET /inventory/overview",
  "UC-41": "GET /inventory/overview",
  "UC-42": "GET /inventory/overview",
  "UC-43": "POST /inventory/adjust",
  "UC-44": "GET /inventory/overview",
  "UC-45": "Inventory export endpoint recommended",
  "UC-46": "GET /returns",
  "UC-47": "GET /returns",
  "UC-48": "PATCH /returns/:id/status",
  "UC-49": "PATCH /returns/:id/status",
  "UC-50": "PATCH /returns/:id/status",
  "UC-51": "PATCH /returns/:id/status",
  "UC-52": "Return status notification service recommended",
  "UC-53": "POST /coupons",
  "UC-54": "PATCH /coupons/:id",
  "UC-55": "PATCH /coupons/:id active=false",
  "UC-56": "GET /coupons",
  "UC-57": "GET /auth/users",
  "UC-58": "GET /auth/users/:id",
  "UC-59": "PATCH /auth/users/:id/role",
  "UC-60": "Disable user endpoint recommended",
  "UC-61": "GET /analytics/overview",
  "UC-62": "GET /analytics/overview",
  "UC-63": "GET /analytics/overview",
  "UC-64": "GET /analytics/overview",
  "UC-65": "GET /analytics/overview",
  "UC-66": "GET /analytics/overview?from=&to=",
  "UC-67": "Analytics export endpoint recommended",
  "UC-68": "POST /chat/conversations",
  "UC-69": "POST /chat/conversations/:id/messages",
  "UC-70": "GET /chat/conversations/:id",
  "UC-71": "GET /chat/conversations?status=open",
  "UC-72": "GET /chat/conversations/:id",
  "UC-73": "POST /chat/conversations/:id/messages",
  "UC-74": "PATCH /chat/conversations/:id/read",
  "UC-75": "PATCH /chat/conversations/:id/status",
  "UC-76": "POST /payments/orders/:orderCode/cancel-refund",
};

function slug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70);
}

function alias(value) {
  return slug(value).replace(/^(\d)/, "_$1");
}

function fileBase(uc) {
  return `${uc.id}_${slug(uc.name)}`;
}

function q(value) {
  return String(value ?? "").replace(/"/g, '\\"');
}

function wrapNote(text, max = 92) {
  const words = String(text ?? "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.join("\\n");
}

function primaryActor(uc) {
  const preferred = uc.actors.find((actor) =>
    ["Admin", "Manager", "User", "Guest"].includes(actor),
  );
  return preferred || uc.actors[0] || "System";
}

function groupsByCategory() {
  const groups = new Map();
  for (const cat of categoryOrder) groups.set(cat, []);
  for (const uc of ucs) {
    if (!groups.has(uc.cat)) groups.set(uc.cat, []);
    groups.get(uc.cat).push(uc);
  }
  return groups;
}

function domainForUc(uc) {
  const id = Number(uc.id.slice(3));
  if (id <= 5) return "catalog";
  if (id <= 8) return "cart";
  if (id <= 12 || id === 18 || id === 76 || id === 39) return "payment";
  if (id === 13 || id === 19 || (id >= 32 && id <= 38)) return "orders";
  if (id >= 14 && id <= 17) return "auth";
  if (id >= 20 && id <= 22) return "returnsReviews";
  if (id === 23) return "wishlist";
  if (id === 24 || id >= 68) return "chat";
  if (id >= 25 && id <= 31) return "productAdmin";
  if (id >= 40 && id <= 45) return "inventory";
  if (id >= 46 && id <= 52) return "returnsAdmin";
  if (id >= 53 && id <= 56) return "coupons";
  if (id >= 57 && id <= 60) return "userAdmin";
  if (id >= 61 && id <= 67) return "analytics";
  return "system";
}

function domainSpec(uc) {
  const domain = domainForUc(uc);
  const specs = {
    catalog: {
      ui: "Product UI",
      controller: "ShoesController / ReviewsController",
      service: "ShoesService / ReviewsService",
      db: "MongoDB: shoes, shoesDetail, reviews",
      classes: ["Shoe", "ShoeDetail", "Review"],
    },
    cart: {
      ui: "Cart UI",
      controller: uc.id === "UC-08" ? "CouponsController" : "Local cart utilities",
      service: uc.id === "UC-08" ? "CouponsService" : "bagStorage / bagHelper",
      db: uc.id === "UC-08" ? "MongoDB: coupons" : "Browser localStorage",
      classes: uc.id === "UC-08" ? ["Coupon"] : ["CartItem", "BagStorage", "BagHelper"],
    },
    payment: {
      ui: "Checkout / Payment UI",
      controller: "PaymentController",
      service: "PaymentService",
      db: "MongoDB: bills, shoesDetail, coupons",
      classes: ["Bill", "ShoeDetail", "Coupon", "OrderEmailService"],
    },
    orders: {
      ui: "My Orders / Admin Purchases UI",
      controller: "PaymentController",
      service: "PaymentService",
      db: "MongoDB: bills",
      classes: ["Bill", "StatusHistory", "OrderEmailService"],
    },
    auth: {
      ui: "Auth / Profile UI",
      controller: "AuthController",
      service: "UsersService",
      db: "MongoDB: users, role",
      classes: ["User", "Role", "JwtStrategy", "EmailService"],
    },
    returnsReviews: {
      ui: "My Orders / Product Review UI",
      controller: uc.id === "UC-20" ? "ReviewsController" : "ReturnsController",
      service: uc.id === "UC-20" ? "ReviewsService" : "ReturnsService",
      db: uc.id === "UC-20" ? "MongoDB: reviews, bills, shoesDetail" : "MongoDB: returnRequests, bills",
      classes: uc.id === "UC-20" ? ["Review", "Bill", "ShoeDetail"] : ["ReturnRequest", "Bill"],
    },
    wishlist: {
      ui: "Wishlist UI",
      controller: "WishlistController",
      service: "WishlistService",
      db: "MongoDB: wishlist, shoesDetail",
      classes: ["WishlistItem", "ShoeDetail"],
    },
    chat: {
      ui: "Chat Widget / Admin Chat UI",
      controller: "ChatController",
      service: "ChatService",
      db: "MongoDB: chatConversations",
      classes: ["ChatConversation", "ChatMessage", "ShoeDetail"],
    },
    productAdmin: {
      ui: "Admin Products UI",
      controller: uc.id === "UC-30" ? "R2Controller" : "ShoesController",
      service: uc.id === "UC-30" ? "R2Service" : "ShoesService",
      db: uc.id === "UC-30" ? "Cloudflare R2" : "MongoDB: shoes, shoesDetail, counters",
      classes: ["Shoe", "ShoeDetail", "ColorVariant", "SizeStock", "Counter", "R2Service"],
    },
    inventory: {
      ui: "Admin Inventory UI",
      controller: "InventoryController",
      service: "InventoryService",
      db: "MongoDB: shoesDetail, stockMovements",
      classes: ["ShoeDetail", "StockMovement", "ColorVariant", "SizeStock"],
    },
    returnsAdmin: {
      ui: "Admin Purchases / Returns UI",
      controller: "ReturnsController",
      service: "ReturnsService",
      db: "MongoDB: returnRequests, bills",
      classes: ["ReturnRequest", "Bill", "OrderEmailService"],
    },
    coupons: {
      ui: "Admin Settings UI",
      controller: "CouponsController",
      service: "CouponsService",
      db: "MongoDB: coupons",
      classes: ["Coupon"],
    },
    userAdmin: {
      ui: "Admin Users UI",
      controller: "AuthController",
      service: "UsersService",
      db: "MongoDB: users, role",
      classes: ["User", "Role", "RolesGuard"],
    },
    analytics: {
      ui: "Admin Analytics UI",
      controller: "AnalyticsController",
      service: "AnalyticsService",
      db: "MongoDB: bills, shoesDetail",
      classes: ["Bill", "ShoeDetail", "AnalyticsSummary"],
    },
    system: {
      ui: "System UI",
      controller: "AppController",
      service: "AppService",
      db: "MongoDB",
      classes: ["SystemProcess"],
    },
  };
  return specs[domain];
}

function generateUseCaseDiagram(cat, list, master = false) {
  const actors = Array.from(new Set(list.flatMap((uc) => uc.actors))).sort();
  const lines = [
    "@startuml",
    "left to right direction",
    "skinparam packageStyle rectangle",
    "skinparam usecaseFontSize 11",
    "skinparam shadowing false",
    "",
  ];

  for (const actor of actors) {
    const a = actor === "System" ? "SystemActor" : alias(actor);
    lines.push(`actor "${q(actor)}" as ${a}`);
  }
  if (actors.includes("Guest") && actors.includes("User")) lines.push("User --|> Guest");
  if (actors.includes("User") && actors.includes("Manager")) lines.push("Manager --|> User");
  if (actors.includes("Manager") && actors.includes("Admin")) lines.push("Admin --|> Manager");
  lines.push("");

  if (master) {
    lines.push('rectangle "Shoes Ecommerce System - All 76 Use Cases" {');
    const groups = groupsByCategory();
    for (const [category, items] of groups.entries()) {
      if (!items.length) continue;
      lines.push(`  package "${q(category)}" {`);
      for (const uc of items) {
        lines.push(`    usecase "${uc.id}\\n${q(uc.name)}" as ${alias(uc.id)}`);
      }
      lines.push("  }");
    }
    lines.push("}");
  } else {
    lines.push(`rectangle "${q(cat)}" {`);
    for (const uc of list) {
      lines.push(`  usecase "${uc.id}\\n${q(uc.name)}" as ${alias(uc.id)}`);
    }
    lines.push("}");
  }

  for (const uc of list) {
    const ucAlias = alias(uc.id);
    for (const actor of uc.actors) {
      const actorAlias = actor === "System" ? "SystemActor" : alias(actor);
      if (actors.includes(actor)) {
        if (["PayOS Gateway", "Stripe Gateway", "System"].includes(actor)) {
          lines.push(`${ucAlias} --> ${actorAlias}`);
        } else {
          lines.push(`${actorAlias} --> ${ucAlias}`);
        }
      }
    }
  }

  const ids = new Set(list.map((uc) => uc.id));
  for (const [type, from, to] of relationships) {
    if (ids.has(from) && ids.has(to)) {
      lines.push(`${alias(from)} ..> ${alias(to)} : <<${type}>>`);
    }
  }

  lines.push("@enduml", "");
  return lines.join("\n");
}

function generateSequence(uc) {
  const spec = domainSpec(uc);
  const actor = primaryActor(uc);
  const providerActors = uc.actors.filter((a) =>
    ["PayOS Gateway", "Stripe Gateway"].includes(a),
  );
  const endpoint = endpointMap[uc.id] || "Application API";
  const lines = [
    "@startuml",
    "autonumber",
    "skinparam shadowing false",
    "skinparam sequenceMessageAlign center",
    `title ${uc.id} - ${q(uc.name)}`,
    "",
    `actor "${q(actor)}" as Actor`,
    `boundary "${q(spec.ui)}" as FE`,
    `control "${q(spec.controller)}" as API`,
    `control "${q(spec.service)}" as Service`,
    `database "${q(spec.db)}" as DB`,
  ];

  for (const provider of providerActors) lines.push(`participant "${q(provider)}" as ${alias(provider)}`);
  if (uc.id === "UC-38" || uc.id === "UC-52" || uc.id === "UC-76" || uc.id === "UC-12") {
    lines.push('participant "Gmail SMTP" as Gmail');
  }
  lines.push("");

  const startsFromProvider = providerActors.length > 0 && uc.id === "UC-12";
  if (startsFromProvider) {
    lines.push(`${alias(providerActors[0])} -> API: Webhook event`);
  } else if (uc.actors.includes("System") && !["UC-38", "UC-52"].includes(uc.id)) {
    lines.push("Actor -> FE: Trigger use case");
  } else if (["UC-38", "UC-52"].includes(uc.id)) {
    lines.push("Actor -> Service: Domain status changed");
  } else {
    lines.push(`Actor -> FE: Start ${uc.id}`);
    lines.push(`FE -> API: ${q(endpoint)}`);
  }

  if (!["UC-07", "UC-06"].includes(uc.id) || uc.id === "UC-06") {
    if (!startsFromProvider && !["UC-38", "UC-52"].includes(uc.id)) {
      lines.push(`API -> Service: Execute ${q(uc.name)}`);
    } else if (startsFromProvider) {
      lines.push("API -> Service: Verify and process webhook");
    }
  }

  const domain = domainForUc(uc);
  if (domain === "cart" && uc.id !== "UC-08") {
    lines.push("FE -> FE: Update cart state and localStorage");
  } else {
    lines.push(`Service -> DB: Read/write ${q(spec.db.replace(/^MongoDB: /, ""))}`);
    lines.push("DB --> Service: Domain data");
  }

  if (providerActors.includes("PayOS Gateway")) {
    lines.push("Service -> PayOS_Gateway: Create/verify PayOS transaction");
    lines.push("PayOS_Gateway --> Service: PayOS result");
  }
  if (providerActors.includes("Stripe Gateway")) {
    lines.push("Service -> Stripe_Gateway: Create/confirm/refund payment");
    lines.push("Stripe_Gateway --> Service: Stripe result");
  }
  if (uc.id === "UC-30" || uc.id === "UC-29") {
    lines.push('participant "Cloudflare R2" as R2');
    lines.push("Service -> R2: List or store media objects");
    lines.push("R2 --> Service: Public media URLs");
  }
  if (uc.id === "UC-38" || uc.id === "UC-52" || uc.id === "UC-76" || uc.id === "UC-12") {
    lines.push("Service -> Gmail: Send notification email when configured");
    lines.push("Gmail --> Service: Delivery accepted or warning logged");
  }

  if (!["UC-38", "UC-52"].includes(uc.id)) {
    if (!startsFromProvider) {
      lines.push("Service --> API: Result");
      lines.push("API --> FE: Response");
      lines.push(`FE --> Actor: ${q(uc.post)}`);
    } else {
      lines.push("Service --> API: Webhook accepted");
      lines.push("API --> PayOS_Gateway: HTTP 200");
    }
  } else {
    lines.push("Service --> Actor: Notification flow completed");
  }

  if (uc.af && uc.af.length) {
    lines.push("");
    lines.push("alt Alternative / exception flow");
    for (const alt of uc.af) {
      lines.push(`  note over FE,Service: ${q(wrapNote(alt))}`);
    }
    lines.push("end");
  }

  lines.push("");
  lines.push("note over Actor,DB");
  lines.push(`Pre: ${q(wrapNote(uc.pre, 72))}`);
  lines.push(`Post: ${q(wrapNote(uc.post, 72))}`);
  lines.push("Main flow:");
  uc.mf.forEach((step, index) => lines.push(`${index + 1}. ${q(wrapNote(step, 72))}`));
  lines.push("end note");
  lines.push("@enduml", "");
  return lines.join("\n");
}

function generateUcClassDiagram(uc) {
  const spec = domainSpec(uc);
  const endpoint = endpointMap[uc.id] || "Application API";
  const lines = [
    "@startuml",
    "skinparam shadowing false",
    "skinparam classAttributeIconSize 0",
    "hide empty members",
    `title Class Diagram - ${uc.id} ${q(uc.name)}`,
    "",
    `class "${q(spec.ui)}" as UI <<boundary>>`,
    `class "${q(spec.controller)}" as Controller <<controller>>`,
    `class "${q(spec.service)}" as Service <<service>>`,
  ];

  for (const className of spec.classes) {
    lines.push(`class "${q(className)}" as ${alias(className)} <<domain>>`);
  }

  lines.push("");
  lines.push(`UI --> Controller : ${q(endpoint)}`);
  lines.push("Controller --> Service : delegates");
  for (const className of spec.classes) {
    lines.push(`Service --> ${alias(className)} : uses`);
  }
  if (uc.actors.includes("PayOS Gateway")) lines.push('Service --> "PayOS Gateway" : integrates');
  if (uc.actors.includes("Stripe Gateway")) lines.push('Service --> "Stripe Gateway" : integrates');
  if (uc.id === "UC-29" || uc.id === "UC-30") lines.push('Service --> "Cloudflare R2" : media API');
  if (["UC-12", "UC-38", "UC-52", "UC-76"].includes(uc.id)) lines.push('Service --> "Gmail SMTP" : email notification');

  lines.push("");
  lines.push("note right of UI");
  lines.push(`${uc.id} - ${q(uc.name)}`);
  lines.push(`Actors: ${q(uc.actors.join(", "))}`);
  lines.push(`Pre: ${q(wrapNote(uc.pre, 64))}`);
  lines.push(`Post: ${q(wrapNote(uc.post, 64))}`);
  lines.push("end note");
  lines.push("@enduml", "");
  return lines.join("\n");
}

function generateOverallClassDiagram() {
  return [
    "@startuml",
    "skinparam shadowing false",
    "skinparam classAttributeIconSize 0",
    "title Shoes Ecommerce - Domain Class Diagram",
    "",
    "package Frontend {",
    "  class VueSPA",
    "  class Router",
    "  class AxiosClient",
    "  class BagStorage",
    "  class ChatWidget",
    "}",
    "",
    "package Backend {",
    "  class AuthController",
    "  class UsersService",
    "  class ShoesController",
    "  class ShoesService",
    "  class PaymentController",
    "  class PaymentService",
    "  class CouponsController",
    "  class CouponsService",
    "  class InventoryController",
    "  class InventoryService",
    "  class ReturnsController",
    "  class ReturnsService",
    "  class ReviewsController",
    "  class ReviewsService",
    "  class WishlistController",
    "  class WishlistService",
    "  class ChatController",
    "  class ChatService",
    "  class AnalyticsController",
    "  class AnalyticsService",
    "  class R2Controller",
    "  class R2Service",
    "  class OrderEmailService",
    "}",
    "",
    "package Domain {",
    "  class User {",
    "    username",
    "    email",
    "    passwordHash",
    "    addresses[]",
    "  }",
    "  class Role {",
    "    name",
    "    permissions[]",
    "  }",
    "  class Shoe {",
    "    productId",
    "    name",
    "    category",
    "    price",
    "  }",
    "  class ShoeDetail {",
    "    productId",
    "    colors[]",
    "  }",
    "  class ColorVariant {",
    "    colorName",
    "    images[]",
    "    sizes[]",
    "  }",
    "  class SizeStock {",
    "    size",
    "    stock",
    "  }",
    "  class Bill {",
    "    orderCode",
    "    status",
    "    fulfillmentStatus",
    "    items[]",
    "  }",
    "  class Coupon {",
    "    code",
    "    type",
    "    value",
    "  }",
    "  class Review",
    "  class ReturnRequest",
    "  class WishlistItem",
    "  class StockMovement",
    "  class ChatConversation",
    "}",
    "",
    "VueSPA --> Router",
    "VueSPA --> AxiosClient",
    "VueSPA --> BagStorage",
    "VueSPA --> ChatWidget",
    "AxiosClient --> AuthController",
    "AxiosClient --> ShoesController",
    "AxiosClient --> PaymentController",
    "AxiosClient --> CouponsController",
    "AxiosClient --> InventoryController",
    "AxiosClient --> ReturnsController",
    "AxiosClient --> ReviewsController",
    "AxiosClient --> WishlistController",
    "AxiosClient --> ChatController",
    "AxiosClient --> AnalyticsController",
    "AxiosClient --> R2Controller",
    "",
    "AuthController --> UsersService",
    "ShoesController --> ShoesService",
    "PaymentController --> PaymentService",
    "CouponsController --> CouponsService",
    "InventoryController --> InventoryService",
    "ReturnsController --> ReturnsService",
    "ReviewsController --> ReviewsService",
    "WishlistController --> WishlistService",
    "ChatController --> ChatService",
    "AnalyticsController --> AnalyticsService",
    "R2Controller --> R2Service",
    "",
    "UsersService --> User",
    "User --> Role",
    "ShoesService --> Shoe",
    "ShoesService --> ShoeDetail",
    "ShoeDetail --> ColorVariant",
    "ColorVariant --> SizeStock",
    "PaymentService --> Bill",
    "PaymentService --> ShoeDetail",
    "PaymentService --> Coupon",
    "PaymentService --> OrderEmailService",
    "CouponsService --> Coupon",
    "InventoryService --> ShoeDetail",
    "InventoryService --> StockMovement",
    "ReviewsService --> Review",
    "ReviewsService --> Bill",
    "ReturnsService --> ReturnRequest",
    "ReturnsService --> Bill",
    "WishlistService --> WishlistItem",
    "ChatService --> ChatConversation",
    "AnalyticsService --> Bill",
    "AnalyticsService --> ShoeDetail",
    "@enduml",
    "",
  ].join("\n");
}

function writeGeneratedDocs() {
  const sequenceDoc = [
    "# Sequence Diagrams for All Use Cases",
    "",
    "Generated from the UC catalog. Each UC has a PlantUML source file and an SVG rendering.",
    "",
    "| UC | Use case | Category | SVG | PlantUML |",
    "| --- | --- | --- | --- | --- |",
    ...ucs.map((uc) => {
      const base = fileBase(uc);
      return `| ${uc.id} | ${uc.name} | ${uc.cat} | [SVG](uml/sequence-svg/${base}.svg) | [PUML](uml/sequence-puml/${base}.puml) |`;
    }),
    "",
  ].join("\n");

  const classDoc = [
    "# Class Diagrams",
    "",
    "## Overall Domain Class Diagram",
    "",
    "![Domain class diagram](uml/class-svg/00_Domain_Class_Diagram.svg)",
    "",
    "## Class Diagram by Use Case",
    "",
    "| UC | Use case | Category | SVG | PlantUML |",
    "| --- | --- | --- | --- | --- |",
    ...ucs.map((uc) => {
      const base = fileBase(uc);
      return `| ${uc.id} | ${uc.name} | ${uc.cat} | [SVG](uml/class-svg/${base}_Class.svg) | [PUML](uml/class-puml/${base}_Class.puml) |`;
    }),
    "",
  ].join("\n");

  const groups = groupsByCategory();
  const usecaseRows = [];
  usecaseRows.push("| Diagram | SVG | PlantUML |");
  usecaseRows.push("| --- | --- | --- |");
  usecaseRows.push("| Master all 76 UCs | [SVG](uml/usecase-svg/00_Master_All_76_UseCases.svg) | [PUML](uml/usecase-puml/00_Master_All_76_UseCases.puml) |");
  for (const [cat, list] of groups.entries()) {
    if (!list.length) continue;
    const prefix = categoryPrefix.get(cat) || slug(cat);
    usecaseRows.push(`| ${cat} (${list.length} UCs) | [SVG](uml/usecase-svg/${prefix}_UseCases.svg) | [PUML](uml/usecase-puml/${prefix}_UseCases.puml) |`);
  }

  const usecaseDoc = [
    "# Use Case Diagrams",
    "",
    "This file fills the missing use case drawings by category and includes a refreshed master diagram with UC-76.",
    "",
    "## Master",
    "",
    "![Master all 76 use cases](uml/usecase-svg/00_Master_All_76_UseCases.svg)",
    "",
    "## Diagram Index",
    "",
    ...usecaseRows,
    "",
  ].join("\n");

  const umlReadme = [
    "# UML Diagram Package",
    "",
    "Generated by `node scripts/generate-uc-uml.js`.",
    "",
    "## Contents",
    "",
    "- `usecase-puml/` and `usecase-svg/`: master plus category use case diagrams.",
    "- `sequence-puml/` and `sequence-svg/`: one sequence diagram for every UC-01..UC-76.",
    "- `class-puml/` and `class-svg/`: one overall class diagram and one class diagram for every UC-01..UC-76.",
    "",
    "## Counts",
    "",
    `- Use cases: ${ucs.length}`,
    `- Categories: ${categoryOrder.length}`,
    "- Use case diagrams: 16 (1 master + 15 categories)",
    "- Sequence diagrams: 76",
    "- Class diagrams: 77 (1 overall + 76 by UC)",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(root, "docs", "design", "sequence-diagrams-all-uc.md"), sequenceDoc, "utf8");
  fs.writeFileSync(path.join(root, "docs", "design", "class-diagrams.md"), classDoc, "utf8");
  fs.writeFileSync(path.join(root, "docs", "design", "usecase-diagrams.md"), usecaseDoc, "utf8");
  fs.writeFileSync(path.join(outRoot, "README.md"), umlReadme, "utf8");
}

function generateAll() {
  const groups = groupsByCategory();

  fs.writeFileSync(
    path.join(pumlDirs.usecase, "00_Master_All_76_UseCases.puml"),
    generateUseCaseDiagram("All Use Cases", ucs, true),
    "utf8",
  );
  for (const [cat, list] of groups.entries()) {
    if (!list.length) continue;
    const prefix = categoryPrefix.get(cat) || slug(cat);
    fs.writeFileSync(
      path.join(pumlDirs.usecase, `${prefix}_UseCases.puml`),
      generateUseCaseDiagram(cat, list),
      "utf8",
    );
  }

  fs.writeFileSync(
    path.join(pumlDirs.class, "00_Domain_Class_Diagram.puml"),
    generateOverallClassDiagram(),
    "utf8",
  );

  for (const uc of ucs) {
    const base = fileBase(uc);
    fs.writeFileSync(path.join(pumlDirs.sequence, `${base}.puml`), generateSequence(uc), "utf8");
    fs.writeFileSync(path.join(pumlDirs.class, `${base}_Class.puml`), generateUcClassDiagram(uc), "utf8");
  }

  writeGeneratedDocs();

  console.log(`Generated UML sources for ${ucs.length} use cases under ${outRoot}`);
}

generateAll();
