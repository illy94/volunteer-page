const STORAGE_KEY = "volunteer-page-state-v2";
const LEGACY_STORAGE_KEY = "volunteer-page-state-v1";
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const weekdayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

const initialState = {
  settings: {
    chatLink: "",
    formLink: "",
    albumLink: "",
    noticeLink: "",
    weekOrdinal: "2",
    weekday: "6",
  },
  months: [
    makeMonth("2026-07", "2026년 7월", "태연"),
    makeMonth("2026-08", "2026년 8월", "명인"),
    makeMonth("2026-09", "2026년 9월", "세연"),
    makeMonth("2026-10", "2026년 10월", "세연"),
    makeMonth("2026-11", "2026년 11월", "태연"),
    makeMonth("2026-12", "2026년 12월", "혜진"),
    makeMonth("2027-01", "2027년 1월", "세영"),
    makeMonth("2027-02", "2027년 2월", "태연"),
    makeMonth("2027-03", "2027년 3월", "세영"),
    makeMonth("2027-04", "2027년 4월", "xx"),
    makeMonth("2027-05", "2027년 5월", "세연"),
    makeMonth("2027-06", "2027년 6월", "세영"),
  ],
};

let state = loadState();
let selectedDate = getInitialSelectedDate();
let saveTimer;

const elements = {
  settingsForm: document.querySelector("#settingsForm"),
  yearCalendar: document.querySelector("#yearCalendar"),
  detailForm: document.querySelector("#detailForm"),
  registerDateBtn: document.querySelector("#registerDateBtn"),
  selectedDateSummary: document.querySelector("#selectedDateSummary"),
  detailTitle: document.querySelector("#detailTitle"),
  overviewTitle: document.querySelector("#overviewTitle"),
  currentOwner: document.querySelector("#currentOwner"),
  currentVolunteer: document.querySelector("#currentVolunteer"),
  currentTime: document.querySelector("#currentTime"),
  ownerBars: document.querySelector("#ownerBars"),
  scheduleTable: document.querySelector("#scheduleTable"),
  linkButtons: document.querySelector("#linkButtons"),
  saveState: document.querySelector("#saveState"),
  noticePreview: document.querySelector("#noticePreview"),
  copyNoticeBtn: document.querySelector("#copyNoticeBtn"),
};

function makeMonth(key, label, owner) {
  return {
    key,
    label,
    owner,
    status: "준비중",
    volunteerTitle: "",
    volunteerDate: "",
    volunteerStartTime: "",
    volunteerEndTime: "",
    volunteerPlace: "",
    activityTitle: "",
    activityDate: "",
    eventTitle: "",
    note: "",
    noticeIntro: "",
    dressCode: "편한 복장, 양말",
    participantInfo: "10명 (이후 대기)",
    memberFee: "참가비 없음",
    associateFee: "1만원 (환불 불가한 국제 로타리재단 기부금)",
    bankAccount: "하나은행 210-910031-69304 서울지아이에이로타리클럽",
    detailSchedule: "",
  };
}

function cloneInitialState() {
  return JSON.parse(JSON.stringify(initialState));
}

function loadState() {
  const fallback = cloneInitialState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return fallback;
    return normalizeState(JSON.parse(saved));
  } catch {
    return fallback;
  }
}

function normalizeState(input) {
  const fallback = cloneInitialState();
  if (!input || typeof input !== "object") return fallback;

  const incomingMonths = Array.isArray(input.months) ? input.months : [];
  const months = fallback.months.map((month) => {
    const saved = incomingMonths.find((item) => item.key === month.key);
    return { ...month, ...(saved || {}) };
  });

  return {
    settings: { ...fallback.settings, ...(input.settings || {}) },
    months,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  elements.saveState.textContent = `저장됨 ${formatTime(new Date())}`;
}

function scheduleSave() {
  elements.saveState.textContent = "저장 중";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 180);
}

function getInitialSelectedDate() {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = state.months.find((month) => month.key === currentKey) || state.months[0];
  return currentMonth.volunteerDate || `${currentMonth.key}-01`;
}

function getSelectedMonth() {
  return getMonthForDate(selectedDate) || state.months[0];
}

function getMonthForDate(dateString) {
  const key = dateString.slice(0, 7);
  return state.months.find((month) => month.key === key);
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateString) {
  if (!dateString) return "미정";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "미정";
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
}

