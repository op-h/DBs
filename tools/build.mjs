#!/usr/bin/env node
// Scans the stage/semester folders and writes index.html, covers/*.jpg and data/library.json.
// GitHub runs this automatically on every push (.github/workflows/update-library.yml).
// To run it yourself: node tools/build.mjs   (needs Node 18+ and poppler-utils)
// See docs/decisions/0001-generated-static-index.md for why this exists.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COVERS = join(ROOT, "covers");
const MANIFEST = join(ROOT, "data", "library.json");
const TEMPLATE = join(ROOT, "tools", "template.html");
const REPO_URL = "https://github.com/op-h/DBs";

// Folder names are Arabic ordinals; map them to numbers so ordering and URLs stay ASCII.
const STAGES = ["المرحلة الاولى", "المرحلة الثانية", "المرحلة الثالثة", "المرحلة الرابعة"];
const TERMS = ["الكورس الاول", "الكورس الثاني"];
const LARGE_FILE_BYTES = 20 * 1024 * 1024;

// poppler-utils (pdfinfo + pdftoppm) is the only external tool. Without it the build still
// works from the cache below; new PDFs just get no page count or cover.
let HAS_POPPLER = true;
try {
  execFileSync("pdfinfo", ["-v"], { stdio: "ignore" });
} catch (error) {
  // pdfinfo -v exits non-zero on some versions but still exists.
  HAS_POPPLER = error.code !== "ENOENT";
}

// Keyed by path. A file whose size is unchanged reuses its page count and cover, so a fresh
// clone (where every mtime is "now") doesn't re-render all covers and commit noise.
const cache = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { files: [] };
const cached = new Map(cache.files.map((f) => [f.path, f]));

const slugify = (text) =>
  text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const toHref = (path) => path.split("/").map(encodeURIComponent).join("/");

