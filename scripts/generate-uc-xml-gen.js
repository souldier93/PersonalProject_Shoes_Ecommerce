const fs = require("fs");
const path = require("path");
const BASE = path.join(__dirname, "..", "docs", "requirements", "usecases");

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

let ucs = [];

function add(id,name,actors,pri,pre,post,mf,af,cat) {
  ucs.push({id,name,actors,pri,pre,post,mf,af,cat});
}

module.exports = { ucs, add, esc, BASE, fs, path, generate: function() {
  ucs.forEach(function(uc) {
    const actors = uc.actors.map(function(a) { return "    <Actor>" + esc(a) + "</Actor>"; }).join("\n");
    const mainFlow = uc.mf.map(function(s,i) { return "    <Step number=\"" + (i+1) + "\">" + esc(s) + "</Step>"; }).join("\n");
    const altFlow = uc.af.map(function(s,i) { return "    <Alternative id=\"" + (i+1) + "\">" + esc(s) + "</Alternative>"; }).join("\n");
    const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
      "<UseCase id=\"" + esc(uc.id) + "\" name=\"" + esc(uc.name) + "\" category=\"" + esc(uc.cat) + "\">\n" +
      "  <Actors>\n" + actors + "\n  </Actors>\n" +
      "  <Priority>" + esc(uc.pri) + "</Priority>\n" +
      "  <Precondition>" + esc(uc.pre) + "</Precondition>\n" +
      "  <Postcondition>" + esc(uc.post) + "</Postcondition>\n" +
      "  <MainFlow>\n" + mainFlow + "\n  </MainFlow>\n" +
      "  <AlternativeFlows>\n" + altFlow + "\n  </AlternativeFlows>\n" +
      "</UseCase>";
    const safeName = uc.id + "-" + uc.name.replace(/[\\/:*?"<>|]/g, "-") + ".xml";
    fs.writeFileSync(path.join(BASE, safeName), xml, "utf8");
  });
  console.log("Generated " + ucs.length + " use case XML files in " + BASE);
}};
