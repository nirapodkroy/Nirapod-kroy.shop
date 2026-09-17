/**
 * Nirapod Kroy - Advanced Real-Time User Tracking System
 * Logs visitor sessions directly into Google Sheets ("user tracking" tab)
 * and keeps real-time metrics for the Admin Panel.
 */

interface GeoData {
  ip: string;
  location: string;
}

let cachedGeo: GeoData | null = null;
let currentTrackingSession: {
  sessionId: string;
  pageTitle: string;
  pageSlug: string;
  startTime: number;
  timerId?: any;
  cleanupListeners?: () => void;
} | null = null;

// Parse Device Type
export function detectDevice(): string {
  if (typeof window === "undefined" || !window.navigator) return "Desktop / PC";
  const ua = navigator.userAgent || "";
  
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    if (/android/i.test(ua)) return "Mobile (Android)";
    if (/iphone|ipad|ipod/i.test(ua)) return "Mobile (iOS)";
    return "Mobile";
  }
  return "Desktop / PC";
}

// Parse Operating System
export function detectOS(): string {
  if (typeof window === "undefined" || !window.navigator) return "Unknown";
  const ua = navigator.userAgent || "";
  
  if (/windows nt 10/i.test(ua)) return "Windows 10/11";
  if (/windows nt 6\.3/i.test(ua)) return "Windows 8.1";
  if (/windows nt 6\.1/i.test(ua)) return "Windows 7";
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "Chrome OS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}

// Parse Browser
export function detectBrowser(): string {
  if (typeof window === "undefined" || !window.navigator) return "Chrome";
  const ua = navigator.userAgent || "";
  
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Chrome";
}

// Parse Screen Resolution
export function detectScreen(): string {
  if (typeof window === "undefined" || !window.screen) return "1920x1080";
  return `${window.screen.width}x${window.screen.height}`;
}

// Parse Referrer
export function detectReferrer(): string {
  if (typeof document === "undefined" || !document.referrer) return "সরাসরি (Direct)";
  try {
    const refUrl = new URL(document.referrer);
    if (refUrl.hostname === window.location.hostname) {
      return "সরাসরি (Direct)";
    }
    return document.referrer;
  } catch {
    return document.referrer || "সরাসরি (Direct)";
  }
}

// Format duration into Bengali representation e.g. "15 সেকেন্ড" or "2 মিনিট 10 সেকেন্ড"
export function formatDurationBangla(seconds: number): string {
  if (seconds <= 0) return "সক্রিয় রয়েছে (Active)...";
  if (seconds < 60) return `${seconds} সেকেন্ড`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (remainingSecs === 0) {
    return `${minutes} মিনিট`;
  }
  return `${minutes} মিনিট ${remainingSecs} সেকেন্ড`;
}

// Fetch or Retrieve Cached Geo & IP
export async function getClientGeo(): Promise<GeoData> {
  if (cachedGeo) return cachedGeo;

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("_nirapod_user_geo");
      if (stored) {
        cachedGeo = JSON.parse(stored);
        if (cachedGeo && cachedGeo.ip) return cachedGeo;
      }
    } catch {}
  }

  // Fast fetch from public CORS-friendly geo API
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const ip = data.ip || "Unknown";
      let location = "Bangladesh";
      if (data.country) {
        if (data.country === "Bangladesh") {
          location = "Bangladesh";
        } else if (data.city && data.city !== data.country) {
          location = `${data.city}, ${data.country}`;
        } else {
          location = data.country;
        }
      }
      cachedGeo = { ip, location };
      try {
        sessionStorage.setItem("_nirapod_user_geo", JSON.stringify(cachedGeo));
      } catch {}
      return cachedGeo;
    }
  } catch {
    // Non-blocking fallback
  }

  cachedGeo = { ip: "Unknown", location: "Bangladesh" };
  return cachedGeo;
}

// Google Sheets Apps Script Webhook (Nirapod Kroy Live Master Database)
export const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzzGJV2nI7grFnBo6OjDw_vJ20DylCfLg6r8ZExsawP4f17rFn5rfKp870TifdtgV4/exec";

// Dynamically resolve target webhook URL (supports admin configuration saved in settings)
export function getGoogleSheetsWebhookUrl(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem("nirapod_admin_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.webhookUrl && typeof parsed.webhookUrl === "string" && parsed.webhookUrl.trim().startsWith("http")) {
          if (parsed.webhookUrl.includes("AKfycbxR4AaUJHq0xQ5dYZfm5sqOBD5tb9urKwjgGQgImUQLP2AuQoxR6bo2hA7V9r9BHq4")) {
            parsed.webhookUrl = GOOGLE_SHEETS_WEBHOOK_URL;
            localStorage.setItem("nirapod_admin_settings", JSON.stringify(parsed));
            return GOOGLE_SHEETS_WEBHOOK_URL;
          }
          return parsed.webhookUrl.trim();
        }
      }
    }
  } catch {}
  return GOOGLE_SHEETS_WEBHOOK_URL;
}

