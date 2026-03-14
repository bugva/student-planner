// Uygulama durumu
let state = {
  courses: [], // {id, name, notes, resources:[{id,title,url,pinned}]}
  gpaRecords: [], // {year, term, courses:[{name,credit,grade}]}
  schedule: [], // {id, course, day, time}
  selectedCourseId: null,
};

function loadState() {
  const raw = localStorage.getItem("uni-assistant-state");
  if (!raw) return;
  try {
    state = JSON.parse(raw);
  } catch (e) {
    console.error("Veri okunamadı:", e);
  }
}

function saveState() {
  localStorage.setItem("uni-assistant-state", JSON.stringify(state));
}

// Yardımcı fonksiyonlar
function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function findCourse(id) {
  return state.courses.find((c) => c.id === id) || null;
}

// Sekmeler
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const tabs = document.querySelectorAll(".tab");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));

      btn.classList.add("active");
      const id = btn.dataset.tab;
      document.getElementById(id).classList.add("active");
    });
  });
}

// DERSLER BÖLÜMÜ

function renderCourseList() {
  const container = document.getElementById("course-list");
  container.innerHTML = "";

  if (state.courses.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Henüz ders eklemedin. Sağ üstten "+ Ders" ile ekle.</p>';
    return;
  }

  state.courses.forEach((course) => {
    const div = document.createElement("div");
    div.className =
      "course-item" +
      (course.id === state.selectedCourseId ? " active" : "");
    div.addEventListener("click", () => selectCourse(course.id));

    const nameDiv = document.createElement("div");
    nameDiv.className = "course-name";
    nameDiv.textContent = course.name;

    const actions = document.createElement("div");
    actions.className = "course-actions";

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(`"${course.name}" dersini silmek istiyor musun?`)) return;
      state.courses = state.courses.filter((c) => c.id !== course.id);
      if (state.selectedCourseId === course.id) {
        state.selectedCourseId = null;
      }
      saveState();
      renderCourseList();
      renderCourseDetail();
    });

    actions.appendChild(delBtn);
    div.appendChild(nameDiv);
    div.appendChild(actions);
    container.appendChild(div);
  });
}

function selectCourse(id) {
  state.selectedCourseId = id;
  saveState();
  renderCourseList();
  renderCourseDetail();
}

function renderCourseDetail() {
  const noSel = document.getElementById("no-course-selected");
  const content = document.getElementById("course-content");

  if (!state.selectedCourseId) {
    noSel.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }

  const course = findCourse(state.selectedCourseId);
  if (!course) {
    noSel.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }

  noSel.classList.add("hidden");
  content.classList.remove("hidden");

  document.getElementById("course-title").textContent = course.name;
  document.getElementById("course-notes").value = course.notes || "";
  renderResources(course);
}

function renderResources(course) {
  const container = document.getElementById("resource-list");
  container.innerHTML = "";

  if (!course.resources || course.resources.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Bu derse henüz kaynak eklemedin.</p>';
    return;
  }

  const sorted = course.resources.slice().sort((a, b) => {
    if (a.pinned === b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  sorted.forEach((res) => {
    const div = document.createElement("div");
    div.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = res.title;

    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.innerHTML = `
      ${res.pinned ? '<span class="badge badge-pin">Pinned</span>' : ""}
      ${res.url ? `<a href="${res.url}" target="_blank" style="color:#38bdf8;">Bağlantı</a>` : ""}
    `;

    main.appendChild(title);
    main.appendChild(sub);

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "4px";

    const pinBtn = document.createElement("button");
    pinBtn.className = "small-btn";
    pinBtn.textContent = res.pinned ? "Unpin" : "Pin";
    pinBtn.addEventListener("click", () => {
      res.pinned = !res.pinned;
      saveState();
      renderResources(course);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", () => {
      course.resources = course.resources.filter((r) => r.id !== res.id);
      saveState();
      renderResources(course);
    });

    btns.appendChild(pinBtn);
    btns.appendChild(delBtn);

    div.appendChild(main);
    div.appendChild(btns);
    container.appendChild(div);
  });
}

function setupCourses() {
  document
    .getElementById("add-course-btn")
    .addEventListener("click", () => {
      const name = prompt("Ders adı (ör: Matematik 1):");
      if (!name) return;
      const c = {
        id: uuid(),
        name: name.trim(),
        notes: "",
        resources: [],
      };
      state.courses.push(c);
      state.selectedCourseId = c.id;
      saveState();
      renderCourseList();
      renderCourseDetail();
    });

  document
    .getElementById("save-notes-btn")
    .addEventListener("click", () => {
      const course = findCourse(state.selectedCourseId);
      if (!course) return;
      course.notes = document.getElementById("course-notes").value;
      saveState();
      alert("Notlar kaydedildi.");
    });

  document
    .getElementById("add-resource-btn")
    .addEventListener("click", () => {
      const course = findCourse(state.selectedCourseId);
      if (!course) return;
      const title = prompt("Kaynak adı (ör: Hafta 3 slayt):");
      if (!title) return;
      const url = prompt(
        "Link (Google Drive, PDF, okul sistemi linki; boş bırakabilirsin):"
      );
      course.resources.push({
        id: uuid(),
        title: title.trim(),
        url: url ? url.trim() : "",
        pinned: false,
      });
      saveState();
      renderResources(course);
    });
}

// GPA BÖLÜMÜ

const gradeMap = {
  AA: 4.0,
  BA: 3.5,
  BB: 3.0,
  CB: 2.5,
  CC: 2.0,
  DC: 1.5,
  DD: 1.0,
  FF: 0.0,
};

function getTermKey(year, term) {
  return `${year}-${term}`;
}

function getOrCreateTermRecord(year, term) {
  const key = getTermKey(year, term);
  let rec = state.gpaRecords.find((r) => r.key === key);
  if (!rec) {
    rec = { key, year, term, courses: [] };
    state.gpaRecords.push(rec);
  }
  return rec;
}

function renderGpaCourseList() {
  const year = document.getElementById("gpa-year").value;
  const term = document.getElementById("gpa-term").value;
  const key = getTermKey(year, term);
  const rec = state.gpaRecords.find((r) => r.key === key);

  const container = document.getElementById("gpa-courses-list");
  container.innerHTML = "";

  if (!rec || rec.courses.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Bu dönem için henüz ders eklemedin.</p>';
    document.getElementById("term-gpa").textContent = "-";
    renderCumulativeGpa();
    return;
  }

  rec.courses.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = c.name;

    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = `${c.credit} kredi • ${c.grade}`;

    main.appendChild(title);
    main.appendChild(sub);

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", () => {
      rec.courses.splice(idx, 1);
      saveState();
      renderGpaCourseList();
    });

    div.appendChild(main);
    div.appendChild(delBtn);
    container.appendChild(div);
  });

  const termGpa = calculateTermGpa(rec.courses);
  document.getElementById("term-gpa").textContent =
    termGpa !== null ? termGpa.toFixed(2) : "-";

  renderCumulativeGpa();
}

