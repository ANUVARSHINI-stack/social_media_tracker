// shared.js - Common Logic, Design Sync, and UI Utilities
document.addEventListener("DOMContentLoaded", () => {
  normalizeGlobalTypography();
  injectResponsiveShellStyles();

  // 1. Rename Kinetic Enterprise -> Social Media Tracker
  applyRebrand();
  normalizeSidebarShell();
  normalizeSidebarBrand();
  normalizeSidebarNavigation();
  normalizeResponsiveShell();
  setupResponsiveSidebar();
  removeDuplicateBrandText();

  // 2. Remove header-only actions requested from every page
  removeHeaderActionIcons();
  removeGoogleAuthControl();

  // 3. Render User Profile Dynamically
  renderProfile();
  normalizeSidebarShell();
  normalizeSidebarBrand();
  normalizeSidebarNavigation();
  normalizeResponsiveShell();
  removeDuplicateBrandText();
  removeGoogleAuthControl();

  // 4. Setup Sync Status Pill in Header
  setupSyncStatusPill();

  // 5. Setup 9-dot (Apps) Menu
  setupAppsMenu();

  // 6. Setup Notification Panel
  setupNotificationPanel();

  // 7. Remove broken navigation and campaign actions
  cleanNavigationAndCampaigns();
  applyAccessControl();
  bindLogoutLinks();

  // Listen to data refreshes to reload content
  window.addEventListener("api-data-refreshed", () => {
    renderProfile();
    updateNotificationBellCount();
    applyAccessControl();
  });
  window.addEventListener("api-local-change", () => {
    renderProfile();
    updateNotificationBellCount();
    applyAccessControl();
  });
});

