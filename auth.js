const AUTH = (() => {
  const SESSION_KEY = "socialtrack_auth_session_v1";
  const OVERRIDES_KEY = "socialtrack_auth_overrides_v1";
  const LOGIN_PAGE = "login.html";
  const HASH_PREFIX = "pbkdf2";
  const HASH_ITERATIONS = 120000;
  const BOOTSTRAP_PASSWORD = "ChangeMe123!";

  function isReloadNavigation() {
    const entries = performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
    if (entries && entries[0] && entries[0].type) {
      return entries[0].type === "reload";
    }
    return false;
  }

  function normalizeRole(role) {
    const text = String(role || "").trim().toLowerCase();
    return text === "viewer" ? "Viewer" : "Admin";
  }

  function roleAccess(role) {
    return normalizeRole(role) === "Viewer" ? "viewer" : "admin";
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.email) return null;
      return {
        ...session,
        role: normalizeRole(session.role),
        access: roleAccess(session.role)
      };
    } catch (error) {
      return null;
    }
  }

  function setSession(user) {
    const session = {
      name: String(user.name || "").trim(),
      email: String(user.email || "").trim(),
      role: normalizeRole(user.role),
      access: roleAccess(user.role)
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getOverrides() {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveOverrides(overrides) {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides || {}));
  }

  function setCredentialOverride(member) {
    const email = String(member && member.email || "").trim().toLowerCase();
    if (!email) return;
    const overrides = getOverrides();
    overrides[email] = {
      name: String(member.name || "").trim(),
      email: String(member.email || "").trim(),
      role: normalizeRole(member.role),
      passwordHash: String(member.passwordHash || "").trim()
    };
    saveOverrides(overrides);
  }

  function removeCredentialOverride(email) {
    const key = String(email || "").trim().toLowerCase();
    if (!key) return;
    const overrides = getOverrides();
    delete overrides[key];
    saveOverrides(overrides);
  }

  function base64Encode(bytes) {
    let binary = "";
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64Decode(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }

  async function deriveHash(password, salt, iterations = HASH_ITERATIONS) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(String(password || "")),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    return new Uint8Array(bits);
  }

  async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await deriveHash(password, salt, HASH_ITERATIONS);
    return `${HASH_PREFIX}$${HASH_ITERATIONS}$${base64Encode(salt)}$${base64Encode(hash)}`;
  }

  async function verifyPassword(password, stored) {
    const value = String(stored || "").trim();
    if (!value) return false;

    if (!value.startsWith(`${HASH_PREFIX}$`)) {
      return value === String(password || "");
    }

    const parts = value.split("$");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = base64Decode(parts[2]);
    const expected = parts[3];
    const actual = await deriveHash(password, salt, iterations);
    return base64Encode(actual) === expected;
  }

  async function prepareStoredPassword(password, existingValue = "") {
    const nextPassword = String(password || "").trim();
    const currentValue = String(existingValue || "").trim();

    if (!nextPassword) return currentValue;
    if (nextPassword.startsWith(`${HASH_PREFIX}$`)) return nextPassword;
    return hashPassword(nextPassword);
  }

  function findMemberByEmail(email) {
    const lookup = String(email || "").trim().toLowerCase();
    if (!lookup || !window.API || !API.getSettings) return null;
    const settingsMember = API.getSettings().find(setting =>
      setting.type === "TeamMember" &&
      String(setting.value1 || "").trim().toLowerCase() === lookup
    ) || null;
    const override = getOverrides()[lookup];
    if (!settingsMember && !override) return null;
    return {
      ...(settingsMember || {}),
      type: "TeamMember",
      name: override && override.name ? override.name : (settingsMember ? settingsMember.name : ""),
      value1: override && override.email ? override.email : (settingsMember ? settingsMember.value1 : ""),
      value2: override && override.role ? override.role : (settingsMember ? settingsMember.value2 : ""),
      value3: override && override.passwordHash ? override.passwordHash : (settingsMember ? settingsMember.value3 : "")
    };
  }

  async function login(email, password) {
    if (!window.API || !API.getSettings) {
      return { ok: false, message: "Application data is unavailable." };
    }

    let member = findMemberByEmail(email);
    if (!member && API.forceSync) {
      await API.forceSync();
      member = findMemberByEmail(email);
    }
    if (!member) {
      return { ok: false, message: "Invalid email or password." };
    }

    const missingPassword = !String(member.value3 || "").trim();
    const valid = missingPassword
      ? String(password || "") === BOOTSTRAP_PASSWORD
      : await verifyPassword(password, member.value3 || "");
    if (!valid) {
      return { ok: false, message: "Invalid email or password." };
    }

    if (missingPassword || (member.value3 && !String(member.value3).startsWith(`${HASH_PREFIX}$`))) {
      const upgraded = await hashPassword(password);
      setCredentialOverride({
        name: member.name,
        email: member.value1,
        role: member.value2 || "Viewer",
        passwordHash: upgraded
      });
      await API.saveSetting({
        type: "TeamMember",
        name: member.name,
        value1: member.value1,
        value2: member.value2,
        value3: upgraded
      });
    }

    setCredentialOverride({
      name: member.name,
      email: member.value1,
      role: member.value2 || "Viewer",
      passwordHash: String(member.value3 || "").trim()
    });

    const session = setSession({
      name: member.name,
      email: member.value1,
      role: member.value2 || "Viewer"
    });
    return { ok: true, session };
  }

  function logout() {
    clearSession();
    if (window.API && API.clearGoogleProfile) API.clearGoogleProfile();
    const target = `${LOGIN_PAGE}?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`;
    window.location.href = target;
  }

  function redirectIfNeeded() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    if (page !== LOGIN_PAGE && isReloadNavigation()) {
      clearSession();
    }

    const session = getSession();

    if (page === LOGIN_PAGE) {
      if (session && !isReloadNavigation()) {
        window.location.replace(session.access === "viewer" ? "index.html" : "index.html");
      }
      return;
    }

    if (!session) {
      window.location.replace(`${LOGIN_PAGE}?next=${encodeURIComponent(page + window.location.search)}`);
      return;
    }

    if (session.access === "viewer" && page === "reports.html") {
      window.location.replace("index.html");
    }
  }

  redirectIfNeeded();

  return {
    BOOTSTRAP_PASSWORD,
    getSession,
    setSession,
    clearSession,
    normalizeRole,
    roleAccess,
    hashPassword,
    verifyPassword,
    prepareStoredPassword,
    setCredentialOverride,
    removeCredentialOverride,
    login,
    logout,
    findMemberByEmail
  };
})();

window.AUTH = AUTH;
