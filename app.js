const STORAGE_KEY = "volunteer-calendar-state-v3";
const LEGACY_KEYS = ["volunteer-page-state-v2", "volunteer-page-state-v1"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const weekdayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

const monthPlans = [
  { key: "2026-07", label: "2026년 7월", owner: "태연" },
  { key: "2026-08", label: "2026년 8월", owner: "명인" },
  { key: "2026-09", label: "2026년 9월", owner: "세연" },
  { key: "2026-10", label: "2026년 10월", owner: "세연" },
  { key: "2026-11", label: "2026년 11월", owner: "태연" },
  { key: "2026-12", label: "2026년 12월", owner: "혜진" },
  { key: "2027-01", label: "2027년 1월", owner: "세영" },
  { key: "2027-02", label: "2027년 2월", owner: "태연" },
  { key: "2027-03", label: "2027년 3월", owner: "세영" },
  { key: "2027-04", label: "2027년 4월", owner: "xx" },
  { key: "2027-05", label: "2027년 5월", owner: "세연" },
  { key: "2027-06", label: "2027년 6월", owner: "세영" },
];

const archiveItems = [
  { month: "2025년 7월", volunteer: "서울역 급식", activity: "환규 전시", event: "" },
  { month: "2025년 8월", volunteer: "혜영 - 빵 포장", activity: "원준/진히 계곡", event: "이취임식" },
  { month: "2025년 9월", volunteer: "세영 - 유기견", activity: "진히 양궁", event: "" },
  { month: "2025년 10월", volunteer: "박철 - 플로깅", activity: "원준 등산", event: "" },
  { month: "2025년 11월", volunteer: "혜영 - 김장", activity: "전시", event: "" },
  { month: "2025년 12월", volunteer: "보육원 청소, 선물", activity: "볼링", event: "송년회" },
  { month: "2026년 1월", volunteer: "연탄", activity: "스키장", event: "" },
  { month: "2026년 2월", volunteer: "제빵", activity: "", event: "" },
];

const defaultState = {
  events: [],
  organizations: [
    {
      id: createId(),
      name: "서울특별시립 따스한채움터",
      address: "서울시 용산구 한강대로 377",
      meeting: "2층 봉사자대기실에서 집결, 주차 불가",
      dressCode: "편한 복장, 양말",
      memo: "무료 급식 일정 공지에 사용한 기관",
    },
  ],
};

let state = loadState();
let currentMonthIndex = getInitialMonthIndex();
let selectedDate = `${monthPlans[currentMonthIndex].key}-01`;
let selectedEventId = null;
let editingEventId = null;
let editingOrganizationId = null;
let touchStartX = 0;

const elements = {
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  calendarView: document.querySelector("#calendarView"),
  dateDetailView: document.querySelector("#dateDetailView"),
  calendarTitle: document.querySelector("#calendarTitle"),
  monthOwner: document.querySelector("#monthOwner"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarShell: document.querySelector("#calendarShell"),
  prevMonthBtn: document.querySelector("#prevMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
  monthEventCount: document.querySelector("#monthEventCount"),
  monthEvents: document.querySelector("#monthEvents"),
  backToCalendarBtn: document.querySelector("#backToCalendarBtn"),
  selectedDateTitle: document.querySelector("#selectedDateTitle"),
  selectedDateMeta: document.querySelector("#selectedDateMeta"),
  emptyState: document.querySelector("#emptyState"),
  createEventBtn: document.querySelector("#createEventBtn"),
  eventView: document.querySelector("#eventView"),
  eventViewTitle: document.querySelector("#eventViewTitle"),
  eventViewStatus: document.querySelector("#eventViewStatus"),
  eventViewFields: document.querySelector("#eventViewFields"),
  editEventBtn: document.querySelector("#editEventBtn"),
  deleteEventBtn: document.querySelector("#deleteEventBtn"),
  eventForm: document.querySelector("#eventForm"),
  eventFormTitle: document.querySelector("#eventFormTitle"),
  cancelEventFormBtn: document.querySelector("#cancelEventFormBtn"),
  noticePreview: document.querySelector("#noticePreview"),
  copyNoticeBtn: document.querySelector("#copyNoticeBtn"),
  organizationList: document.querySelector("#organizationList"),
  organizationForm: document.querySelector("#organizationForm"),
  organizationFormTitle: document.querySelector("#organizationFormTitle"),
  addOrganizationBtn: document.querySelector("#addOrganizationBtn"),
  cancelOrganizationBtn: document.querySelector("#cancelOrganizationBtn"),
  archiveList: document.querySelector("#archiveList"),
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));

    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return migrateLegacyState(JSON.parse(legacy));
    }
  } catch {
    return clone(defaultState);
  }

  return clone(defaultState);
}

