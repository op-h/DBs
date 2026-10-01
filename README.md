# Cyber Security Library

Course PDFs for the Cyber Security department, organised by stage and semester.

**Live site:** https://op-h.github.io/DBs/

Search any course, filter by stage, then tap a course to open it or download it. Each course shows
its cover, page count and size, and large files are marked so you can wait for Wi-Fi. Works on
phones and desktops, in light and dark mode, and without JavaScript.

## Adding or removing a PDF

Just put the PDF in the right folder and push (or upload it on github.com):

```
المرحلة الاولى/          Stage 1
  الكورس الاول/           Semester 1
    Course Name.pdf      ← the file name is the course name on the site
  الكورس الثاني/          Semester 2
المرحلة الثانية/          Stage 2
المرحلة الثالثة/          Stage 3
المرحلة الرابعة/          Stage 4
```

A GitHub Action (`.github/workflows/update-library.yml`) rebuilds the page, the covers and the
sizes automatically and republishes the site, usually within two minutes. You don't need to run
anything on your computer.

- github.com's upload page accepts files up to 25 MB. Push bigger files with git or GitHub
  Desktop. GitHub rejects anything over 100 MB, so compress those first.
- To check the Action, open the repository's **Actions** tab and look at "Update library".

### Building locally (optional)

```sh
node tools/build.mjs
```

This needs Node 18+ and `poppler-utils` (for page counts and covers). It writes `index.html`,
`covers/` and `data/library.json`.

## How it is built

There's no framework and nothing to install for the site itself. `index.html` is generated from
`tools/template.html`, so the whole library is real HTML. `script.js` only adds search and the
stage filter, and `styles.css` holds the design. The decisions behind it are in [`docs/`](docs/).
