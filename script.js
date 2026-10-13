console.log("NightDesk script loaded.");

const translations = {
  en: {
    links: "Quick Links",
    todo: "To-Do",
    timer: "Focus Timer",
    notes: "Notes",
  },
  cs: {
    links: "Rychlé odkazy",
    todo: "Úkoly",
    timer: "Časovač soustředění",
    notes: "Poznámky",
  },
};

const SETTINGS_KEY = "nightdesk-settings";

const DEFAULT_SETTINGS = {
  language: "en",
  timeFormat: "24",
  showSeconds: true,
  focusMinutes: 10,
  showLinks: true,
  showTodo: true,
  showTimer: true,
  showNotes: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_SETTINGS };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

let settings = loadSettings();

if (!translations[settings.language]) {
  settings.language = DEFAULT_SETTINGS.language;
}

const clockTimeEl = document.getElementById("clock-time");
const clockSuffixEl = document.getElementById("clock-suffix");
const dateEl = document.getElementById("date");

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  let suffix = "";

  if (settings.timeFormat === "12") {
    suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
  }

  const hh = String(hours).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  clockTimeEl.textContent = settings.showSeconds
    ? `${hh}:${mm}:${ss}`
    : `${hh}:${mm}`;
  clockSuffixEl.textContent = suffix;

  const locale = settings.language === "cs" ? "cs-CZ" : "en-US";
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateEl.textContent = now.toLocaleDateString(locale, dateOptions);
}

updateClock();
setInterval(updateClock, 1000);

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query.length === 0) return;

  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.location.href = url;
});

const STARTER_LINKS = [
  { name: "GitHub", url: "https://github.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Discord", url: "https://discord.com" },
  { name: "ChatGPT", url: "https://chat.openai.com" },
];

const LINKS_STORAGE_KEY = "nightdesk-links-v2";

function loadLinks() {
  const raw = localStorage.getItem(LINKS_STORAGE_KEY);
  if (raw === null) {
    const seeded = [...STARTER_LINKS];
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw);
}

function saveLinks() {
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
}

let links = loadLinks();

const linksGrid = document.getElementById("links-grid");
const addLinkButton = document.getElementById("add-link-button");

function firstLetter(name) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "?";
}

function renderLinks() {
  linksGrid.querySelectorAll(".link-tile:not(.add-link-tile)").forEach((el) => {
    el.remove();
  });

  links.forEach((link, index) => {
    const tile = document.createElement("a");
    tile.className = "link-tile";
    tile.href = link.url;
    tile.target = "_blank";
    tile.rel = "noopener";

    const icon = document.createElement("span");
    icon.className = "link-icon";
    icon.textContent = firstLetter(link.name);

    const label = document.createElement("span");
    label.className = "link-label";
    label.textContent = link.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "link-delete";
    removeBtn.textContent = "x";
    removeBtn.setAttribute("aria-label", `Remove ${link.name}`);
    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    tile.appendChild(icon);
    tile.appendChild(label);
    tile.appendChild(removeBtn);

    linksGrid.insertBefore(tile, addLinkButton);
  });
}

renderLinks();

addLinkButton.addEventListener("click", () => {
  const name = window.prompt("Link name (e.g. Gmail):");
  if (name === null) return;
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return;

  const urlInput = window.prompt("URL (e.g. https://gmail.com):");
  if (urlInput === null) return;
  let url = urlInput.trim();
  if (url.length === 0) return;

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  links.push({ name: trimmedName, url });
  saveLinks();
  renderLinks();
});

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

const TODO_STORAGE_KEY = "nightdesk-todos";

const EDIT_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;

function loadTodos() {
  const raw = localStorage.getItem(TODO_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTodos() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

let todos = loadTodos();

function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text;
    span.addEventListener("click", () => {
      todos[index].completed = !todos[index].completed;
      saveTodos();
      renderTodos();
    });

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "todo-edit";
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.innerHTML = EDIT_ICON;
    editBtn.addEventListener("click", () => startEditingTodo(index));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "todo-delete";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.textContent = "x";
    deleteBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

function startEditingTodo(index) {
  const li = todoList.children[index];
  if (!li) return;

  li.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "todo-edit-input";
  input.value = todos[index].text;
  li.appendChild(input);
  input.focus();
  input.select();

  function commitEdit() {
    const newText = input.value.trim();
    if (newText.length > 0) {
      todos[index].text = newText;
      saveTodos();
    }
    renderTodos();
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    }
    if (event.key === "Escape") {
      renderTodos();
    }
  });

  input.addEventListener("blur", commitEdit);
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (text.length === 0) return;

  todos.push({ text, completed: false });
  saveTodos();
  renderTodos();
  todoInput.value = "";
});