function normalizeState(input) {
  const fallback = clone(defaultState);
  return {
    events: Array.isArray(input.events) ? input.events.map(normalizeEvent) : fallback.events,
    organizations: Array.isArray(input.organizations) ? input.organizations.map(normalizeOrganization) : fallback.organizations,
  };
}

function migrateLegacyState(input) {
  const fallback = clone(defaultState);
  const events = Array.isArray(input.months)
    ? input.months
        .filter((month) => month.volunteerDate)
        .map((month) =>
          normalizeEvent({
            id: createId(),
            date: month.volunteerDate,
            category: month.category || "봉사",
            owner: month.owner,
            title: month.volunteerTitle,
            status: month.status,
            startTime: month.volunteerStartTime,
            endTime: month.volunteerEndTime,
            place: month.volunteerPlace,
            intro: month.noticeIntro,
            dressCode: month.dressCode,
            capacity: month.participantInfo,
            memberFee: month.memberFee,
            associateFee: month.associateFee,
            bankAccount: month.bankAccount,
            detailSchedule: month.detailSchedule,
            memo: month.note,
          }),
        )
    : [];

  return {
    events,
    organizations: fallback.organizations,
  };
}

function normalizeEvent(event) {
  const memberFee = event.memberFee || "0원";
  return {
    id: event.id || createId(),
    date: event.date || "",
    category: event.category || event.type || "봉사",
    owner: event.owner || "",
    title: event.title || "",
    status: event.status || "준비중",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    place: event.place || "",
    intro: event.intro || "",
    dressCode: event.dressCode || "편한 복장, 양말",
    capacity: event.capacity || "10명 (이후 대기)",
    memberFee,
    associateFee: calculateAssociateFee(memberFee),
    bankAccount: event.bankAccount || "하나은행 210-910031-69304 서울지아이에이로타리클럽",
    detailSchedule: event.detailSchedule || "",
    memo: event.memo || "",
  };
}