function normalizeGlobalTypography() {
  document.body.style.fontFamily = "'Inter', sans-serif";

  if (document.getElementById("global-typography-normalizer")) return;
  const style = document.createElement("style");
  style.id = "global-typography-normalizer";
  style.textContent = `
    body {
      font-family: 'Inter', sans-serif !important;
      font-size: 14px;
      line-height: 20px;
    }
    aside,
    aside *:not(.material-symbols-outlined) {
      font-family: 'Inter', sans-serif !important;
    }
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined' !important;
      font-weight: normal !important;
      font-style: normal !important;
      font-size: 24px;
      line-height: 1 !important;
      letter-spacing: normal !important;
      text-transform: none !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
      font-feature-settings: 'liga';
      overflow: hidden;
      width: 24px;
      min-width: 24px;
      height: 24px;
      vertical-align: middle;
    }
    aside h1 {
      font-size: 20px !important;
      line-height: 28px !important;
      font-weight: 700 !important;
      letter-spacing: 0 !important;
    }
    aside nav a span:not(.material-symbols-outlined),
    aside [data-sidebar-footer="true"] a span:not(.material-symbols-outlined) {
      font-size: 14px !important;
      line-height: 20px !important;
      font-weight: 400 !important;
      letter-spacing: 0 !important;
    }
    aside nav a.text-primary span:not(.material-symbols-outlined) {
      font-weight: 700 !important;
    }
    main > header h2,
    .ml-64 > header h2 {
      font-size: 14px !important;
      line-height: 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

function injectResponsiveShellStyles() {
  if (document.getElementById("responsive-shell-normalizer")) return;
  const style = document.createElement("style");
  style.id = "responsive-shell-normalizer";
  style.textContent = `
    aside {
      height: 100dvh !important;
    }
    @media (max-width: 1023px) {
      body {
        overflow-x: hidden;
      }
      body.sidebar-open {
        overflow: hidden;
      }
      aside {
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
      }
      body.sidebar-open aside {
        transform: translateX(0);
      }
      main,
      .ml-64 {
        margin-left: 0 !important;
      }
      main {
        width: 100% !important;
        min-width: 0;
      }
      header,
      main > header,
      .ml-64 > header,
      .flex-1 > header {
        padding-left: 16px !important;
        padding-right: 16px !important;
        min-height: 64px !important;
        height: auto !important;
        gap: 12px !important;
        flex-wrap: wrap !important;
      }
      body > header {
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
      }
      main > header > div,
      .ml-64 > header > div,
      .flex-1 > header > div,
      header > div {
        min-width: 0;
      }
      body > header > div:first-child {
        flex: 1 1 100%;
        order: 2;
      }
      body > header > div:last-child {
        flex: 1 1 100%;
        order: 1;
        justify-content: space-between !important;
        gap: 8px !important;
      }
      body > header input[type="text"] {
        min-width: 0;
      }
      body > header .w-96,
      body > header .max-w-md {
        width: 100% !important;
        max-width: none !important;
      }
      body > header .space-x-6,
      body > header .gap-6 {
        gap: 8px !important;
      }
      body > header.header-mobile-optimized {
        display: grid !important;
        grid-template-columns: auto 1fr auto !important;
        align-items: center !important;
        row-gap: 10px !important;
        column-gap: 10px !important;
        padding-top: 12px !important;
        padding-bottom: 12px !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }
      body > header.header-mobile-optimized .responsive-sidebar-toggle {
        grid-column: 1;
        grid-row: 1;
      }
      body > header.header-mobile-optimized .header-trailing-group {
        grid-column: 3;
        grid-row: 1;
        justify-self: end;
        width: auto !important;
      }
      body > header.header-mobile-optimized .header-leading-group {
        grid-column: 1 / span 3;
        grid-row: 2;
        width: 100% !important;
      }
      body > header.header-mobile-optimized .header-leading-group > div,
      body > header.header-mobile-optimized .header-leading-group {
        width: 100% !important;
        max-width: none !important;
      }
      body > main {
        padding-top: 152px !important;
      }
      .p-margin-desktop,
      .px-margin-desktop,
      .p-gutter {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .p-margin-desktop {
        padding-top: 16px !important;
        padding-bottom: 16px !important;
      }
      .px-gutter {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .max-w-container-max {
        max-width: 100% !important;
      }
      table {
        min-width: 640px;
      }
      .responsive-sidebar-toggle {
        display: inline-flex !important;
      }
      .responsive-sidebar-scrim {
        display: block;
      }
      #sync-status-pill {
        padding: 6px 10px !important;
      }
      #sync-status-pill span:last-child {
        white-space: nowrap;
        font-size: 10px !important;
      }
      body:not(.sidebar-open) .responsive-sidebar-scrim {
        opacity: 0;
        pointer-events: none;
      }
      body.sidebar-open .responsive-sidebar-scrim {
        opacity: 1;
        pointer-events: auto;
      }
    }
    @media (max-width: 520px) {
      #sync-status-pill {
        display: none !important;
      }
      body > header.header-mobile-optimized {
        row-gap: 8px !important;
      }
      body > header.header-mobile-optimized .header-leading-group {
        min-width: 0;
      }
      body > header .flex.items-center.space-x-6,
      body > header .flex.items-center.gap-6 {
        width: 100%;
      }
      body > header .flex.items-center.space-x-6 > div:last-child,
      body > header .flex.items-center.gap-6 > div:last-child {
        margin-left: auto;
      }
    }
    @media (min-width: 1024px) {
      .responsive-sidebar-toggle,
      .responsive-sidebar-scrim {
        display: none !important;
      }
      aside {
        transform: none !important;
        box-shadow: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function getTodayLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeResponsiveShell() {
  const main = document.querySelector("main");
  if (!main) return;
  main.classList.add("min-w-0");

  const header = document.querySelector("header");
  if (header) {
    header.classList.add("gap-3");
    const headerChildren = Array.from(header.children);
    headerChildren.forEach(child => child.classList?.add("min-w-0"));
    if (header.parentElement === document.body) {
      header.classList.add("header-mobile-optimized");
      const originalGroups = headerChildren.filter(child => child.tagName === "DIV");
      if (originalGroups[0]) originalGroups[0].classList.add("header-leading-group");
      if (originalGroups[1]) originalGroups[1].classList.add("header-trailing-group");
    }
  }
}

function setupResponsiveSidebar() {
  const sidebar = document.querySelector("aside");
  const header = document.querySelector("header");
  if (!sidebar || !header) return;

  let scrim = document.querySelector(".responsive-sidebar-scrim");
  if (!scrim) {
    scrim = document.createElement("button");
    scrim.type = "button";
    scrim.className = "responsive-sidebar-scrim fixed inset-0 z-40 bg-black/30 transition-opacity duration-200";
    scrim.setAttribute("aria-label", "Close navigation");
    scrim.addEventListener("click", closeResponsiveSidebar);
    document.body.appendChild(scrim);
  }

  let toggle = document.querySelector(".responsive-sidebar-toggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "responsive-sidebar-toggle hidden h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low text-on-surface-variant";
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.innerHTML = `<span class="material-symbols-outlined">menu</span>`;
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
    });
  }

  const leadingGroup = header.firstElementChild;
  if (header.parentElement === document.body) {
    if (!toggle.parentElement) {
      header.insertBefore(toggle, header.firstChild);
    }
  } else if (leadingGroup) {
    if (!toggle.parentElement) {
      leadingGroup.insertBefore(toggle, leadingGroup.firstChild);
    }
    leadingGroup.classList.add("flex-wrap");
  } else if (!toggle.parentElement) {
    header.insertBefore(toggle, header.firstChild);
  }

  document.querySelectorAll("aside a").forEach(link => {
    if (link.dataset.responsiveSidebarBound === "true") return;
    link.dataset.responsiveSidebarBound = "true";
    link.addEventListener("click", () => closeResponsiveSidebar());
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closeResponsiveSidebar();
  });
}