renderTodos();

const timerDisplay = document.getElementById("timer-display");
const timerStartBtn = document.getElementById("timer-start");
const timerResetBtn = document.getElementById("timer-reset");
const timerMessage = document.getElementById("timer-message");
const timerMinutesInput = document.getElementById("timer-minutes-input");
const timerMinutesApply = document.getElementById("timer-minutes-apply");

let secondsLeft = settings.focusMinutes * 60;
let timerInterval = null;
let endTime = 0;
let isRunning = false;

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(secondsLeft);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timerStartBtn.textContent = "Start";
}

function resetTimer() {
  stopTimer();
  secondsLeft = settings.focusMinutes * 60;
  updateTimerDisplay();
  timerMessage.textContent = "";
}

function tick() {
  secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  updateTimerDisplay();

  if (secondsLeft === 0) {
    stopTimer();
    timerMessage.textContent = "Focus session complete!";
  }
}

timerStartBtn.addEventListener("click", () => {
  if (isRunning) {
    stopTimer();
    return;
  }

  if (secondsLeft <= 0) {
    resetTimer();
  }

  timerMessage.textContent = "";
  endTime = Date.now() + secondsLeft * 1000;
  timerInterval = setInterval(tick, 250);
  isRunning = true;
  timerStartBtn.textContent = "Pause";
});

timerResetBtn.addEventListener("click", resetTimer);

function applyCustomMinutes() {
  const value = Math.round(Number(timerMinutesInput.value));
  if (!value || value < 1) return;

  settings.focusMinutes = Math.min(Math.max(value, 1), 180);
  saveSettings();
  resetTimer();
  timerMinutesInput.value = "";
}

timerMinutesApply.addEventListener("click", applyCustomMinutes);
timerMinutesInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyCustomMinutes();
  }
});

updateTimerDisplay();

const notesArea = document.getElementById("notes-area");
const NOTES_STORAGE_KEY = "nightdesk-notes";

notesArea.value = localStorage.getItem(NOTES_STORAGE_KEY) || "";

notesArea.addEventListener("input", () => {
  localStorage.setItem(NOTES_STORAGE_KEY, notesArea.value);
});

const themeToggle = document.getElementById("theme-toggle");
const THEME_STORAGE_KEY = "nightdesk-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "Light" : "Dark";
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
});

const canvas = document.getElementById("canvas");
const widgets = {
  links: document.getElementById("links-widget"),
  todo: document.getElementById("todo-widget"),
  timer: document.getElementById("timer-widget"),
  notes: document.getElementById("notes-widget"),
};

const LAYOUT_STORAGE_KEY = "nightdesk-layout-v6";
const V5_LAYOUT_STORAGE_KEY = "nightdesk-layout-v5";
const V4_LAYOUT_STORAGE_KEY = "nightdesk-layout-v4";
const MIN_WIDGET_WIDTH = 220;
const MIN_WIDGET_HEIGHT = 160;
const WIDGET_GAP = 20;

const dashboard = document.querySelector(".dashboard");
const hero = document.getElementById("hero");

// Na širokých obrazovkách je plátno přilepené k celému oknu (position: fixed),
// na úzkých leží ve stránce pod hodinami (position: static).
function isFreeCanvas() {
  return getComputedStyle(canvas).position === "fixed";
}