// Throttle map to ensure Google Sheets isn't flooded while guaranteeing instant visit logging
const lastSheetDispatchMap = new Map<string, number>();
const initialVisitDispatchedSessions = new Set<string>();

// Dispatcher to Server API and direct Google Sheets Webhook
async function dispatchTrackingEvent(payload: {
  sessionId: string;
  page: string;
  pageSlug: string;
  isHeartbeat: boolean;
  timeSpent: string;
  clientIp: string;
  location: string;
  device: string;
  os: string;
  browser: string;
  screen: string;
  referrer: string;
}) {
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  
  // Enforce single initial visit rule:
  // If an initial visit (!isHeartbeat) has already been sent for this session,
  // all subsequent events for this session MUST be updates (isHeartbeat: true).
  let effectiveIsHeartbeat = Boolean(payload.isHeartbeat);
  if (!effectiveIsHeartbeat) {
    if (initialVisitDispatchedSessions.has(payload.sessionId)) {
      effectiveIsHeartbeat = true;
    } else {
      initialVisitDispatchedSessions.add(payload.sessionId);
    }
  }

  // 1. Notify server API for admin live dashboard ONLY (skip Google Sheets to avoid duplicate entries)
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, isHeartbeat: effectiveIsHeartbeat, skipGoogleSheets: true, syncToGoogleSheet: false }),
      keepalive: true
    }).catch(() => {});
  } catch {}

  // 2. Direct client-side dispatch to Google Sheets Webhook (works on mobile and desktop without server proxy blocking)
  // STRICT RULE: Dispatch to Google Sheets EXACTLY ONCE per session.
  // This guarantees that "user traking" tab gets exactly ONE row per visitor, never duplicate rows!
  if (initialVisitDispatchedSessions.has(payload.sessionId)) {
    return; // Session already recorded in Google Sheets. Do not create duplicate rows.
  }
  initialVisitDispatchedSessions.add(payload.sessionId);

  {
    lastSheetDispatchMap.set(payload.sessionId, Date.now());

    const sheetPayload = {
      action: "user_tracking",
      type: "user_tracking",
      sheetTab: "user traking",
      targetSheet: "user traking",
      targetTab: "user traking",
      alternativeSheet: "user tracking",
      sessionId: payload.sessionId,
      isHeartbeat: false,
      timeSpent: "সক্রিয় ভিজিটর (Active)",
      page: payload.page,
      ip: payload.clientIp,
      location: payload.location,
      device: payload.device,
      os: payload.os,
      browser: payload.browser,
      referrer: payload.referrer,
      screen: payload.screen,
      time: timestamp,
      sheetRow: [
        timestamp,
        payload.page,
        payload.clientIp,
        payload.location,
        payload.device,
        payload.os,
        payload.browser,
        "সক্রিয় ভিজিটর (Active)",
        payload.referrer,
        payload.screen,
        payload.sessionId
      ]
    };

    const jsonBody = JSON.stringify(sheetPayload);
    const baseWebhookUrl = getGoogleSheetsWebhookUrl();
    if (baseWebhookUrl && baseWebhookUrl.startsWith("http")) {
      const targetWebhookUrl = baseWebhookUrl + (baseWebhookUrl.includes("?") ? "&" : "?") + 
        "tab=user+traking&target=user_traking&altTab=user+tracking&type=user_tracking&action=user_tracking&sessionId=" + encodeURIComponent(payload.sessionId);

      // Direct client-side fetch with mode: 'no-cors' seamlessly follows Google Apps Script 302 cross-domain redirect
      fetch(targetWebhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: jsonBody,
        keepalive: true
      }).catch(() => {});
    }
  }
}

/**
 * Initialize page tracking for a specific route / modal view.
 * Handles initial registration, heartbeats, and page unload.
 */