function formatSize(bytes) {
  // 1023.6 KB would round up to "1024 KB"; switch to MB before that happens.
  if (bytes < 1023.5 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readPages(absPath, relPath, changed) {
  const old = cached.get(relPath)?.pages ?? null;
  if (!changed && old) return old;
  if (!HAS_POPPLER) return old;
  try {
    const out = execFileSync("pdfinfo", [absPath], { encoding: "utf8" });
    const match = out.match(/^Pages:\s+(\d+)/m);
    return match ? Number(match[1]) : old;
  } catch {
    // A damaged PDF should not break the build.
    return old;
  }
}

function makeCover(absPath, slug, changed) {
  const out = join(COVERS, `${slug}.jpg`);
  const rel = `covers/${slug}.jpg`;
  if (existsSync(out) && !changed) return rel;
  if (!HAS_POPPLER) return existsSync(out) ? rel : null;
  try {
    // First page, 240px wide (2x for ~120px display), cropped to 3:4 from the top so the
    // title block stays in frame.
    execFileSync("pdftoppm", [
      "-f", "1", "-l", "1", "-singlefile", "-jpeg", "-jpegopt", "quality=60,optimize=y",
      "-scale-to-x", "240", "-scale-to-y", "-1", "-x", "0", "-y", "0", "-W", "240", "-H", "320",
      absPath, out.replace(/\.jpg$/, "")
    ], { stdio: "ignore", timeout: 60_000 });
    return rel;
  } catch {
    console.warn(`  ! cover failed: ${absPath}`);
    return null;
  }
}

function scan() {
  mkdirSync(COVERS, { recursive: true });
  const stages = STAGES.map((stageName, si) => ({
    n: si + 1,
    ar: stageName,
    terms: TERMS.map((termName, ti) => ({ n: ti + 1, ar: termName, files: [] }))
  }));

  for (const stage of stages) {
    for (const term of stage.terms) {
      const dir = join(ROOT, stage.ar, term.ar);
      if (!existsSync(dir)) continue;
      const pdfs = readdirSync(dir).filter((f) => /\.pdf$/i.test(f)).sort((a, b) => a.localeCompare(b, "en"));
      for (const fileName of pdfs) {
        const relPath = `${stage.ar}/${term.ar}/${fileName}`;
        const absPath = join(dir, fileName);
        const stat = statSync(absPath);
        const name = fileName.replace(/\.pdf$/i, "").replace(/\s+/g, " ").trim();
        // Non-Latin names slug to nothing; fall back to a stable hash so ids and covers can't collide.
        const base = slugify(name) || createHash("sha256").update(name).digest("hex").slice(0, 8);
        const slug = `s${stage.n}-${term.n}-${base}`;
        const changed = cached.get(relPath)?.size !== stat.size;
        term.files.push({
          id: slug,
          name,
          path: relPath,
          href: toHref(relPath),
          size: stat.size,
          pages: readPages(absPath, relPath, changed),
          cover: makeCover(absPath, slug, changed),
          stage: stage.n,
          term: term.n
        });
      }
    }
  }

  const ids = stages.flatMap((s) => s.terms.flatMap((t) => t.files.map((f) => f.id)));
  const dupe = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dupe) throw new Error(`Two PDFs map to the same id "${dupe}"; rename one of them.`);

  // Drop covers whose PDF was removed so the repo does not accumulate orphans.
  const live = new Set(stages.flatMap((s) => s.terms.flatMap((t) => t.files.map((f) => `${f.id}.jpg`))));
  for (const file of readdirSync(COVERS)) {
    if (!live.has(file)) rmSync(join(COVERS, file));
  }

  return stages;
}

// ---------- curriculum ----------
// data/curriculum.json is hand-transcribed from the department's official curriculum PDF
// (Program Curriculum 2023-2024, Rev. 3.1). Each module names the PDF file that holds its material, if any.

const CURRICULUM_PATH = join(ROOT, "data", "curriculum.json");

function loadCurriculum() {
  if (!existsSync(CURRICULUM_PATH)) return null;
  const cur = JSON.parse(readFileSync(CURRICULUM_PATH, "utf8"));
  const byCode = new Map();
  for (const sem of cur.semesters) {
    sem.stage = Math.ceil(sem.n / 2);
    sem.term = sem.n % 2 ? 1 : 2;
    for (const m of sem.modules) {
      byCode.set(m.code, m);
      for (const o of m.options || []) {
        o.slot = m;
        byCode.set(o.code, o);
      }
    }
  }
  cur.byCode = byCode;
  return cur;
}

// Attach each PDF to its module (and each module to its PDF). Unmatched PDFs still render;
// they just have no code or curriculum facts.
function linkCurriculum(cur, stages) {
  if (!cur) return;
  for (const sem of cur.semesters) {
    const files = stages[sem.stage - 1].terms[sem.term - 1].files;
    const entries = sem.modules.flatMap((m) => (m.options ? m.options : [m]));
    for (const entry of entries) {
      if (!entry.file) continue;
      const file = files.find((f) => f.name === entry.file);
      if (!file) {
        console.warn(`  ! curriculum: no PDF named "${entry.file}" in stage ${sem.stage} semester ${sem.term}`);
        continue;
      }
      entry.pdf = file;
      file.module = entry;
    }
  }
  for (const f of stages.flatMap((s) => s.terms.flatMap((t) => t.files))) {
    if (!f.module) console.warn(`  ! curriculum: "${f.path}" is not linked to a module (add "file" in data/curriculum.json)`);
  }
}

// ---------- markup ----------

const vh = (text) => `<span class="visually-hidden">${text}</span>`;
const chevron = `<span class="chev" aria-hidden="true"></span>`;

function moduleFacts(mod, cur) {
  if (!mod) return "";
  const slot = mod.slot || mod;
  const type = cur.types[slot.type] || slot.type;
  const prereq = (mod.prereq || slot.prereq || [])
    .map((code) => {
      const p = cur.byCode.get(code);
      return `<span><code>${code}</code> ${p ? escapeHtml(p.name) : ""}</span>`;
    })
    .join(", ");
  const facts = [
    ["Type", mod.slot ? `${type} · option for ${escapeHtml(slot.name)}` : type],
    ["ECTS", String(slot.ects)],
    ["Workload", `${slot.swl} h <span class="muted">(${slot.sswl} h scheduled)</span>`],
    ["Taught in", slot.lang]
  ];
  if (prereq) facts.push(["Requires", prereq]);
  return facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
}

function renderCourse(file, cur) {
  const size = formatSize(file.size);
  const large = file.size >= LARGE_FILE_BYTES;
  const mod = file.module;
  const title = escapeHtml(mod ? mod.name : file.name);
  const code = mod ? mod.code : "";
  const pages = file.pages ? `${file.pages.toLocaleString("en")} pages` : "";
  // "stage1"/"semester2" are single words so script.js can match them without a bare number
  // leaking across fields; Arabic names let students search in Arabic too.
  const search = [file.name, mod?.name, code, mod?.ar, `stage${file.stage}`, `semester${file.term}`, STAGES[file.stage - 1], TERMS[file.term - 1]]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const cover = file.cover
    ? `<img class="preview-cover" src="${file.cover}" width="120" height="160" alt="" loading="lazy" decoding="async">`
    : `<span class="preview-cover preview-cover--empty" aria-hidden="true">PDF</span>`;

  // Collapsed, a course is one quiet row; opening it shows the preview with the actions.
  // name="course" makes the rows an exclusive accordion where supported (one open at a time).
  return `
            <li class="course" id="${file.id}" data-stage="${file.stage}" data-term="${file.term}" data-search="${escapeHtml(search)}">
              <details class="course-item" name="course">
                <summary class="course-row">
                  <code class="course-code">${code || "PDF"}</code>
                  <span class="course-title">${title}</span>
                  <span class="course-meta">${vh(", ")}${size}${large ? `${vh(", ")}<span class="flag">Large</span>` : ""}</span>
                  ${chevron}
                </summary>
                <div class="preview">
                  ${cover}
                  <div class="preview-info">
                    ${mod?.ar ? `<p class="preview-ar" lang="ar" dir="rtl">${escapeHtml(mod.ar)}</p>` : ""}
                    <dl class="facts">${moduleFacts(mod, cur)}<div><dt>File</dt><dd>${pages ? `${pages} · ` : ""}${size}${large ? ` <span class="flag">Large file, best on Wi-Fi</span>` : ""}</dd></div></dl>
                    <div class="preview-actions">
                      <a class="btn btn--primary" href="${file.href}" type="application/pdf" target="_blank" rel="noopener" aria-describedby="newTabHint">Open PDF${vh(` ${title}`)}</a>
                      <a class="btn" href="${file.href}" type="application/pdf" download="${escapeHtml(file.name)}.pdf">Download${vh(` ${title}, ${size}`)}</a>
                    </div>
                  </div>
                </div>
              </details>
            </li>`;
}

function renderTerm(stage, term, cur) {
  const sem = cur?.semesters.find((s) => s.stage === stage.n && s.term === term.n);
  const ects = sem ? sem.modules.reduce((a, m) => a + m.ects, 0) : 0;
  return `
          <section class="term" data-term="${term.n}">
            <h3 class="term-title" id="stage-${stage.n}-sem-${term.n}">Semester ${term.n}${ects ? ` <span class="term-ects">${ects} ECTS</span>` : ""}</h3>
            ${term.files.length
              ? `<ul class="course-list" role="list">${term.files.map((f) => renderCourse(f, cur)).join("")}
            </ul>`
              : `<p class="term-empty">No material uploaded yet.</p>`}
          </section>`;
}

function renderStage(stage, cur) {
  const files = stage.terms.flatMap((t) => t.files);
  const size = files.reduce((sum, f) => sum + f.size, 0);
  const count = files.length ? `${files.length} PDFs · ${formatSize(size)}` : "No PDFs yet";
  const body = files.length
    ? stage.terms.map((t) => renderTerm(stage, t, cur)).join("")
    : `
          <p class="stage-empty">No material uploaded yet. The modules for this stage are listed in the curriculum map above.</p>`;
  return `
      <details class="stage" id="stage-${stage.n}" data-stage="${stage.n}">
        <summary class="stage-summary">
          <h2 class="stage-title" id="stage-${stage.n}-title">Stage ${stage.n} <span class="ar" lang="ar" dir="rtl">${stage.ar}</span></h2>
          <span class="stage-count">${count}</span>
          ${chevron}
        </summary>
        <div class="stage-body">${body}
        </div>
      </details>`;
}

function renderStageNav(stages) {
  return stages
    .map((s) => {
      const count = s.terms.reduce((n, t) => n + t.files.length, 0);
      return `<li><a href="#stage-${s.n}">Stage ${s.n} <span class="count">${count}${vh(count === 1 ? " file" : " files")}</span></a></li>`;
    })
    .join("\n          ");
}

function renderMapEntry(entry) {
  const name = escapeHtml(entry.name);
  return entry.pdf
    ? `<a class="map-link" href="${entry.pdf.href}" type="application/pdf" target="_blank" rel="noopener" aria-describedby="newTabHint">${name}</a>`
    : `<span class="map-link is-missing">${name}${vh(", not uploaded yet")}</span>`;
}

// A route map: the four stages are stations on one line, each with its two semester stops and
// the modules taught there. Names only; codes, credits and types live in the course previews,
// so the map stays quiet.
function renderMap(cur, stages) {
  if (!cur) return "";
  const entries = cur.semesters.flatMap((s) => s.modules.flatMap((m) => (m.options ? m.options : [m])));
  const withPdf = entries.filter((e) => e.pdf).length;
  const totalEcts = cur.semesters.reduce((a, s) => a + s.modules.reduce((b, m) => b + m.ects, 0), 0);

  const stations = stages
    .map((stage) => {
      const sems = cur.semesters.filter((s) => s.stage === stage.n);
      const hasPdf = sems.some((s) => s.modules.some((m) => m.pdf || (m.options || []).some((o) => o.pdf)));
      const stops = sems
        .map((sem) => {
          const items = sem.modules
            .map((m) =>
              m.options
                ? `<li class="map-elective"><span class="map-elective-label">${escapeHtml(m.name)}:</span> ${m.options.map((o) => renderMapEntry(o)).join(' <span class="muted">or</span> ')}</li>`
                : `<li>${renderMapEntry(m)}</li>`
            )
            .join("\n                  ");
          return `
              <li class="map-stop">
                <h4 class="map-stop-title">Semester ${sem.term}</h4>
                <ul class="map-list" role="list">
                  ${items}
                </ul>
              </li>`;
        })
        .join("");
      return `
          <li class="map-station${hasPdf ? "" : " is-ahead"}">
            <h3 class="map-station-title"><span class="map-node" aria-hidden="true"></span>Stage ${stage.n} <span class="ar" lang="ar" dir="rtl">${stage.ar}</span></h3>
            <ol class="map-stops" role="list">${stops}
            </ol>
          </li>`;
    })
    .join("");

  return `
      <details class="map" id="map" open>
        <summary class="map-summary">
          <h2 class="map-title" id="mapTitle">Curriculum map</h2>
          <span class="map-sub">${cur.semesters.length} semesters · ${totalEcts} ECTS · ${withPdf} of ${entries.length} modules uploaded</span>
          ${chevron}
        </summary>
        <div class="map-body">
          <ol class="map-route" role="list">${stations}
          </ol>
          <ul class="legend" role="list"><li><span class="legend-dot is-on" aria-hidden="true"></span>PDF available</li><li><span class="legend-dot" aria-hidden="true"></span>Not uploaded yet</li></ul>
        </div>
      </details>`;
}

// ---------- pixel mark ----------
// One small pixel-art page (the library's mark), drawn as SVG rects so it stays crisp at any
// size. Shared by the page header and favicon.svg. '#' ink, '=' text lines, '+' accent ribbon.
const MARK = [
  "..##########....",
  "..#........##...",
  "..#.++.....#.#..",
  "..#.++.....####.",
  "..#.++........#.",
  "..#.+..======.#.",
  "..#...........#.",
  "..#.========..#.",
  "..#...........#.",
  "..#.======....#.",
  "..#...........#.",
  "..#.=========.#.",
  "..#...........#.",
  "..#.=====.....#.",
  "..#...........#.",
  "..#############.",
];

function markRects(classFor) {
  const rects = [];
  MARK.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects.push(classFor(ch, x, y));
    })
  );
  return rects.join("");
}