function formatFullDate(dateString) {
  if (!dateString) return "날짜 미정";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "날짜 미정";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

function formatNoticeDate(dateString) {
  if (!dateString) return "미정";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "미정";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${weekdays[date.getDay()]})`;
}

function formatNoticeTitleDate(dateString) {
  if (!dateString) return "날짜 미정";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "날짜 미정";
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatTimeRange(month) {
  const times = [month.volunteerStartTime, month.volunteerEndTime].filter(Boolean);
  return times.length ? times.join(" - ") : "미정";
}

function formatNoticeDateTime(month) {
  const date = formatNoticeDate(month.volunteerDate);
  const time = [month.volunteerStartTime, month.volunteerEndTime].filter(Boolean).join(" - ");
  return time ? `${date} ${time}` : date;
}

function valueOrPending(value, fallback = "미정") {
  return value && value.trim() ? value.trim() : fallback;
}

function getNthWeekdayDate(monthKey, ordinal, weekdayValue) {
  const [year, month] = monthKey.split("-").map(Number);
  const weekday = Number(weekdayValue);
  const date = new Date(year, month - 1, 1);

  if (ordinal === "last") {
    const lastDate = new Date(year, month, 0);
    const offset = (lastDate.getDay() - weekday + 7) % 7;
    lastDate.setDate(lastDate.getDate() - offset);
    return toInputDate(lastDate);
  }

  const firstOffset = (weekday - date.getDay() + 7) % 7;
  const targetDate = 1 + firstOffset + (Number(ordinal) - 1) * 7;
  return toInputDate(new Date(year, month - 1, targetDate));
}

function toInputDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function applySettingsToForm() {
  Object.entries(state.settings).forEach(([key, value]) => {
    const input = elements.settingsForm.elements[key];
    if (input) input.value = value;
  });
}

function render() {
  applySettingsToForm();
  renderLinks();
  renderCalendar();
  renderSelectedDate();
  renderOwnerBars();
  renderTable();
}

function renderLinks() {
  const links = [
    ["단톡방", state.settings.chatLink],
    ["신청 폼", state.settings.formLink],
    ["사진 앨범", state.settings.albumLink],
    ["공지 문서", state.settings.noticeLink],
  ];

  elements.linkButtons.innerHTML = "";
  links.forEach(([label, url]) => {
    const safeUrl = getSafeUrl(url);
    if (safeUrl) {
      const anchor = document.createElement("a");
      anchor.href = safeUrl;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.textContent = label;
      elements.linkButtons.append(anchor);
      return;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "empty-link";
    placeholder.textContent = url ? `${label} 링크 형식 확인` : `${label} 링크 입력 전`;
    elements.linkButtons.append(placeholder);
  });
}

function getSafeUrl(value) {
  if (!value || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderCalendar() {
  elements.yearCalendar.innerHTML = "";
  state.months.forEach((month) => {
    elements.yearCalendar.append(createMonthCalendar(month));
  });
}

function createMonthCalendar(month) {
  const section = document.createElement("section");
  section.className = "month-calendar";

  const header = document.createElement("div");
  header.className = "month-calendar-head";
  header.innerHTML = `
    <div>
      <h3>${escapeHtml(month.label)}</h3>
      <p>담당: ${escapeHtml(valueOrPending(month.owner))}</p>
    </div>
    <span class="status-pill" data-status="${escapeHtml(month.status)}">${escapeHtml(month.status)}</span>
  `;

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  weekdayHeaders.forEach((day) => {
    const headerCell = document.createElement("div");
    headerCell.className = "weekday-cell";
    headerCell.textContent = day;
    grid.append(headerCell);
  });

  const [year, monthNumber] = month.key.split("-").map(Number);
  const firstDate = new Date(year, monthNumber - 1, 1);
  const lastDate = new Date(year, monthNumber, 0);

  for (let index = 0; index < firstDate.getDay(); index += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-day is-empty";
    grid.append(empty);
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const dateString = `${month.key}-${String(day).padStart(2, "0")}`;
    const hasVolunteer = month.volunteerDate === dateString;
    const isSelected = selectedDate === dateString;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.date = dateString;
    if (hasVolunteer) button.classList.add("has-volunteer");
    if (isSelected) button.classList.add("is-selected");

    const dateLabel = document.createElement("span");
    dateLabel.className = "day-number";
    dateLabel.textContent = String(day);
    button.append(dateLabel);

    if (hasVolunteer) {
      const info = document.createElement("span");
      info.className = "day-event";
      info.innerHTML = `
        <strong>${escapeHtml(valueOrPending(month.owner))}</strong>
        <span>${escapeHtml(valueOrPending(month.volunteerTitle, "봉사"))}</span>
        <em>${escapeHtml(formatTimeRange(month))}</em>
      `;
      button.append(info);
    }

    button.addEventListener("click", () => {
      selectedDate = dateString;
      renderCalendar();
      renderSelectedDate();
    });

    grid.append(button);
  }

  section.append(header, grid);
  return section;
}

function renderSelectedDate() {
  const month = getSelectedMonth();
  const hasVolunteer = month.volunteerDate === selectedDate;
  elements.detailTitle.textContent = formatFullDate(selectedDate);
  elements.overviewTitle.textContent = hasVolunteer ? month.label : "선택된 날짜";

  elements.currentOwner.textContent = valueOrPending(month.owner);
  elements.currentVolunteer.textContent = hasVolunteer ? valueOrPending(month.volunteerTitle) : "등록된 봉사 없음";
  elements.currentTime.textContent = hasVolunteer ? formatTimeRange(month) : "미정";

  elements.selectedDateSummary.innerHTML = "";
  if (hasVolunteer) {
    addSummaryRow("담당", valueOrPending(month.owner));
    addSummaryRow("봉사", valueOrPending(month.volunteerTitle));
    addSummaryRow("시간", formatTimeRange(month));
    addSummaryRow("장소", valueOrPending(month.volunteerPlace));
    addSummaryRow("상태", month.status);
    elements.registerDateBtn.hidden = true;
    elements.detailForm.hidden = false;
    bindDetailForm(month);
    elements.noticePreview.value = buildNoticeText(month);
  } else {
    addSummaryRow("상태", "등록된 봉사활동 없음");
    addSummaryRow("월 담당", valueOrPending(month.owner));
    addSummaryRow("선택 날짜", formatFullDate(selectedDate));
    elements.registerDateBtn.hidden = false;
    elements.registerDateBtn.textContent = month.volunteerDate ? "이 날짜로 봉사일 변경" : "이 날짜에 봉사 등록";
    elements.detailForm.hidden = true;
  }
}

function addSummaryRow(label, value) {
  const row = document.createElement("div");
  row.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span>`;
  elements.selectedDateSummary.append(row);
}

