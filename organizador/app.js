const STORAGE_KEY = "semesterOrganizer.v1";
const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const SUBJECT_PALETTE = [
  "#d4572b",
  "#1f6f8b",
  "#567b55",
  "#6b4f9c",
  "#c46f8c",
  "#c27b3d",
  "#2f4858",
  "#8b5d3d",
];

const EVENT_TYPE_LABELS = {
  quiz: "Quiz",
  parcial: "Parcial",
  taller: "Taller",
  examen: "Examen",
  tarea: "Tarea",
  entrega: "Entrega",
  otro: "Otro",
};

const EXPORT_VERSION = 1;

const DEFAULT_SCHEDULE_IMAGE = "horario.png";

const refs = {
  subjectForm: document.getElementById("subject-form"),
  subjectName: document.getElementById("subject-name"),
  subjectProfessor: document.getElementById("subject-professor"),
  subjectNotes: document.getElementById("subject-notes"),
  subjectsList: document.getElementById("subjects-list"),
  calendarTitle: document.getElementById("calendar-title"),
  calendarGrid: document.getElementById("calendar-grid"),
  prevMonth: document.getElementById("prev-month"),
  nextMonth: document.getElementById("next-month"),
  selectedDate: document.getElementById("selected-date"),
  eventForm: document.getElementById("event-form"),
  eventDate: document.getElementById("event-date"),
  eventSubject: document.getElementById("event-subject"),
  eventTitle: document.getElementById("event-title"),
  eventType: document.getElementById("event-type"),
  eventsList: document.getElementById("events-list"),
  scheduleImageInput: document.getElementById("schedule-image-input"),
  dayModal: document.getElementById("day-modal"),
  dayModalTitle: document.getElementById("day-modal-title"),
  dayModalBody: document.getElementById("day-modal-body"),
  exportConfig: document.getElementById("export-config"),
  importConfig: document.getElementById("import-config"),
  backupMessage: document.getElementById("backup-message"),
  qrModal: document.getElementById("qr-modal"),
  qrModalTitle: document.getElementById("qr-modal-title"),
  qrExportPanel: document.getElementById("qr-export-panel"),
  qrImportPanel: document.getElementById("qr-import-panel"),
  qrExportMessage: document.getElementById("qr-export-message"),
  qrImportMessage: document.getElementById("qr-import-message"),
  qrCanvas: document.getElementById("qr-canvas"),
  qrReader: document.getElementById("qr-reader"),
  qrExportButton: document.getElementById("qr-export"),
  qrImportButton: document.getElementById("qr-import"),
  scheduleImageRemove: document.getElementById("schedule-image-remove"),
  scheduleImageMessage: document.getElementById("schedule-image-message"),
  schedulePreview: document.getElementById("schedule-preview"),
  screenTitle: document.getElementById("screen-title"),
  backButton: document.getElementById("back-button"),
  screens: document.querySelectorAll(".screen"),
};

let qrScanner = null;

const defaultData = {
  subjects: [],
  events: [],
  scheduleImage: DEFAULT_SCHEDULE_IMAGE,
};

let state = loadData();
let currentMonth = startOfMonth(new Date());
let selectedDate = formatDateInput(new Date());

init();

function init() {
  bindNavigation();
  bindEvents();
  renderAll();
  setActiveScreen("home");
}

function bindNavigation() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger) return;
    const screenId = trigger.dataset.go;
    if (!screenId) return;
    setActiveScreen(screenId);
  });
}

