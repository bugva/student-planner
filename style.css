:root {
  --bg: #020617;
  --card: #020617;
  --accent: #38bdf8;
  --accent-soft: rgba(56, 189, 248, 0.16);
  --text: #e5e7eb;
  --muted: #9ca3af;
  --danger: #f97373;
  --radius: 16px;
  --padding: 16px;
  --shadow: 0 18px 45px rgba(15, 23, 42, 0.9);
  --font-main: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "Segoe UI", sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-main);
  background: radial-gradient(circle at top, #1f2937 0, #020617 55%, #000 100%);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.94), transparent);
  padding: 14px 18px 6px;
}

.app-header h1 {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Tabs */

.tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px 10px;
}

.tab-button {
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 10px 0;
  font-size: 14px;
  background: rgba(15, 23, 42, 0.85);
  color: var(--muted);
  cursor: pointer;
  transition: 0.18s all ease-out;
}

.tab-button.active {
  background: linear-gradient(135deg, var(--accent), #6366f1);
  color: #0b1120;
  font-weight: 600;
  box-shadow: 0 10px 28px rgba(56, 189, 248, 0.4);
}

/* Content */

main {
  padding: 0 16px 24px;
}

h2 {
  font-size: 18px;
  margin: 6px 0 10px;
}

h3 {
  font-size: 15px;
  margin: 6px 0 8px;
}

.tab {
  display: none;
}

.tab.active {
  display: block;
}

/* Cards / layout */

.card {
  background: radial-gradient(circle at top left, #111827 0, #020617 70%);
  border-radius: var(--radius);
  padding: var(--padding);
  box-shadow: var(--shadow);
  border: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 16px;
}

.courses-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 800px) {
  .courses-layout {
    flex-direction: row;
  }
}

.courses-sidebar {
  flex: 0 0 260px;
}

.course-detail {
  flex: 1;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* Buttons / inputs */

.small-accent-btn {
  border: none;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: linear-gradient(135deg, var(--accent), #6366f1);
  color: #0b1120;
  box-shadow: 0 10px 25px rgba(56, 189, 248, 0.45);
}

label {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--muted);
}

input,
select,
textarea {
  width: 100%;
  margin-top: 4px;
  padding: 9px 11px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.9);
  color: var(--text);
  font-size: 14px;
  resize: vertical;
}

/* Lists & items */

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(15, 23, 42, 0.96);
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
}

.item-sub {
  font-size: 12px;
  color: var(--muted);
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

.badge-pill {
  background: var(--accent-soft);
  color: var(--accent);
}

.badge-pin {
  background: rgba(234, 179, 8, 0.18);
  color: #facc15;
}

.small-btn {
  border: none;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.9);
  color: var(--muted);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.small-btn.danger {
  border-color: rgba(248, 113, 113, 0.7);
  color: var(--danger);
}

/* Courses */

.course-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.course-item {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.95);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-item.active {
  border-color: var(--accent);
  background: radial-gradient(circle at top left, #0f172a 0, #020617 70%);
}

.course-name {
  flex: 1;
}

.course-actions {
  display: flex;
  gap: 4px;
}

/* Details */

.detail-section {
  margin-top: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.muted-text {
  color: var(--muted);
  font-size: 12px;
}

.hidden {
  display: none;
}

/* GPA */

.gpa-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gpa-course-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.gpa-course-form label {
  flex: 1 1 120px;
}

.gpa-summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
}

.gpa-value {
  font-size: 20px;
  font-weight: 600;
}

/* Schedule */

#schedule-list .item-sub {
  font-size: 12px;
}