// Starší verze ukládaly pozice od jiného počátku než dnešní plátno.
// Tahle funkce vrátí, kde ten starý počátek leží v dnešních souřadnicích.
function getLegacyOrigins() {
  if (!isFreeCanvas()) {
    return { v4: { x: 0, y: 0 }, v5: { x: 0, y: 0 } };
  }

  const canvasRect = canvas.getBoundingClientRect();
  const dashRect = dashboard.getBoundingClientRect();
  const heroRect = hero.getBoundingClientRect();
  const style = getComputedStyle(dashboard);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const gap = parseFloat(style.rowGap) || 0;

  return {
    // v5: plátno začínalo uvnitř odsazení panelu .dashboard
    v5: {
      x: dashRect.left + padLeft - canvasRect.left,
      y: dashRect.top + padTop - canvasRect.top,
    },
    // v4: plátno začínalo hned pod hodinami
    v4: {
      x: dashRect.left + padLeft - canvasRect.left,
      y: heroRect.bottom + gap - canvasRect.top,
    },
  };
}

function isValidLayout(data) {
  return Boolean(
    data &&
      Object.keys(widgets).every((id) => {
        const r = data[id];
        return r && [r.x, r.y, r.w, r.h].every(Number.isFinite);
      })
  );
}

function shiftLayout(data, origin) {
  const shifted = {};
  Object.keys(widgets).forEach((id) => {
    shifted[id] = { ...data[id], x: data[id].x + origin.x, y: data[id].y + origin.y };
  });
  return shifted;
}

