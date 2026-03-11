const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const AUTHOR = "WellingtonADS";
const CREATED = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files = files.concat(walk(full));
    } else if (e.isFile() && full.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

function hasHeaderBlock(content) {
  const m = content.match(/^([\s\t]*\/\*[\s\S]*?\*\/\s*)/);
  if (!m) return null;
  const block = m[1];
  if (/@module|@page|@file/.test(block)) return { block, range: m[0] };
  return null;
}

function makeHeader(relPath, filename) {
  const page = path.basename(filename, path.extname(filename));
  const rel = relPath.split(path.sep).join("/");
  return `/**\n * @module Domínio\n * @page ${page}\n * @description Descrição concisa da funcionalidade.\n * @path ${rel}\n * @author ${AUTHOR}\n * @created ${CREATED}\n */\n\n`;
}

function run() {
  const files = walk(SRC);
  console.log(`Found ${files.length} .tsx files under src/`);

  let changed = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const headerInfo = hasHeaderBlock(content);
    let body = content;
    if (headerInfo) {
      // remove the existing header block at top
      body = content.slice(headerInfo.range.length);
    }

    const rel = path.relative(ROOT, file);
    const header = makeHeader(rel, file);

    if (content.startsWith(header)) {
      // already up-to-date
      continue;
    }

    fs.writeFileSync(file, header + body, "utf8");
    changed++;
    console.log(`Updated: ${rel}`);
  }

  console.log(`Done. Files changed: ${changed}`);
}

run();
