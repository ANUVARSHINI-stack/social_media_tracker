// api.js - Central Data Access Layer for Social Media Tracker (Google Sheets Sync Only)
const API = (() => {
  let cachedShops = [];
  let cachedPosts = [];
  let cachedSettings = [];
  let cachedLogs = [];
  let syncInFlight = null;
  let lastErrorMessage = "";

  const syncChannel = "BroadcastChannel" in window
    ? new BroadcastChannel("socialtrack_sync_channel")
    : null;
  const DATA_CACHE_KEY = "socialtrack_data_cache_v1";
  const GOOGLE_PROFILE_KEY = "socialtrack_google_profile";

  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data === "refresh") syncFromRemote({ background: true });
    };
  }

  let statusListener = null;

  const HEADER_ALIASES = {
    shopId: "id",
    shopid: "id",
    postId: "id",
    postid: "id",
    logId: "id",
    logid: "id",
    shopName: "name",
    shopname: "name",
    assignedTo: "assignedPerson",
    assignedto: "assignedPerson",
    assignedEmailAddress: "assignedEmail",
    assignedemailaddress: "assignedEmail",
    assignedPerson: "assignedPerson",
    assignedperson: "assignedPerson",
    assignedEmail: "assignedEmail",
    assignedemail: "assignedEmail",
    postLink: "postUrl",
    postlink: "postUrl",
    url: "postUrl",
    postUrl: "postUrl",
    posturl: "postUrl",
    content: "caption",
    date: "postingDate",
    time: "postingTime",
    postingDate: "postingDate",
    postingdate: "postingDate",
    postingTime: "postingTime",
    postingtime: "postingTime",
    assetLink: "driveLink",
    assetlink: "driveLink",
    assetsLink: "driveLink",
    assetslink: "driveLink",
    driveLink: "driveLink",
    drivelink: "driveLink",
    value1: "value1",
    value2: "value2",
    value3: "value3"
  };

  function setStatus(status, message) {
    if (status === "error") lastErrorMessage = message || "";
    if (statusListener) statusListener(status, message);
    window.dispatchEvent(new CustomEvent("api-status-change", { detail: { status, message } }));
  }

  function toCamelCase(value) {
    return String(value || "")
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part, index) => {
        const lower = part.toLowerCase();
        return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join("");
  }

  function canonicalKey(key) {
    const camel = toCamelCase(key);
    return HEADER_ALIASES[camel] || camel;
  }

  function normalizeDate(value) {
    if (!value) return "";
    if (value instanceof Date) return formatLocalDate(value);
    const text = String(value).trim();
    if (!text) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return formatLocalDate(parsed);
    return text;
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeTime(value) {
    if (!value) return "";
    const text = String(value).trim();
    if (/^\d{2}:\d{2}/.test(text)) return text.substring(0, 5);
    const parsed = new Date(`1970-01-01T${text}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
    }
    return text;
  }

  function normalizeStatus(value) {
    const text = String(value || "Pending").trim().toLowerCase();
    return text === "posted" || text === "published" || text === "done" ? "Posted" : "Pending";
  }

  function comparePostsBySchedule(a, b) {
    const dateA = String(a && a.postingDate || "");
    const dateB = String(b && b.postingDate || "");
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    const timeA = String(a && a.postingTime || "");
    const timeB = String(b && b.postingTime || "");
    if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    return String(a && a.title || "").localeCompare(String(b && b.title || ""));
  }
  function recordsFromSheet(list) {
    if (!Array.isArray(list) || list.length === 0) return [];

    if (Array.isArray(list[0])) {
      const headers = list[0].map(canonicalKey);
      return list.slice(1)
        .map(row => {
          const record = {};
          headers.forEach((key, index) => {
            if (key) record[key] = row[index] ?? "";
          });
          return record;
        })
        .filter(record => Object.values(record).some(value => String(value ?? "").trim() !== ""));
    }

    return list
      .map(item => {
        const record = {};
        Object.entries(item || {}).forEach(([key, value]) => {
          const normalizedKey = canonicalKey(key);
          if (normalizedKey) record[normalizedKey] = value ?? "";
        });
        return record;
      })
      .filter(record => Object.values(record).some(value => String(value ?? "").trim() !== ""));
  }

  function normalizeShop(raw) {
    const shop = { ...(raw || {}) };
    const name = String(shop.name || shop.shop || "").trim();
    const id = String(shop.id || name || `shop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).trim();
    return {
      ...shop,
      id,
      shopId: id,
      shopID: id,
      name,
      shopName: name,
      description: String(shop.description || "").trim(),
      assignedPerson: String(shop.assignedPerson || "").trim(),
      assignedEmail: String(shop.assignedEmail || "").trim()
    };
  }

  function normalizePost(raw) {
    const post = { ...(raw || {}) };
    const id = String(post.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).trim();
    return {
      ...post,
      id,
      postId: id,
      postID: id,
      shopName: String(post.shopName || post.name || "").trim(),
      title: String(post.title || "").trim(),
      platform: String(post.platform || "").trim(),
      category: String(post.category || "").trim(),
      description: String(post.description || "").trim(),
      instruction: String(post.instruction || "").trim(),
      caption: String(post.caption || "").trim(),
      postingDate: normalizeDate(post.postingDate),
      postingTime: normalizeTime(post.postingTime),
      status: normalizeStatus(post.status),
      assignedPerson: String(post.assignedPerson || "").trim(),
      assignedEmail: String(post.assignedEmail || "").trim(),
      postUrl: String(post.postUrl || "").trim(),
      driveLink: String(post.driveLink || "").trim(),
      assetsLink: String(post.driveLink || post.assetsLink || "").trim(),
      created: String(post.created || "").trim()
    };
  }

  function normalizeSetting(raw) {
    const setting = { ...(raw || {}) };
    return {
      ...setting,
      type: String(setting.type || "").trim(),
      name: String(setting.name || "").trim(),
      value1: String(setting.value1 || "").trim(),
      value2: String(setting.value2 || "").trim(),
      value3: String(setting.value3 || "").trim()
    };
  }

  function normalizeLog(raw) {
    const log = { ...(raw || {}) };
    const id = String(log.id || `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).trim();
    return {
      ...log,
      id,
      logId: id,
      logID: id,
      timestamp: String(log.timestamp || "").trim(),
      postId: String(log.postId || "").trim(),
      shopName: String(log.shopName || "").trim(),
      assignedEmail: String(log.assignedEmail || "").trim(),
      status: String(log.status || "").trim(),
      actionTaken: String(log.actionTaken || "").trim()
    };
  }

  function persistCache() {
    try {
      localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
        shops: cachedShops,
        posts: cachedPosts,
        settings: cachedSettings,
        logs: cachedLogs,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("Could not save data cache:", error);
    }
  }

  function hydrateCache() {
    try {
      const raw = localStorage.getItem(DATA_CACHE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      cachedShops = uniqueById((data.shops || []).map(normalizeShop).filter(s => s.name));
      cachedPosts = uniqueById((data.posts || []).map(normalizePost).filter(p => p.shopName || p.caption || p.category));
      cachedSettings = (data.settings || []).map(normalizeSetting).filter(s => s.type && s.name);
      cachedLogs = uniqueById((data.logs || []).map(normalizeLog));
      return true;
    } catch (error) {
      console.warn("Could not load data cache:", error);
      localStorage.removeItem(DATA_CACHE_KEY);
      return false;
    }
  }

  function uniqueById(records) {
    const seen = new Set();
    return records.filter(record => {
      if (!record.id || seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }

  function slugId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "shop";
  }

  function getAllShops() {
    const byName = new Map();

    cachedShops.forEach(shop => {
      const enriched = enrichShopAssignment(shop);
      if (enriched.name) byName.set(enriched.name, enriched);
    });

    cachedPosts.forEach(post => {
      const name = String(post.shopName || "").trim();
      if (!name || byName.has(name)) return;
      byName.set(name, normalizeShop({
        id: `derived_${slugId(name)}`,
        name,
        description: "",
        assignedPerson: post.assignedPerson || "",
        assignedEmail: post.assignedEmail || "",
        derivedFromPosts: true
      }));
    });

    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  function enrichShopAssignment(shop) {
    if (!shop.assignedPerson) return shop;
    const match = cachedSettings.find(s => s.type === "TeamMember" && s.name === shop.assignedPerson);
    return { ...shop, assignedEmail: match ? match.value1 : shop.assignedEmail || "" };
  }

  function enrichPostAssignment(post) {
    let next = { ...post };
    if (!next.assignedPerson && next.shopName) {
      const shop = cachedShops.find(s => s.name === next.shopName);
      if (shop) {
        next.assignedPerson = shop.assignedPerson || "";
        next.assignedEmail = shop.assignedEmail || "";
      }
    }
    if (next.assignedPerson) {
      const match = cachedSettings.find(s => s.type === "TeamMember" && s.name === next.assignedPerson);
      next.assignedEmail = match ? match.value1 : next.assignedEmail || "";
    }
    if (next.postUrl) next.status = "Posted";
    return next;
  }

  async function remoteCall(action, payload = {}, options = {}) {
      if (!CONFIG.APPS_SCRIPT_URL) {
        setStatus("error", "Google Sheets URL is not configured.");
        return null;
      }

    if (!options.background) {
      setStatus("syncing", "Syncing with Google Sheets...");
    }
    try {
      const url = CONFIG.APPS_SCRIPT_URL;
      const response = action === "readAll"
        ? await fetch(`${url}?action=readAll`, { method: "GET", cache: "no-store" })
        : await fetch(`${url}?action=${encodeURIComponent(action)}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, ...payload })
          });

      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid Apps Script response: ${text.substring(0, 120)}`);
      }

      if (result.status === "error" || result.error) {
        throw new Error(result.message || result.error || "Apps Script returned an error.");
      }

      if (action !== "readAll" && result.status !== "success") {
        throw new Error(result.message || "Apps Script did not confirm the write.");
      }

      setStatus("synced", "All data synced!");
      return result;
    } catch (error) {
      console.error("Google Sheets Sync failed:", error);
      setStatus("error", "Sync failed: " + error.message);
      return null;
    }
  }

  function writeInBackground(action, payload, onFailure, onSuccess) {
    remoteCall(action, payload, { background: true }).then(result => {
      if (result) {
        if (typeof onSuccess === "function") onSuccess(result);
        broadcastRefresh();
        return;
      }
      if (typeof onFailure === "function") onFailure();
    });
  }

  function syncFromRemote(options = {}) {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      const result = await remoteCall("readAll", {}, options);
      if (!result) return null;

      cachedShops = uniqueById(recordsFromSheet(result.shops).map(normalizeShop).filter(s => s.name));
      cachedPosts = uniqueById(recordsFromSheet(result.posts).map(normalizePost).filter(p => p.shopName || p.caption || p.category));
      cachedSettings = recordsFromSheet(result.settings).map(normalizeSetting).filter(s => s.type && s.name);
      cachedLogs = uniqueById(recordsFromSheet(result.logs).map(normalizeLog));

      persistCache();
      window.dispatchEvent(new CustomEvent("api-data-refreshed"));
      return result;
    })().finally(() => {
      syncInFlight = null;
    });

    return syncInFlight;
  }

  function notifyLocalChange() {
    persistCache();
    window.dispatchEvent(new CustomEvent("api-local-change"));
  }

  function broadcastRefresh() {
    if (syncChannel) syncChannel.postMessage("refresh");
  }

  function isDailyReminderEnabled() {
    const notifSetting = cachedSettings.find(
      setting => setting.type === "Notification" && setting.name === "Daily reminder email"
    );
    if (!notifSetting) return true;
    return String(notifSetting.value1 || "").trim().toLowerCase() === "true";
  }

  hydrateCache();
  setTimeout(() => syncFromRemote({ background: true }), 100);
  setInterval(() => {
    if (document.hidden) return;
    syncFromRemote({ background: true });
  }, 5000);
  window.addEventListener("focus", () => syncFromRemote({ background: true }));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncFromRemote({ background: true });
  });

  return {
    onStatusChange(callback) {
      statusListener = callback;
      callback(CONFIG.APPS_SCRIPT_URL ? "synced" : "error", CONFIG.APPS_SCRIPT_URL ? "Idle" : "Google Sheets URL missing");
    },

    forceSync() {
      return syncFromRemote();
    },

    getLastError() {
      return lastErrorMessage;
    },

    isLocalMode() {
      return false;
    },

    getShops() {
      return getAllShops().map(shop => ({ ...shop }));
    },

    async saveShop(shop) {
      const normalized = enrichShopAssignment(normalizeShop(shop));
      const previousShops = cachedShops;
      const previousPosts = cachedPosts;
      const index = cachedShops.findIndex(s => s.id === normalized.id);
      cachedShops = index > -1
        ? cachedShops.map((s, i) => i === index ? { ...s, ...normalized } : s)
        : [...cachedShops, normalized];
      cachedPosts = cachedPosts.map(post => {
        if (post.shopName !== normalized.name) return post;
        return {
          ...post,
          assignedPerson: normalized.assignedPerson || "",
          assignedEmail: normalized.assignedEmail || ""
        };
      });

      notifyLocalChange();
      const result = await remoteCall("saveShop", { shop: normalized });
      if (!result) {
        cachedShops = previousShops;
        cachedPosts = previousPosts;
        notifyLocalChange();
        return null;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return normalized;
    },

    async deleteShop(shopId) {
      const previousShops = cachedShops;
      const previousPosts = cachedPosts;
      const shop = getAllShops().find(s => s.id === shopId);
      const shopName = shop ? shop.name : "";
      cachedShops = cachedShops.filter(s => s.id !== shopId);
      if (shopName) cachedPosts = cachedPosts.filter(p => p.shopName !== shopName);

      notifyLocalChange();
      const result = await remoteCall("deleteShop", { shopId, shopName });
      if (!result) {
        cachedShops = previousShops;
        cachedPosts = previousPosts;
        notifyLocalChange();
        return false;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return true;
    },

    getPosts() {
      return cachedPosts
        .map(post => ({ ...enrichPostAssignment(post) }))
        .sort(comparePostsBySchedule);
    },

    async savePost(post) {
      const normalized = enrichPostAssignment(normalizePost(post));
      const previousPosts = cachedPosts;
      const index = cachedPosts.findIndex(p => p.id === normalized.id);
      cachedPosts = index > -1
        ? cachedPosts.map((p, i) => i === index ? { ...p, ...normalized } : p)
        : [...cachedPosts, normalized];

      notifyLocalChange();
      const result = await remoteCall("savePost", { post: normalized });
      if (!result) {
        cachedPosts = previousPosts;
        notifyLocalChange();
        return null;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return normalized;
    },

    async deletePost(postId) {
      const previousPosts = cachedPosts;
      cachedPosts = cachedPosts.filter(p => p.id !== postId);
      notifyLocalChange();
      const result = await remoteCall("deletePost", { postId });
      if (!result) {
        cachedPosts = previousPosts;
        notifyLocalChange();
        return false;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return true;
    },

    getSettings() {
      return cachedSettings.map(setting => ({ ...setting }));
    },

    async saveSetting(setting) {
      const normalized = normalizeSetting(setting);
      const previousSettings = cachedSettings;
      const index = cachedSettings.findIndex(s => s.type === normalized.type && s.name === normalized.name);
      cachedSettings = index > -1
        ? cachedSettings.map((s, i) => i === index ? { ...s, ...normalized } : s)
        : [...cachedSettings, normalized];

      notifyLocalChange();
      const result = await remoteCall("saveSetting", { setting: normalized });
      if (!result) {
        cachedSettings = previousSettings;
        notifyLocalChange();
        return null;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return normalized;
    },

    async saveNotificationSetting(setting) {
      const normalized = normalizeSetting(setting);
      const previousSettings = cachedSettings;
      const index = cachedSettings.findIndex(s => s.type === normalized.type && s.name === normalized.name);
      cachedSettings = index > -1
        ? cachedSettings.map((s, i) => i === index ? { ...s, ...normalized } : s)
        : [...cachedSettings, normalized];

      notifyLocalChange();
      const result = await remoteCall("saveSetting", { setting: normalized });
      if (!result) {
        cachedSettings = previousSettings;
        notifyLocalChange();
        return null;
      }
      broadcastRefresh();
      return normalized;
    },

    async deleteSetting(type, name) {
      const previousSettings = cachedSettings;
      cachedSettings = cachedSettings.filter(s => !(s.type === type && s.name === name));
      notifyLocalChange();
      const result = await remoteCall("deleteSetting", { type, name });
      if (!result) {
        cachedSettings = previousSettings;
        notifyLocalChange();
        return false;
      }
      await syncFromRemote({ background: true });
      broadcastRefresh();
      return true;
    },

    getUserProfile() {
      if (window.AUTH && AUTH.getSession) {
        const session = AUTH.getSession();
        if (session) {
          return {
            email: session.email || CONFIG.DEFAULT_PROFILE.email,
            name: session.name || CONFIG.DEFAULT_PROFILE.name,
            role: session.role || CONFIG.DEFAULT_PROFILE.role,
            avatar: CONFIG.DEFAULT_PROFILE.avatar
          };
        }
      }

      let googleProfile = null;
      try {
        googleProfile = JSON.parse(localStorage.getItem(GOOGLE_PROFILE_KEY) || "null");
      } catch (error) {
        googleProfile = null;
      }
      if (googleProfile && (googleProfile.email || googleProfile.name)) {
        return {
          email: googleProfile.email || CONFIG.DEFAULT_PROFILE.email,
          name: googleProfile.name || CONFIG.DEFAULT_PROFILE.name,
          role: "Google Account",
          avatar: googleProfile.avatar || CONFIG.DEFAULT_PROFILE.avatar
        };
      }

      const profile = cachedSettings.find(s => s.type === "Profile");
      const photoSetting = cachedSettings.find(s => s.type === "ProfilePhoto");
      return {
        email: profile ? profile.value1 : CONFIG.DEFAULT_PROFILE.email,
        name: profile ? profile.value2 : CONFIG.DEFAULT_PROFILE.name,
        role: CONFIG.DEFAULT_PROFILE.role,
        avatar: photoSetting ? photoSetting.value1 : CONFIG.DEFAULT_PROFILE.avatar
      };
    },

    setGoogleProfile(profile) {
      localStorage.setItem(GOOGLE_PROFILE_KEY, JSON.stringify(profile || {}));
      notifyLocalChange();
      broadcastRefresh();
    },

    clearGoogleProfile() {
      localStorage.removeItem(GOOGLE_PROFILE_KEY);
      notifyLocalChange();
      broadcastRefresh();
    },

    isGoogleSignedIn() {
      return Boolean(localStorage.getItem(GOOGLE_PROFILE_KEY));
    },

    getLogs() {
      return cachedLogs.map(log => ({ ...log }));
    },

    async logNotification(log) {
      const normalized = normalizeLog({
        ...log,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
      });

      cachedLogs = [normalized, ...cachedLogs];
      notifyLocalChange();
      writeInBackground("logNotification", { log: normalized });
    },

    async sendPendingNotificationsForMember(member) {
      if (!isDailyReminderEnabled()) {
        return { status: "success", sent: 0, skipped: true, message: "Daily reminder email is disabled." };
      }
      const result = await remoteCall("sendPendingNotificationsForMember", {
        member: {
          name: String(member && member.name || "").trim(),
          email: String(member && member.email || "").trim()
        }
      });
      if (result) {
        await syncFromRemote();
        broadcastRefresh();
      }
      return result;
    },

    async sendPendingNotifications() {
      const result = await remoteCall("sendPendingNotifications", { force: true });
      if (result) {
        await syncFromRemote();
        broadcastRefresh();
      }
      return result;
    }
  };
})();

window.API = API;
