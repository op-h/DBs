# Cyber Security Library

Course PDFs for the Cyber Security department, organised by stage and semester.

**Live site:** https://op-h.github.io/DBs/

- **Curriculum map** at the top shows all 4 stages and 8 semesters from the official curriculum
  (codes, ECTS, module type) and links each module straight to its PDF.
- **Library** below: stages fold open, and each lecture opens into a preview with its cover,
  curriculum details, Open and Download.
- Search by name, module code (e.g. `CSTE2103`) or Arabic name, or filter by stage.

It works on phones and desktops, in light and dark mode, and without JavaScript.

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

To show its curriculum details (code, ECTS and so on), the PDF's name, without `.pdf`, must
appear as `"file"` on its module in `data/curriculum.json`. The Action log warns about any PDF that
isn't linked.

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