function setActiveScreen(screenId) {
  let activeScreen = null;
  refs.screens.forEach((screen) => {
    const isActive = screen.dataset.screen === screenId;
    screen.classList.toggle("active", isActive);
    if (isActive) activeScreen = screen;
  });

  if (!activeScreen) {
    setActiveScreen("home");
    return;
  }

  refs.screenTitle.textContent =
    activeScreen.dataset.title || "Organizador del semestre";
  refs.backButton.hidden = screenId === "home";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindEvents() {
  refs.subjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = refs.subjectName.value.trim();
    if (!name) return;

    state.subjects.push({
      id: generateId(),
      name,
      professor: refs.subjectProfessor.value.trim(),
      color: colorFromName(name),
      notes: refs.subjectNotes.value.trim(),
    });

    saveData();
    refs.subjectForm.reset();
    renderAll();
  });

  refs.subjectsList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "remove-subject") {
      removeSubject(button.dataset.id);
    }
  });

  refs.prevMonth.addEventListener("click", () => {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    renderCalendar();
  });

  refs.nextMonth.addEventListener("click", () => {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    renderCalendar();
  });

  refs.calendarGrid.addEventListener("click", (event) => {
    const dayButton = event.target.closest(".calendar-day");
    if (!dayButton || !dayButton.dataset.date) return;
    const dateValue = dayButton.dataset.date;
    selectedDate = dateValue;
    refs.eventDate.value = dateValue;

    const dateObj = parseDate(dateValue);
    if (dateObj) {
      currentMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    }
    renderCalendar();
    renderEvents();
    openDayModal(dateValue);
  });

  refs.eventDate.addEventListener("change", () => {
    if (!refs.eventDate.value) return;
    selectedDate = refs.eventDate.value;
    const dateObj = parseDate(selectedDate);
    if (dateObj) {
      currentMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    }
    renderCalendar();
    renderEvents();
  });

  refs.eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = refs.eventDate.value;
    const title = refs.eventTitle.value.trim();
    if (!date || !title) return;

    state.events.push({
      id: generateId(),
      subjectId: refs.eventSubject.value,
      date,
      title,
      type: refs.eventType.value,
    });

    saveData();
    refs.eventForm.reset();
    refs.eventDate.value = date;
    selectedDate = date;
    renderCalendar();
    renderEvents();
  });

  refs.eventsList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.action === "remove-event") {
      state.events = state.events.filter(
        (item) => item.id !== button.dataset.id,
      );
      saveData();
      renderCalendar();
      renderEvents();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-modal-close]")) return;
    if (refs.dayModal?.classList.contains("open")) {
      closeDayModal();
    }
    if (refs.qrModal?.classList.contains("open")) {
      closeQrModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (refs.dayModal?.classList.contains("open")) {
      closeDayModal();
    }
    if (refs.qrModal?.classList.contains("open")) {
      closeQrModal();
    }
  });

  refs.scheduleImageInput.addEventListener("change", handleScheduleImage);
  refs.scheduleImageRemove.addEventListener("click", removeScheduleImage);
  if (refs.exportConfig) {
    refs.exportConfig.addEventListener("click", handleExport);
  }
  if (refs.importConfig) {
    refs.importConfig.addEventListener("change", handleImport);
  }
  if (refs.qrExportButton) {
    refs.qrExportButton.addEventListener("click", () => openQrModal("export"));
  }
  if (refs.qrImportButton) {
    refs.qrImportButton.addEventListener("click", () => openQrModal("import"));
  }
}

function renderAll() {
  renderSubjects();
  updateSubjectOptions();
  renderScheduleImage();
  renderCalendar();
  renderEvents();
}

function renderSubjects() {
  refs.subjectsList.innerHTML = "";
  if (state.subjects.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Agrega tus materias para comenzar.";
    refs.subjectsList.appendChild(empty);
    return;
  }

  state.subjects.forEach((subject) => {
    if (!subject.color) {
      subject.color = colorFromName(subject.name);
    }
    const card = document.createElement("div");
    card.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-header";

    const meta = document.createElement("div");
    meta.className = "subject-meta";

    const color = document.createElement("span");
    color.className = "subject-color";
    color.style.background = subject.color;

    const name = document.createElement("strong");
    name.textContent = subject.name;

    meta.append(color, name);

    const actions = document.createElement("div");
    actions.className = "subject-actions";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Eliminar";
    removeBtn.dataset.action = "remove-subject";
    removeBtn.dataset.id = subject.id;
    actions.appendChild(removeBtn);

    header.append(meta, actions);

    if (subject.professor) {
      const professor = document.createElement("p");
      professor.className = "muted";
      professor.textContent = `Profesor/a: ${subject.professor}`;
      card.appendChild(professor);
    }

    if (subject.notes) {
      const notes = document.createElement("p");
      notes.className = "muted";
      notes.textContent = `Notas: ${subject.notes}`;
      card.appendChild(notes);
    }

    card.prepend(header);
    refs.subjectsList.appendChild(card);
  });
}

