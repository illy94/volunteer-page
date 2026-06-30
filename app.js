const STORAGE_KEY = "volunteer-page-state-v1";
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

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
  archive: [
    { label: "2025년 7월", volunteer: "서울역 급식", activity: "환규 전시", event: "" },
    { label: "2025년 8월", volunteer: "혜영 - 빵 포장", activity: "원준/진히 계곡", event: "이취임식" },
    { label: "2025년 9월", volunteer: "세영 - 유기견", activity: "진히 양궁", event: "" },
    { label: "2025년 10월", volunteer: "박철 - 플로깅", activity: "원준 등산", event: "" },
    { label: "2025년 11월", volunteer: "혜영 - 김장", activity: "전시", event: "" },
    { label: "2025년 12월", volunteer: "보육원 청소, 선물", activity: "볼링", event: "송년회" },
    { label: "2026년 1월", volunteer: "연탄", activity: "스키장", event: "" },
    { label: "2026년 2월", volunteer: "제빵", activity: "", event: "" },
  ],
};

let state = loadState();
let saveTimer;

const elements = {
  settingsForm: document.querySelector("#settingsForm"),
  monthCards: document.querySelector("#monthCards"),
  scheduleTable: document.querySelector("#scheduleTable"),
  ownerBars: document.querySelector("#ownerBars"),
  archiveGrid: document.querySelector("#archiveGrid"),
  linkButtons: document.querySelector("#linkButtons"),
  saveState: document.querySelector("#saveState"),
  thisMonthNumber: document.querySelector("#thisMonthNumber"),
  thisMonthTitle: document.querySelector("#thisMonthTitle"),
  thisMonthOwner: document.querySelector("#thisMonthOwner"),
  thisMonthVolunteer: document.querySelector("#thisMonthVolunteer"),
  thisMonthActivity: document.querySelector("#thisMonthActivity"),
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return normalizeState(parsed);
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
    archive: Array.isArray(input.archive) ? input.archive : fallback.archive,
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

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateString) {
  if (!dateString) return "미정";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "미정";
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
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

function formatNoticeDateTime(month) {
  const date = formatNoticeDate(month.volunteerDate);
  const time = [month.volunteerStartTime, month.volunteerEndTime].filter(Boolean).join(" - ");
  return time ? `${date} ${time}` : date;
}

function formatScheduleText(title, dateString = "", place = "") {
  const parts = [];
  if (title && title.trim()) parts.push(title.trim());
  if (dateString) parts.push(formatDate(dateString));
  if (place && place.trim()) parts.push(place.trim());
  return parts.length ? parts.join(" / ") : "미정";
}

function valueOrPending(value, fallback = "미정") {
  return value && value.trim() ? value.trim() : fallback;
}

function getMonthNumber(month) {
  return month.key.slice(5, 7);
}

function findCurrentMonth() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return state.months.find((month) => month.key === key) || state.months[0];
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
  renderThisMonth();
  renderLinks();
  renderMonthCards();
  renderTable();
  renderOwnerBars();
  renderArchive();
}