function closeResponsiveSidebar() {
  document.body.classList.remove("sidebar-open");
}

function removeHeaderActionIcons() {
  const removableIcons = ["apps", "notifications", "calendar_month", "calendar_today"];
  document.querySelectorAll("header button span.material-symbols-outlined").forEach(icon => {
    const iconName = icon.getAttribute("data-icon") || icon.textContent.trim();
    if (!removableIcons.includes(iconName)) return;
    const button = icon.closest("button");
    if (button) button.remove();
  });

  document.querySelectorAll("header .flex.items-center.space-x-4, header .flex.items-center.gap-4, header .flex.items-center.gap-6").forEach(group => {
    if (!group.querySelector("button") && !group.querySelector("img") && group.children.length === 0) {
      group.remove();
    }
  });
}

function removeGoogleAuthControl() {
  const authButton = document.getElementById("google-auth-control");
  if (authButton) authButton.remove();

  document.querySelectorAll("header button").forEach(button => {
    const label = button.textContent.trim();
    if ((label.includes("Google") && label.includes("Sign")) || label === "Sign out") {
      button.remove();
    }
  });
}

function removeDuplicateBrandText() {
  document.querySelectorAll("body h1, body h2, body h3, body span, body p").forEach(element => {
    if (element.closest("aside")) return;
    const text = element.textContent.trim();
    if (text === "Social Media Tracker") {
      element.remove();
      return;
    }
    if (text.includes("Social Media Tracker") && (text.includes("©") || text.includes("All rights reserved"))) {
      element.remove();
    }
  });
}

function applyRebrand() {
  // Replace legacy brand names in page titles, sidebars, and footers
  const replaceTexts = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.nodeValue;
      if (text.includes("Kinetic Enterprise")) {
        node.nodeValue = text.replace(/Kinetic Enterprise/g, "Social Media Tracker");
      }
      if (text.includes("Kinetic")) {
        // Avoid replacing campaigns titles like "Kinetic Fall Campaign"
        node.nodeValue = text.replace(/Kinetic(?!\s+Fall)/g, "Social Media Tracker");
      }
      if (text.includes("SocialTrack")) {
        node.nodeValue = text.replace(/SocialTrack/g, "Social Media Tracker");
      }
      if (text.includes("Social Tracker")) {
        node.nodeValue = text.replace(/Social Tracker/g, "Social Media Tracker");
      }
    } else {
      for (let child of node.childNodes) {
        // Skip inputs and textareas
        if (child.nodeName !== "INPUT" && child.nodeName !== "TEXTAREA") {
          replaceTexts(child);
        }
      }
    }
  };
  replaceTexts(document.body);

  // Update Page Title if it contains Kinetic
  if (document.title.includes("Kinetic")) {
    document.title = document.title.replace(/Kinetic Enterprise/g, "Social Media Tracker").replace(/Kinetic/g, "Social Media Tracker");
  }
  if (document.title.includes("SocialTrack")) {
    document.title = document.title.replace(/SocialTrack/g, "Social Media Tracker");
  }
  if (document.title.includes("Social Tracker")) {
    document.title = document.title.replace(/Social Tracker/g, "Social Media Tracker");
  }
}

function normalizeSidebarShell() {
  const sidebar = document.querySelector("aside");
  if (!sidebar) return;
  sidebar.className = "h-screen w-64 fixed left-0 top-0 flex flex-col py-6 bg-surface border-r border-border-subtle z-50";
}

function normalizeSidebarBrand() {
  const sidebar = document.querySelector("aside");
  if (!sidebar) return;
  normalizeSidebarShell();

  const heading = sidebar.querySelector("h1");
  let brandBlock = sidebar.querySelector('[data-sidebar-brand="true"]');
  if (!brandBlock && heading) {
    let candidate = heading.parentElement;
    while (candidate && candidate.parentElement !== sidebar) {
      candidate = candidate.parentElement;
    }
    brandBlock = candidate;
  }
  if (!brandBlock) brandBlock = sidebar.firstElementChild;
  if (!brandBlock || brandBlock.tagName === "NAV") {
    brandBlock = document.createElement("div");
    sidebar.insertBefore(brandBlock, sidebar.firstChild);
  }

  brandBlock.dataset.sidebarBrand = "true";
  brandBlock.className = "px-6 mb-10 flex items-center min-h-10";
  brandBlock.innerHTML = `
    <div class="min-w-0">
      <h1 class="font-bold text-[20px] leading-7 text-primary tracking-normal whitespace-nowrap">Social Media Tracker</h1>
      <p class="font-label-sm text-label-sm text-on-surface-variant hidden"></p>
    </div>
  `;
}

