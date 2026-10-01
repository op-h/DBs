#!/usr/bin/env node
// Scans the stage/semester folders and writes index.html, covers/*.webp and data/library.json.
// Run after adding or removing PDFs:  node tools/build.mjs
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

const has = (cmd) => {
  try {
    execFileSync(cmd, ["-v"], { stdio: "ignore" });
    return true;
  } catch (error) {
    // pdfinfo -v exits non-zero on some versions but still exists.
    return error.code !== "ENOENT";
  }
};
const HAS_PDFINFO = has("pdfinfo");
const HAS_MAGICK = has("magick");

const cache = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { files: [] };
const cachedPages = new Map(cache.files.map((f) => [f.path, f.pages]));

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

function readPages(absPath, relPath) {
  if (HAS_PDFINFO) {
    try {
      const out = execFileSync("pdfinfo", [absPath], { encoding: "utf8" });
      const match = out.match(/^Pages:\s+(\d+)/m);
      if (match) return Number(match[1]);
    } catch {
      // Fall through to the cached value; a damaged PDF should not break the build.
    }
  }
  return cachedPages.get(relPath) ?? null;
}

function makeCover(absPath, slug, pdfMtime) {
  const out = join(COVERS, `${slug}.webp`);
  const rel = `covers/${slug}.webp`;
  if (existsSync(out) && statSync(out).mtimeMs >= pdfMtime) return rel;
  if (!HAS_MAGICK) return existsSync(out) ? rel : null;
  try {
    // Top-anchored crop keeps the title block, which is what students recognise.
    execFileSync("magick", [
      "-density", "72", `${absPath}[0]`,
      "-background", "white", "-alpha", "remove", "-alpha", "off",
      "-resize", "240x", "-gravity", "north", "-extent", "240x320",
      "-strip", "-quality", "62", out
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
        term.files.push({
          id: slug,
          name,
          path: relPath,
          href: toHref(relPath),
          size: stat.size,
          pages: readPages(absPath, relPath),
          cover: makeCover(absPath, slug, stat.mtimeMs),
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
  const live = new Set(stages.flatMap((s) => s.terms.flatMap((t) => t.files.map((f) => `${f.id}.webp`))));
  for (const file of readdirSync(COVERS)) {
    if (!live.has(file)) rmSync(join(COVERS, file));
  }

  return stages;
}

// ---------- markup ----------

function renderCourse(file) {
  const size = formatSize(file.size);
  const large = file.size >= LARGE_FILE_BYTES;
  const pages = file.pages ? `${file.pages.toLocaleString("en")} pages` : "";
  // "stage1"/"semester2" are single words so script.js can match them without a bare number
  // leaking across fields; the Arabic folder names let students search in Arabic too.
  const search = `${file.name} stage${file.stage} semester${file.term} ${STAGES[file.stage - 1]} ${TERMS[file.term - 1]}`.toLowerCase();
  const cover = file.cover
    ? `<img class="course-cover" src="${file.cover}" width="120" height="160" alt="" loading="lazy" decoding="async">`
    : `<span class="course-cover course-cover--empty" aria-hidden="true">PDF</span>`;

  const name = escapeHtml(file.name);

  // One open link per course (the visible Open button), so the title stays plain text and
  // keyboard users get Open → Download → Share. See docs/decisions/0002-team-rulings.md.
  return `
          <li class="course" id="${file.id}" data-stage="${file.stage}" data-term="${file.term}" data-search="${escapeHtml(search)}">
            ${cover}
            <div class="course-body">
              <h4 class="course-title">${name}</h4>
              <p class="course-meta">${pages ? `<span>${pages}</span><span class="visually-hidden">, </span>` : ""}<span>${size}</span>${large ? '<span class="visually-hidden">, </span><span class="stamp">Large file</span>' : ""}</p>
              <div class="course-actions">
                <a class="btn btn--primary" href="${file.href}" type="application/pdf" target="_blank" rel="noopener" aria-describedby="newTabHint">Open<span class="visually-hidden"> ${name}</span></a>
                <a class="btn" href="${file.href}" type="application/pdf" download="${escapeHtml(file.name)}.pdf">Download<span class="visually-hidden"> ${name}, ${size}</span></a>
                <button class="btn btn--icon share" type="button" data-share="${file.id}" aria-label="Share link to ${name}"><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"/></svg></button>
              </div>
            </div>
          </li>`;
}

function renderTerm(stage, term) {
  const id = `stage-${stage.n}-sem-${term.n}`;
  const body = term.files.length
    ? `<ul class="course-list" role="list">${term.files.map(renderCourse).join("")}
        </ul>`
    : `<p class="term-empty">No material uploaded yet.</p>`;
  // No accessible name on purpose: eight extra "region" landmarks would bury the useful ones.
  return `
      <section class="term" data-term="${term.n}">
        <h3 class="term-title" id="${id}">Semester ${term.n} <span class="ar" lang="ar" dir="rtl">${term.ar}</span></h3>
        ${body}
      </section>`;
}

function renderStage(stage) {
  const files = stage.terms.flatMap((t) => t.files);
  const size = files.reduce((sum, f) => sum + f.size, 0);
  const meta = files.length ? `${files.length} files · ${formatSize(size)}` : "Coming soon";
  const terms = files.length
    ? stage.terms.map((t) => renderTerm(stage, t)).join("")
    : `
      <p class="stage-empty">No material uploaded yet. Check back later.</p>`;
  return `
    <section class="stage" id="stage-${stage.n}" data-stage="${stage.n}" aria-labelledby="stage-${stage.n}-title">
      <header class="stage-head">
        <h2 class="stage-title" id="stage-${stage.n}-title">Stage ${stage.n} <span class="ar" lang="ar" dir="rtl">${stage.ar}</span></h2>
        <p class="stage-meta">${meta}</p>
      </header>${terms}
    </section>`;
}

function renderStageNav(stages) {
  return stages
    .map((s) => {
      const count = s.terms.reduce((n, t) => n + t.files.length, 0);
      return `<li><a href="#stage-${s.n}">Stage ${s.n} <span class="count">${count}<span class="visually-hidden"> ${count === 1 ? "file" : "files"}</span></span></a></li>`;
    })
    .join("\n          ");
}

function build() {
  const stages = scan();
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
        files: files.map(({ id, name, path, href, size, pages, cover, stage, term }) => ({ id, name, path, href, size, pages, cover, stage, term }))
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
    "{{LIBRARY}}": stages.map(renderStage).join("\n"),
    "{{REPO_URL}}": REPO_URL
  };

  let html = readFileSync(TEMPLATE, "utf8");
  for (const [token, value] of Object.entries(replacements)) html = html.split(token).join(value);

  // Pages can't send headers, so the CSP is a <meta>. Hashing every executable inline script here
  // means editing the head script can never silently break the policy (see docs/qa.md).
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const hashes = inline.map((code) => `'sha256-${createHash("sha256").update(code).digest("base64")}'`).join(" ");
  const csp = `default-src 'none'; script-src 'self' ${hashes}; style-src 'self'; img-src 'self' data:; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests`;
  html = html.replace("{{CSP}}", `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  const leftover = html.match(/\{\{[A-Z_]+\}\}/);
  if (leftover) throw new Error(`Unreplaced template token ${leftover[0]}`);
  writeFileSync(join(ROOT, "index.html"), html);

  console.log(`Built ${files.length} files across ${stagesWithFiles} stages (${formatSize(totalSize)}, ${totalPages} pages).`);
  if (!HAS_PDFINFO) console.log("  note: pdfinfo not found; page counts came from data/library.json");
  if (!HAS_MAGICK) console.log("  note: ImageMagick not found; new PDFs will have no cover");
}

build();