function renderThisMonth() {
  const month = findCurrentMonth();
  elements.thisMonthNumber.textContent = getMonthNumber(month);
  elements.thisMonthTitle.textContent = month.label;
  elements.thisMonthOwner.textContent = valueOrPending(month.owner);
  elements.thisMonthVolunteer.textContent = formatScheduleText(
    month.volunteerTitle,
    month.volunteerDate,
    month.volunteerPlace,
  );
  elements.thisMonthActivity.textContent = formatScheduleText(month.activityTitle, month.activityDate);
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

function renderMonthCards() {
  const template = document.querySelector("#monthCardTemplate");
  elements.monthCards.innerHTML = "";

  state.months.forEach((month, index) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".month-card");
    const form = fragment.querySelector(".month-form");

    card.dataset.key = month.key;
    fragment.querySelector(".card-number").textContent = getMonthNumber(month);
    fragment.querySelector("h3").textContent = month.label;
    fragment.querySelector(".weekday-preview").textContent = `봉사일 ${formatDate(month.volunteerDate)}`;

    bindFormValue(form, "owner", month.owner);
    bindFormValue(form, "status", month.status);
    bindFormValue(form, "volunteerTitle", month.volunteerTitle);
    bindFormValue(form, "volunteerDate", month.volunteerDate);
    bindFormValue(form, "volunteerStartTime", month.volunteerStartTime);
    bindFormValue(form, "volunteerEndTime", month.volunteerEndTime);
    bindFormValue(form, "volunteerPlace", month.volunteerPlace);
    bindFormValue(form, "activityTitle", month.activityTitle);
    bindFormValue(form, "activityDate", month.activityDate);
    bindFormValue(form, "eventTitle", month.eventTitle);
    bindFormValue(form, "note", month.note);
    bindFormValue(form, "noticeIntro", month.noticeIntro);
    bindFormValue(form, "dressCode", month.dressCode);
    bindFormValue(form, "participantInfo", month.participantInfo);
    bindFormValue(form, "memberFee", month.memberFee);
    bindFormValue(form, "associateFee", month.associateFee);
    bindFormValue(form, "bankAccount", month.bankAccount);
    bindFormValue(form, "detailSchedule", month.detailSchedule);
    fragment.querySelector(".notice-preview").value = buildNoticeText(month);

    form.addEventListener("input", (event) => {
      const field = event.target.name;
      if (!field) return;
      state.months[index][field] = event.target.value;
      updateDerivedViews();
      scheduleSave();
    });

    form.addEventListener("change", (event) => {
      const field = event.target.name;
      if (!field) return;
      state.months[index][field] = event.target.value;
      updateDerivedViews();
      scheduleSave();
    });

    fragment.querySelector(".copy-notice-button").addEventListener("click", (event) => {
      copyNoticeText(event.currentTarget, form.querySelector(".notice-preview"));
    });

    elements.monthCards.append(fragment);
  });
}

function bindFormValue(form, name, value) {
  const field = form.elements[name];
  if (field) field.value = value || "";
}

function updateDerivedViews() {
  document.querySelectorAll(".month-card").forEach((card) => {
    const month = state.months.find((item) => item.key === card.dataset.key);
    if (!month) return;
    card.querySelector(".weekday-preview").textContent = `봉사일 ${formatDate(month.volunteerDate)}`;
    card.querySelector(".notice-preview").value = buildNoticeText(month);
  });
  renderThisMonth();
  renderLinks();
  renderTable();
  renderOwnerBars();
}

function buildNoticeText(month) {
  const title = valueOrPending(month.volunteerTitle, "봉사활동");
  const lines = [
    `[${formatNoticeTitleDate(month.volunteerDate)}] ${title}`,
  ];

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

async function copyNoticeText(button, textArea) {
  const text = textArea.value;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
    }
    button.textContent = "복사됨";
  } catch {
    button.textContent = "복사 실패";
  }

  setTimeout(() => {
    button.textContent = "공지 복사";
  }, 1400);
}

function renderTable() {
  elements.scheduleTable.innerHTML = "";
  state.months.forEach((month) => {
    const row = document.createElement("tr");
    const cells = [
      month.label,
      valueOrPending(month.owner),
      formatScheduleText(month.volunteerTitle, "", month.volunteerPlace),
      formatDate(month.volunteerDate),
      formatScheduleText(month.activityTitle, month.activityDate),
      valueOrPending(month.eventTitle, "없음"),
    ];

    cells.forEach((value) => {
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

function renderArchive() {
  elements.archiveGrid.innerHTML = "";
  state.archive.forEach((item) => {
    const row = document.createElement("div");
    row.className = "archive-item";
    row.innerHTML = `
      <strong>${escapeHtml(item.label)}</strong>
      <span>봉사: ${escapeHtml(valueOrPending(item.volunteer))}</span>
      <span>액티: ${escapeHtml(valueOrPending(item.activity))}</span>
      <span>행사: ${escapeHtml(valueOrPending(item.event, "없음"))}</span>
    `;
    elements.archiveGrid.append(row);
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
  renderMonthCards();
  updateDerivedViews();
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
document.querySelector("#fillEmptyDatesBtn").addEventListener("click", () => fillVolunteerDates(false));
document.querySelector("#recalculateDatesBtn").addEventListener("click", () => fillVolunteerDates(true));
document.querySelector("#exportBtn").addEventListener("click", exportJson);
document.querySelector("#importFile").addEventListener("change", (event) => importJson(event.target.files[0]));
document.querySelector("#resetBtn").addEventListener("click", () => {
  const confirmed = window.confirm("입력한 내용을 초기값으로 되돌릴까요?");
  if (!confirmed) return;
  state = cloneInitialState();
  render();
  saveState();
});

render();
saveState();