function updateSubjectOptions() {
  const previous = refs.eventSubject.value;
  refs.eventSubject.innerHTML = "";

  const emptyOption = new Option("Sin materia", "");
  refs.eventSubject.add(emptyOption);

  state.subjects.forEach((subject) => {
    const option = new Option(subject.name, subject.id);
    refs.eventSubject.add(option);
  });

  if (
    previous &&
    Array.from(refs.eventSubject.options).some((opt) => opt.value === previous)
  ) {
    refs.eventSubject.value = previous;
  } else {
    refs.eventSubject.value = "";
  }
}

function renderScheduleImage() {
  refs.schedulePreview.innerHTML = "";

  if (!state.scheduleImage) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Aún no has subido tu horario.";
    refs.schedulePreview.appendChild(empty);
    refs.scheduleImageRemove.disabled = true;
    return;
  }

  const img = document.createElement("img");
  img.src = state.scheduleImage;
  img.alt = "Horario del semestre";
  img.onerror = () => {
    refs.schedulePreview.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No se encontró el archivo del horario.";
    refs.schedulePreview.appendChild(empty);
    refs.scheduleImageMessage.textContent =
      "Coloca la imagen como 'horario.png' en la carpeta 2026/organizador.";
    refs.scheduleImageRemove.disabled = true;
  };
  refs.schedulePreview.appendChild(img);
  refs.scheduleImageRemove.disabled = false;
}

function handleScheduleImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ]);
  if (!allowedTypes.has(file.type)) {
    refs.scheduleImageMessage.textContent = "Solo se permite PNG, JPG o WebP.";
    refs.scheduleImageInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.scheduleImage = reader.result;
    saveData();
    renderScheduleImage();
    refs.scheduleImageMessage.textContent = "Horario actualizado.";
  };
  reader.readAsDataURL(file);
}

function removeScheduleImage() {
  state.scheduleImage = "";
  refs.scheduleImageInput.value = "";
  saveData();
  renderScheduleImage();
  refs.scheduleImageMessage.textContent = "Horario eliminado.";
}

function handleExport() {
  if (refs.backupMessage) {
    refs.backupMessage.textContent = "";
    refs.backupMessage.classList.remove("success");
  }
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "organizador-semestre.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  if (refs.backupMessage) {
    refs.backupMessage.textContent = "Respaldo exportado.";
    refs.backupMessage.classList.add("success");
  }
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (refs.backupMessage) {
    refs.backupMessage.textContent = "";
    refs.backupMessage.classList.remove("success");
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = normalizeImportedData(parsed, { keepScheduleImage: false });
      saveData();
      renderAll();
      if (refs.backupMessage) {
        refs.backupMessage.textContent = "Respaldo importado.";
        refs.backupMessage.classList.add("success");
      }
    } catch (error) {
      if (refs.backupMessage) {
        refs.backupMessage.textContent = "Archivo inválido.";
      }
    } finally {
      refs.importConfig.value = "";
    }
  };
  reader.readAsText(file);
}

function openQrModal(mode) {
  if (!refs.qrModal) return;
  if (refs.qrModalTitle) {
    refs.qrModalTitle.textContent =
      mode === "import" ? "Escanear QR" : "QR de transferencia";
  }
  if (refs.qrExportPanel && refs.qrImportPanel) {
    refs.qrExportPanel.classList.toggle("is-hidden", mode !== "export");
    refs.qrImportPanel.classList.toggle("is-hidden", mode !== "import");
  }
  if (refs.qrExportMessage) {
    refs.qrExportMessage.textContent = "";
    refs.qrExportMessage.classList.remove("success");
  }
  if (refs.qrImportMessage) {
    refs.qrImportMessage.textContent = "";
    refs.qrImportMessage.classList.remove("success");
  }

  refs.qrModal.classList.add("open");
  refs.qrModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (mode === "export") {
    renderQrCode();
  } else {
    startQrScanner();
  }
}

function closeQrModal() {
  refs.qrModal?.classList.remove("open");
  refs.qrModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  stopQrScanner();
}

function renderQrCode() {
  if (!refs.qrCanvas || typeof QRious !== "function") {
    if (refs.qrExportMessage) {
      refs.qrExportMessage.textContent = "No se pudo generar el QR.";
    }
    return;
  }

  const payload = buildQrPayload();
  const json = JSON.stringify(payload);
  if (json.length > 3000 && refs.qrExportMessage) {
    refs.qrExportMessage.textContent =
      "El QR es muy grande. Considera exportar el archivo.";
  }

  // eslint-disable-next-line no-new
  new QRious({
    element: refs.qrCanvas,
    size: 280,
    value: json,
    level: "M",
  });
}