function normalizeSidebarNavigation() {
  const sidebar = document.querySelector("aside");
  if (!sidebar) return;
  normalizeSidebarShell();

  const nav = sidebar.querySelector("nav") || document.createElement("nav");
  if (!nav.parentElement) {
    const brandBlock = sidebar.querySelector('[data-sidebar-brand="true"]') || sidebar.firstElementChild;
    sidebar.insertBefore(nav, brandBlock ? brandBlock.nextSibling : sidebar.firstChild);
  }

  nav.className = "flex-1 px-3 space-y-1";
  const items = [
    { label: "Dashboard", href: "index.html", icon: "dashboard" },
    { label: "Shops", href: "shops.html", icon: "storefront" },
    { label: "Calendar", href: "shop_details_calendar.html", icon: "calendar_today" },
    { label: "Reports", href: "reports.html", icon: "analytics" },
    { label: "Settings", href: "settings.html", icon: "settings" }
  ];

  nav.innerHTML = items.map(item => `
    <a class="sidebar-nav-link flex items-center px-3 py-2.5 rounded-r-lg group transition-all duration-200" href="${item.href}" data-sidebar-label="${item.label}">
      <span class="material-symbols-outlined mr-3" data-icon="${item.icon}">${item.icon}</span>
      <span class="font-body-md text-body-md">${item.label}</span>
    </a>
  `).join("");

  normalizeSidebarFooter(sidebar);
  updateSidebarActiveState();
}

function normalizeSidebarFooter(sidebar) {
  const nav = sidebar.querySelector("nav");
  const brandBlock = sidebar.querySelector('[data-sidebar-brand="true"]');
  Array.from(sidebar.children).forEach(child => {
    if (child === brandBlock || child === nav || child.dataset.sidebarFooter === "true") return;
    child.remove();
  });

  let footer = sidebar.querySelector('[data-sidebar-footer="true"]');
  if (!footer) {
    footer = document.createElement("div");
    footer.dataset.sidebarFooter = "true";
    sidebar.appendChild(footer);
  }

  footer.className = "mt-auto px-3 border-t border-border-subtle pt-6 space-y-1";
  footer.innerHTML = `
    <a class="flex items-center px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-lowest rounded-lg transition-all duration-200" href="settings.html">
      <span class="material-symbols-outlined mr-3" data-icon="help">help</span>
      <span class="font-body-md text-body-md">Help</span>
    </a>
    <a class="flex items-center px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-lowest rounded-lg transition-all duration-200" href="#" data-logout-link="true">
      <span class="material-symbols-outlined mr-3" data-icon="logout">logout</span>
      <span class="font-body-md text-body-md">Logout</span>
    </a>
  `;
}

function renderProfile() {
  const profile = API.getUserProfile();
  
  // Replace profile photos with a simple profile icon.
  const profileImgs = document.querySelectorAll('header img[alt*="User"], aside img[alt*="User"]');
  profileImgs.forEach(img => {
    const holder = img.parentElement;
    if (!holder) return;
    holder.classList.add("flex", "items-center", "justify-center");
    holder.innerHTML = `<span class="material-symbols-outlined text-primary text-[22px]" data-profile-icon="true">person</span>`;
  });

  // Find profile name and role texts
  const profileNames = document.querySelectorAll('header p.text-text-primary, header p.text-on-surface, header .text-right p:first-child, aside p.text-text-primary, aside p.text-on-surface, aside .hidden.lg\\:block p:first-child');
  profileNames.forEach(p => {
    if (p.textContent !== "Alex Sterling" && p.textContent !== "Alex Rivera") {
      // If it's a sibling of "Admin Level" or similar
    }
    // Set text directly if it aligns with the name layout
    if (p.classList.contains("font-label-md") || p.classList.contains("text-label-md") || p.classList.contains("font-bold") || p.textContent.includes("Alex")) {
      p.textContent = profile.name;
    }
  });

  const profileRoles = document.querySelectorAll('header p.text-on-surface-variant, header p.text-text-secondary, aside p.text-on-surface-variant, aside p.text-text-secondary');
  profileRoles.forEach(p => {
    const sidebarBrandBlock = p.closest("aside") && p.closest("aside").querySelector("h1")?.closest("div")?.contains(p);
    if (sidebarBrandBlock) return;
    if (p.textContent === "Admin Level" || p.textContent === "Admin" || p.textContent === "Marketing Pro") {
      p.textContent = profile.role;
    }
  });
  normalizeSidebarBrand();
}