export function trackPageView(pageTitle: string, pageSlug = "root"): () => void {
  if (typeof window === "undefined") return () => {};

  // Clean up any previously active session
  if (currentTrackingSession) {
    endTrackingSession(currentTrackingSession);
    currentTrackingSession = null;
  }

  const cleanSlug = pageSlug.replace(/[^a-z0-9_-]/gi, "").toLowerCase().slice(0, 20) || "page";
  const sessionId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${cleanSlug}`;
  const startTime = Date.now();

  const device = detectDevice();
  const os = detectOS();
  const browser = detectBrowser();
  const screen = detectScreen();
  const referrer = detectReferrer();

  const sessionObj = {
    sessionId,
    pageTitle,
    pageSlug: cleanSlug,
    startTime,
    timerId: null as any,
    ended: false,
    cleanupListeners: () => {}
  };
  currentTrackingSession = sessionObj;

  // Send EXACTLY ONE initial visit record (wait up to 120ms for geo to avoid duplicate "Unknown" and real IP rows)
  const sendInitialVisit = async () => {
    let initialGeo = cachedGeo;
    if (!initialGeo) {
      initialGeo = await Promise.race([
        getClientGeo(),
        new Promise<GeoData>((r) => setTimeout(() => r({ ip: "Unknown", location: "Bangladesh" }), 120))
      ]);
    }
    if (sessionObj.ended || currentTrackingSession?.sessionId !== sessionId) return;

    dispatchTrackingEvent({
      sessionId,
      page: pageTitle,
      pageSlug: cleanSlug,
      isHeartbeat: false,
      timeSpent: "সক্রিয় রয়েছে (Active)...",
      clientIp: initialGeo.ip,
      location: initialGeo.location,
      device,
      os,
      browser,
      screen,
      referrer
    });
  };
  sendInitialVisit();

  // Heartbeat sequence: update active duration (every 30 seconds if tab is active)
  let elapsedSeconds = 0;
  const heartbeatInterval = setInterval(() => {
    if (sessionObj.ended || currentTrackingSession?.sessionId !== sessionId) {
      clearInterval(heartbeatInterval);
      return;
    }
    // If user is on phone or browser tab is hidden/minimized, pause heartbeat to save resources
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const timeSpent = formatDurationBangla(elapsedSeconds);

    getClientGeo().then((geo) => {
      if (sessionObj.ended) return;
      dispatchTrackingEvent({
        sessionId,
        page: pageTitle,
        pageSlug: cleanSlug,
        isHeartbeat: true,
        timeSpent,
        clientIp: geo.ip,
        location: geo.location,
        device,
        os,
        browser,
        screen,
        referrer
      });
    });
  }, 30000); // 30-second clean heartbeat

  sessionObj.timerId = heartbeatInterval;

  // Pagehide / Visibility change listener (guarded against duplicate exit dispatches)
  const handleUnloadOrHide = () => {
    if (sessionObj.ended) return;
    sessionObj.ended = true;

    if (sessionObj.timerId) clearInterval(sessionObj.timerId);
    if (sessionObj.cleanupListeners) sessionObj.cleanupListeners();

    const finalSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const finalTimeSpent = formatDurationBangla(finalSecs);
    const geo = cachedGeo || { ip: "Unknown", location: "Bangladesh" };

    dispatchTrackingEvent({
      sessionId,
      page: pageTitle,
      pageSlug: cleanSlug,
      isHeartbeat: true,
      timeSpent: finalTimeSpent,
      clientIp: geo.ip,
      location: geo.location,
      device,
      os,
      browser,
      screen,
      referrer
    });
  };

  window.addEventListener("pagehide", handleUnloadOrHide);
  window.addEventListener("beforeunload", handleUnloadOrHide);

  sessionObj.cleanupListeners = () => {
    window.removeEventListener("pagehide", handleUnloadOrHide);
    window.removeEventListener("beforeunload", handleUnloadOrHide);
  };

  return () => {
    if (!sessionObj.ended) {
      endTrackingSession(sessionObj);
      currentTrackingSession = null;
    }
  };
}

function endTrackingSession(session: (typeof currentTrackingSession & { ended?: boolean }) | null) {
  if (!session || session.ended) return;
  session.ended = true;
  if (session.timerId) clearInterval(session.timerId);
  if (session.cleanupListeners) session.cleanupListeners();

  const finalSecs = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
  const finalTimeSpent = formatDurationBangla(finalSecs);
  const geo = cachedGeo || { ip: "Unknown", location: "Bangladesh" };

  dispatchTrackingEvent({
    sessionId: session.sessionId,
    page: session.pageTitle,
    pageSlug: session.pageSlug,
    isHeartbeat: true,
    timeSpent: finalTimeSpent,
    clientIp: geo.ip,
    location: geo.location,
    device: detectDevice(),
    os: detectOS(),
    browser: detectBrowser(),
    screen: detectScreen(),
    referrer: detectReferrer()
  });
}
