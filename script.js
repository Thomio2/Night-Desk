const STORAGE_KEYS = {
  settings: "nightdesk-settings",
  links: "nightdesk-links-v2",
  todos: "nightdesk-todos",
  notes: "nightdesk-notes",
  theme: "nightdesk-theme",
  layout: "nightdesk-layout-v6",
  layoutV5: "nightdesk-layout-v5",
  layoutV4: "nightdesk-layout-v4",
};

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

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
  }
}

function readStoredList(key, isValidItem) {
  const raw = readStorage(key);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : null;
  } catch (error) {
    return null;
  }
}

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

const MIN_FOCUS_MINUTES = 1;
const MAX_FOCUS_MINUTES = 180;

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(readStorage(STORAGE_KEYS.settings)) || {};
  } catch (error) {
  }

  const loaded = { ...DEFAULT_SETTINGS, ...saved };

  if (!translations[loaded.language]) {
    loaded.language = DEFAULT_SETTINGS.language;
  }
  if (loaded.timeFormat !== "12" && loaded.timeFormat !== "24") {
    loaded.timeFormat = DEFAULT_SETTINGS.timeFormat;
  }
  const minutes = loaded.focusMinutes;
  if (!Number.isInteger(minutes) || minutes < MIN_FOCUS_MINUTES || minutes > MAX_FOCUS_MINUTES) {
    loaded.focusMinutes = DEFAULT_SETTINGS.focusMinutes;
  }
  return loaded;
}

function saveSettings() {
  writeStorage(STORAGE_KEYS.settings, JSON.stringify(settings));
}

let settings = loadSettings();

const clockTime = document.getElementById("clock-time");
const clockSuffix = document.getElementById("clock-suffix");
const dateDisplay = document.getElementById("date");

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

  clockTime.textContent = settings.showSeconds
    ? `${hh}:${mm}:${ss}`
    : `${hh}:${mm}`;
  clockSuffix.textContent = suffix;

  const locale = settings.language === "cs" ? "cs-CZ" : "en-US";
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateDisplay.textContent = now.toLocaleDateString(locale, dateOptions);
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
  { name: "ChatGPT", url: "https://chatgpt.com" },
];

function isValidLink(link) {
  return Boolean(link) && typeof link.name === "string" && typeof link.url === "string";
}

function loadLinks() {
  const stored = readStoredList(STORAGE_KEYS.links, isValidLink);
  if (stored !== null) return stored;

  const seeded = [...STARTER_LINKS];
  writeStorage(STORAGE_KEYS.links, JSON.stringify(seeded));
  return seeded;
}

