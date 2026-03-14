// Uygulama durumu
let state = {
  courses: [], // {id, name, notes, resources:[{id,title,url,pinned}], tasks:[{id,title,done}], studySeconds}
  gpaRecords: [], // {key, year, term, courses:[{name,credit,grade}]}
  schedule: [], // {id, course, day, time}
  todos: [], // {id,title,date,done}
  selectedCourseId: null,
  theme: "dark",
};

let timerInterval = null;

function loadState() {
  const raw = localStorage.getItem("uni-assistant-state");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state = {
      ...state,
      ...parsed,
    };
    state.courses = (state.courses || []).map((c) => ({
      id: c.id,
      name: c.name,
      notes: c.notes || "",
      resources: c.resources || [],
      tasks: c.tasks || [],
      studySeconds: typeof c.studySeconds === "number" ? c.studySeconds : 0,
    }));
    state.todos = state.todos || [];
    state.theme = state.theme || "dark";
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

function formatDuration(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h} sa ${m} dk`;
  if (m > 0) return `${m} dk ${ss} sn`;
  return `${ss} sn`;
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function compareDateToToday(dateStr) {
  if (!dateStr) return 0;
  const t = new Date(todayISO() + "T00:00:00");
  const d = new Date(dateStr + "T00:00:00");
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - t) / (1000 * 60 * 60 * 24));
  return diff; // <0 geçmiş, 0 bugün, >0 gelecek
}

// Tema

function applyTheme() {
  const body = document.body;
  body.classList.remove("theme-dark", "theme-light");
  if (state.theme === "light") {
    body.classList.add("theme-light");
    document.getElementById("theme-toggle").textContent = "☼ Açık";
  } else {
    body.classList.add("theme-dark");
    document.getElementById("theme-toggle").textContent = "☾ Koyu";
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });
  applyTheme();
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
      stopTimer();
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
  stopTimer();
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
  renderCourseTasks(course);
  renderTimerDisplay(course);
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
      ${
        res.url
          ? `<a href="${res.url}" target="_blank" style="color:#38bdf8;">Bağlantı</a>`
          : ""
      }
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

function renderCourseTasks(course) {
  const container = document.getElementById("course-tasks-list");
  container.innerHTML = "";

  if (!course.tasks || course.tasks.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Bu ders için henüz görev eklemedin.</p>';
    return;
  }

  course.tasks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "item" + (t.done ? " todo-done" : "");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = t.title;

    const sub = document.createElement("div");
    sub.className = "item-sub muted-text";
    sub.textContent = t.done ? "Tamamlandı" : "Bekliyor";

    main.appendChild(title);
    main.appendChild(sub);

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "4px";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "small-btn";
    toggleBtn.textContent = t.done ? "Geri Al" : "Bitti";
    toggleBtn.addEventListener("click", () => {
      t.done = !t.done;
      saveState();
      renderCourseTasks(course);
    });

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", () => {
      course.tasks = course.tasks.filter((x) => x.id !== t.id);
      saveState();
      renderCourseTasks(course);
    });

    btns.appendChild(toggleBtn);
    btns.appendChild(delBtn);

    div.appendChild(main);
    div.appendChild(btns);
    container.appendChild(div);
  });
}

function renderTimerDisplay(course) {
  const display = document.getElementById("course-timer-display");
  display.textContent = formatDuration(course.studySeconds || 0);
}

// Timer kontrolü
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const btn = document.getElementById("course-timer-toggle");
  if (btn) btn.textContent = "Başlat";
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
        tasks: [],
        studySeconds: 0,
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

  document
    .getElementById("add-course-task-btn")
    .addEventListener("click", () => {
      const course = findCourse(state.selectedCourseId);
      if (!course) return;
      const title = prompt("Görev (ör: Türev tekrar, 2023 çıkmış sorular):");
      if (!title) return;
      course.tasks.push({
        id: uuid(),
        title: title.trim(),
        done: false,
      });
      saveState();
      renderCourseTasks(course);
    });

  const timerToggle = document.getElementById("course-timer-toggle");
  const timerReset = document.getElementById("course-timer-reset");

  timerToggle.addEventListener("click", () => {
    const course = findCourse(state.selectedCourseId);
    if (!course) return;
    if (timerInterval) {
      stopTimer();
      saveState();
      return;
    }
    timerToggle.textContent = "Durdur";
    timerInterval = setInterval(() => {
      course.studySeconds = (course.studySeconds || 0) + 1;
      renderTimerDisplay(course);
      saveState();
    }, 1000);
  });

  timerReset.addEventListener("click", () => {
    const course = findCourse(state.selectedCourseId);
    if (!course) return;
    if (!confirm("Bu dersin çalışma süresi sıfırlansın mı?")) return;
    course.studySeconds = 0;
    stopTimer();
    saveState();
    renderTimerDisplay(course);
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

function numericToLetter(avg) {
  if (avg >= 90) return "AA";
  if (avg >= 85) return "BA";
  if (avg >= 80) return "BB";
  if (avg >= 75) return "CB";
  if (avg >= 70) return "CC";
  if (avg >= 65) return "DC";
  if (avg >= 60) return "DD";
  return "FF";
}

function askNumber(message, allowEmpty = false) {
  const input = prompt(message);
  if (input === null) return null;
  if (allowEmpty && input.trim() === "") return "";
  const num = Number(input.replace(",", "."));
  if (Number.isNaN(num)) {
    alert("Lütfen sayısal bir değer gir.");
    return askNumber(message, allowEmpty);
  }
  return num;
}

function openExamCalculator() {
  alert(
    "Vize / final notuna ve yüzdelik ağırlıklara göre ders notu hesaplayacağız.\n" +
      "Örnek: Vize %40, Final %60 gibi."
  );

  const mid = askNumber("Vize notu (0-100):");
  if (mid === null) return null;

  const midW = askNumber("Vize yüzdesi (%):");
  if (midW === null) return null;

  const fin = askNumber("Final notu (0-100):");
  if (fin === null) return null;

  const finW = askNumber("Final yüzdesi (%):");
  if (finW === null) return null;

  const extra = askNumber(
    "İsterseniz ek değerlendirme (quiz, ödev) notu (0-100) girin, boş bırakabilirsiniz:",
    true
  );
  let extraW = 0;
  if (extra !== null && extra !== "") {
    extraW = askNumber("Bu ek değerlendirmenin yüzdesi (%):");
    if (extraW === null) return null;
  }

  const totalW = midW + finW + extraW;
  if (totalW <= 0) {
    alert("Yüzdelerin toplamı 0 olamaz.");
    return null;
  }

  if (Math.abs(totalW - 100) > 0.001) {
    if (
      !confirm(
        "Yüzdelerin toplamı " +
          totalW +
          "%. Yine de bu değerlerle hesaplama yapılsın mı?"
      )
    ) {
      return null;
    }
  }

  const midPart = (mid * midW) / totalW;
  const finPart = (fin * finW) / totalW;
  const extraPart =
    extra !== "" && extra !== null ? (extra * extraW) / totalW : 0;

  const avg = midPart + finPart + extraPart;
  const letter = numericToLetter(avg);

  return { numeric: avg, letter };
}

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
    renderGpaStats();
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
    sub.className = "item-sub muted-text";
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
  renderGpaStats();
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

function renderGpaStats() {
  let allCourses = [];
  state.gpaRecords.forEach((r) => {
    allCourses = allCourses.concat(r.courses);
  });
  let totalCredits = 0;
  let passed = 0;
  let failed = 0;
  allCourses.forEach((c) => {
    totalCredits += c.credit;
    const val = gradeMap[c.grade];
    if (val > 0) passed++;
    else failed++;
  });

  const el = document.getElementById("gpa-stats");
  if (allCourses.length === 0) {
    el.textContent = "Henüz hiç ders notu eklemedin.";
    return;
  }
  el.textContent = `Toplam kredi: ${totalCredits.toFixed(
    1
  )} • Geçilen ders: ${passed} • Kalan ders: ${failed}`;
}

function setupGpa() {
  document
    .getElementById("gpa-year")
    .addEventListener("change", renderGpaCourseList);
  document
    .getElementById("gpa-term")
    .addEventListener("change", renderGpaCourseList);

  const examBtn = document.getElementById("exam-calc-btn");
  if (examBtn) {
    examBtn.addEventListener("click", () => {
      const result = openExamCalculator();
      if (!result) return;
      const gradeSelect = document.getElementById("gpa-course-grade");
      gradeSelect.value = result.letter;
      alert(
        "Hesaplanan ders notu: " +
          result.numeric.toFixed(2) +
          " → " +
          result.letter
      );
    });
  }

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

  document
    .getElementById("backup-export")
    .addEventListener("click", () => {
      const data = JSON.stringify(state, null, 2);
      prompt(
        "Veri JSON'unu kopyalayarak güvenli bir yere kaydedebilirsin:",
        data
      );
    });

  document
    .getElementById("backup-import")
    .addEventListener("click", () => {
      const input = prompt(
        "Daha önce dışa aktardığın JSON verisini buraya yapıştır:"
      );
      if (!input) return;
      try {
        const imported = JSON.parse(input);
        state = {
          ...state,
          ...imported,
        };
        saveState();
        alert("Veri içe aktarıldı.");
        location.reload();
      } catch (e) {
        alert("JSON okunamadı. Yapıştırdığın metni kontrol et.");
      }
    });
}

// ZAMANLAYICI BÖLÜMÜ

function renderScheduleWeek() {
  const container = document.getElementById("schedule-week");
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

  const byDay = {};
  daysOrder.forEach((d) => (byDay[d] = []));

  state.schedule.forEach((item) => {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  });

  daysOrder.forEach((day) => {
    const items = byDay[day];
    const dayDiv = document.createElement("div");
    dayDiv.className = "schedule-day";

    const title = document.createElement("div");
    title.className = "schedule-day-title";
    title.textContent = day;
    dayDiv.appendChild(title);

    if (!items || items.length === 0) {
      const p = document.createElement("p");
      p.className = "muted-text small";
      p.textContent = "Ders yok.";
      dayDiv.appendChild(p);
    } else {
      items
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))
        .forEach((item) => {
          const row = document.createElement("div");
          row.className = "item";
          row.style.marginTop = "4px";

          const main = document.createElement("div");
          main.className = "item-main";

          const t = document.createElement("div");
          t.className = "item-title";
          t.textContent = item.course;

          const sub = document.createElement("div");
          sub.className = "item-sub muted-text";
          sub.textContent = item.time;

          main.appendChild(t);
          main.appendChild(sub);

          const delBtn = document.createElement("button");
          delBtn.className = "small-btn danger";
          delBtn.textContent = "Sil";
          delBtn.addEventListener("click", () => {
            state.schedule = state.schedule.filter((s) => s.id !== item.id);
            saveState();
            renderScheduleWeek();
          });

          row.appendChild(main);
          row.appendChild(delBtn);
          dayDiv.appendChild(row);
        });
    }

    container.appendChild(dayDiv);
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
    renderScheduleWeek();
  });
}

// PLAN / GENEL TODOS

function renderTodos() {
  const container = document.getElementById("todo-list");
  container.innerHTML = "";

  if (!state.todos || state.todos.length === 0) {
    container.innerHTML =
      '<p class="muted-text">Henüz genel yapılacak eklemedin.</p>';
    return;
  }

  const sorted = state.todos
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  sorted.forEach((t) => {
    const div = document.createElement("div");
    div.className = "item" + (t.done ? " todo-done" : "");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = t.title;

    const sub = document.createElement("div");
    sub.className = "item-sub";

    let badge = "";
    if (t.date) {
      const diff = compareDateToToday(t.date);
      if (diff === 0) {
        badge = '<span class="badge badge-today">Bugün</span>';
      } else if (diff < 0) {
        badge =
          '<span class="badge badge-overdue">Geçmiş</span>';
      } else if (diff === 1) {
        badge = '<span class="badge badge-pill">Yarın</span>';
      } else {
        badge = `<span class="badge badge-pill">${t.date}</span>`;
      }
    }

    sub.innerHTML = badge || '<span class="muted-text">Tarih yok</span>';

    main.appendChild(title);
    main.appendChild(sub);

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "4px";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "small-btn";
    toggleBtn.textContent = t.done ? "Geri Al" : "Bitti";
    toggleBtn.addEventListener("click", () => {
      t.done = !t.done;
      saveState();
      renderTodos();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "small-btn danger";
    delBtn.textContent = "Sil";
    delBtn.addEventListener("click", () => {
      state.todos = state.todos.filter((x) => x.id !== t.id);
      saveState();
      renderTodos();
    });

    btns.appendChild(toggleBtn);
    btns.appendChild(delBtn);

    div.appendChild(main);
    div.appendChild(btns);
    container.appendChild(div);
  });
}

function setupTodos() {
  const form = document.getElementById("todo-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("todo-title").value.trim();
    const date = document.getElementById("todo-date").value;
    if (!title) return;
    state.todos.push({
      id: uuid(),
      title,
      date: date || null,
      done: false,
    });
    saveState();
    form.reset();
    renderTodos();
  });
}

// Başlat

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  setupThemeToggle();
  setupTabs();
  setupCourses();
  setupGpa();
  setupSchedule();
  setupTodos();

  renderCourseList();
  renderCourseDetail();
  renderGpaCourseList();
  renderScheduleWeek();
  renderTodos();
});
