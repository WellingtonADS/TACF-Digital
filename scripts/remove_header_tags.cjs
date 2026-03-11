const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const patterns = [
  /@module\s+Domínio/,
  /@author\s+WellingtonADS/,
  /@created\s+\d{4}-\d{2}-\d{2}/,
];

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

function processFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const m = content.match(/^([\s\t]*\/\*[\s\S]*?\*\/\s*)/);
  if (!m) return false;
  const block = m[1];
  const lines = block.split(/\r?\n/);
  const filtered = lines.filter((ln) => {
    // keep opening and closing lines
    if (/^\s*\/\*/.test(ln) || /\*\//.test(ln)) return true;
    // remove lines matching any pattern
    for (const p of patterns) {
      if (p.test(ln)) return false;
    }
    return true;
  });

  // If only opening and closing remain, remove header entirely
  const meaningful = filtered.filter(
    (ln) => !/^\s*\/\*|\*\/\s*$/.test(ln) && !/^\s*$/.test(ln),
  );
  let newPrefix = "";
  if (meaningful.length > 0) {
    newPrefix = filtered.join("\n") + "\n\n";
  } else {
    newPrefix = "";
  }

  const newContent = newPrefix + content.slice(block.length);
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, "utf8");
    return true;
  }
  return false;
}

function run() {
  const files = walk(SRC);
  console.log(`Found ${files.length} .tsx files under src/`);
  let changed = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    try {
      const ok = processFile(f);
      if (ok) {
        changed++;
        console.log(`Updated: ${rel}`);
      }
    } catch (err) {
      console.error(`Error processing ${rel}:`, err.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run();