function saveLinks() {
  writeStorage(STORAGE_KEYS.links, JSON.stringify(links));
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

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "link-delete";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${link.name}`);
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    tile.appendChild(icon);
    tile.appendChild(label);
    tile.appendChild(removeButton);

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

const EDIT_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;

function isValidTodo(todo) {
  return Boolean(todo) && typeof todo.text === "string";
}

function loadTodos() {
  return readStoredList(STORAGE_KEYS.todos, isValidTodo) || [];
}

function saveTodos() {
  writeStorage(STORAGE_KEYS.todos, JSON.stringify(todos));
}

let todos = loadTodos();

function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = todo.text;
    textSpan.addEventListener("click", () => {
      todos[index].completed = !todos[index].completed;
      saveTodos();
      renderTodos();
    });

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "todo-edit";
    editButton.setAttribute("aria-label", "Edit task");
    editButton.innerHTML = EDIT_ICON;
    editButton.addEventListener("click", () => startEditingTodo(index));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-delete";
    deleteButton.setAttribute("aria-label", "Delete task");
    deleteButton.textContent = "x";
    deleteButton.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    li.appendChild(textSpan);
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

  let finished = false;

  function commitEdit() {
    if (finished) return;
    finished = true;

    const newText = input.value.trim();
    if (newText.length > 0) {
      todos[index].text = newText;
      saveTodos();
    }
    renderTodos();
  }

  function cancelEdit() {
    if (finished) return;
    finished = true;
    renderTodos();
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    }
    if (event.key === "Escape") {
      cancelEdit();
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
const timerStartButton = document.getElementById("timer-start");
const timerResetButton = document.getElementById("timer-reset");
const timerMessage = document.getElementById("timer-message");
const timerMinutesInput = document.getElementById("timer-minutes-input");
const timerSetButton = document.getElementById("timer-minutes-apply");

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
  timerStartButton.textContent = "Start";
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

timerStartButton.addEventListener("click", () => {
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
  timerStartButton.textContent = "Pause";
});

timerResetButton.addEventListener("click", resetTimer);

function applyCustomMinutes() {
  const value = Math.round(Number(timerMinutesInput.value));
  if (!value || value < MIN_FOCUS_MINUTES) return;

  settings.focusMinutes = Math.min(value, MAX_FOCUS_MINUTES);
  saveSettings();
  resetTimer();
  timerMinutesInput.value = "";
}

timerSetButton.addEventListener("click", applyCustomMinutes);
timerMinutesInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyCustomMinutes();
  }
});

updateTimerDisplay();

const notesArea = document.getElementById("notes-area");

notesArea.value = readStorage(STORAGE_KEYS.notes) || "";

notesArea.addEventListener("input", () => {
  writeStorage(STORAGE_KEYS.notes, notesArea.value);
});

const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "Light" : "Dark";
}

const savedTheme = readStorage(STORAGE_KEYS.theme) === "light" ? "light" : "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  writeStorage(STORAGE_KEYS.theme, next);
});

const canvas = document.getElementById("canvas");
const widgets = {
  links: document.getElementById("links-widget"),
  todo: document.getElementById("todo-widget"),
  timer: document.getElementById("timer-widget"),
  notes: document.getElementById("notes-widget"),
};
const dashboard = document.querySelector(".dashboard");
const hero = document.getElementById("hero");

const MIN_WIDGET_WIDTH = 220;
const MIN_WIDGET_HEIGHT = 160;
const WIDGET_GAP = 20;

function isFreeCanvas() {
  return getComputedStyle(canvas).position === "fixed";
}

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
    v5: {
      x: dashRect.left + padLeft - canvasRect.left,
      y: dashRect.top + padTop - canvasRect.top,
    },
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
    const raw = readStorage(STORAGE_KEYS.layout);
    if (raw) {
      const saved = JSON.parse(raw);
      if (isValidLayout(saved)) return saved;
    }

    const origins = getLegacyOrigins();
    const legacy = [
      [STORAGE_KEYS.layoutV5, origins.v5],
      [STORAGE_KEYS.layoutV4, origins.v4],
    ];
    for (const [key, origin] of legacy) {
      const oldRaw = readStorage(key);
      if (!oldRaw) continue;
      const old = JSON.parse(oldRaw);
      if (isValidLayout(old)) {
        const migrated = shiftLayout(old, origin);
        writeStorage(STORAGE_KEYS.layout, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (error) {
  }
  return null;
}

function saveLayout() {
  writeStorage(STORAGE_KEYS.layout, JSON.stringify(layout));
}

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

function startPointerAction(event, id, getNewRect) {
  if (event.button !== 0) return;
  event.preventDefault();

  const canvasRect = canvas.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const startRect = { ...layout[id] };

  function onMove(moveEvent) {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    layout[id] = clampRect(getNewRect(startRect, dx, dy), canvasRect);
    applyLayout();
  }

  function onUp() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    saveLayout();
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function makeDraggable(id) {
  const header = widgets[id].querySelector(".widget-header");

  header.addEventListener("pointerdown", (event) => {
    startPointerAction(event, id, (rect, dx, dy) => ({
      ...rect,
      x: rect.x + dx,
      y: rect.y + dy,
    }));
  });
}

function makeResizable(id) {
  const handle = widgets[id].querySelector(".resize-handle");

  handle.addEventListener("pointerdown", (event) => {
    startPointerAction(event, id, (rect, dx, dy) => ({
      ...rect,
      w: rect.w + dx,
      h: rect.h + dy,
    }));
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
const showSecondsCheckbox = document.getElementById("setting-seconds");
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

const widgetVisibilityKeys = {
  links: "showLinks",
  todo: "showTodo",
  timer: "showTimer",
  notes: "showNotes",
};

function applyVisibility() {
  Object.keys(widgets).forEach((id) => {
    const isVisible = settings[widgetVisibilityKeys[id]];
    widgets[id].classList.toggle("is-hidden", !isVisible);
  });
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

function bindSetting(input, key, onChange) {
  const property = input.type === "checkbox" ? "checked" : "value";

  input[property] = settings[key];

  input.addEventListener("change", () => {
    settings[key] = input[property];
    saveSettings();
    onChange();
  });
}

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

bindSetting(languageSelect, "language", applyLanguage);
bindSetting(timeFormatSelect, "timeFormat", updateClock);
bindSetting(showSecondsCheckbox, "showSeconds", updateClock);
bindSetting(showLinksCheckbox, "showLinks", applyVisibility);
bindSetting(showTodoCheckbox, "showTodo", applyVisibility);
bindSetting(showTimerCheckbox, "showTimer", applyVisibility);
bindSetting(showNotesCheckbox, "showNotes", applyVisibility);

applyLanguage();
applyVisibility();