function buildQrPayload() {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      subjects: state.subjects,
      events: state.events,
    },
  };
}

function startQrScanner() {
  if (!refs.qrReader || typeof Html5Qrcode === "undefined") {
    if (refs.qrImportMessage) {
      refs.qrImportMessage.textContent = "No se pudo abrir la cámara.";
    }
    return;
  }

  stopQrScanner();
  qrScanner = new Html5Qrcode(refs.qrReader.id);
  qrScanner
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => handleQrScan(decodedText),
      () => {},
    )
    .catch(() => {
      if (refs.qrImportMessage) {
        refs.qrImportMessage.textContent = "Permiso de cámara denegado.";
      }
    });
}

function stopQrScanner() {
  if (!qrScanner) return;
  qrScanner
    .stop()
    .catch(() => {})
    .finally(() => {
      qrScanner.clear();
      qrScanner = null;
    });
}

function handleQrScan(decodedText) {
  if (!decodedText) return;
  try {
    const parsed = JSON.parse(decodedText);
    state = normalizeImportedData(parsed, { keepScheduleImage: true });
    saveData();
    renderAll();
    if (refs.backupMessage) {
      refs.backupMessage.textContent = "Respaldo importado desde QR.";
      refs.backupMessage.classList.add("success");
    }
    if (refs.qrImportMessage) {
      refs.qrImportMessage.textContent = "Importado correctamente.";
      refs.qrImportMessage.classList.add("success");
    }
    closeQrModal();
  } catch (error) {
    if (refs.qrImportMessage) {
      refs.qrImportMessage.textContent = "QR inválido.";
    }
  }
}

function renderCalendar() {
  refs.calendarGrid.innerHTML = "";
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  refs.calendarTitle.textContent = `${MONTHS[month]} ${year}`;

  DAYS_SHORT.forEach((day) => {
    const label = document.createElement("div");
    label.className = "calendar-weekday";
    label.textContent = day;
    refs.calendarGrid.appendChild(label);
  });

  const eventsByDate = state.events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = 42;

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - startOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const inMonth = cellDate.getMonth() === month;
    const dateStr = formatDateInput(cellDate);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    if (!inMonth) button.classList.add("other-month");
    if (dateStr === selectedDate) button.classList.add("selected");
    button.dataset.date = dateStr;

    const number = document.createElement("span");
    number.textContent = cellDate.getDate();

    const events = eventsByDate[dateStr] || [];
    if (events.length) {
      button.classList.add("has-events");
      const badge = document.createElement("span");
      badge.className = "event-badge";
      badge.textContent = events.length;
      button.appendChild(badge);
    }

    button.appendChild(number);

    if (events.length) {
      const meta = document.createElement("div");
      meta.className = "event-meta";
      events.slice(0, 2).forEach((event) => {
        const pill = document.createElement("span");
        pill.className = "event-pill";
        pill.textContent = EVENT_TYPE_LABELS[event.type] || event.type;
        const subject = state.subjects.find(
          (item) => item.id === event.subjectId,
        );
        pill.style.background = subject?.color || "#d4572b";
        pill.style.color = "#fffdf8";
        meta.appendChild(pill);
      });
      if (events.length > 2) {
        const more = document.createElement("span");
        more.className = "event-pill event-more";
        more.textContent = `+${events.length - 2}`;
        meta.appendChild(more);
      }
      button.appendChild(meta);
    }
    refs.calendarGrid.appendChild(button);
  }

  refs.selectedDate.textContent = `Eventos del ${formatDateLong(selectedDate)}`;
  if (refs.eventDate.value !== selectedDate) {
    refs.eventDate.value = selectedDate;
  }
}