function setupSyncStatusPill() {
  const header = document.querySelector("header");
  if (!header) return;

  // Check if header already has a status pill container
  let pillContainer = document.getElementById("sync-status-pill");
  if (!pillContainer) {
    pillContainer = document.createElement("div");
    pillContainer.id = "sync-status-pill";
    pillContainer.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-label-sm font-semibold transition-all border";
    
    // Insert before profile avatar or trailing items
    const rightSection = header.querySelector(".flex.items-center.space-x-6, .flex.items-center.gap-6");
    if (rightSection) {
      rightSection.insertBefore(pillContainer, rightSection.firstChild);
    }
  }

  function updatePill(status, message) {
    pillContainer.className = "flex items-center space-x-1.5 px-3 py-1 py-1.5 rounded-full text-[11px] font-semibold transition-all border shadow-sm ";
    
    if (status === "local") {
      pillContainer.classList.add("bg-surface-container", "text-on-surface-variant", "border-border-subtle");
      pillContainer.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-outline"></span><span>Local Storage Mode</span>`;
    } else if (status === "synced") {
      pillContainer.classList.add("bg-green-50", "text-status-completed", "border-status-completed/20");
      pillContainer.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-status-completed"></span><span>Sheets Connected</span>`;
    } else if (status === "syncing") {
      pillContainer.classList.add("bg-yellow-50", "text-status-scheduled", "border-status-scheduled/20");
      pillContainer.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-status-scheduled animate-pulse"></span><span>Syncing...</span>`;
    } else if (status === "error") {
      pillContainer.classList.add("bg-red-50", "text-status-missed", "border-status-missed/20");
      pillContainer.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-status-missed"></span><span>Sync Error</span>`;
    }
    pillContainer.title = message || "";
  }

  // Subscribe to changes
  API.onStatusChange(updatePill);
  window.addEventListener("api-status-change", (e) => {
    updatePill(e.detail.status, e.detail.message);
  });
}

function setupAppsMenu() {
  const appsBtn = document.querySelector('button span[data-icon="apps"]');
  if (!appsBtn) return;

  const button = appsBtn.closest("button");
  button.classList.add("relative");

  // Create Apps Menu Dropdown
  const menu = document.createElement("div");
  menu.id = "apps-dropdown-menu";
  menu.className = "absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border-subtle rounded-xl shadow-lg p-3 hidden z-50 animate-slide-up";
  menu.innerHTML = `
    <p class="font-label-sm text-label-sm text-text-secondary uppercase px-2 mb-2 tracking-wider">Quick Switcher</p>
    <div class="grid grid-cols-2 gap-2">
      <a href="index.html" class="flex flex-col items-center justify-center p-3 hover:bg-surface-container-low rounded-lg transition-colors group">
        <span class="material-symbols-outlined text-primary mb-1 group-hover:scale-110 transition-transform">dashboard</span>
        <span class="text-[11px] font-medium text-text-primary text-center">Dashboard</span>
      </a>
      <a href="shops.html" class="flex flex-col items-center justify-center p-3 hover:bg-surface-container-low rounded-lg transition-colors group">
        <span class="material-symbols-outlined text-secondary mb-1 group-hover:scale-110 transition-transform">storefront</span>
        <span class="text-[11px] font-medium text-text-primary text-center">Shops</span>
      </a>
      <a href="shop_details_calendar.html" class="flex flex-col items-center justify-center p-3 hover:bg-surface-container-low rounded-lg transition-colors group">
        <span class="material-symbols-outlined text-tertiary mb-1 group-hover:scale-110 transition-transform">calendar_month</span>
        <span class="text-[11px] font-medium text-text-primary text-center">Calendar</span>
      </a>
      <a href="reports.html" class="flex flex-col items-center justify-center p-3 hover:bg-surface-container-low rounded-lg transition-colors group">
        <span class="material-symbols-outlined text-status-completed mb-1 group-hover:scale-110 transition-transform">analytics</span>
        <span class="text-[11px] font-medium text-text-primary text-center">Reports</span>
      </a>
    </div>
    <div class="border-t border-border-subtle my-2"></div>
    <a href="settings.html" class="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low rounded-lg text-label-md font-medium text-text-primary">
      <span class="material-symbols-outlined text-outline text-lg">settings</span>
      <span>Settings</span>
    </a>
  `;

  button.appendChild(menu);

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    menu.classList.add("hidden");
  });
}