function normalizeOrganization(org) {
  return {
    id: org.id || createId(),
    name: org.name || "",
    address: org.address || "",
    meeting: org.meeting || "",
    dressCode: org.dressCode || "",
    memo: org.memo || "",
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getInitialMonthIndex() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const index = monthPlans.findIndex((month) => month.key === key);
  return index >= 0 ? index : 0;
}

function getMonthPlan(dateString = selectedDate) {
  const key = dateString.slice(0, 7);
  return monthPlans.find((month) => month.key === key) || monthPlans[currentMonthIndex];
}

function getEventByDate(dateString) {
  return state.events.find((event) => event.date === dateString) || null;
}

function getEventById(id) {
  return state.events.find((event) => event.id === id) || null;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "날짜 미정";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "미정";
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
}

function formatNoticeDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "미정";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${weekdays[date.getDay()]})`;
}

function formatNoticeTitleDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "날짜 미정";
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatTimeRange(event) {
  const times = [event.startTime, event.endTime].filter(Boolean);
  return times.length ? times.join(" - ") : "시간 미정";
}

function valueOrPending(value, fallback = "미정") {
  return value && value.trim() ? value.trim() : fallback;
}

function parseFeeAmount(value) {
  const text = String(value || "").replace(/\s/g, "");
  if (!text || /무료|없음/.test(text)) return 0;

  const manWon = text.match(/(\d+(?:\.\d+)?)만/);
  if (manWon) return Math.round(Number(manWon[1]) * 10000);

  const thousandWon = text.match(/(\d+(?:\.\d+)?)천/);
  if (thousandWon) return Math.round(Number(thousandWon[1]) * 1000);

  const digits = text.replaceAll(",", "").match(/\d+/g);
  return digits ? Number(digits.join("")) : 0;
}

function formatFeeAmount(amount) {
  if (amount === 0) return "0원";
  if (amount % 10000 === 0) return `${amount / 10000}만원`;
  return `${amount.toLocaleString("ko-KR")}원`;
}

function calculateAssociateFee(memberFee) {
  return formatFeeAmount(parseFeeAmount(memberFee) + 10000);
}

function render() {
  renderTabs();
  renderCalendar();
  renderMonthEvents();
  renderOrganizations();
  renderArchive();
}

function renderTabs() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
}

function switchTab(tab) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  elements.tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab;
    panel.classList.toggle("is-active", panel.dataset.panel === tab);
  });
}

function renderCalendar() {
  const month = monthPlans[currentMonthIndex];
  elements.calendarTitle.textContent = month.label;
  elements.monthOwner.textContent = `담당: ${month.owner}`;
  elements.prevMonthBtn.disabled = currentMonthIndex === 0;
  elements.nextMonthBtn.disabled = currentMonthIndex === monthPlans.length - 1;
  elements.calendarGrid.innerHTML = "";

  weekdayHeaders.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "weekday";
    cell.textContent = day;
    elements.calendarGrid.append(cell);
  });

  const [year, monthNumber] = month.key.split("-").map(Number);
  const firstDate = new Date(year, monthNumber - 1, 1);
  const lastDate = new Date(year, monthNumber, 0);

  for (let i = 0; i < firstDate.getDay(); i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell is-empty";
    elements.calendarGrid.append(empty);
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const dateString = `${month.key}-${String(day).padStart(2, "0")}`;
    const event = getEventByDate(dateString);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    button.dataset.date = dateString;
    if (event) button.classList.add("has-event");
    if (dateString === selectedDate) button.classList.add("is-selected");

    button.innerHTML = `<span class="day-number">${day}</span>`;
    if (event) {
      const chip = document.createElement("span");
      chip.className = "event-chip";
      chip.innerHTML = `
        <strong><span class="category-badge">${escapeHtml(event.category)}</span> 담당: ${escapeHtml(valueOrPending(event.owner))}</strong>
        <span>${escapeHtml(valueOrPending(event.title, "일정"))}</span>
        <em>${escapeHtml(formatTimeRange(event))}</em>
      `;
      button.append(chip);
    }

    button.addEventListener("click", () => openDateDetail(dateString));
    elements.calendarGrid.append(button);
  }
}

function renderMonthEvents() {
  const month = monthPlans[currentMonthIndex];
  const events = state.events
    .filter((event) => event.date.startsWith(month.key))
    .sort((a, b) => a.date.localeCompare(b.date));

  elements.monthEventCount.textContent = `${events.length}건`;
  elements.monthEvents.innerHTML = "";

  if (!events.length) {
    const empty = document.createElement("p");
    empty.className = "subtle";
    empty.textContent = "이 달에 등록된 일정이 없습니다.";
    elements.monthEvents.append(empty);
    return;
  }

  events.forEach((event) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "month-event";
    button.innerHTML = `
      <strong>${escapeHtml(formatShortDate(event.date))}</strong>
      <span>${escapeHtml(event.category)} · ${escapeHtml(valueOrPending(event.title, "일정"))}</span>
      <em>${escapeHtml(valueOrPending(event.owner))} / ${escapeHtml(formatTimeRange(event))}</em>
    `;
    button.addEventListener("click", () => openDateDetail(event.date));
    elements.monthEvents.append(button);
  });
}

function changeMonth(delta) {
  currentMonthIndex = Math.max(0, Math.min(monthPlans.length - 1, currentMonthIndex + delta));
  selectedDate = `${monthPlans[currentMonthIndex].key}-01`;
  renderCalendar();
  renderMonthEvents();
}

function openDateDetail(dateString) {
  selectedDate = dateString;
  const event = getEventByDate(dateString);
  selectedEventId = event ? event.id : null;
  editingEventId = null;
  elements.calendarView.hidden = true;
  elements.dateDetailView.hidden = false;
  renderDateDetail();
  renderCalendar();
}

function closeDateDetail() {
  elements.dateDetailView.hidden = true;
  elements.calendarView.hidden = false;
  selectedEventId = null;
  editingEventId = null;
  renderCalendar();
  renderMonthEvents();
}

function renderDateDetail() {
  const event = selectedEventId ? getEventById(selectedEventId) : getEventByDate(selectedDate);
  selectedEventId = event ? event.id : null;
  elements.selectedDateTitle.textContent = formatDate(selectedDate);
  elements.selectedDateMeta.innerHTML = "";
  addMeta("월 담당", getMonthPlan(selectedDate).owner);

  if (!event) {
    elements.emptyState.hidden = false;
    elements.eventView.hidden = true;
    elements.eventForm.hidden = true;
    addMeta("등록 상태", "등록된 일정 없음");
    return;
  }

  elements.emptyState.hidden = true;
  elements.eventView.hidden = editingEventId === event.id;
  elements.eventForm.hidden = editingEventId !== event.id;

  addMeta("등록 상태", event.status);
  addMeta("구분", event.category);
  addMeta("일정명", valueOrPending(event.title));
  addMeta("시간", formatTimeRange(event));

  if (editingEventId === event.id) {
    bindEventForm(event);
    return;
  }

  elements.eventViewTitle.textContent = valueOrPending(event.title, "일정");
  elements.eventViewStatus.textContent = event.status;
  elements.eventViewStatus.dataset.status = event.status;
  elements.noticePreview.value = buildNoticeText(event);
  elements.eventViewFields.innerHTML = "";
  [
    ["구분", event.category],
    ["담당", event.owner],
    ["일시", `${formatDate(event.date)} ${formatTimeRange(event)}`],
    ["장소", event.place],
    ["복장", event.dressCode],
    ["인원", event.capacity],
    ["메모", event.memo],
  ].forEach(([label, value]) => addEventField(label, value));
}

function addMeta(label, value) {
  const row = document.createElement("div");
  row.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(valueOrPending(value))}</span>`;
  elements.selectedDateMeta.append(row);
}

