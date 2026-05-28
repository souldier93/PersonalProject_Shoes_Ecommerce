// Generate XMI 2.1 files importable by Visual Paradigm
const gen = require("./uc-gen");
require("./uc-gen-2");
require("./uc-gen-3");
const ucs = gen.ucs;
const { esc, fs, path } = gen;

const BASE = path.join(__dirname, "..", "docs", "requirements", "xmi-usecases");
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

function xmiEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ID counters
let c = 0;
function nid(prefix) { c++; return prefix + "_" + c; }

// Known actors
const actorIds = {};
const actors = ["Guest", "User", "Manager", "Admin", "PayOS Gateway", "Stripe Gateway", "System"];
actors.forEach(function (a) {
  actorIds[a] = nid("actor");
});

// Generate individual XMI file per use case
ucs.forEach(function (uc, idx) {
  const ucId = nid("usecase");
  const packageId = nid("package");
  const modelId = nid("model");

  let actorElems = "";
  uc.actors.forEach(function (a) {
    const aId = actorIds[a] || nid("actor");
    if (!actorIds[a]) actorIds[a] = aId;
    actorElems +=
      '      <packagedElement xmi:type="uml:Actor" xmi:id="' +
      aId +
      '" name="' +
      xmiEsc(a) +
      '"/>\n';
  });

  const preId = nid("constraint");
  const postId = nid("constraint");

  let altSteps = "";
  if (uc.af && uc.af.length > 0) {
    altSteps =
      "<AlternativeFlows>\n" +
      uc.af
        .map(function (s, i) {
          return "      <Alternative id=\"" + (i + 1) + "\">" + xmiEsc(s) + "</Alternative>";
        })
        .join("\n") +
      "\n    </AlternativeFlows>\n";
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1">\n' +
    '  <xmi:Documentation exporter="Shoes-Ecommerce" exporterVersion="1.0">\n' +
    "    " + xmiEsc("Use Case: " + uc.id + " - " + uc.name) + "\n" +
    "    Category: " + xmiEsc(uc.cat) + "\n" +
    "    Priority: " + xmiEsc(uc.pri) + "\n" +
    "  </xmi:Documentation>\n" +
    '  <uml:Model xmi:id="' +
    modelId +
    '" name="' +
    xmiEsc(uc.id + " - " + uc.name) +
    '">\n' +
    '    <packagedElement xmi:type="uml:Package" xmi:id="' +
    packageId +
    '" name="' +
    xmiEsc(uc.id) +
    '">\n' +
    actorElems +
    '      <packagedElement xmi:type="uml:UseCase" xmi:id="' +
    ucId +
    '" name="' +
    xmiEsc(uc.name) +
    '">\n' +
    '        <ownedRule xmi:type="uml:Constraint" xmi:id="' +
    preId +
    '" name="precondition">\n' +
    '          <specification xmi:type="uml:OpaqueExpression" body="' +
    xmiEsc(uc.pre) +
    '"/>\n' +
    "        </ownedRule>\n" +
    '        <ownedRule xmi:type="uml:Constraint" xmi:id="' +
    postId +
    '" name="postcondition">\n' +
    '          <specification xmi:type="uml:OpaqueExpression" body="' +
    xmiEsc(uc.post) +
    '"/>\n' +
    "        </ownedRule>\n" +
    '        <ownedComment xmi:type="uml:Comment" body="Category: ' +
    xmiEsc(uc.cat) +
    " | Priority: " +
    xmiEsc(uc.pri) +
    '"/>\n' +
    "      </packagedElement>\n" +
    "    </packagedElement>\n" +
    "  </uml:Model>\n" +
    "</xmi:XMI>";

  const fname = uc.id + "-" + uc.name.replace(/[\\/:*?"<>|]/g, "-") + ".xmi";
  fs.writeFileSync(path.join(BASE, fname), xml, "utf8");
});

// Generate MASTER XMI file with ALL use cases and actors
c = 0;
const masterModelId = nid("model");
const masterPackageId = nid("package");
const actorsPackageId = nid("package");

// Actor definitions (shared)
let allActorElems = "";
const allActorIds = {};
["Guest", "User", "Manager", "Admin", "PayOS Gateway", "Stripe Gateway", "System"].forEach(function (a) {
  const aId = nid("actor");
  allActorIds[a] = aId;
  allActorElems +=
    '      <packagedElement xmi:type="uml:Actor" xmi:id="' +
    aId +
    '" name="' +
    xmiEsc(a) +
    '"/>\n';
});

// Use case elements
let allUcElems = "";
ucs.forEach(function (uc) {
  const ucId = nid("usecase");
  const preId = nid("constraint");
  const postId = nid("constraint");

  allUcElems +=
    '      <packagedElement xmi:type="uml:UseCase" xmi:id="' +
    ucId +
    '" name="' +
    xmiEsc(uc.id + " - " + uc.name) +
    '">\n' +
    '        <ownedRule xmi:type="uml:Constraint" xmi:id="' +
    preId +
    '" name="precondition">\n' +
    '          <specification xmi:type="uml:OpaqueExpression" body="' +
    xmiEsc(uc.pre) +
    '"/>\n' +
    "        </ownedRule>\n" +
    '        <ownedRule xmi:type="uml:Constraint" xmi:id="' +
    postId +
    '" name="postcondition">\n' +
    '          <specification xmi:type="uml:OpaqueExpression" body="' +
    xmiEsc(uc.post) +
    '"/>\n' +
    "        </ownedRule>\n" +
    '        <ownedComment xmi:type="uml:Comment" body="Category: ' +
    xmiEsc(uc.cat) +
    " | Priority: " +
    xmiEsc(uc.pri) +
    '"/>\n' +
    "      </packagedElement>\n";
});

const masterXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1">\n' +
  '  <xmi:Documentation exporter="Shoes-Ecommerce" exporterVersion="1.0">\n' +
  "    Shoes Ecommerce - Complete Use Case Model (" +
  ucs.length +
  " use cases, 7 actors)\n" +
  "  </xmi:Documentation>\n" +
  '  <uml:Model xmi:id="' +
  masterModelId +
  '" name="Shoes Ecommerce Use Case Model">\n' +
  '    <packagedElement xmi:type="uml:Package" xmi:id="' +
  masterPackageId +
  '" name="UseCases">\n' +
  allUcElems +
  "    </packagedElement>\n" +
  '    <packagedElement xmi:type="uml:Package" xmi:id="' +
  actorsPackageId +
  '" name="Actors">\n' +
  allActorElems +
  "    </packagedElement>\n" +
  "  </uml:Model>\n" +
  "</xmi:XMI>";

const masterPath = path.join(BASE, "_MASTER_ALL_USE_CASES.xmi");
fs.writeFileSync(masterPath, masterXml, "utf8");

console.log(
  "Generated " + ucs.length + " individual XMI files + 1 master file in " + BASE
);
