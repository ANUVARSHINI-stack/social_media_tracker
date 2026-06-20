function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action === "diagnostics") return reply(getDiagnostics());
  if (action !== "readAll") return reply({ status: "error", message: "Invalid action" });
  return reply({ status: "success", shops: readRows("Shops"), posts: readRows("Posts"), settings: readRows("Settings"), logs: readRows("Notifications Log") });
}
function doPost(e) {
  try {
    var body = JSON.parse(e && e.postData ? e.postData.contents : "{}");
    var action = body.action || (e && e.parameter ? e.parameter.action : "");
    if (action === "saveShop") {
      saveRow("Shops", body.shop || {}, "Shop ID");
      syncPostsForShopAssignment(body.shop || {});
    }
    else if (action === "deleteShop") deleteShopAndPosts(body.shopId, body.shopName);
    else if (action === "savePost") saveRow("Posts", body.post || {}, "Post ID");
    else if (action === "deletePost") deleteRow("Posts", body.postId, "Post ID");
    else if (action === "saveSetting") {
      saveSetting(body.setting || {});
      maybeConfigureNotificationTrigger(body.setting || {});
    }
    else if (action === "deleteSetting") deleteSetting(body.type, body.name);
    else if (action === "logNotification") saveRow("Notifications Log", body.log || {}, "Log ID");
    else if (action === "sendPendingNotificationsForMember") return reply(sendPendingNotificationsForMember(body.member || {}));
    else if (action === "sendPendingNotifications") return reply(sendPendingNotifications());
    else if (action === "authorizeEmailServices") return reply(authorizeEmailServices());
    else if (action === "diagnostics") return reply(getDiagnostics());
    else return reply({ status: "error", message: "Unknown action: " + action });
    return reply({ status: "success" });
  } catch (err) {
    return reply({ status: "error", message: err.message });
  }
}
function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function getDiagnostics() {
  return {
    status: "success",
    version: "20260616l-email-v5",
    timezone: Session.getScriptTimeZone(),
    emailQuota: MailApp.getRemainingDailyQuota(),
    notification: getNotificationDiagnostics(),
    triggers: ScriptApp.getProjectTriggers().map(function(trigger) {
      return trigger.getHandlerFunction ? trigger.getHandlerFunction() : "";
    })
  };
}
function authorizeEmailServices() {
  return {
    status: "success",
    message: "Mail and trigger services are authorized.",
    emailQuota: MailApp.getRemainingDailyQuota(),
    triggerCount: ScriptApp.getProjectTriggers().length,
    timezone: Session.getScriptTimeZone()
  };
}
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  ensureHeaders(sh, name);
  return sh;
}
function readRows(name) {
  var sh = getSheet(name), data = sh.getDataRange().getValues(), out = [], i, j, obj;
  if (data.length <= 1) return [];
  for (i = 1; i < data.length; i++) {
    obj = {};
    for (j = 0; j < data[0].length; j++) obj[toKey(data[0][j])] = data[i][j];
    out.push(obj);
  }
  return out;
}
function saveRow(name, rec, idHeader) {
  var sh = getSheet(name), data = sh.getDataRange().getValues(), head = data[0], idCol = head.indexOf(idHeader);
  var idVal = valueFor(rec, idHeader), row = -1, vals = [], i;
  for (i = 1; i < data.length; i++) if (String(data[i][idCol]) === String(idVal)) row = i + 1;
  for (i = 0; i < head.length; i++) vals.push(valueFor(rec, head[i]));
  if (row > -1) sh.getRange(row, 1, 1, head.length).setValues([vals]);
  else sh.appendRow(vals);
}
function deleteRow(name, idVal, idHeader) {
  var sh = getSheet(name), data = sh.getDataRange().getValues(), idCol = data[0].indexOf(idHeader), i;
  if (idCol < 0) return;
  for (i = 1; i < data.length; i++) if (String(data[i][idCol]) === String(idVal)) { sh.deleteRow(i + 1); return; }
}
function deleteShopAndPosts(shopId, shopName) {
  var shops = readRows("Shops"), i, shop;
  if (!shopName) {
    for (i = 0; i < shops.length; i++) {
      if (String(shops[i].shopId || shops[i].id || "") === String(shopId)) {
        shopName = shops[i].shopName || shops[i].name || "";
        break;
      }
    }
  }
  deleteRow("Shops", shopId, "Shop ID");
  if (shopName) deleteRowsByValue("Posts", "Shop Name", shopName);
}
function deleteRowsByValue(name, header, value) {
  var sh = getSheet(name), data = sh.getDataRange().getValues(), col = data[0].indexOf(header), i;
  if (col < 0 || !value) return;
  for (i = data.length - 1; i >= 1; i--) {
    if (String(data[i][col]).trim() === String(value).trim()) sh.deleteRow(i + 1);
  }
}
function syncPostsForShopAssignment(shop) {
  var normalizedShop = shop || {};
  var shopName = String(normalizedShop.shopName || normalizedShop.name || "").trim();
  var assignedPerson = String(normalizedShop.assignedPerson || normalizedShop.assignedTo || "").trim();
  var assignedEmail = String(normalizedShop.assignedEmail || normalizedShop.assignedEmailAddress || "").trim();
  var sh, data, head, shopCol, assignedPersonCol, assignedEmailCol, i;
  if (!shopName) return;

  sh = getSheet("Posts");
  data = sh.getDataRange().getValues();
  if (data.length <= 1) return;

  head = data[0];
  shopCol = head.indexOf("Shop Name");
  assignedPersonCol = head.indexOf("Assigned Person");
  assignedEmailCol = head.indexOf("Assigned Email");
  if (shopCol < 0 || assignedPersonCol < 0 || assignedEmailCol < 0) return;

  for (i = 1; i < data.length; i++) {
    if (String(data[i][shopCol]).trim() !== shopName) continue;
    data[i][assignedPersonCol] = assignedPerson;
    data[i][assignedEmailCol] = assignedEmail;
  }

  sh.getRange(1, 1, data.length, head.length).setValues(data);
}
function saveSetting(rec) {
  var sh = getSheet("Settings"), data = sh.getDataRange().getValues(), head = data[0], row = -1, vals = [], i;
  if (String(rec.type || "") === "Notification" && String(rec.name || "") === "Daily reminder email") {
    rec.value2 = normalizeReminderTime(rec.value2 || "21:00");
  }
  for (i = 1; i < data.length; i++) if (String(data[i][0]) === String(rec.type) && String(data[i][1]) === String(rec.name)) row = i + 1;
  for (i = 0; i < head.length; i++) vals.push(valueFor(rec, head[i]));
  if (row > -1) {
    sh.getRange(row, 1, 1, head.length).setValues([vals]);
  } else {
    sh.appendRow(vals);
    row = sh.getLastRow();
  }
  if (String(rec.type || "") === "Notification" && String(rec.name || "") === "Daily reminder email") {
    sh.getRange(row, 4).setNumberFormat("@").setValue(String(rec.value2 || "21:00"));
  }
}
function deleteSetting(type, name) {
  var sh = getSheet("Settings"), data = sh.getDataRange().getValues(), i;
  for (i = 1; i < data.length; i++) if (String(data[i][0]) === String(type) && String(data[i][1]) === String(name)) { sh.deleteRow(i + 1); return; }
}
function maybeConfigureNotificationTrigger(setting) {
  if (String(setting.type || "") !== "Notification" || String(setting.name || "") !== "Daily reminder email") return;
  configureDailyNotificationTrigger(String(setting.value1 || "") === "true", String(setting.value2 || "21:00"));
}
function configureDailyNotificationTrigger(enabled, timeValue) {
  var triggers = ScriptApp.getProjectTriggers(), i;
  for (i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction && triggers[i].getHandlerFunction() === "runDailyPendingPostNotifications") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  if (!enabled) return;
  PropertiesService.getScriptProperties().setProperty("pendingNotificationTime", normalizeReminderTime(timeValue));
  ScriptApp.newTrigger("runDailyPendingPostNotifications").timeBased().everyMinutes(1).create();
}
function runDailyPendingPostNotifications() {
  if (!shouldRunPendingNotificationsNow()) return { status: "success", sent: 0, skipped: true };
  return sendPendingNotifications();
}
function normalizeReminderTime(value) {
  var text, parsed, parts, hour, minute;
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  text = String(value || "21:00").trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    parsed = new Date(text);
    if (!isNaN(parsed.getTime())) return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "HH:mm");
  }
  parts = text.split(":");
  hour = parseInt(parts[0], 10);
  minute = parseInt(parts[1], 10);
  if (isNaN(hour) || hour < 0 || hour > 23) hour = 21;
  if (isNaN(minute) || minute < 0 || minute > 59) minute = 0;
  return String(hour).replace(/^(\d)$/, "0$1") + ":" + String(minute).replace(/^(\d)$/, "0$1");
}
function shouldRunPendingNotificationsNow() {
  var settings = readRows("Settings"), enabled = true, target = PropertiesService.getScriptProperties().getProperty("pendingNotificationTime") || "21:00";
  var now = new Date(), tz = Session.getScriptTimeZone(), today, currentTime, currentMinutes, targetMinutes, i, s, marker;

  for (i = 0; i < settings.length; i++) {
    s = settings[i];
    if (String(s.type || "") === "Notification" && String(s.name || "") === "Daily reminder email") {
      enabled = String(s.value1 || "").toLowerCase() === "true";
      target = normalizeReminderTime(s.value2 || target);
      break;
    }
  }
  if (!enabled) return false;

  currentTime = Utilities.formatDate(now, tz, "HH:mm");
  currentMinutes = minutesFromTime(currentTime);
  targetMinutes = minutesFromTime(target);
  if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 15) return false;

  today = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  marker = "pendingNotificationSentOn_" + target;
  if (PropertiesService.getScriptProperties().getProperty(marker) === today) return false;
  PropertiesService.getScriptProperties().setProperty(marker, today);
  return true;
}
function minutesFromTime(value) {
  var parts = String(value || "00:00").split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}