function addEventField(label, value) {
  const group = document.createElement("div");
  group.innerHTML = `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(valueOrPending(value))}</dd>`;
  elements.eventViewFields.append(group);
}

function startCreateEvent() {
  selectedEventId = null;
  editingEventId = "new";
  elements.emptyState.hidden = true;
  elements.eventView.hidden = true;
  elements.eventForm.hidden = false;
  bindEventForm(makeBlankEvent(selectedDate));
}

function startEditEvent() {
  const event = getEventById(selectedEventId);
  if (!event) return;
  editingEventId = event.id;
  renderDateDetail();
}

function cancelEventForm() {
  editingEventId = null;
  renderDateDetail();
}

function makeBlankEvent(date) {
  return normalizeEvent({
    id: "new",
    date,
    category: "봉사",
    owner: getMonthPlan(date).owner,
    status: "모집중",
  });
}

function bindEventForm(event) {
  elements.eventFormTitle.textContent = editingEventId === "new" ? "일정 등록" : "일정 수정";
  Object.entries({
    date: event.date,
    category: event.category,
    owner: event.owner,
    title: event.title,
    status: event.status,
    startTime: event.startTime,
    endTime: event.endTime,
    place: event.place,
    intro: event.intro,
    dressCode: event.dressCode,
    capacity: event.capacity,
    memberFee: event.memberFee,
    associateFee: event.associateFee,
    bankAccount: event.bankAccount,
    detailSchedule: event.detailSchedule,
    memo: event.memo,
  }).forEach(([name, value]) => {
    const field = elements.eventForm.elements[name];
    if (field) field.value = value || "";
  });
  syncAssociateFee();
}