function setupNotificationPanel() {
  const notifBtn = document.querySelector('button span[data-icon="notifications"]');
  if (!notifBtn) return;

  const button = notifBtn.closest("button");
  button.classList.add("relative");

  // Create Notification Dot if not present
  let dot = button.querySelector(".absolute");
  if (!dot) {
    dot = document.createElement("span");
    dot.className = "absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface hidden";
    button.appendChild(dot);
  }

  // Create Dropdown Panel
  const panel = document.createElement("div");
  panel.id = "notification-panel-dropdown";
  panel.className = "absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-border-subtle rounded-xl shadow-lg py-3 px-4 hidden z-50 animate-slide-up text-left";
  panel.style.maxHeight = "400px";
  panel.style.overflowY = "auto";
  
  button.appendChild(panel);

  function renderLogs() {
    const logs = API.getLogs().slice(0, 10); // show last 10 logs
    const todayStr = getTodayLocalDateString();
    const pendingCount = API.getPosts().filter(p => p.status === "Pending" && p.postingDate && p.postingDate <= todayStr).length;
    
    if (pendingCount > 0) {
      dot.classList.remove("hidden");
    } else {
      dot.classList.add("hidden");
    }

    let logsHTML = "";
    if (logs.length === 0) {
      logsHTML = `<p class="text-body-md text-text-secondary italic py-4 text-center">No recent alerts or logs.</p>`;
    } else {
      logsHTML = logs.map(log => `
        <div class="py-2.5 border-b border-border-subtle last:border-0 text-left">
          <div class="flex justify-between items-start mb-0.5">
            <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${log.actionTaken}</span>
            <span class="text-[9px] text-text-secondary">${log.timestamp.split(' ')[1] || log.timestamp}</span>
          </div>
          <p class="text-body-md font-semibold text-text-primary">${log.shopName || "System Alert"}</p>
          <p class="text-label-sm text-text-secondary truncate">Notification to: ${log.assignedEmail}</p>
        </div>
      `).join("");
    }

    panel.innerHTML = `
      <div class="flex justify-between items-center pb-2 border-b border-border-subtle mb-2">
        <h4 class="font-label-md text-label-md font-bold text-text-primary">System Notifications</h4>
        ${pendingCount > 0 ? `<span class="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">${pendingCount} Today Pending</span>` : ''}
      </div>
      <div class="divide-y divide-border-subtle">
        ${logsHTML}
      </div>
      <div class="pt-2 text-center border-t border-border-subtle mt-2">
        <a href="settings.html" class="text-primary hover:underline font-label-sm text-label-sm font-semibold">Configure Reminders</a>
      </div>
    `;
  }

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    renderLogs();
    panel.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  // Initial bell count set
  setTimeout(() => {
    const todayStr = getTodayLocalDateString();
    const pendingCount = API.getPosts().filter(p => p.status === "Pending" && p.postingDate && p.postingDate <= todayStr).length;
    if (pendingCount > 0) dot.classList.remove("hidden");
  }, 500);
}

function updateNotificationBellCount() {
  const notifBtn = document.querySelector('button span[data-icon="notifications"]');
  if (!notifBtn) return;
  const button = notifBtn.closest("button");
  const dot = button.querySelector(".absolute");
  if (!dot) return;
  
  const todayStr = getTodayLocalDateString();
  const pendingCount = API.getPosts().filter(p => p.status === "Pending" && p.postingDate && p.postingDate <= todayStr).length;
  if (pendingCount > 0) {
    dot.classList.remove("hidden");
  } else {
    dot.classList.add("hidden");
  }
}

function cleanNavigationAndCampaigns() {
  normalizeSidebarNavigation();

  // 1. Sidebar Links Redirection
  // Fix the links to point to the correct HTML pages
  const navLinks = document.querySelectorAll("aside nav a");
  navLinks.forEach(link => {
    const text = link.querySelector("span:not(.material-symbols-outlined)").textContent.trim();
    if (text === "Dashboard") {
      link.href = "index.html";
    } else if (text === "Shops") {
      link.href = "shops.html";
    } else if (text === "Calendar") {
      link.href = "shop_details_calendar.html";
    } else if (text === "Reports") {
      link.href = "reports.html";
    } else if (text === "Settings") {
      link.href = "settings.html";
    }
  });
  updateSidebarActiveState();

  // 2. Remove "New Campaign" sidebar/footer button completely
  const campaignButtons = document.querySelectorAll("aside button, aside a");
  campaignButtons.forEach(btn => {
    if (btn.textContent.includes("New Campaign")) {
      btn.remove();
    } else if (
      btn.textContent.includes("Support") ||
      btn.textContent.includes("Account") ||
      btn.textContent.includes("Help")
    ) {
      btn.href = "settings.html";
    }
  });
}

function bindLogoutLinks() {
  document.querySelectorAll('[data-logout-link="true"], a[href="#"]').forEach(link => {
    if (!link.textContent.includes("Logout")) return;
    if (link.dataset.logoutBound === "true") return;
    link.dataset.logoutBound = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.AUTH && AUTH.logout) AUTH.logout();
    });
  });
}

function applyAccessControl() {
  if (!window.AUTH || !AUTH.getSession) return;
  const session = AUTH.getSession();
  if (!session) return;

  if (session.access === "viewer") {
    hideViewerRestrictedNavigation();
    disableViewerMutations();
    ensureViewerMutationObserver();
    if ((window.location.pathname.split("/").pop() || "index.html") === "settings.html") {
      renderViewerSettingsProfile(session);
    }
  }
}

