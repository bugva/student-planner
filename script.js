// Basit veri yapıları (tarayıcıda saklanacak)
let state = {
  tasks: [],
  exams: [],
  topics: [],
};

// LocalStorage'tan yükle
function loadState() {
  const raw = localStorage.getItem("student-assistant-state");
  if (!raw) return;
  try {
    state = JSON.parse(raw);
  } catch (e) {
    console.error("Veri okunamadı:", e);
  }
}

// LocalStorage'a kaydet
function saveState() {
  localStorage.setItem("student-assistant-state", JSON.stringify(state));
}

// Yardımcı: Tarihi güzel göster
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

// Görevleri çiz
function renderTasks() {
  const container = document.getElementById("task-list");
  container.innerHTML = "";

  if (state.tasks.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;font-size:13px;">Henüz görev yok.</p>';
    return;
  }

  state.tasks
    .slice()
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    .forEach((task, index) => {
      const div = document.createElement("div");
      div.className = "item";

      const main = document.createElement("div");
      main.className = "item-main";

      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = task.title;

      const sub = document.createElement("div");
      sub.className = "item-sub";

      const courseBadge = `<span class="badge badge-pill">${task.course}</span>`;
      const due = task.dueDate
        ? `<span class="badge ${
            task.overdue ? "badge-danger" : "badge-pill"
          }">Son: ${formatDate(task.dueDate)}</span>`
        : "";

      sub.innerHTML = `${courseBadge} ${due}`;

      main.appendChild(title);
      main.appendChild(sub);

      const btn = document.createElement("button");
      btn.className = "small-btn" + (task.completed ? " done" : "");
      btn.textContent = task.completed ? "Tamamlandı" : "Bitti";
      btn.addEventListener("click", () => {
        state.tasks[index].completed = !state.tasks[index].completed;
        saveState();
        updateDerived();
        renderTasks();
      });

      div.appendChild(main);
      div.appendChild(btn);

      container.appendChild(div);
    });
}

// Sınavları çiz
function renderExams() {
  const container = document.getElementById("exam-list");
  container.innerHTML = "";

  if (state.exams.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;font-size:13px;">Henüz sınav yok.</p>';
    return;
  }

  state.exams
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((exam) => {
      const div = document.createElement("div");
      div.className = "item";

      const main = document.createElement("div");
      main.className = "item-main";

      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `${exam.course} - ${exam.title}`;

      const sub = document.createElement("div");
      sub.className = "item-sub";

      const daysLeft = exam.daysLeft;
      let text = `Tarih: ${formatDate(exam.date)}`;
      if (typeof daysLeft === "number") {
        if (daysLeft > 0) text += ` • ${daysLeft} gün kaldı`;
        else if (daysLeft === 0) text += " • Bugün!";
        else text += ` • ${Math.abs(daysLeft)} gün önceydi`;
      }

      sub.textContent = text;

      main.appendChild(title);
      main.appendChild(sub);
      div.appendChild(main);

      container.appendChild(div);
    });
}

// Konuları çiz
function renderTopics() {
  const container = document.getElementById("topic-list");
  container.innerHTML = "";

  if (state.topics.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;font-size:13px;">Henüz konu eklenmedi.</p>';
    return;
  }

  state.topics
    .slice()
    .sort((a, b) =>
      a.priority === b.priority ? 0 : a.priority === "yüksek" ? -1 : 1
    )
    .forEach((topic, index) => {
      const div = document.createElement("div");
      div.className = "item";

      const main = document.createElement("div");
      main.className = "item-main";

      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = topic.title;

      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.innerHTML = `<span class="badge badge-pill">${topic.course}</span>
        <span class="badge badge-pill">${topic.priority} öncelik</span>`;

      main.appendChild(title);
      main.appendChild(sub);

      const btn = document.createElement("button");
      btn.className = "small-btn";
      btn.textContent = "Çözüldü";
      btn.addEventListener("click", () => {
        state.topics.splice(index, 1);
        saveState();
        renderTopics();
      });

      div.appendChild(main);
      div.appendChild(btn);
      container.appendChild(div);
    });
}

// Tarihe göre ek bilgileri hesapla
function updateDerived() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  state.tasks.forEach((t) => {
    if (!t.dueDate) {
      t.overdue = false;
      return;
    }
    const d = new Date(t.dueDate + "T00:00:00");
    d.setHours(0, 0, 0, 0);
    t.overdue = d < today && !t.completed;
  });

  state.exams.forEach((e) => {
    const d = new Date(e.date + "T00:00:00");
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    e.daysLeft = diff;
  });
}

// Formları bağla
function setupForms() {
  // Görev formu
  const taskForm = document.getElementById("task-form");
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const course = document.getElementById("task-course").value.trim();
    const title = document.getElementById("task-title").value.trim();
    const due = document.getElementById("task-due").value;

    if (!course || !title) return;

    state.tasks.push({
      course,
      title,
      dueDate: due || null,
      completed: false,
      overdue: false,
    });

    saveState();
    updateDerived();
    renderTasks();

    taskForm.reset();
  });

  // Sınav formu
  const examForm = document.getElementById("exam-form");
  examForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const course = document.getElementById("exam-course").value.trim();
    const title = document.getElementById("exam-title").value.trim();
    const date = document.getElementById("exam-date").value;

    if (!course || !title || !date) return;

    state.exams.push({ course, title, date, daysLeft: null });
    saveState();
    updateDerived();
    renderExams();

    examForm.reset();
  });

  // Konu formu
  const topicForm = document.getElementById("topic-form");
  topicForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const course = document.getElementById("topic-course").value.trim();
    const title = document.getElementById("topic-title").value.trim();
    const priority = document.getElementById("topic-priority").value;

    if (!course || !title) return;

    state.topics.push({ course, title, priority });
    saveState();
    renderTopics();

    topicForm.reset();
  });
}

// Başlat
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateDerived();
  setupTabs();
  setupForms();
  renderTasks();
  renderExams();
  renderTopics();
});