// Configuration for Social Media Tracker
// Open any page with ?demo=1 to use browser-only faculty demo data.
const demoParams = new URLSearchParams(window.location.search);
const DEMO_MODE_STORAGE_KEY = "socialtrack_demo_mode";
const DEMO_RESET_STORAGE_KEY = "socialtrack_demo_reset_requested";

if (demoParams.get("demo") === "1") {
  sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
}
if (demoParams.get("demo") === "0") {
  sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY);
}
if (demoParams.get("demoReset") === "1") {
  sessionStorage.setItem(DEMO_RESET_STORAGE_KEY, "1");
}

const CONFIG = {
  DEMO_MODE: sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === "1",
  DEMO_RESET_REQUESTED: sessionStorage.getItem(DEMO_RESET_STORAGE_KEY) === "1",
  // Pasting Google Apps Script Web App URL here enables Google Sheets sync.
  // Required for Google Sheets sync.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxrkefkeWvtD1X9Sl6la94cC7GG1mmmWg7KzDaVdD0E8iTata7RyR0z2IvNGL9Osz8q/exec",

  // Add your Google OAuth web client ID to enable Google Sign-In.
  GOOGLE_CLIENT_ID: "",

  // Default fallback user profile, editable from Settings page
  DEFAULT_PROFILE: {
    name: "Alex Sterling",
    email: "alex@socialtrack.com",
    role: "Admin Level",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-PC-xcxRCGAGBUm09n46vnbncwXRbRaVDMJBxRU_cQtrmJg20V0ftywU5eAH8Ay1WNmMBlSnhPom15E7CfcuzRLEEECP3PN1Lg2ebW5p_rOIvJptZdzt33dNm07OEaB57xCvGhBLhKwgtOo3vF3SqAb489J8HGcjSgm-klXEVLDR7SgOzMg9rSnrrFObafNk92kNTDxwGLSchPdGPJk_Z-B_Fs8D7iqsXBnwrhXp9y_DEhp_9FHEQIvFidV-OgRJamMJrZTUtpQ"
  }
};