function bindDetailForm(month) {
  [
    "owner",
    "status",
    "volunteerTitle",
    "volunteerDate",
    "volunteerStartTime",
    "volunteerEndTime",
    "volunteerPlace",
    "activityTitle",
    "activityDate",
    "eventTitle",
    "note",
    "noticeIntro",
    "dressCode",
    "participantInfo",
    "memberFee",
    "associateFee",
    "bankAccount",
    "detailSchedule",
  ].forEach((name) => {
    const field = elements.detailForm.elements[name];
    if (field) field.value = month[name] || "";
  });
}

function updateSelectedMonthFromForm(event) {
  const field = event.target.name;
  if (!field) return;

  const month = getSelectedMonth();
  month[field] = event.target.value;
  if (field === "volunteerDate" && event.target.value) {
    selectedDate = event.target.value;
  }

  renderCalendar();
  renderSelectedDate();
  renderOwnerBars();
  renderTable();
  scheduleSave();
}

function registerSelectedDate() {
  const month = getSelectedMonth();
  month.volunteerDate = selectedDate;
  if (month.status === "준비중") month.status = "모집중";
  renderCalendar();
  renderSelectedDate();
  renderTable();
  scheduleSave();
}

function buildNoticeText(month) {
  const title = valueOrPending(month.volunteerTitle, "봉사활동");
  const lines = [`[${formatNoticeTitleDate(month.volunteerDate)}] ${title}`];

  if (month.noticeIntro && month.noticeIntro.trim()) {
    lines.push(month.noticeIntro.trim());
  }

  lines.push(
    "",
    `일시: ${formatNoticeDateTime(month)}`,
    "",
    `장소: ${valueOrPending(month.volunteerPlace)}`,
    "",
    `복장: ${valueOrPending(month.dressCode)}`,
    "",
    `인원: ${valueOrPending(month.participantInfo)}`,
    "",
    "세부 일정:",
    valueOrPending(month.detailSchedule),
    "",
    `정회원: ${valueOrPending(month.memberFee)}`,
    `준회원: ${valueOrPending(month.associateFee)}`,
  );

  if (month.bankAccount && month.bankAccount.trim()) {
    lines.push(month.bankAccount.trim());
  }

  return lines.join("\n");
}