function syncAssociateFee() {
  const memberFeeField = elements.eventForm.elements.memberFee;
  const associateFeeField = elements.eventForm.elements.associateFee;
  if (!memberFeeField || !associateFeeField) return;
  associateFeeField.value = calculateAssociateFee(memberFeeField.value);
}

function submitEventForm(event) {
  event.preventDefault();
  const data = new FormData(elements.eventForm);
  const payload = normalizeEvent({
    id: editingEventId === "new" ? createId() : editingEventId,
    date: data.get("date"),
    category: data.get("category"),
    owner: data.get("owner"),
    title: data.get("title"),
    status: data.get("status"),
    startTime: data.get("startTime"),
    endTime: data.get("endTime"),
    place: data.get("place"),
    intro: data.get("intro"),
    dressCode: data.get("dressCode"),
    capacity: data.get("capacity"),
    memberFee: data.get("memberFee"),
    associateFee: calculateAssociateFee(data.get("memberFee")),
    bankAccount: data.get("bankAccount"),
    detailSchedule: data.get("detailSchedule"),
    memo: data.get("memo"),
  });

  state.events = state.events.filter((item) => item.id !== payload.id && item.date !== payload.date);
  state.events.push(payload);
  state.events.sort((a, b) => a.date.localeCompare(b.date));
  selectedDate = payload.date;
  selectedEventId = payload.id;
  currentMonthIndex = Math.max(0, monthPlans.findIndex((month) => month.key === payload.date.slice(0, 7)));
  editingEventId = null;
  saveState();
  renderCalendar();
  renderMonthEvents();
  renderDateDetail();
}

function deleteSelectedEvent() {
  const event = getEventById(selectedEventId);
  if (!event) return;
  const confirmed = window.confirm("이 일정을 삭제할까요?");
  if (!confirmed) return;
  state.events = state.events.filter((item) => item.id !== event.id);
  selectedEventId = null;
  editingEventId = null;
  saveState();
  renderCalendar();
  renderMonthEvents();
  renderDateDetail();
}

function buildNoticeText(event) {
  const lines = [`[${formatNoticeTitleDate(event.date)}] ${valueOrPending(event.title, "일정")}`];
  if (event.intro && event.intro.trim()) lines.push(event.intro.trim());
  lines.push(
    "",
    `일시: ${formatNoticeDate(event.date)} ${formatTimeRange(event)}`,
    "",
    `장소: ${valueOrPending(event.place)}`,
    "",
    `복장: ${valueOrPending(event.dressCode)}`,
    "",
    `인원: ${valueOrPending(event.capacity)}`,
    "",
    "세부 일정:",
    valueOrPending(event.detailSchedule),
    "",
    `정회원: ${valueOrPending(event.memberFee)}`,
    `준회원: ${valueOrPending(event.associateFee)}`,
  );
  if (event.bankAccount && event.bankAccount.trim()) lines.push(event.bankAccount.trim());
  return lines.join("\n");
}

async function copyNotice() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(elements.noticePreview.value);
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
  }, 1200);
}