function hideViewerRestrictedNavigation() {
  document.querySelectorAll("aside nav a").forEach(link => {
    const label = link.dataset.sidebarLabel || link.querySelector("span:not(.material-symbols-outlined)")?.textContent.trim();
    if (label === "Reports") {
      link.remove();
    }
  });
}

function isViewerPostEditPage() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  return page === "shop_details_table.html" || page === "shop_details_calendar.html";
}

function isViewerAllowedMutationControl(element) {
  if (!isViewerPostEditPage()) return false;
  const text = (element.textContent || "").trim();
  const title = element.getAttribute("title") || "";
  const onclick = element.getAttribute("onclick") || "";
  return /edit post|^edit$|save changes/i.test(text) ||
    /edit post|^edit$/i.test(title) ||
    /openEditPostModal|requestSubmit/.test(onclick);
}

function disableViewerMutations() {
  const destructivePatterns = /(add|save|edit|delete|remove|post add|new role|new platform|new category)/i;

  document.querySelectorAll("button").forEach(button => {
    const text = button.textContent.trim();
    const title = button.getAttribute("title") || "";
    const onclick = button.getAttribute("onclick") || "";
    if (isViewerAllowedMutationControl(button)) return;
    if (destructivePatterns.test(text) || destructivePatterns.test(title) || destructivePatterns.test(onclick)) {
      button.remove();
    }
  });

  document.querySelectorAll("[onclick], [title]").forEach(element => {
    const title = element.getAttribute("title") || "";
    const onclick = element.getAttribute("onclick") || "";
    const text = element.textContent.trim();
    if (isViewerAllowedMutationControl(element)) return;
    if (destructivePatterns.test(text) || destructivePatterns.test(title) || destructivePatterns.test(onclick)) {
      if (element.tagName === "BUTTON" || element.tagName === "A" || element.classList.contains("material-symbols-outlined")) {
        const target = element.closest("button, a") || element;
        if (isViewerAllowedMutationControl(target)) return;
        target.remove();
      }
    }
  });

  if (!isViewerPostEditPage()) {
    document.querySelectorAll("th").forEach(th => {
      if (th.textContent.trim().toLowerCase() === "actions") {
        th.style.display = "none";
      }
    });
    document.querySelectorAll("td").forEach(td => {
      const actionGroup = td.querySelector("button");
      if (actionGroup && td.parentElement && td.parentElement.children.length > 1) {
        td.style.display = "none";
      }
    });
  }

  document.querySelectorAll(".group-hover\\:opacity-100, .opacity-0.group-hover\\:opacity-100, .flex.items-center.justify-end.gap-2").forEach(group => {
    if (isViewerPostEditPage() && group.querySelector('button[title="Edit Post"], button[title="Edit"]')) {
      return;
    }
    if (group.querySelector("button, a")) {
      group.remove();
    }
  });
}