async function copyNoticeText() {
  const text = elements.noticePreview.value;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      elements.noticePreview.focus();
      elements.noticePreview.select();
      document.execCommand("copy");
    }
    elements.copyNoticeBtn.textContent = "복사됨";
  } catch {
    elements.copyNoticeBtn.textContent = "복사 실패";
  }

  setTimeout(() => {
    elements.copyNoticeBtn.textContent = "공지 복사";
  }, 1400);
}

function renderOwnerBars() {
  const counts = state.months.reduce((map, month) => {
    const owner = valueOrPending(month.owner);
    map.set(owner, (map.get(owner) || 0) + 1);
    return map;
  }, new Map());
  const max = Math.max(...counts.values());

  elements.ownerBars.innerHTML = "";
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .forEach(([owner, count]) => {
      const row = document.createElement("div");
      row.className = "owner-row";
      row.innerHTML = `
        <strong>${escapeHtml(owner)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width: ${(count / max) * 100}%"></div></div>
        <span>${count}회</span>
      `;
      elements.ownerBars.append(row);
    });
}

function renderTable() {
  elements.scheduleTable.innerHTML = "";
  state.months.forEach((month) => {
    const row = document.createElement("tr");
    const dateTime = month.volunteerDate
      ? `${formatDate(month.volunteerDate)} ${formatTimeRange(month)}`
      : "미정";

    [
      month.label,
      valueOrPending(month.owner),
      valueOrPending(month.volunteerTitle),
      dateTime,
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = "status-pill";
    status.dataset.status = month.status;
    status.textContent = month.status;
    statusCell.append(status);
    row.append(statusCell);
    elements.scheduleTable.append(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateSettingsFromForm() {
  const data = new FormData(elements.settingsForm);
  state.settings = {
    chatLink: data.get("chatLink").trim(),
    formLink: data.get("formLink").trim(),
    albumLink: data.get("albumLink").trim(),
    noticeLink: data.get("noticeLink").trim(),
    weekOrdinal: data.get("weekOrdinal"),
    weekday: data.get("weekday"),
  };
  renderLinks();
  scheduleSave();
}

function fillVolunteerDates(overwrite) {
  state.months = state.months.map((month) => {
    if (!overwrite && month.volunteerDate) return month;
    return {
      ...month,
      volunteerDate: getNthWeekdayDate(month.key, state.settings.weekOrdinal, state.settings.weekday),
    };
  });

  if (!getMonthForDate(selectedDate)?.volunteerDate) {
    selectedDate = state.months[0].volunteerDate || `${state.months[0].key}-01`;
  }

  renderCalendar();
  renderSelectedDate();
  renderTable();
  scheduleSave();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "volunteer-schedule-2026-2027.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = normalizeState(JSON.parse(reader.result));
      selectedDate = getInitialSelectedDate();
      render();
      saveState();
    } catch {
      elements.saveState.textContent = "JSON 형식 확인 필요";
    }
  };
  reader.readAsText(file);
}

elements.settingsForm.addEventListener("input", updateSettingsFromForm);
elements.settingsForm.addEventListener("change", updateSettingsFromForm);
elements.detailForm.addEventListener("input", updateSelectedMonthFromForm);
elements.detailForm.addEventListener("change", updateSelectedMonthFromForm);
elements.registerDateBtn.addEventListener("click", registerSelectedDate);
elements.copyNoticeBtn.addEventListener("click", copyNoticeText);
document.querySelector("#fillEmptyDatesBtn").addEventListener("click", () => fillVolunteerDates(false));
document.querySelector("#recalculateDatesBtn").addEventListener("click", () => fillVolunteerDates(true));
document.querySelector("#exportBtn").addEventListener("click", exportJson);
document.querySelector("#importFile").addEventListener("change", (event) => importJson(event.target.files[0]));
document.querySelector("#resetBtn").addEventListener("click", () => {
  const confirmed = window.confirm("입력한 내용을 초기값으로 되돌릴까요?");
  if (!confirmed) return;
  state = cloneInitialState();
  selectedDate = getInitialSelectedDate();
  render();
  saveState();
});

render();
saveState();