function renderOrganizations() {
  elements.organizationList.innerHTML = "";
  if (!state.organizations.length) {
    const empty = document.createElement("p");
    empty.className = "subtle";
    empty.textContent = "등록된 기관이 없습니다.";
    elements.organizationList.append(empty);
    return;
  }

  state.organizations.forEach((org) => {
    const card = document.createElement("article");
    card.className = "organization-card";
    card.innerHTML = `
      <h3>${escapeHtml(org.name)}</h3>
      <dl>
        <div><dt>주소</dt><dd>${escapeHtml(valueOrPending(org.address))}</dd></div>
        <div><dt>집결/주차</dt><dd>${escapeHtml(valueOrPending(org.meeting))}</dd></div>
        <div><dt>기본 복장</dt><dd>${escapeHtml(valueOrPending(org.dressCode))}</dd></div>
        <div><dt>메모</dt><dd>${escapeHtml(valueOrPending(org.memo))}</dd></div>
      </dl>
      <div class="inline-actions">
        <button type="button" data-action="edit">수정</button>
        <button type="button" class="danger" data-action="delete">삭제</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => startEditOrganization(org.id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteOrganization(org.id));
    elements.organizationList.append(card);
  });
}

function startCreateOrganization() {
  editingOrganizationId = "new";
  elements.organizationForm.hidden = false;
  elements.organizationFormTitle.textContent = "기관 등록";
  elements.organizationForm.reset();
}

function startEditOrganization(id) {
  const org = state.organizations.find((item) => item.id === id);
  if (!org) return;
  editingOrganizationId = id;
  elements.organizationForm.hidden = false;
  elements.organizationFormTitle.textContent = "기관 수정";
  ["name", "address", "meeting", "dressCode", "memo"].forEach((name) => {
    elements.organizationForm.elements[name].value = org[name] || "";
  });
}

function cancelOrganizationForm() {
  editingOrganizationId = null;
  elements.organizationForm.hidden = true;
}

function submitOrganizationForm(event) {
  event.preventDefault();
  const data = new FormData(elements.organizationForm);
  const payload = normalizeOrganization({
    id: editingOrganizationId === "new" ? createId() : editingOrganizationId,
    name: data.get("name"),
    address: data.get("address"),
    meeting: data.get("meeting"),
    dressCode: data.get("dressCode"),
    memo: data.get("memo"),
  });

  state.organizations = state.organizations.filter((item) => item.id !== payload.id);
  state.organizations.push(payload);
  saveState();
  cancelOrganizationForm();
  renderOrganizations();
}

function deleteOrganization(id) {
  const confirmed = window.confirm("이 기관을 삭제할까요?");
  if (!confirmed) return;
  state.organizations = state.organizations.filter((item) => item.id !== id);
  saveState();
  renderOrganizations();
}

function renderArchive() {
  elements.archiveList.innerHTML = "";
  archiveItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "archive-card";
    card.innerHTML = `
      <strong>${escapeHtml(item.month)}</strong>
      <span>봉사: ${escapeHtml(valueOrPending(item.volunteer))}</span>
      <span>액티비티: ${escapeHtml(valueOrPending(item.activity))}</span>
      <span>행사: ${escapeHtml(valueOrPending(item.event, "없음"))}</span>
    `;
    elements.archiveList.append(card);
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

elements.prevMonthBtn.addEventListener("click", () => changeMonth(-1));
elements.nextMonthBtn.addEventListener("click", () => changeMonth(1));
elements.backToCalendarBtn.addEventListener("click", closeDateDetail);
elements.createEventBtn.addEventListener("click", startCreateEvent);
elements.editEventBtn.addEventListener("click", startEditEvent);
elements.deleteEventBtn.addEventListener("click", deleteSelectedEvent);
elements.cancelEventFormBtn.addEventListener("click", cancelEventForm);
elements.eventForm.addEventListener("submit", submitEventForm);
elements.eventForm.elements.memberFee.addEventListener("input", syncAssociateFee);
elements.copyNoticeBtn.addEventListener("click", copyNotice);
elements.addOrganizationBtn.addEventListener("click", startCreateOrganization);
elements.cancelOrganizationBtn.addEventListener("click", cancelOrganizationForm);
elements.organizationForm.addEventListener("submit", submitOrganizationForm);

elements.calendarShell.addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
});

elements.calendarShell.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) < 60) return;
  changeMonth(delta < 0 ? 1 : -1);
});

render();
saveState();