function renderEvents() {
  refs.eventsList.innerHTML = "";
  const eventsForDay = state.events.filter(
    (event) => event.date === selectedDate,
  );

  if (eventsForDay.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No hay eventos para este día.";
    refs.eventsList.appendChild(empty);
    return;
  }

  eventsForDay.forEach((event) => {
    const subject = state.subjects.find((item) => item.id === event.subjectId);
    const item = document.createElement("div");
    item.className = "event-item";

    const header = document.createElement("div");
    header.className = "event-item-header";

    const meta = document.createElement("div");
    meta.className = "subject-meta";

    const color = document.createElement("span");
    color.className = "subject-color";
    color.style.background = subject?.color || "#9ca3af";

    const title = document.createElement("strong");
    title.textContent = event.title;

    meta.append(color, title);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Eliminar";
    removeBtn.dataset.action = "remove-event";
    removeBtn.dataset.id = event.id;

    header.append(meta, removeBtn);

    const subjectLine = document.createElement("p");
    subjectLine.className = "muted";
    subjectLine.textContent = subject ? subject.name : "Sin materia";

    const badge = document.createElement("span");
    badge.className = `badge ${event.type}`;
    badge.textContent = EVENT_TYPE_LABELS[event.type] || event.type;

    item.append(header, subjectLine, badge);
    refs.eventsList.appendChild(item);
  });
}

function openDayModal(dateValue) {
  if (!refs.dayModal) return;
  const eventsForDay = state.events.filter((event) => event.date === dateValue);
  if (eventsForDay.length === 0) return;

  refs.dayModalTitle.textContent = `Eventos del ${formatDateLong(dateValue)}`;
  refs.dayModalBody.innerHTML = "";

  eventsForDay.forEach((event) => {
    const subject = state.subjects.find((item) => item.id === event.subjectId);
    const item = document.createElement("div");
    item.className = "modal-event";

    const title = document.createElement("div");
    title.className = "modal-event-title";
    title.textContent = event.title;

    const meta = document.createElement("div");
    meta.className = "modal-event-meta";

    const dot = document.createElement("span");
    dot.className = "subject-color";
    dot.style.background = subject?.color || "#9ca3af";

    const subjectName = document.createElement("span");
    subjectName.textContent = subject ? subject.name : "Sin materia";

    const badge = document.createElement("span");
    badge.className = `badge ${event.type}`;
    badge.textContent = EVENT_TYPE_LABELS[event.type] || event.type;

    meta.append(dot, subjectName, badge);
    item.append(title, meta);
    refs.dayModalBody.appendChild(item);
  });

  refs.dayModal.classList.add("open");
  refs.dayModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDayModal() {
  refs.dayModal.classList.remove("open");
  refs.dayModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function removeSubject(subjectId) {
  state.subjects = state.subjects.filter((item) => item.id !== subjectId);
  state.events = state.events.filter((item) => item.subjectId !== subjectId);
  saveData();
  renderAll();
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultData();
    const parsed = JSON.parse(raw);
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      scheduleImage:
        typeof parsed.scheduleImage === "string"
          ? parsed.scheduleImage
          : DEFAULT_SCHEDULE_IMAGE,
    };
  } catch (error) {
    console.warn("No se pudo cargar el almacenamiento.", error);
    return cloneDefaultData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDateInput(date) {
  if (!(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLong(dateValue) {
  const date = parseDate(dateValue);
  if (!date) return "";
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function generateId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function cloneDefaultData() {
  if (typeof structuredClone === "function")
    return structuredClone(defaultData);
  return JSON.parse(JSON.stringify(defaultData));
}

function normalizeImportedData(payload, options = {}) {
  const data = payload?.data && payload?.version ? payload.data : payload;
  const subjectsRaw = Array.isArray(data?.subjects) ? data.subjects : [];
  const eventsRaw = Array.isArray(data?.events) ? data.events : [];
  const keepScheduleImage = options.keepScheduleImage === true;
  const fallbackSchedule = keepScheduleImage
    ? state?.scheduleImage || DEFAULT_SCHEDULE_IMAGE
    : DEFAULT_SCHEDULE_IMAGE;
  const scheduleImage =
    typeof data?.scheduleImage === "string"
      ? data.scheduleImage
      : fallbackSchedule;

  const subjects = subjectsRaw.map((subject) => ({
    ...subject,
    color: subject.color || colorFromName(subject.name),
  }));

  return {
    subjects,
    events: eventsRaw,
    scheduleImage,
  };
}

function colorFromName(name) {
  const safeName = name || "materia";
  let hash = 0;
  for (let i = 0; i < safeName.length; i += 1) {
    hash = (hash * 31 + safeName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % SUBJECT_PALETTE.length;
  return SUBJECT_PALETTE[index];
}
