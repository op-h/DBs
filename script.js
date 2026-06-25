const rawFiles = [
  { path: "المرحلة الاولى\\الكورس الاول\\Democracy & Human Rights.pdf", size: 4634333 },
  { path: "المرحلة الاولى\\الكورس الاول\\Engineering Drawing.pdf", size: 1230264 },
  { path: "المرحلة الاولى\\الكورس الاول\\Fundamental of Electrical Eng .pdf", size: 9311125 },
  { path: "المرحلة الاولى\\الكورس الاول\\Introduction to Information System.pdf", size: 3159371 },
  { path: "المرحلة الاولى\\الكورس الاول\\Mathematics 1.pdf", size: 2920205 },
  { path: "المرحلة الاولى\\الكورس الاول\\Programming Essentials.pdf", size: 3149121 },
  { path: "المرحلة الاولى\\الكورس الثاني\\Arabic Language 1.pdf", size: 2483873 },
  { path: "المرحلة الاولى\\الكورس الثاني\\Digital Logic Design .pdf", size: 4936185 },
  { path: "المرحلة الاولى\\الكورس الثاني\\Engineering Workshops.pdf", size: 3293525 },
  { path: "المرحلة الاولى\\الكورس الثاني\\English Language 1.pdf", size: 30503117 },
  { path: "المرحلة الاولى\\الكورس الثاني\\Ethics for the Information Age.pdf", size: 4461164 },
  { path: "المرحلة الاولى\\الكورس الثاني\\General Physics .pdf", size: 7507673 },
  { path: "المرحلة الاولى\\الكورس الثاني\\Mathematics 2.pdf", size: 2244208 },
  { path: "المرحلة الثانية\\الكورس الاول\\Computer Organization & Architecture.pdf", size: 7486329 },
  { path: "المرحلة الثانية\\الكورس الاول\\Data Structure & Algorithms.pdf", size: 2104721 },
  { path: "المرحلة الثانية\\الكورس الاول\\Electronics Fundamentals.pdf", size: 2227045 },
  { path: "المرحلة الثانية\\الكورس الاول\\Engineering Mathematics.pdf", size: 2249644 },
  { path: "المرحلة الثانية\\الكورس الاول\\Linux Essentials.pdf", size: 12535921 },
  { path: "المرحلة الثانية\\الكورس الاول\\The Crimes of the Baath regime in Iraq.pdf", size: 8593614 },
  { path: "المرحلة الثانية\\الكورس الثاني\\Communication Fundamentals.pdf", size: 5365727 },
  { path: "المرحلة الثانية\\الكورس الثاني\\English Language 2.pdf", size: 54444525 },
  { path: "المرحلة الثانية\\الكورس الثاني\\Introduction to Database -SQL.pdf", size: 476456 },
  { path: "المرحلة الثانية\\الكورس الثاني\\Microprocessors.pdf", size: 3808488 },
  { path: "المرحلة الثانية\\الكورس الثاني\\Numerical Analysis & Statistics.pdf", size: 2505132 },
  { path: "المرحلة الثانية\\الكورس الثاني\\Object Oriented Programming.pdf", size: 6446779 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Computer Networks.pdf", size: 3913563 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Digital Forensics.pdf", size: 4515671 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Digital Signal Processing.pdf", size: 5399568 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Information Security and Cryptography.pdf", size: 3508175 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Python.pdf", size: 2606625 },
  { path: "المرحلة الثالثة\\الكورس الاول\\Software Engineering.pdf", size: 2281244 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\Artificial Intelligence.pdf", size: 5834477 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\CyberSecurity Essentials.pdf", size: 1131553 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\Information theory and coding.pdf", size: 4392568 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\Network Protocols.pdf", size: 5298877 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\Operating System.pdf", size: 31133896 },
  { path: "المرحلة الثالثة\\الكورس الثاني\\Web Design.pdf", size: 4591748 }
];

const stageOrder = ["المرحلة الاولى", "المرحلة الثانية", "المرحلة الثالثة", "المرحلة الرابعة"];
const courseOrder = ["الكورس الاول", "الكورس الثاني"];

const state = {
  search: "",
  stage: "All",
  course: "All",
  selectedFolder: null
};

const files = rawFiles.map((file) => {
  const cleanPath = file.path.replace(/\\/g, "/");
  const parts = cleanPath.split("/");
  const name = parts.at(-1).replace(/\.pdf$/i, "").trim();
  const stage = parts[0];
  const course = parts[1];

  return {
    ...file,
    path: cleanPath,
    href: encodeURI(cleanPath),
    name,
    stage,
    course,
    folderKey: `${stage}|||${course}`,
    searchable: `${name} ${stage} ${course}`.toLowerCase()
  };
});

const folders = stageOrder.flatMap((stage) =>
  courseOrder.map((course) => {
    const folderFiles = files.filter((file) => file.stage === stage && file.course === course);
    const size = folderFiles.reduce((sum, file) => sum + file.size, 0);

    return {
      key: `${stage}|||${course}`,
      stage,
      course,
      files: folderFiles,
      size,
      searchable: `${stage} ${course} ${folderFiles.map((file) => file.name).join(" ")}`.toLowerCase()
    };
  })
).filter((folder) => folder.files.length > 0);

const elements = {
  searchInput: document.querySelector("#searchInput"),
  stageFilters: document.querySelector("#stageFilters"),
  courseFilters: document.querySelector("#courseFilters"),
  folderGrid: document.querySelector("#folderGrid"),
  resourceGrid: document.querySelector("#resourceGrid"),
  resultsMeta: document.querySelector(".results-meta"),
  resultsCount: document.querySelector("#resultsCount"),
  emptyState: document.querySelector("#emptyState"),
  clearFilters: document.querySelector("#clearFilters"),
  selectedFolder: document.querySelector("#selectedFolder"),
  selectedFolderTitle: document.querySelector("#selectedFolderTitle"),
  closeFolder: document.querySelector("#closeFolder")
};

function formatSize(bytes) {
  if (bytes === 0) {
    return "Empty";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function createChip(label, value, type, count) {
  const button = document.createElement("button");
  button.className = "chip";
  button.type = "button";
  button.textContent = count === undefined ? label : `${label} (${count})`;
  button.dataset.value = value;
  button.setAttribute("aria-pressed", String(state[type] === value));

  if (state[type] === value) {
    button.classList.add("is-active");
  }

  button.addEventListener("click", () => {
    state[type] = value;
    state.selectedFolder = null;
    render();
  });

  return button;
}

function renderFilters() {
  const stageCounts = new Map(stageOrder.map((stage) => [stage, 0]));
  const courseCounts = new Map(courseOrder.map((course) => [course, 0]));

  folders.forEach((folder) => {
    if (folder.files.length > 0) {
      stageCounts.set(folder.stage, (stageCounts.get(folder.stage) || 0) + 1);
      courseCounts.set(folder.course, (courseCounts.get(folder.course) || 0) + 1);
    }
  });

  const visibleStages = stageOrder.filter((stage) => (stageCounts.get(stage) || 0) > 0);

  elements.stageFilters.replaceChildren(
    createChip("All", "All", "stage", folders.length),
    ...visibleStages.map((stage) => createChip(stage, stage, "stage", stageCounts.get(stage) || 0))
  );

  elements.courseFilters.replaceChildren(
    createChip("All", "All", "course", courseOrder.length),
    ...courseOrder.map((course) => createChip(course, course, "course", courseCounts.get(course) || 0))
  );
}

function getFilteredFolders() {
  const search = state.search.trim().toLowerCase();

  return folders.filter((folder) => {
    const matchesSearch = !search || folder.searchable.includes(search);
    const matchesStage = state.stage === "All" || folder.stage === state.stage;
    const matchesCourse = state.course === "All" || folder.course === state.course;
    return matchesSearch && matchesStage && matchesCourse;
  });
}

function createFolderCard(folder) {
  const article = document.createElement("article");
  article.className = "folder-card";

  article.innerHTML = `
    <div class="folder-top">
      <div>
        <h3 class="folder-title"></h3>
        <div class="path-line"></div>
      </div>
      <span class="folder-icon" aria-hidden="true">DIR</span>
    </div>
    <div class="card-meta">
      <span class="meta-pill"></span>
      <span class="meta-pill"></span>
    </div>
    <div class="folder-actions">
      <button class="open-folder" type="button">Open folder</button>
      <span class="folder-note"></span>
    </div>
  `;

  article.querySelector(".folder-title").textContent = `${folder.stage} ---> ${folder.course}`;
  article.querySelector(".path-line").textContent = folder.files.length
    ? `${folder.files.length} PDF material files`
    : "No files yet";

  const pills = article.querySelectorAll(".meta-pill");
  pills[0].textContent = folder.stage;
  pills[1].textContent = folder.course;
  article.querySelector(".folder-note").textContent = formatSize(folder.size);

  article.querySelector(".open-folder").addEventListener("click", () => {
    state.selectedFolder = folder.key;
    renderSelectedFolder();
    elements.selectedFolder.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return article;
}

function createResourceCard(file) {
  const article = document.createElement("article");
  article.className = "resource-card";

  article.innerHTML = `
    <div class="card-top">
      <div>
        <h3 class="file-title"></h3>
        <div class="path-line"></div>
      </div>
      <span class="file-icon" aria-hidden="true">PDF</span>
    </div>
    <div class="card-meta">
      <span class="meta-pill"></span>
      <span class="meta-pill"></span>
    </div>
    <div class="card-actions">
      <a class="open-link" target="_blank" rel="noopener">Open</a>
      <a class="download-link" download>Download</a>
    </div>
  `;

  article.querySelector(".file-title").textContent = file.name;
  article.querySelector(".path-line").textContent = `${file.stage} / ${file.course}`;

  const pills = article.querySelectorAll(".meta-pill");
  pills[0].textContent = formatSize(file.size);
  pills[1].textContent = "PDF";

  const [openLink, downloadLink] = article.querySelectorAll("a");
  openLink.href = file.href;
  openLink.setAttribute("aria-label", `Open ${file.name}`);
  downloadLink.href = file.href;
  downloadLink.setAttribute("aria-label", `Download ${file.name}`);

  return article;
}

function renderFolders() {
  const filtered = getFilteredFolders();
  elements.folderGrid.replaceChildren(...filtered.map(createFolderCard));
  elements.folderGrid.hidden = Boolean(state.selectedFolder);
  elements.emptyState.hidden = filtered.length > 0 || Boolean(state.selectedFolder);
  elements.resultsMeta.hidden = Boolean(state.selectedFolder);
  elements.resultsCount.textContent = `Showing ${filtered.length} folders`;

  if (state.selectedFolder && !filtered.some((folder) => folder.key === state.selectedFolder)) {
    state.selectedFolder = null;
  }
}

function renderSelectedFolder() {
  const folder = folders.find((item) => item.key === state.selectedFolder);

  if (!folder) {
    elements.selectedFolder.hidden = true;
    elements.folderGrid.hidden = false;
    elements.resultsMeta.hidden = false;
    elements.resourceGrid.replaceChildren();
    return;
  }

  elements.folderGrid.hidden = true;
  elements.resultsMeta.hidden = true;
  elements.selectedFolder.hidden = false;
  elements.selectedFolderTitle.textContent = `${folder.stage} ---> ${folder.course}`;
  elements.resourceGrid.replaceChildren(...folder.files.map(createResourceCard));
}

function render() {
  renderFilters();
  renderFolders();
  renderSelectedFolder();
}

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  state.selectedFolder = null;
  renderFolders();
  renderSelectedFolder();
});

elements.clearFilters.addEventListener("click", () => {
  state.search = "";
  state.stage = "All";
  state.course = "All";
  state.selectedFolder = null;
  elements.searchInput.value = "";
  render();
});

elements.closeFolder.addEventListener("click", () => {
  state.selectedFolder = null;
  renderSelectedFolder();
  document.querySelector("#library").scrollIntoView({ behavior: "smooth", block: "start" });
});

render();