function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (isValidLayout(saved)) return saved;
    }

    // Migrace ze starších verzí (nejdřív novější v5, pak v4).
    // Staré záznamy se nemažou.
    const origins = getLegacyOrigins();
    const legacy = [
      [V5_LAYOUT_STORAGE_KEY, origins.v5],
      [V4_LAYOUT_STORAGE_KEY, origins.v4],
    ];
    for (const [key, origin] of legacy) {
      const oldRaw = localStorage.getItem(key);
      if (!oldRaw) continue;
      const old = JSON.parse(oldRaw);
      if (isValidLayout(old)) {
        const migrated = shiftLayout(old, origin);
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (error) {
    // Poškozená uložená data: použije se výchozí rozložení.
  }
  return null;
}

function saveLayout() {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

// Výchozí rozložení vypadá stejně jako dřív: mřížka 2x2 pod hodinami.
function defaultLayout() {
  const rect = canvas.getBoundingClientRect();
  let area = { x: 0, y: 0, w: rect.width, h: rect.height };

  if (isFreeCanvas()) {
    const origin = getLegacyOrigins().v4;
    const style = getComputedStyle(dashboard);
    const padRight = parseFloat(style.paddingRight) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;
    area = {
      x: origin.x,
      y: origin.y,
      w: rect.width - origin.x - padRight,
      h: rect.height - origin.y - padBottom,
    };
  }

  const width = Math.max(area.w, MIN_WIDGET_WIDTH * 2 + WIDGET_GAP);
  const height = Math.max(area.h, MIN_WIDGET_HEIGHT * 2 + WIDGET_GAP);

  const colWidth = (width - WIDGET_GAP) / 2;
  const rowHeight = (height - WIDGET_GAP) / 2;
  const col2 = area.x + colWidth + WIDGET_GAP;
  const row2 = area.y + rowHeight + WIDGET_GAP;

  return {
    links: { x: area.x, y: area.y, w: colWidth, h: rowHeight },
    todo: { x: col2, y: area.y, w: colWidth, h: rowHeight },
    timer: { x: area.x, y: row2, w: colWidth, h: rowHeight },
    notes: { x: col2, y: row2, w: colWidth, h: rowHeight },
  };
}

let layout = loadLayout() || defaultLayout();

function clampRect(rect, canvasRect) {
  const w = Math.min(Math.max(rect.w, MIN_WIDGET_WIDTH), canvasRect.width);
  const h = Math.min(Math.max(rect.h, MIN_WIDGET_HEIGHT), canvasRect.height);
  const x = Math.min(Math.max(rect.x, 0), Math.max(0, canvasRect.width - w));
  const y = Math.min(Math.max(rect.y, 0), Math.max(0, canvasRect.height - h));
  return { x, y, w, h };
}

function applyLayout() {
  const canvasRect = canvas.getBoundingClientRect();

  Object.keys(widgets).forEach((id) => {
    layout[id] = clampRect(layout[id], canvasRect);
    const el = widgets[id];
    el.style.left = `${layout[id].x}px`;
    el.style.top = `${layout[id].y}px`;
    el.style.width = `${layout[id].w}px`;
    el.style.height = `${layout[id].h}px`;
  });
}

applyLayout();
window.addEventListener("resize", applyLayout);

function makeDraggable(id) {
  const el = widgets[id];
  const header = el.querySelector(".widget-header");

  header.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    const canvasRect = canvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = { ...layout[id] };

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      layout[id] = clampRect(
        { ...startRect, x: startRect.x + dx, y: startRect.y + dy },
        canvasRect
      );
      applyLayout();
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      saveLayout();
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

function makeResizable(id) {
  const el = widgets[id];
  const handle = el.querySelector(".resize-handle");

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const canvasRect = canvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = { ...layout[id] };

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      layout[id] = clampRect(
        { ...startRect, w: startRect.w + dx, h: startRect.h + dy },
        canvasRect
      );
      applyLayout();
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      saveLayout();
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

Object.keys(widgets).forEach((id) => {
  makeDraggable(id);
  makeResizable(id);
});

const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const languageSelect = document.getElementById("setting-language");
const timeFormatSelect = document.getElementById("setting-time-format");
const secondsCheckbox = document.getElementById("setting-seconds");
const showLinksCheckbox = document.getElementById("setting-show-links");
const showTodoCheckbox = document.getElementById("setting-show-todo");
const showTimerCheckbox = document.getElementById("setting-show-timer");
const showNotesCheckbox = document.getElementById("setting-show-notes");

function applyLanguage() {
  document.documentElement.lang = settings.language === "cs" ? "cs" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = translations[settings.language][el.dataset.i18n];
  });

  updateClock();
}

function applyVisibility() {
  widgets.links.classList.toggle("is-hidden", !settings.showLinks);
  widgets.todo.classList.toggle("is-hidden", !settings.showTodo);
  widgets.timer.classList.toggle("is-hidden", !settings.showTimer);
  widgets.notes.classList.toggle("is-hidden", !settings.showNotes);
  applyLayout();
}

function openSettings() {
  settingsPanel.hidden = false;
  settingsToggle.setAttribute("aria-expanded", "true");
}

function closeSettings() {
  settingsPanel.hidden = true;
  settingsToggle.setAttribute("aria-expanded", "false");
}

languageSelect.value = settings.language;
timeFormatSelect.value = settings.timeFormat;
secondsCheckbox.checked = settings.showSeconds;
showLinksCheckbox.checked = settings.showLinks;
showTodoCheckbox.checked = settings.showTodo;
showTimerCheckbox.checked = settings.showTimer;
showNotesCheckbox.checked = settings.showNotes;

settingsToggle.addEventListener("click", () => {
  if (settingsPanel.hidden) {
    openSettings();
  } else {
    closeSettings();
  }
});

document.addEventListener("click", (event) => {
  if (!settingsPanel.hidden && !event.target.closest(".settings")) {
    closeSettings();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !settingsPanel.hidden) {
    closeSettings();
    settingsToggle.focus();
  }
});

languageSelect.addEventListener("change", () => {
  settings.language = languageSelect.value;
  saveSettings();
  applyLanguage();
});

timeFormatSelect.addEventListener("change", () => {
  settings.timeFormat = timeFormatSelect.value;
  saveSettings();
  updateClock();
});

secondsCheckbox.addEventListener("change", () => {
  settings.showSeconds = secondsCheckbox.checked;
  saveSettings();
  updateClock();
});

showLinksCheckbox.addEventListener("change", () => {
  settings.showLinks = showLinksCheckbox.checked;
  saveSettings();
  applyVisibility();
});

showTodoCheckbox.addEventListener("change", () => {
  settings.showTodo = showTodoCheckbox.checked;
  saveSettings();
  applyVisibility();
});

showTimerCheckbox.addEventListener("change", () => {
  settings.showTimer = showTimerCheckbox.checked;
  saveSettings();
  applyVisibility();
});

showNotesCheckbox.addEventListener("change", () => {
  settings.showNotes = showNotesCheckbox.checked;
  saveSettings();
  applyVisibility();
});

applyLanguage();
applyVisibility();