function ensureViewerMutationObserver() {
  if (window.__viewerMutationObserverActive) return;
  window.__viewerMutationObserverActive = true;
  const observer = new MutationObserver(() => {
    disableViewerMutations();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function renderViewerSettingsProfile(session) {
  const canvas = document.querySelector("main > .p-gutter.max-w-container-max.mx-auto, main > div.p-gutter");
  if (!canvas || document.getElementById("viewer-profile-card")) return;

  const pageTitle = canvas.firstElementChild;
  const grid = canvas.querySelector(".grid");
  if (grid) grid.style.display = "none";

  const member = window.AUTH && AUTH.findMemberByEmail ? AUTH.findMemberByEmail(session.email) : null;
  const card = document.createElement("div");
  card.id = "viewer-profile-card";
  card.className = "max-w-2xl rounded-2xl border border-border-subtle bg-white p-6 shadow-sm";
  card.innerHTML = `
    <div class="mb-6">
      <h3 class="text-headline-sm font-headline-sm text-text-primary">My Account</h3>
      <p class="mt-1 text-body-md text-text-secondary">View-only profile details for your account.</p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
        <p class="text-label-sm text-text-secondary">Name</p>
        <p class="mt-2 text-body-md font-semibold text-text-primary">${escapeAccessHtml(session.name || "")}</p>
      </div>
      <div class="rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
        <p class="text-label-sm text-text-secondary">Email</p>
        <p class="mt-2 text-body-md font-semibold text-text-primary">${escapeAccessHtml(session.email || "")}</p>
      </div>
      <div class="rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
        <p class="text-label-sm text-text-secondary">Role</p>
        <p class="mt-2 text-body-md font-semibold text-text-primary">${escapeAccessHtml(session.role || "Viewer")}</p>
      </div>
      <div class="rounded-xl border border-border-subtle bg-surface-container-lowest p-4">
        <p class="text-label-sm text-text-secondary">Password</p>
        <p class="mt-2 text-body-md font-semibold text-text-primary">${member && member.value3 ? "Protected" : "Not set"}</p>
      </div>
    </div>
  `;
  if (pageTitle) {
    pageTitle.insertAdjacentElement("afterend", card);
  } else {
    canvas.prepend(card);
  }
}

function escapeAccessHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateSidebarActiveState() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  const activeByPage = {
    "index.html": "Dashboard",
    "shops.html": "Shops",
    "shop_details_table.html": "Shops",
    "shop_details_calendar.html": "Calendar",
    "reports.html": "Reports",
    "settings.html": "Settings"
  };
  const activeLabel = activeByPage[current];
  if (!activeLabel) return;

  document.querySelectorAll("aside nav a").forEach(link => {
    const label = link.dataset.sidebarLabel || link.querySelector("span:not(.material-symbols-outlined)")?.textContent.trim();
    const isActive = label === activeLabel;
    link.className = isActive
      ? "sidebar-nav-link flex items-center px-3 py-2.5 text-primary font-bold border-l-4 border-primary bg-surface-container-low rounded-r-lg group transition-all duration-200"
      : "sidebar-nav-link flex items-center px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-lowest rounded-lg group transition-all duration-200";

    const icon = link.querySelector(".material-symbols-outlined");
    if (icon) icon.className = "material-symbols-outlined mr-3";

    const labelNode = link.querySelector("span:not(.material-symbols-outlined)");
    if (labelNode) labelNode.className = "font-body-md text-body-md";
  });
}

function downloadTablePDF({ filename, title, subtitle, columns, rows }) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 34;
  const tableWidth = pageWidth - margin * 2;
  const headerHeight = 26;
  const rowHeight = 24;
  const fontSize = 8;
  const pages = [];

  const columnTotal = columns.reduce((sum, col) => sum + (col.width || 1), 0);
  const widths = columns.map(col => tableWidth * ((col.width || 1) / columnTotal));

  function cleanText(value) {
    return String(value ?? "")
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pdfText(value) {
    return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function fitText(value, width) {
    const text = cleanText(value);
    const maxChars = Math.max(4, Math.floor((width - 8) / (fontSize * 0.52)));
    return text.length > maxChars ? `${text.slice(0, maxChars - 1)}...` : text;
  }

  function addText(commands, x, y, size, text) {
    commands.push(`BT /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(text)}) Tj ET`);
  }

  function addPage() {
    const commands = [
      "1 1 1 rg 0 0 842 595 re f",
      "0.10 0.11 0.12 rg",
      "0.82 0.84 0.86 RG"
    ];
    addText(commands, margin, pageHeight - 34, 18, title || "Table Export");
    if (subtitle) addText(commands, margin, pageHeight - 52, 9, subtitle);
    let y = pageHeight - 76;

    commands.push(`0.94 0.95 0.96 rg ${margin.toFixed(2)} ${(y - headerHeight + 5).toFixed(2)} ${tableWidth.toFixed(2)} ${headerHeight.toFixed(2)} re f`);
    let x = margin;
    columns.forEach((col, index) => {
      commands.push(`0.82 0.84 0.86 RG ${x.toFixed(2)} ${(y - headerHeight + 5).toFixed(2)} ${widths[index].toFixed(2)} ${headerHeight.toFixed(2)} re S`);
      commands.push("0.10 0.11 0.12 rg");
      addText(commands, x + 4, y - 10, 7.5, String(col.label || "").toUpperCase());
      x += widths[index];
    });
    y -= headerHeight;
    pages.push({ commands, y });
    return pages[pages.length - 1];
  }

  let page = addPage();
  rows.forEach(row => {
    if (page.y - rowHeight < margin) page = addPage();
    let x = margin;
    columns.forEach((col, index) => {
      const y = page.y - rowHeight + 5;
      page.commands.push(`0.82 0.84 0.86 RG ${x.toFixed(2)} ${y.toFixed(2)} ${widths[index].toFixed(2)} ${rowHeight.toFixed(2)} re S`);
      page.commands.push("0.10 0.11 0.12 rg");
      const cellValue = Array.isArray(row) ? row[index] : row[col.key];
      addText(page.commands, x + 4, page.y - 10, fontSize, fitText(cellValue, widths[index]));
      x += widths[index];
    });
    page.y -= rowHeight;
  });

  const objects = [null];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  let nextId = 4;
  const pageIds = [];

  pages.forEach(pageData => {
    const pageId = nextId++;
    const contentId = nextId++;
    const content = pageData.commands.join("\n");
    pageIds.push(pageId);
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
  });

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[fontId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "table_export.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
