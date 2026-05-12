  };
}

function isBanned(person) {
  pruneExpiredBans();
  return Boolean(state.bans[emailKey(person.email)] && state.bans[emailKey(person.email)] > Date.now());
}

function showBan(person) {
  const expires = state.bans[emailKey(person.email)];
  showMessage("RSVP paused", `You are blocked from RSVPing until ${formatDate(expires)}. To lift this sooner, email host@games.com or pay $10.`);
  renderBanNotice();
}

function showMessage(title, text) {
  elements.messageTitle.textContent = title;
  elements.messageText.textContent = text;
  elements.messageDialog.showModal();
}

function pruneExpiredBans() {
  Object.entries(state.bans).forEach(([email, expires]) => {
    if (expires <= Date.now()) delete state.bans[email];
  });
  saveState();
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(stored || defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(candidate) {
  const normalizedState = { ...structuredClone(defaultState), ...candidate };
  normalizedState.tables = normalizedState.tables.map((table, index) => {
    const fallback = defaultState.tables[index] || {};
    return {
      ...fallback,
      ...table,
      ownerName: table.ownerName || table.owner || fallback.ownerName || "",
      ownerEmail: cleanEmail(table.ownerEmail || ""),
      seats: Array.isArray(table.seats) ? table.seats.map(normalizePerson).filter((person) => person.email) : []
    };
  });
  normalizedState.waitlist = Array.isArray(normalizedState.waitlist)
    ? normalizedState.waitlist.map(normalizePerson).filter((person) => person.email)
    : [];
  normalizedState.bans = Object.entries(normalizedState.bans || {}).reduce((bans, [email, expires]) => {
    const clean = emailKey(email);
    if (clean && Number(expires) > Date.now()) bans[clean] = Number(expires);
    return bans;
  }, {});
  return normalizedState;
}

function normalizePerson(value) {
  if (typeof value === "string") {
    return { name: cleanText(value), email: "" };
  }
  return {
    name: cleanText(value && value.name),
    email: cleanEmail(value && value.email)
  };
}

function loadCurrentPerson() {
  try {
    const stored = JSON.parse(localStorage.getItem(CURRENT_PERSON_KEY));
    return {
      name: cleanText((stored && stored.name) || localStorage.getItem("game-night-current-name") || ""),
      email: cleanEmail(stored && stored.email)
    };
  } catch {
    return { name: cleanText(localStorage.getItem("game-night-current-name") || ""), email: "" };
  }
}

function rememberCurrentPerson(person) {
  localStorage.setItem(CURRENT_PERSON_KEY, JSON.stringify(person));
  localStorage.setItem("game-night-current-name", person.name);
}

function saveAndRender() {
  saveState();
  render();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function emailKey(value) {
  return cleanEmail(value);
}

function sameEmail(first, second) {
  return emailKey(first) === emailKey(second);
}

function samePerson(first, second) {
  return Boolean(first && second && sameEmail(first.email, second.email));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

render();
