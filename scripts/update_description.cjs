const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DESCR = "Descrição concisa da funcionalidade.";

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (e.isFile() && full.endsWith(".tsx")) files.push(full);
  }
  return files;
}

function normalizeHeader(block) {
  const lines = block.split(/\r?\n/);
  let hasDescription = false;
  const out = lines.map((ln) => {
    if (/@description/.test(ln)) {
      hasDescription = true;
      return ln.replace(/@description[\s\S]*/, `@description ${DESCR}`);
    }
    return ln;
  });

  if (!hasDescription) {
    // insert after opening /** or after first non-empty line
    const insertIdx = out.findIndex((ln, idx) => idx > 0 && ln.trim() !== "");
    const descLine = ` * @description ${DESCR}`;
    if (insertIdx === -1) out.splice(out.length - 1, 0, descLine);
    else out.splice(insertIdx, 0, descLine);
  }

  return out.join("\n");
}

function processFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const m = content.match(/^([\s\t]*\/\*[\s\S]*?\*\/\s*)/);
  if (!m) {
    // create a header
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const page = path.basename(file, path.extname(file));
    const header = `/**\n * @page ${page}\n * @description ${DESCR}\n * @path ${rel}\n */\n\n`;
    fs.writeFileSync(file, header + content, "utf8");
    return true;
  }

  const block = m[1];
  const newBlock = normalizeHeader(block);
  if (newBlock === block) return false;
  const newContent = newBlock + content.slice(block.length);
  fs.writeFileSync(file, newContent, "utf8");
  return true;
}

function run() {
  const files = walk(SRC);
  console.log(`Found ${files.length} .tsx files under src/`);
  let changed = 0;
  for (const f of files) {
    try {
      const ok = processFile(f);
      if (ok) {
        changed++;
        console.log(`Updated: ${path.relative(ROOT, f)}`);
      }
    } catch (err) {
      console.error(`Error processing ${f}:`, err.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run();