function renderMark() {
  // Each pixel gets one of 8 delay buckets so the mark "assembles" in a dissolve on load.
  // Classes, not inline styles: the CSP forbids style attributes.
  const kind = { "#": "ink", "=": "line", "+": "accent" };
  const rects = markRects((ch, x, y) => `<rect class="px ${kind[ch]} d${(x * 7 + y * 13) % 8}" x="${x}" y="${y}" width="1" height="1"/>`);
  return `<svg class="mark" viewBox="0 0 16 16" width="64" height="64" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${rects}</svg>`;
}

function renderFavicon() {
  const fill = { "#": "#1C1A17", "=": "#5C574E", "+": "#1F6B45" };
  const rects = markRects((ch, x, y) => `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill[ch]}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="12" height="15" fill="#F6F3EC"/>${rects}</svg>\n`;
}

function build() {
  const stages = scan();
  const cur = loadCurriculum();
  linkCurriculum(cur, stages);
  // Curriculum order (by module code) reads like the timetable; unmatched files go last.
  for (const t of stages.flatMap((st) => st.terms)) {
    t.files.sort((a, b) => (a.module?.code ?? "~" + a.name).localeCompare(b.module?.code ?? "~" + b.name, "en"));
  }
  const files = stages.flatMap((s) => s.terms.flatMap((t) => t.files));
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalPages = files.reduce((sum, f) => sum + (f.pages || 0), 0);
  const stagesWithFiles = stages.filter((s) => s.terms.some((t) => t.files.length)).length;

  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        stages: stages.map(({ n, ar, terms }) => ({ n, ar, terms: terms.map(({ n: tn, ar: tar }) => ({ n: tn, ar: tar })) })),
        files: files.map(({ id, name, path, href, size, pages, cover, stage, term, module }) => ({ id, name, path, href, size, pages, cover, stage, term, code: module?.code ?? null }))
      },
      null,
      2
    ) + "\n"
  );

  // Pages caches assets for 10 minutes; a content hash in the URL stops new HTML pairing with stale CSS/JS.
  const version = (file) => createHash("sha256").update(readFileSync(join(ROOT, file))).digest("hex").slice(0, 10);

  const replacements = {
    "{{CSS_V}}": version("styles.css"),
    "{{JS_V}}": version("script.js"),
    "{{FILE_COUNT}}": String(files.length),
    "{{TOTAL_SIZE}}": formatSize(totalSize),
    "{{TOTAL_PAGES}}": totalPages.toLocaleString("en"),
    "{{STAGE_NAV}}": renderStageNav(stages),
    "{{MAP}}": renderMap(cur, stages),
    "{{MARK}}": renderMark(),
    "{{LIBRARY}}": stages.map((s) => renderStage(s, cur)).join("\n"),
    "{{REPO_URL}}": REPO_URL
  };

  let html = readFileSync(TEMPLATE, "utf8");
  for (const [token, value] of Object.entries(replacements)) html = html.split(token).join(value);

  // Pages can't send headers, so the CSP is a <meta>. Hashing every executable inline script here
  // means editing the head script can never silently break the policy (see docs/qa.md).
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const hashes = inline.map((code) => `'sha256-${createHash("sha256").update(code).digest("base64")}'`).join(" ");
  const csp = `default-src 'none'; script-src 'self' ${hashes}; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests`;
  html = html.replace("{{CSP}}", `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  const leftover = html.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) throw new Error(`Unreplaced template token ${leftover[0]}`);
  writeFileSync(join(ROOT, "index.html"), html);
  writeFileSync(join(ROOT, "favicon.svg"), renderFavicon());

  console.log(`Built ${files.length} files across ${stagesWithFiles} stages (${formatSize(totalSize)}, ${totalPages} pages).`);
  if (!HAS_POPPLER) console.log("  note: poppler-utils not found; new PDFs get no page count or cover");
}

build();