function calculateTermGpa(courses) {
  let totalPoints = 0;
  let totalCredits = 0;
  courses.forEach((c) => {
    const gradeVal = gradeMap[c.grade];
    if (gradeVal === undefined) return;
    totalPoints += gradeVal * c.credit;
    totalCredits += c.credit;
  });
  if (totalCredits === 0) return null;
  return totalPoints / totalCredits;
}

function renderCumulativeGpa() {
  let allCourses = [];
  state.gpaRecords.forEach((r) => {
    allCourses = allCourses.concat(r.courses);
  });
  const g = calculateTermGpa(allCourses);
  document.getElementById("cumulative-gpa").textContent =
    g !== null ? g.toFixed(2) : "-";
}

function setupGpa() {
  document
    .getElementById("gpa-year")
    .addEventListener("change", renderGpaCourseList);
  document
    .getElementById("gpa-term")
    .addEventListener("change", renderGpaCourseList);

  const form = document.getElementById("gpa-course-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const year = document.getElementById("gpa-year").value;
    const term = document.getElementById("gpa-term").value;
    const name = document.getElementById("gpa-course-name").value.trim();
    const credit = parseFloat(
      document.getElementById("gpa-course-credit").value
    );
    const grade = document.getElementById("gpa-course-grade").value;

    if (!name || !credit || !grade) return;

    const rec = getOrCreateTermRecord(year, term);
    rec.courses.push({ name, credit, grade });

    saveState();
    form.reset();
    renderGpaCourseList();
  });
}

// ZAMANLAYICI BÖLÜMÜ

function renderSchedule() {
  const container = document.getElementById("schedule-list");
  container.innerHTML = "";

  if (state.schedule.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Henüz ders zamanlaması eklemedin.</p>';
    return;
  }

  const daysOrder = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
  ];

  const sorted = state.schedule.slice().sort((a, b) => {
    const dDiff =
      daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
    if (dDiff !== 0) return dDiff;
    return a.time.localeCompare(b.time);
  });

  sorted.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.course;

    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = `${item.day} • ${item.time}`;

    main.appendChild(title);
    main.appendChild(sub);

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", () => {
      state.schedule = state.schedule.filter((s) => s.id !== item.id);
      saveState();
      renderSchedule();
    });

    div.appendChild(main);
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

function setupSchedule() {
  const form = document.getElementById("schedule-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const course = document.getElementById("schedule-course").value.trim();
    const day = document.getElementById("schedule-day").value;
    const time = document.getElementById("schedule-time").value;

    if (!course || !day || !time) return;

    state.schedule.push({
      id: uuid(),
      course,
      day,
      time,
    });

    saveState();
    form.reset();
    renderSchedule();
  });
}

// Başlat

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setupTabs();
  setupCourses();
  setupGpa();
  setupSchedule();
  renderCourseList();
  renderCourseDetail();
  renderGpaCourseList();
  renderSchedule();
});