function getNotificationDiagnostics() {
  var settings = readRows("Settings"), enabled = true, target = PropertiesService.getScriptProperties().getProperty("pendingNotificationTime") || "21:00";
  var now = new Date(), tz = Session.getScriptTimeZone(), i, s, currentTime, currentMinutes, targetMinutes;
  for (i = 0; i < settings.length; i++) {
    s = settings[i];
    if (String(s.type || "") === "Notification" && String(s.name || "") === "Daily reminder email") {
      enabled = String(s.value1 || "").toLowerCase() === "true";
      target = normalizeReminderTime(s.value2 || target);
      break;
    }
  }
  currentTime = Utilities.formatDate(now, tz, "HH:mm");
  currentMinutes = minutesFromTime(currentTime);
  targetMinutes = minutesFromTime(target);
  return {
    enabled: enabled,
    targetTime: target,
    currentTime: currentTime,
    dueWindowOpen: enabled && currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + 15,
    lastSentToday: PropertiesService.getScriptProperties().getProperty("pendingNotificationSentOn_" + target) || ""
  };
}
function sendPendingNotifications() {
  var members = readRows("Settings"), posts = readRows("Posts"), shops = readRows("Shops");
  var sent = 0, groups = {}, i, member, email, name, result;
  var forceSend = arguments.length > 0 && arguments[0] && arguments[0].force;

  for (i = 0; i < members.length; i++) {
    member = members[i];
    if (String(member.type || "") !== "TeamMember") continue;
    name = String(member.name || "").trim();
    email = String(member.value1 || member.email || "").trim();
    if (!email || groups[email]) continue;
    result = sendPendingNotificationsForMember({ name: name, email: email, posts: posts, shops: shops, members: members, force: forceSend });
    sent += Number(result.sent || 0);
    groups[email] = true;
  }
  return { status: "success", sent: sent };
}
function sendPendingNotificationsForMember(member) {
  var name = String(member.name || "").trim();
  var email = String(member.email || "").trim();
  var posts = member.posts || readRows("Posts");
  var shops = member.shops || readRows("Shops");
  var members = member.members || readRows("Settings");
  var shopAssignments = buildShopAssignmentMap(shops, members);
  var pending = [], i, p, assignedName, assignedEmail, status, shopName, fallback;
  var notificationsEnabled = isDailyReminderEnabled(members);
  var forceSend = Boolean(member.force);

  if (!email) return { status: "success", sent: 0, message: "No email address provided." };
  if (!notificationsEnabled && !forceSend) return { status: "success", sent: 0, skipped: true, message: "Daily reminder email is disabled." };

  for (i = 0; i < posts.length; i++) {
    p = posts[i];
    status = String(p.status || "").trim().toLowerCase();
    assignedName = String(p.assignedPerson || p.assignedTo || "").trim();
    assignedEmail = String(p.assignedEmail || p.assignedEmailAddress || "").trim();
    shopName = String(p.shopName || "").trim();
    fallback = shopAssignments[shopName] || {};
    if (!assignedName) assignedName = fallback.name || "";
    if (!assignedEmail) assignedEmail = fallback.email || "";
    if (status === "posted" || status === "published" || status === "done") continue;
    if (!forceSend && !isPostDueForReminder(p)) continue;
    if ((name && assignedName === name) || assignedEmail === email) pending.push(p);
  }

  if (pending.length === 0) return { status: "success", sent: 0 };

  MailApp.sendEmail({
    to: email,
    subject: "Pending social media posts need publishing",
    body: buildPendingPostsEmail(name, pending)
  });

  for (i = 0; i < pending.length; i++) {
    saveRow("Notifications Log", {
      logId: "log_" + new Date().getTime() + "_" + i,
      timestamp: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      postId: pending[i].postId || pending[i].id || "",
      shopName: pending[i].shopName || "",
      assignedEmail: email,
      status: pending[i].status || "Pending",
      actionTaken: "Pending post email sent"
    }, "Log ID");
  }

  return { status: "success", sent: pending.length };
}
function isDailyReminderEnabled(settings) {
  var rows = settings || readRows("Settings"), i, s;
  for (i = 0; i < rows.length; i++) {
    s = rows[i];
    if (String(s.type || "") === "Notification" && String(s.name || "") === "Daily reminder email") {
      return String(s.value1 || "").toLowerCase() === "true";
    }
  }
  return true;
}
function buildShopAssignmentMap(shops, members) {
  var memberEmails = {}, map = {}, i, m, s, assignedName, assignedEmail, shopName;
  for (i = 0; i < members.length; i++) {
    m = members[i];
    if (String(m.type || "") === "TeamMember") memberEmails[String(m.name || "").trim()] = String(m.value1 || "").trim();
  }
  for (i = 0; i < shops.length; i++) {
    s = shops[i];
    shopName = String(s.shopName || s.name || "").trim();
    assignedName = String(s.assignedPerson || s.assignedTo || "").trim();
    assignedEmail = String(s.assignedEmail || s.assignedEmailAddress || "").trim();
    if (!assignedEmail && assignedName) assignedEmail = memberEmails[assignedName] || "";
    if (shopName) map[shopName] = { name: assignedName, email: assignedEmail };
  }
  return map;
}
function buildPendingPostsEmail(name, posts) {
  var lines = [], i, p;
  lines.push("Hi " + (name || "there") + ",");
  lines.push("");
  lines.push("These social media posts are not published yet:");
  lines.push("");
  for (i = 0; i < posts.length; i++) {
    p = posts[i];
    lines.push("- " + (p.title || p.caption || p.category || "Untitled post") +
      " | Shop: " + (p.shopName || "-") +
      " | Publishing date: " + formatSheetValue(p.postingDate) +
      " | Status: " + (p.status || "Pending"));
  }
  lines.push("");
  lines.push("Please publish them or update their status in Social Media Tracker.");
  return lines.join("\n");
}
function isPostDueForReminder(post) {
  var postingDate = toDateKey(post && post.postingDate);
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  if (!postingDate) return false;
  return postingDate <= today;
}
function toDateKey(value) {
  var text, match, parsed;
  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isNaN(value.getTime())) return "";
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  text = String(value || "").trim();
  if (!text) return "";
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[1] + "-" + match[2] + "-" + match[3];
  parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return "";
}
function formatSheetValue(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "-");
}
function ensureHeaders(sh, name) {
  var map = {
    "Shops": ["Shop ID", "Shop Name", "Description", "Assigned Person", "Assigned Email"],
    "Posts": ["Post ID", "Shop Name", "Title", "Platform", "Category", "Created", "Description", "Instruction", "Assets Link", "Caption", "Posting Date", "Posting Time", "Status", "Assigned Person", "Assigned Email", "Post URL"],
    "Settings": ["Type", "Name", "Value1", "Value2", "Value3"],
    "Notifications Log": ["Log ID", "Timestamp", "Post ID", "Shop Name", "Assigned Email", "Status", "Action Taken"]
  }, need = map[name], current, merged = [], i;
  if (!need) return;
  current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  for (i = 0; i < current.length; i++) if (String(current[i] || "").trim()) merged.push(String(current[i]).trim());
  for (i = 0; i < need.length; i++) if (merged.indexOf(need[i]) < 0) merged.push(need[i]);
  sh.getRange(1, 1, 1, merged.length).setValues([merged]);
}
function toKey(v) {
  var p = String(v || "").trim().replace(/[_-]+/g, " ").replace(/[^\w\s]/g, "").split(/\s+/), out = "", i, s;
  for (i = 0; i < p.length; i++) { s = p[i].toLowerCase(); if (s) out += i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1); }
  return out;
}
function valueFor(rec, header) {
  var k = toKey(header);
  var a = { shopId: ["shopId", "id"], postId: ["postId", "id"], logId: ["logId", "id"], shopName: ["shopName", "name"], assetsLink: ["assetsLink", "driveLink"], postUrl: ["postUrl", "url"] }[k] || [k], i;
  for (i = 0; i < a.length; i++) if (rec[a[i]] !== undefined) return rec[a[i]];
  return "";
}
