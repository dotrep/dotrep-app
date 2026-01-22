import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from '../hooks/useAuth';
import "./dashboard.css";
import { MISSIONS, type MissionDef, type MissionId } from "../../shared/missions";

const SAFE_MODE = import.meta.env.VITE_DISABLE_MANIFOLD === "true";
const DEBUG_MODE = import.meta.env.VITE_MANIFOLD_DEBUG === "1";
const IFRAME_PROOF_MODE = import.meta.env.VITE_MANIFOLD_IFRAME_PROOF === "1";

// Embedded/Preview mode detection - guards against analytics initialization
// True if: inside an iframe, has embed=1 param, or running in Replit Preview environment
const IS_EMBEDDED_MODE = (() => {
  if (typeof window === 'undefined') return false;
  const inIframe = window.self !== window.top;
  const hasEmbedParam = new URLSearchParams(window.location.search).get('embed') === '1';
  const isReplitEnv = window.location.hostname.includes('replit') || window.location.hostname.includes('repl.co');
  return inIframe || hasEmbedParam || isReplitEnv;
})();

// Guard: Disable any third-party analytics in embedded/Preview mode
// This prevents blocked network calls from causing blank rendering
if (IS_EMBEDDED_MODE) {
  // Stub out common analytics globals to prevent initialization errors
  (window as any).gtag = () => {};
  (window as any).dataLayer = [];
  (window as any).fbq = () => {};
  (window as any).AF = () => {};
  console.log('[Dashboard] Embedded mode detected - analytics disabled');
}

// Debug panel visibility: OFF by default, ON if VITE_IFRAME_DEBUG=1 or ?debug=1
const DEBUG_PANEL_ENABLED =
  (import.meta.env.VITE_IFRAME_DEBUG === '1') ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1');

// Same-origin proxy URL for reliable iframe loading (avoids cross-repl 502s)
// Falls back to direct cross-origin URL if proxy not available
const MANIFOLD_URL = import.meta.env.VITE_MANIFOLD_URL;

// Env var override for app path (if set, skip auto-detection)
const ENV_APP_PATH_OVERRIDE = import.meta.env.VITE_MANIFOLD_APP_PATH?.trim() || null;

// A1: Hard "Manifold target override" - single source of truth for debugging
// VITE_MANIFOLD_ORIGIN_OVERRIDE -> bypass proxy and load direct from origin
// VITE_MANIFOLD_PATH_OVERRIDE -> override path (default: /manifold)
// VITE_MANIFOLD_FORCE_EMBED -> add ?embed=1
// VITE_MANIFOLD_FORCE_NO_CACHE -> add ?v=<ts>
const ORIGIN_OVERRIDE = (import.meta.env.VITE_MANIFOLD_ORIGIN_OVERRIDE as string | undefined)?.trim() || null;
const PATH_OVERRIDE = (import.meta.env.VITE_MANIFOLD_PATH_OVERRIDE as string | undefined)?.trim() || "/";
const FORCE_EMBED = import.meta.env.VITE_MANIFOLD_FORCE_EMBED === "1";
const FORCE_NO_CACHE = import.meta.env.VITE_MANIFOLD_FORCE_NO_CACHE === "1";

// MVP_v2: Use LOCAL /manifold route instead of external proxy
// This ensures the torus is loaded same-origin, avoiding 502 errors
const USE_LOCAL_MANIFOLD = true; // MVP_v2: always use local embed

// LOCKED CONSTANT: Dashboard iframe src - must be local and same-origin
const MANIFOLD_EMBED_SRC = "/manifold?embed=1&nobadge=1";

// DEV ASSERTION: Prevent external manifold URLs from ever being used
if (import.meta.env.DEV) {
  if (MANIFOLD_EMBED_SRC.includes('http') || MANIFOLD_EMBED_SRC.includes('//')) {
    throw new Error('[Dashboard] FORBIDDEN: external manifold src detected - must use local /manifold');
  }
  if (!MANIFOLD_EMBED_SRC.startsWith('/manifold')) {
    throw new Error('[Dashboard] FORBIDDEN: manifold src must start with /manifold');
  }
}

// Build iframe src - uses the locked constant with cache-bust
function buildForcedIframeSrc(): string {
  return `${MANIFOLD_EMBED_SRC}&v=${Date.now()}`;
}

// LocalStorage keys for caching
const APP_PATH_CACHE_KEY = "manifoldAppPath";
const ORIGIN_HOST_CACHE_KEY = "manifoldOriginHost";

// Stricter SPA validation: requires ALL of root div + module script + Vite assets
function isValidSpaHtml(html: string): boolean {
  const hasRoot = html.includes('id="root"') || html.includes("id='root'");
  const hasModuleScript = html.includes('type="module"') || html.includes("type='module'");
  const hasViteAssets = /\/assets\/[^"']+\.(js|css)/.test(html) || html.includes('/assets/');
  return hasRoot && hasModuleScript && hasViteAssets;
}

// Probe a path via proxy to check if it serves a valid SPA entry
async function probeSpaPath(path: string): Promise<boolean> {
  try {
    const url = `/manifold-proxy${path}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const html = await res.text();
    return isValidSpaHtml(html);
  } catch {
    return false;
  }
}

// Get current origin host from health endpoint or env
async function getCurrentOriginHost(): Promise<string | null> {
  try {
    const res = await fetch('/manifold-proxy/health', { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.origin) {
        try {
          return new URL(data.origin).host;
        } catch { return data.origin; }
      }
    }
  } catch {}
  return null;
}

// Clear cached app path
function clearAppPathCache() {
  localStorage.removeItem(APP_PATH_CACHE_KEY);
  console.log('[Manifold] Cleared cached app path');
}

// Auto-detect SPA entry path with origin + failure invalidation
async function detectAppPath(): Promise<string> {
  // 1. Env var override takes precedence
  if (ENV_APP_PATH_OVERRIDE) {
    const sanitized = ENV_APP_PATH_OVERRIDE.startsWith('/') ? ENV_APP_PATH_OVERRIDE : '/' + ENV_APP_PATH_OVERRIDE;
    console.log('[Manifold] Using env var app path override:', sanitized);
    return sanitized;
  }
  
  // 2. Origin-based cache invalidation
  const currentHost = await getCurrentOriginHost();
  const cachedHost = localStorage.getItem(ORIGIN_HOST_CACHE_KEY);
  if (currentHost && cachedHost && currentHost !== cachedHost) {
    console.log('[Manifold] Origin changed, invalidating cache:', cachedHost, '->', currentHost);
    clearAppPathCache();
  }
  if (currentHost) {
    localStorage.setItem(ORIGIN_HOST_CACHE_KEY, currentHost);
  }
  
  // 3. Check localStorage cache + revalidate
  const cached = localStorage.getItem(APP_PATH_CACHE_KEY);
  if (cached) {
    console.log('[Manifold] Revalidating cached app path:', cached);
    if (await probeSpaPath(cached)) {
      console.log('[Manifold] Cached path still valid:', cached);
      return cached;
    }
    console.log('[Manifold] Cached path invalid, re-probing');
    clearAppPathCache();
  }
  
  // 4. Probe /manifold first (preferred)
  console.log('[Manifold] Probing /manifold for SPA entry...');
  if (await probeSpaPath('/manifold')) {
    console.log('[Manifold] Detected app path: /manifold');
    localStorage.setItem(APP_PATH_CACHE_KEY, '/manifold');
    return '/manifold';
  }
  
  // 5. Fallback to root /
  console.log('[Manifold] Probing / for SPA entry...');
  if (await probeSpaPath('/')) {
    console.log('[Manifold] Detected app path: /');
    localStorage.setItem(APP_PATH_CACHE_KEY, '/');
    return '/';
  }
  
  // 6. Default to /manifold if probes fail (let iframe handle errors)
  console.warn('[Manifold] Could not detect app path, defaulting to /manifold');
  return '/manifold';
}

// Debug panel state interface
interface DebugState {
  iframeSrc: string | null;
  didLoad: boolean;
  loadCount: number;
  lastLoadMs: number | null;
  lastRemountReason: string | null;
  containerWidth: number;
  containerHeight: number;
  proxyStatus: number | null;
  proxyHtmlLength: number | null;
  proxyHasCanvas: boolean | null;
}

// Build iframe src with detected app path
// ALWAYS includes embed=1 + nobadge=1 to signal iframe context (hides chrome/badges in Manifold)
const getManifoldSrc = (useProxy: boolean, appPath: string) => {
  const ts = Date.now();
  const embedParams = `embed=1&nobadge=1&v=${ts}`;
  // HARDCODED FOR DEBUG TEST - always use /manifold-proxy/manifold
  if (DEBUG_MODE) {
    return `/manifold-proxy/manifold?${embedParams}`;
  }
  if (useProxy) {
    return `/manifold-proxy${appPath}?${embedParams}`;
  }
  return MANIFOLD_URL ? `${MANIFOLD_URL.replace(/\/+$/, "")}${appPath}?${embedParams}` : null;
};

// Health response type from /manifold-proxy/health
interface HealthResponse {
  ok: boolean;
  origin: string;
  originHost?: string;
  status: number | null;
  error: string | null;
}

// Upstream health state - authoritative for torus status decisions
interface UpstreamHealthState {
  ok: boolean;
  status: number | null;
  origin: string | null;
  error: string | null;
  lastChecked: number;
}

// Warmup result with diagnostics
interface WarmupResult {
  ok: boolean;
  useProxy: boolean;
  diagnostics: HealthResponse | null;
}

// Warmup function - retry up to 6 times with 700ms delay
// Returns diagnostics on failure for fail-loud UI
async function warmupManifold(): Promise<WarmupResult> {
  const maxRetries = 6;
  const delay = 700;
  let lastDiagnostics: HealthResponse | null = null;
  
  // Try proxy first
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('/manifold-proxy/health', { cache: 'no-store' });
      const data: HealthResponse = await res.json();
      lastDiagnostics = data;
      
      if (data.ok) {
        console.log('[Manifold] Warmup via proxy succeeded on attempt', i + 1);
        return { ok: true, useProxy: true, diagnostics: null };
      }
      console.log('[Manifold] Proxy warmup attempt', i + 1, 'failed:', data.error);
    } catch (err) {
      console.log('[Manifold] Proxy warmup attempt', i + 1, 'failed');
    }
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  // Fallback: try direct URL if available
  if (MANIFOLD_URL) {
    console.log('[Manifold] Proxy failed, trying direct URL fallback');
    try {
      const directUrl = `${MANIFOLD_URL.replace(/\/+$/, "")}/`;
      const res = await fetch(directUrl, { method: 'HEAD', mode: 'no-cors' });
      // no-cors means we can't check status, but if fetch completes, URL exists
      console.log('[Manifold] Direct URL fallback available');
      return { ok: true, useProxy: false, diagnostics: null };
    } catch (err) {
      console.warn('[Manifold] Direct URL fallback also failed');
    }
  }
  
  console.warn('[Manifold] All warmup attempts exhausted');
  return { ok: false, useProxy: false, diagnostics: lastDiagnostics };
}

type ViewLens = "identity" | "system" | "patterns" | "detail";
type ActiveMode = "missions" | "activity" | "view" | null;
type EventType = "mission" | "session" | "identity";

interface SelectedDot {
  dotId: string;
  type: string;
  label: string;
  xp?: number;
  clusterId?: string;
  index?: number;  // Index in the dot array for navigation
  meta?: Record<string, unknown>;
}

// Dot type filter options
type DotTypeFilter = 'ALL' | 'DEFI' | 'NFT' | 'SOCIAL' | 'GAMING' | 'GOVERNANCE' | 'STAKING';

// FX toggles are now independent booleans (no mutual exclusivity)

// Dot type color mapping
const DOT_TYPE_COLORS: Record<string, string> = {
  DEFI: '#47f0ff',
  NFT: '#a855f7',
  SOCIAL: '#ff478d',
  GAMING: '#00d4aa',
  GOVERNANCE: '#ffba4a',
  STAKING: '#3b82f6',
};

function getDotTypeColor(type: string): string {
  return DOT_TYPE_COLORS[type] || '#47f0ff';
}

interface RepEvent {
  id: string;
  type: EventType;
  label: string;
  at: number;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "rep.events.v2";
const MAX_EVENTS = 500;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_EVENT_GAP_MS = 1500;

const ORBIT_RADII: Record<EventType, number> = {
  identity: 0.14,
  mission: 0.24,
  session: 0.34,
};

const lastRecordedRef: Record<string, number> = {};

const createSeedEvents = (): RepEvent[] => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const seeds: RepEvent[] = [];
  
  const sessionLabels = ["Opened History", "Session resumed", "Dashboard loaded", "Lens switched", "Panel opened", "Ambient toggled"];
  const missionLabels = ["Mission Action", "Follow a builder", "Post a comment", "Verify wallet action", "Check progress", "Complete task"];
  const identityLabels = ["Lens: IDENTITY", "Profile viewed", "Wallet connected", "Name claimed"];

  sessionLabels.forEach((label, i) => {
    seeds.push({
      id: `seed-session-${i}`,
      type: "session",
      label,
      at: now - (i * 5 + 1) * day,
    });
  });

  missionLabels.forEach((label, i) => {
    seeds.push({
      id: `seed-mission-${i}`,
      type: "mission",
      label,
      at: now - (i * 4 + 2) * day,
    });
  });

  identityLabels.forEach((label, i) => {
    seeds.push({
      id: `seed-identity-${i}`,
      type: "identity",
      label,
      at: now - (i * 7 + 3) * day,
    });
  });

  return seeds;
};

const loadEvents = (): RepEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === "[]") {
      const seeds = createSeedEvents();
      saveEvents(seeds);
      return seeds;
    }
    const events: RepEvent[] = JSON.parse(raw);
    const now = Date.now();
    return events.filter((e) => now - e.at < MAX_AGE_MS).slice(-MAX_EVENTS);
  } catch {
    return [];
  }
};

const saveEvents = (events: RepEvent[]): void => {
  const now = Date.now();
  const pruned = events
    .filter((e) => now - e.at < MAX_AGE_MS)
    .slice(-MAX_EVENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // ignore storage errors
  }
};

const VIEW_DATA: Record<ViewLens, { quickTake: string; context: { label: string; value: string }[]; nextStep: string }> = {
  identity: {
    quickTake: "Your identity signal looks steady — consistent behavior, low volatility.",
    context: [
      { label: "Name status", value: "claimed" },
      { label: "Wallet age", value: "14d" },
      { label: "Consistency", value: "steady" },
      { label: "Risk flags", value: "0" },
    ],
    nextStep: "Complete 1 mission to strengthen continuity.",
  },
  system: {
    quickTake: "Your onchain footprint is expanding across more systems.",
    context: [
      { label: "Wallet interactions (24h)", value: "7" },
      { label: "Unique protocols (7d)", value: "3" },
      { label: "Repeat usage", value: "moderate" },
      { label: "Anomalies", value: "none" },
    ],
    nextStep: "Use one protocol twice to build repeat signal.",
  },
  patterns: {
    quickTake: "Patterns show clustered behavior — a few actions dominate.",
    context: [
      { label: "Dominant action type", value: "Social" },
      { label: "Streak", value: "4 days" },
      { label: "Peaks", value: "evening" },
      { label: "Outliers", value: "low" },
    ],
    nextStep: "Add one non-social action to diversify.",
  },
  detail: {
    quickTake: "Recent events are clean — nothing unusual detected.",
    context: [
      { label: "Last action", value: "Comment posted" },
      { label: "Prior action", value: "Follow" },
      { label: "Time since last", value: "2h" },
      { label: "Flags", value: "none" },
    ],
    nextStep: "Open Activity for full history.",
  },
};

const MISSION_STORAGE_KEY = "rep.missions.completed";

const getCompletedMissions = (): Set<MissionId> => {
  try {
    const stored = localStorage.getItem(MISSION_STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored) as MissionId[]);
    }
  } catch {}
  return new Set();
};

const saveCompletedMissions = (completed: Set<MissionId>) => {
  try {
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify([...completed]));
  } catch {}
};

const META_MISSIONS: MissionId[] = ["quest_chain", "core_five_lit"];

const getActiveMissions = (completed: Set<MissionId>): MissionDef[] => {
  return MISSIONS.filter(m => !completed.has(m.id) && !META_MISSIONS.includes(m.id));
};

const RECENT_ACTIVITY = [
  { label: "Mission progress recorded", time: "2m ago" },
  { label: "View lens changed", time: "5m ago" },
  { label: "Ambient toggled", time: "12m ago" },
  { label: "Identity updated", time: "1h ago" },
  { label: "Session resumed", time: "2h ago" },
  { label: "Torus interaction", time: "3h ago" },
];

const ACTIVITY_SIGNALS = [
  { label: "Consistency", value: "Med" },
  { label: "Coverage", value: "Med" },
  { label: "Velocity", value: "Med" },
];

interface SemanticDot {
  id: string;
  x: number;
  y: number;
  theta: number;
  size: number;
  color: string;
  type: EventType;
  semanticWeights: {
    identity: number;
    system: number;
    patterns: number;
    detail: number;
  };
}

interface EventGroup {
  label: string;
  type: EventType;
  count: number;
  lastAt: number;
}

const TYPE_COLORS: Record<EventType, string> = {
  mission: "#00ffd5",
  session: "#4cc9a6",
  identity: "#cfd6e4",
};

const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
};

const normalizeLabel = (label: string): string => {
  return label.replace(/\d{10,}/g, "").replace(/\s+/g, " ").trim();
};

const groupEventsToGroups = (events: RepEvent[]): EventGroup[] => {
  const groupMap = new Map<string, EventGroup>();
  for (const e of events) {
    const normalized = normalizeLabel(e.label);
    const key = `${e.type}:${normalized}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastAt = Math.max(existing.lastAt, e.at);
    } else {
      groupMap.set(key, { label: normalized, type: e.type, count: 1, lastAt: e.at });
    }
  }
  return Array.from(groupMap.values());
};

const mapEventGroupsToDots = (groups: EventGroup[]): SemanticDot[] => {
  const cx = 0.5;
  const cy = 0.5;
  const now = Date.now();
  const nowAngle = -Math.PI / 2;
  const span = 1.5 * Math.PI;

  return groups.map((group, idx) => {
    const id = `dot-${group.type}-${normalizeLabel(group.label).slice(0, 12)}`;
    const t = Math.min(1, Math.max(0, (now - group.lastAt) / MAX_AGE_MS));
    const jitter = (seededRandom(id) - 0.5) * 0.24;
    const theta = nowAngle + t * span + jitter;
    const r = ORBIT_RADII[group.type];

    let x = cx + r * Math.cos(theta);
    let y = cy + r * Math.sin(theta);
    x = Math.max(0.08, Math.min(0.92, x));
    y = Math.max(0.08, Math.min(0.92, y));

    const recency = Math.max(0, 1 - (now - group.lastAt) / (7 * 24 * 3600000));
    const frequency = Math.min(1, group.count / 20);

    const semanticWeights = {
      identity: group.type === "identity" ? 0.9 + frequency * 0.1 : 0.2 + recency * 0.3,
      system: group.type === "session" ? 0.7 + frequency * 0.3 : 0.3 + recency * 0.2,
      patterns: group.type === "session" ? 0.8 + recency * 0.2 : group.type === "mission" ? 0.6 + frequency * 0.3 : 0.3,
      detail: recency * 0.8 + frequency * 0.2,
    };

    return {
      id,
      x,
      y,
      theta,
      size: 6.5 + Math.min(group.count, 10) * 0.35,
      color: TYPE_COLORS[group.type],
      type: group.type,
      semanticWeights,
    };
  });
};

const getTopDotsForLens = (dots: SemanticDot[], lens: ViewLens, n: number = 8): Map<string, number> => {
  const sorted = [...dots].sort((a, b) => b.semanticWeights[lens] - a.semanticWeights[lens]);
  const result = new Map<string, number>();
  sorted.slice(0, n).forEach((d, i) => result.set(d.id, i));
  return result;
};

const computeDrift = (
  dot: SemanticDot,
  lens: ViewLens,
  rank: number,
  allDots: SemanticDot[],
  topDotsMap: Map<string, number>
): { x: number; y: number } => {
  const maxOffset = (8 - rank) * 0.75;
  const centerX = 0.5;
  const centerY = 0.5;

  switch (lens) {
    case "identity": {
      const dx = centerX - dot.x;
      const dy = centerY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return {
        x: (dx / dist) * maxOffset,
        y: (dy / dist) * maxOffset,
      };
    }
    case "system": {
      const angle = (rank % 2 === 0 ? 1 : -1) * (3 * Math.PI / 180);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = dot.x - centerX;
      const ry = dot.y - centerY;
      return {
        x: (rx * cos - ry * sin - rx) * 100 * 0.5,
        y: (rx * sin + ry * cos - ry) * 100 * 0.5,
      };
    }
    case "patterns": {
      const emphasized = allDots.filter(d => topDotsMap.has(d.id));
      const centroidX = emphasized.reduce((s, d) => s + d.x, 0) / emphasized.length;
      const centroidY = emphasized.reduce((s, d) => s + d.y, 0) / emphasized.length;
      const dx = centroidX - dot.x;
      const dy = centroidY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = Math.min(maxOffset * 0.6, 4);
      return {
        x: (dx / dist) * offset,
        y: (dy / dist) * offset,
      };
    }
    case "detail": {
      const dx = centerX - dot.x;
      const dy = centerY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      return {
        x: (dx / dist) * Math.min(maxOffset * 0.3, 2),
        y: (dy / dist) * Math.min(maxOffset * 0.3, 2),
      };
    }
    default:
      return { x: 0, y: 0 };
  }
};

export const Dashboard: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    isAuthenticating, 
    walletAddress, 
    repName, 
    error: authError, 
    login, 
    logout, 
    clearError 
  } = useAuth();
  
  const walletConnected = isAuthenticated && !!walletAddress;
  
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  
  const handleConnectWallet = useCallback(async () => {
    console.log('[DASHBOARD_LOGIN_CLICK]');
    await login();
  }, [login]);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);
  const [viewLens, setViewLens] = useState<ViewLens>("identity");
  const [lastViewLens, setLastViewLens] = useState<ViewLens>("identity");
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [showFullscreenUI, setShowFullscreenUI] = useState(false);
  const uiHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState<RepEvent[]>(() => loadEvents());
  
  // Torus control state
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [swarmEnabled, setSwarmEnabled] = useState(false);
  const [selectedDot, setSelectedDot] = useState<SelectedDot | null>(null);
  const [dotListOpen, setDotListOpen] = useState(false);
  const [dotTypeFilter, setDotTypeFilter] = useState<DotTypeFilter>('ALL');
  const [discoEnabled, setDiscoEnabled] = useState(false);
  const [fireworksEnabled, setFireworksEnabled] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  // All dots from the torus (received via postMessage or useReputationDots)
  const [allDots, setAllDots] = useState<Array<{id: string; type: string; xp: number; clusterId?: string}>>([]);
  const TOTAL_DOTS = 8; // Fixed number of dots in the torus
  
  // Missions state
  const [completedMissions, setCompletedMissions] = useState<Set<MissionId>>(() => getCompletedMissions());
  const [missionFeedback, setMissionFeedback] = useState<string | null>(null);
  const [showAllMissions, setShowAllMissions] = useState(false);
  const activeMissions = getActiveMissions(completedMissions);
  const DEFAULT_MISSIONS_COUNT = 4;
  const visibleMissions = showAllMissions ? activeMissions : activeMissions.slice(0, DEFAULT_MISSIONS_COUNT);
  const totalXP = MISSIONS.filter(m => completedMissions.has(m.id)).reduce((sum, m) => sum + m.xp, 0);
  const streakDays = Math.floor(totalXP / 50) + 1; // Simple streak calculation
  
  // Share state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // XP Panel state
  const [xpPanelOpen, setXpPanelOpen] = useState(false);
  
  // Identity Focus state
  const [identityFocusOpen, setIdentityFocusOpen] = useState(false);
  
  // User identity state (claimed handle) - check both localStorage keys
  const [claimedHandle, setClaimedHandle] = useState<string | null>(() => {
    try {
      return localStorage.getItem("rep.claimedHandle") || localStorage.getItem("rep:lastName") || null;
    } catch { return null; }
  });
  
  // Auth wiring: Look up rep name from API on mount
  useEffect(() => {
    const checkRepName = async () => {
      // Get wallet address from multiple sources
      const addr = walletAddress || localStorage.getItem('rep:address')?.toLowerCase();
      if (!addr) return;
      
      // Check localStorage cache first
      const cachedName = localStorage.getItem('rep:lastName');
      if (cachedName) {
        setClaimedHandle(cachedName);
        console.log('[TORUS_DASHBOARD_AUTH]', { address: addr, repName: cachedName, source: 'cache' });
        return;
      }
      
      // Look up from API
      try {
        const res = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(addr)}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.ok && data.name) {
          setClaimedHandle(data.name);
          localStorage.setItem('rep:lastName', data.name);
          localStorage.setItem('rep:address', addr);
          console.log('[TORUS_DASHBOARD_AUTH]', { address: addr, repName: data.name, source: 'api' });
        } else {
          console.log('[TORUS_DASHBOARD_AUTH]', { address: addr, repName: null, status: 'unclaimed' });
        }
      } catch (e) {
        console.log('[TORUS_DASHBOARD_AUTH]', { address: addr, error: 'lookup failed' });
      }
    };
    checkRepName();
  }, [walletAddress]);
  
  // Baseposting Mirror state
  const [basepostingEnabled, setBasepostingEnabled] = useState(() => {
    try {
      return localStorage.getItem("rep.baseposting.enabled") === "true";
    } catch { return false; }
  });
  const [basepostingHandle, setBasepostingHandle] = useState(() => {
    try {
      return localStorage.getItem("rep.baseposting.handle") || "";
    } catch { return ""; }
  });
  const [basepostingStatus, setBasepostingStatus] = useState<"Connected" | "Signals Pending" | "OFF">(() => {
    try {
      const enabled = localStorage.getItem("rep.baseposting.enabled") === "true";
      const sig = localStorage.getItem("rep.baseposting.signature");
      return enabled && sig ? "Connected" : "OFF";
    } catch { return "OFF"; }
  });
  const [basepostingSignature, setBasepostingSignature] = useState<string | null>(() => {
    try {
      return localStorage.getItem("rep.baseposting.signature") || null;
    } catch { return null; }
  });
  const [basepostingBindingOpen, setBasepostingBindingOpen] = useState(false);
  const [basepostingHandleInput, setBasepostingHandleInput] = useState("");
  const [basepostingHandleError, setBasepostingHandleError] = useState<string | null>(null);
  
  // Baseposting Mirror claims state (from API)
  const [basepostingClaims, setBasepostingClaims] = useState<{
    coherence: { intensity: number; clarity: number; calm: number };
    counts: { erc721: number; erc1155: number; total: number };
    score: number;
    fetchedAt: number;
    error?: string;
  } | null>(null);
  const basepostingPollRef = useRef<number | null>(null);
  const basepostingInFlightRef = useRef<boolean>(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BASEPOSTING VIEW - Outbound sharing to Farcaster/Base feed
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Baseposting View toggle state (persisted per wallet)
  const getBasepostingViewKey = (addr: string) => `rep.baseposting-view.${addr.toLowerCase()}`;
  const [basepostingViewEnabled, setBasepostingViewEnabled] = useState(false);
  const [basepostingViewSummary, setBasepostingViewSummary] = useState<{
    timeWindow: string;
    txCount: number;
    nftMints: number;
    swaps: number;
    transfers: number;
    highlights: string[];
    generatedAt: string;
    loading?: boolean;
    error?: string;
  } | null>(null);
  const [basepostingShareState, setBasepostingShareState] = useState<{
    loading: boolean;
    imageUrl: string | null;
    caption: string | null;
    copied: boolean;
    error: string | null;
  }>({ loading: false, imageUrl: null, caption: null, copied: false, error: null });
  const basepostingViewFetchRef = useRef<boolean>(false);
  
  // Fetch summary when toggle is turned ON (ONE request only, no polling)
  // MUST be defined before useEffect that calls it
  const fetchBasepostingViewSummary = useCallback(async () => {
    if (!walletAddress || basepostingViewFetchRef.current) return;
    
    basepostingViewFetchRef.current = true;
    setBasepostingViewSummary(prev => prev ? { ...prev, loading: true } : { 
      timeWindow: '7d', txCount: 0, nftMints: 0, swaps: 0, transfers: 0, 
      highlights: [], generatedAt: '', loading: true 
    });
    
    if (import.meta.env.DEV) {
      console.log('[Baseposting View] Fetching summary...');
    }
    
    try {
      const response = await fetch(`/api/baseposting/summary?address=${walletAddress}`);
      const data = await response.json();
      
      if (data.ok) {
        setBasepostingViewSummary({
          timeWindow: data.timeWindow,
          txCount: data.txCount,
          nftMints: data.nftMints,
          swaps: data.swaps,
          transfers: data.transfers,
          highlights: data.highlights,
          generatedAt: data.generatedAt,
          loading: false,
        });
        
        // Generate basepost dots from nftMints count and send to torus
        const mintCount = Math.min(data.nftMints || 0, 8); // Cap at 8 dots
        const basepostDots = mintCount > 0 
          ? Array.from({ length: mintCount }, (_, i) => ({
              id: `basepost-${i}-${Date.now()}`,
              x: 0,
              y: 0,
              z: 0,
              clusterId: 'basepost',
              xp: 5, // Low XP for basepost events
              type: 'BASEPOST' as const,
            }))
          : []; // Empty array clears stale dots
        
        // Send to torus iframe (always send to clear or update)
        const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SET_BASEPOST_DOTS', dots: basepostDots }, '*');
          console.log('[DASH] Sent basepost dots', mintCount);
        }
      } else {
        setBasepostingViewSummary(prev => prev ? { ...prev, loading: false, error: data.message } : null);
      }
    } catch (e) {
      setBasepostingViewSummary(prev => prev ? { ...prev, loading: false, error: 'Failed to fetch' } : null);
    } finally {
      basepostingViewFetchRef.current = false;
    }
  }, [walletAddress]);
  
  // Load baseposting view toggle state from localStorage when wallet changes
  useEffect(() => {
    if (walletAddress) {
      try {
        const stored = localStorage.getItem(getBasepostingViewKey(walletAddress));
        const isEnabled = stored === 'true';
        setBasepostingViewEnabled(isEnabled);
        // If restoring to enabled state, fetch summary immediately
        if (isEnabled) {
          // Defer to next tick to avoid race with state update
          setTimeout(() => {
            if (!basepostingViewFetchRef.current) {
              if (import.meta.env.DEV) {
                console.log('[Baseposting View] Restored ON state, fetching summary...');
              }
              fetchBasepostingViewSummary();
            }
          }, 0);
        }
      } catch {
        setBasepostingViewEnabled(false);
      }
    } else {
      setBasepostingViewEnabled(false);
    }
  }, [walletAddress, fetchBasepostingViewSummary]);
  
  // Toggle handler with dev log
  const handleBasepostingViewToggle = useCallback(() => {
    const newValue = !basepostingViewEnabled;
    setBasepostingViewEnabled(newValue);
    
    console.log('[DASH] baseposting', newValue);
    
    if (walletAddress) {
      try {
        localStorage.setItem(getBasepostingViewKey(walletAddress), String(newValue));
      } catch {}
    }
    
    // Send SET_BASEPOSTING to iframe
    const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'SET_BASEPOSTING', enabled: newValue }, '*');
    }
    
    // Fetch summary when turning ON
    if (newValue && walletAddress) {
      fetchBasepostingViewSummary();
    } else {
      setBasepostingViewSummary(null);
      setBasepostingShareState({ loading: false, imageUrl: null, caption: null, copied: false, error: null });
    }
  }, [basepostingViewEnabled, walletAddress, fetchBasepostingViewSummary]);
  
  // Generate caption for sharing
  const generateShareCaption = useCallback(() => {
    if (!basepostingViewSummary) return '';
    const s = basepostingViewSummary;
    return `.rep Baseposting View 🦎
Last ${s.timeWindow}: ${s.txCount} tx · ${s.nftMints} mints · ${s.swaps} swaps · ${s.transfers} transfers
Built on Base.`;
  }, [basepostingViewSummary]);
  
  // Capture torus snapshot via postMessage to iframe
  const captureTorusSnapshot = useCallback(async (): Promise<string | null> => {
    if (!iframeRef.current?.contentWindow) return null;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000);
      
      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'REP_SNAPSHOT_RESULT') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(event.data.image || null);
        }
      };
      
      window.addEventListener('message', handler);
      iframeRef.current?.contentWindow?.postMessage({ type: 'REP_SNAPSHOT_REQUEST' }, '*');
    });
  }, []);
  
  // Share to Base (Farcaster) handler
  const handleShareToBase = useCallback(async () => {
    if (!walletAddress || !basepostingViewSummary) return;
    
    if (import.meta.env.DEV) {
      console.log('[Baseposting View] Share clicked');
    }
    
    setBasepostingShareState({ loading: true, imageUrl: null, caption: null, copied: false, error: null });
    
    const caption = generateShareCaption();
    
    // Try to capture snapshot
    let imageUrl: string | null = null;
    try {
      const snapshot = await captureTorusSnapshot();
      if (snapshot) {
        // Upload image
        const uploadRes = await fetch('/api/baseposting/share-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: snapshot, walletAddress }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.ok) {
          imageUrl = uploadData.imageUrl;
        }
      }
    } catch (e) {
      console.warn('[Baseposting View] Snapshot failed, sharing text only');
    }
    
    setBasepostingShareState({ loading: false, imageUrl, caption, copied: false, error: null });
    
    // Open Warpcast composer
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(caption)}${imageUrl ? `&embeds[]=${encodeURIComponent(imageUrl)}` : ''}`;
    window.open(warpcastUrl, '_blank', 'noopener,noreferrer');
  }, [walletAddress, basepostingViewSummary, generateShareCaption, captureTorusSnapshot]);
  
  // Copy caption fallback
  const handleCopyCaption = useCallback(() => {
    const caption = generateShareCaption();
    navigator.clipboard.writeText(caption).then(() => {
      setBasepostingShareState(prev => ({ ...prev, copied: true }));
      setTimeout(() => setBasepostingShareState(prev => ({ ...prev, copied: false })), 2000);
    });
  }, [generateShareCaption]);
  
  // DEV-only: Loop detection counters (Phase 1)
  const debugCohUrlParam = new URLSearchParams(window.location.search).get('debug_coh') === '1';
  const debugCohPhaseRef = useRef<number>(0);
  const debugCohIntervalRef = useRef<number | null>(null);
  
  // Initialize debug counters on window (DEV only)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    (window as any).__repDbg = (window as any).__repDbg || { tx: 0, rx: 0, setInt: 0, fetch: 0, lastTxTs: 0 };
  }
  
  // Handle validation: lowercase, alphanumeric + hyphen + underscore only
  const validateBasepostingHandle = (input: string): { valid: boolean; normalized: string; error: string | null } => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return { valid: false, normalized: "", error: "Handle is required" };
    const pattern = /^[a-z0-9_-]+$/;
    if (!pattern.test(trimmed)) return { valid: false, normalized: trimmed, error: "Only letters, numbers, hyphens, and underscores allowed" };
    if (trimmed.length < 2) return { valid: false, normalized: trimmed, error: "Handle must be at least 2 characters" };
    if (trimmed.length > 32) return { valid: false, normalized: trimmed, error: "Handle must be 32 characters or less" };
    return { valid: true, normalized: trimmed, error: null };
  };
  
  // Share selective disclosure state
  const [shareBasepostingActive, setShareBasepostingActive] = useState(false);
  
  // Slide panel state (only one panel open at a time)
  const [openPanel, setOpenPanel] = useState<"missions" | "activity" | null>(null);
  const [activityTab, setActivityTab] = useState<ViewLens>("identity");
  
  // Iframe error state and warmup
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [remountCount, setRemountCount] = useState(0);
  const MAX_REMOUNTS = 3;
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  
  // C) Handshake watchdog state + ref
  const handshakeTimeoutRef = useRef<number | null>(null);
  const [manifoldPongTs, setManifoldPongTs] = useState<number | null>(null);
  
  // E) Send initial spin once after READY handshake (default ON)
  const sentInitialSpinRef = useRef(false);
  
  // Torus status state (REP_MANIFOLD_READY/ERROR)
  const [torusReady, setTorusReady] = useState(false);
  const [torusError, setTorusError] = useState<string | null>(null);
  
  // RX message ring buffer (last 25 messages) for debug panel
  const [rxBuffer, setRxBuffer] = useState<Array<{ type: string; source: string; origin: string; ts: number; sourceIsIframe: boolean | null }>>([]);
  const [lastReadyTs, setLastReadyTs] = useState<number | null>(null);
  const readyTimeoutRef = useRef<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<HealthResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Cover Detector state (debug only)
  const [coverReport, setCoverReport] = useState<{
    covered: boolean;
    coveringElement: string;
    domPath: string[];
    styles: Record<string, string>;
    iframeRect: DOMRect | null;
    coverRect: DOMRect | null;
  } | null>(null);
  const coverDetectorRef = useRef<number | null>(null);
  
  // Bring To Front state (debug only)
  const [iframeBroughtToFront, setIframeBroughtToFront] = useState(false);
  
  // Source match telemetry (debug only)
  const [iframeWindowKnown, setIframeWindowKnown] = useState(false);
  const [lastMsgFromIframeWindow, setLastMsgFromIframeWindow] = useState<boolean | null>(null);
  
  // Proxy target origin (debug only) - fetched from /manifold-proxy/health
  const [proxyTargetOrigin, setProxyTargetOrigin] = useState<{ origin: string; host: string } | null>(null);
  
  // Build signature from iframe (debug only) - iframe sends REP_MANIFOLD_BUILD_ID on boot
  const [buildSignature, setBuildSignature] = useState<{ id: string; fromIframe: boolean } | null>(null);
  
  // B) Build verification state - cryptographic proof-of-build
  const [buildVerification, setBuildVerification] = useState<{
    verified: boolean;
    buildId: string | null;
    headerBuildId: string | null;
    hasStamp: boolean;
    hasScripts: boolean;
    hasAssetRefs: boolean;
    hasBaseTag: boolean;
    status: number | null;
    sample: string;
    error: string | null;
  } | null>(null);
  
  // B2) Asset health state (from _debug_assets endpoint)
  const [assetHealth, setAssetHealth] = useState<{
    ok: boolean;
    totalScripts: number;
    totalCss: number;
    assets: { url: string; type: string; status: number | null; ok: boolean }[];
    error?: string;
  } | null>(null);
  
  // Upstream health state - AUTHORITATIVE for torus status (A. Make proxy health report authoritative)
  const [upstreamHealth, setUpstreamHealth] = useState<UpstreamHealthState>({
    ok: true,
    status: null,
    origin: null,
    error: null,
    lastChecked: 0,
  });
  const UPSTREAM_DOWN = (upstreamHealth.status !== null && upstreamHealth.status >= 500);
  
  // Health retry loop ref
  const healthRetryRef = useRef<number | null>(null);
  
  // Detected app path (auto-detected or from env var override)
  const detectedAppPathRef = useRef<string>('/manifold');
  
  // Debug state for fail-loud diagnostics
  const [debugState, setDebugState] = useState<DebugState>({
    iframeSrc: null,
    didLoad: false,
    loadCount: 0,
    lastLoadMs: null,
    lastRemountReason: null,
    containerWidth: 0,
    containerHeight: 0,
    proxyStatus: null,
    proxyHtmlLength: null,
    proxyHasCanvas: null,
  });
  
  // Track whether to use proxy or direct URL
  const useProxyRef = useRef(true);
  
  // Remount timer ref - stored globally to persist across effect runs
  const remountTimerRef = useRef<number | undefined>(undefined);
  
  // Update debug state helper
  const updateDebugState = useCallback((updates: Partial<DebugState>) => {
    setDebugState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // TEMPORARY DIAGNOSTIC: Log MANIFOLD_URL on mount
  useEffect(() => {
    console.log('[Dashboard] MANIFOLD_URL =', MANIFOLD_URL);
    console.log('[Dashboard] SAFE_MODE =', SAFE_MODE);
  }, []);
  
  // SYSTEM MISSIONS: Auto-complete prerequisite missions on dashboard load
  // These are always complete if user reaches dashboard (wallet connected + viewing)
  useEffect(() => {
    const SYSTEM_MISSIONS: MissionId[] = ["connect_wallet", "claim_name", "explore_graph"];
    const current = getCompletedMissions();
    let changed = false;
    const updated = new Set(current);
    
    for (const missionId of SYSTEM_MISSIONS) {
      if (!updated.has(missionId)) {
        updated.add(missionId);
        changed = true;
      }
    }
    
    if (changed) {
      saveCompletedMissions(updated);
      setCompletedMissions(updated);
      console.log('[Missions] systemComplete', {
        connect_wallet: updated.has("connect_wallet"),
        claim_name: updated.has("claim_name"),
        explore_graph: updated.has("explore_graph"),
        xpTotal: MISSIONS.filter(m => updated.has(m.id)).reduce((sum, m) => sum + m.xp, 0),
      });
    } else {
      console.log('[Missions] systemComplete (already done)', {
        connect_wallet: current.has("connect_wallet"),
        claim_name: current.has("claim_name"),
        explore_graph: current.has("explore_graph"),
        xpTotal: MISSIONS.filter(m => current.has(m.id)).reduce((sum, m) => sum + m.xp, 0),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Force remount handler (debug only)
  const handleForceRemount = useCallback(() => {
    if (!DEBUG_MODE) return;
    const newSrc = getManifoldSrc(useProxyRef.current, detectedAppPathRef.current);
    if (newSrc) {
      updateDebugState({ lastRemountReason: 'manual-force' });
      setIframeSrc(newSrc);
      setIframeKey(k => k + 1);
    }
  }, [updateDebugState]);
  
  // B) Verify iframe build stamp - cryptographic proof-of-build
  const verifyIframeBuild = useCallback(async (src: string) => {
    try {
      const r = await fetch(src, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const headerBuildId = r.headers.get('x-mf-build-id');
      const html = await r.text();
      
      // Check for build stamp in HTML
      const hasStamp = html.includes('MF_BUILD_ID=') || html.includes('id="mf-build-badge"');
      
      // B1) Extended checks for asset loading
      const hasScripts = html.includes('<script');
      const hasAssetRefs = html.includes('/assets/') || html.includes('assets/');
      const hasBaseTag = html.includes('<base href="/manifold-proxy/">');
      
      // Extract build ID from HTML comment if present
      const buildIdMatch = html.match(/MF_BUILD_ID=([^\s\-]+(?:-[^\s\-]+)*)/);
      const buildIdFromHtml = buildIdMatch ? buildIdMatch[1] : null;
      
      // Verified only if stamp present AND scripts exist (not error page)
      const verified = r.ok && hasStamp && hasScripts;
      
      setBuildVerification({
        verified,
        buildId: buildIdFromHtml || headerBuildId,
        headerBuildId,
        hasStamp,
        hasScripts,
        hasAssetRefs,
        hasBaseTag,
        status: r.status,
        sample: html.slice(0, 400),
        error: null,
      });
      
      console.log('[Dashboard] Build verification:', { verified, buildId: buildIdFromHtml, hasStamp, hasScripts, hasAssetRefs, hasBaseTag, status: r.status });
      
      return { verified, buildId: buildIdFromHtml, hasStamp, hasScripts, status: r.status };
    } catch (err: any) {
      console.error('[Dashboard] Build verification failed:', err.message);
      setBuildVerification({
        verified: false,
        buildId: null,
        headerBuildId: null,
        hasStamp: false,
        hasScripts: false,
        hasAssetRefs: false,
        hasBaseTag: false,
        status: null,
        sample: '',
        error: err.message,
      });
      return { verified: false, buildId: null, hasStamp: false, hasScripts: false, status: null, error: err.message };
    }
  }, []);
  
  // B2) Check asset health through proxy
  const checkAssetHealth = useCallback(async () => {
    try {
      const r = await fetch('/manifold-proxy/_debug_assets', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      const data = await r.json();
      setAssetHealth({
        ok: data.ok,
        totalScripts: data.totalScripts || 0,
        totalCss: data.totalCss || 0,
        assets: data.assets || [],
        error: data.error,
      });
      console.log('[Dashboard] Asset health:', data);
    } catch (err: any) {
      setAssetHealth({
        ok: false,
        totalScripts: 0,
        totalCss: 0,
        assets: [],
        error: err.message,
      });
    }
  }, []);

  // Recheck proxy health (authoritative status)
  const recheckProxyHealth = useCallback(async () => {
    try {
      const res = await fetch('/manifold-proxy/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const data: HealthResponse = await res.json();
      const host = data.origin ? (() => { try { return new URL(data.origin).host; } catch { return data.origin; } })() : null;
      
      setUpstreamHealth({
        ok: data.ok,
        status: data.status ?? (data.ok ? 200 : 502),
        origin: data.origin || null,
        error: data.error || null,
        lastChecked: Date.now(),
      });
      
      // Also update proxyTargetOrigin for compatibility
      if (data.origin) {
        setProxyTargetOrigin({ origin: data.origin, host: host || data.origin });
      }
      
      return data;
    } catch (err) {
      setUpstreamHealth({
        ok: false,
        status: -1,
        origin: null,
        error: String(err),
        lastChecked: Date.now(),
      });
      return null;
    }
  }, []);

  // Validate proxy HTML content (debug only) - uses detected app path
  const validateProxyHtml = useCallback(async () => {
    if (!DEBUG_MODE) return;
    try {
      const proxyAppUrl = `/manifold-proxy${detectedAppPathRef.current}`;
      const res = await fetch(proxyAppUrl, { cache: 'no-store' });
      const html = await res.text();
      // Check for SPA patterns: canvas in HTML OR script module (SPAs create canvas dynamically)
      const hasStaticCanvas = html.includes('<canvas') || html.includes('three') || html.includes('webgl');
      const hasSpaEntryPoint = html.includes('type="module"') || html.includes('/assets/') || html.includes('id="root"');
      updateDebugState({
        proxyStatus: res.status,
        proxyHtmlLength: html.length,
        proxyHasCanvas: hasStaticCanvas || hasSpaEntryPoint,
      });
    } catch (err) {
      updateDebugState({
        proxyStatus: -1,
        proxyHtmlLength: 0,
        proxyHasCanvas: false,
      });
    }
  }, [updateDebugState]);
  
  // Update container dimensions (debug only)
  useEffect(() => {
    if (!DEBUG_MODE || !frameRef.current) return;
    const updateDimensions = () => {
      if (frameRef.current) {
        updateDebugState({
          containerWidth: frameRef.current.clientWidth,
          containerHeight: frameRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDebugState]);
  
  // Cover Detector - runs after iframe load + timer for 5 seconds (debug only)
  const runCoverDetector = useCallback(() => {
    if (!DEBUG_MODE) return;
    
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log('[CoverDetector] No iframe ref');
      return;
    }
    
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(window.innerHeight / 2);
    const topElement = document.elementFromPoint(cx, cy);
    
    if (!topElement) {
      console.log('[CoverDetector] No element at center');
      return;
    }
    
    const isIframe = topElement === iframe || topElement.closest('iframe') === iframe;
    const hasPointerEventsNone = window.getComputedStyle(topElement).pointerEvents === 'none';
    const isPassthroughOverlay = hasPointerEventsNone && topElement !== iframe;
    
    if (isIframe || isPassthroughOverlay) {
      console.log('[CoverDetector] IFRAME_VISIBLE_OK', isPassthroughOverlay ? '(via passthrough overlay)' : '');
      setCoverReport(null);
      return;
    }
    
    // Build DOM path
    const domPath: string[] = [];
    let el: Element | null = topElement;
    while (el && el !== document.body) {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' 
        ? '.' + el.className.split(' ').filter(Boolean).join('.') 
        : '';
      domPath.push(`${tag}${id}${cls}`);
      el = el.parentElement;
    }
    
    // Get computed styles of covering element
    const computed = window.getComputedStyle(topElement);
    const styles: Record<string, string> = {
      position: computed.position,
      zIndex: computed.zIndex,
      opacity: computed.opacity,
      visibility: computed.visibility,
      pointerEvents: computed.pointerEvents,
      backgroundColor: computed.backgroundColor,
      filter: computed.filter,
      backdropFilter: (computed as unknown as { backdropFilter: string }).backdropFilter || 'none',
    };
    
    const iframeRect = iframe.getBoundingClientRect();
    const coverRect = topElement.getBoundingClientRect();
    
    const elementDesc = `${topElement.tagName.toLowerCase()}${topElement.id ? '#' + topElement.id : ''}${topElement.className && typeof topElement.className === 'string' ? '.' + topElement.className.split(' ').filter(Boolean)[0] : ''}`;
    
    console.log('[CoverDetector] IFRAME_COVERED by:', elementDesc, {
      domPath,
      styles,
      iframeRect: { top: iframeRect.top, left: iframeRect.left, width: iframeRect.width, height: iframeRect.height },
      coverRect: { top: coverRect.top, left: coverRect.left, width: coverRect.width, height: coverRect.height },
    });
    
    // Visual outline on covering element
    (topElement as HTMLElement).style.outline = '3px solid rgba(255,80,80,0.9)';
    setTimeout(() => {
      (topElement as HTMLElement).style.outline = '';
    }, 1000);
    
    setCoverReport({
      covered: true,
      coveringElement: elementDesc,
      domPath,
      styles,
      iframeRect,
      coverRect,
    });
  }, []);
  
  // Run cover detector after iframe load + every 500ms for 5 seconds (debug only)
  useEffect(() => {
    if (!DEBUG_PANEL_ENABLED || !iframeLoaded) return;
    
    // Initial check
    runCoverDetector();
    
    // Run every 500ms for 5 seconds (10 checks)
    let checkCount = 0;
    const maxChecks = 10;
    coverDetectorRef.current = window.setInterval(() => {
      checkCount++;
      runCoverDetector();
      if (checkCount >= maxChecks && coverDetectorRef.current) {
        window.clearInterval(coverDetectorRef.current);
        coverDetectorRef.current = null;
      }
    }, 500);
    
    return () => {
      if (coverDetectorRef.current) {
        window.clearInterval(coverDetectorRef.current);
        coverDetectorRef.current = null;
      }
    };
  }, [iframeLoaded, runCoverDetector]);
  
  // Bring Iframe To Front handler (debug only)
  const handleBringToFront = useCallback(() => {
    if (!DEBUG_PANEL_ENABLED) return;
    setIframeBroughtToFront(true);
    console.log('[Debug] Iframe brought to front');
  }, []);
  
  // Reset Iframe Z handler (debug only)
  const handleResetZ = useCallback(() => {
    if (!DEBUG_PANEL_ENABLED) return;
    setIframeBroughtToFront(false);
    console.log('[Debug] Iframe z-index reset');
  }, []);
  
  // Clear remount timer
  const clearRemountTimer = useCallback(() => {
    if (remountTimerRef.current) {
      window.clearTimeout(remountTimerRef.current);
      remountTimerRef.current = undefined;
    }
  }, []);
  
  // Warmup function with retry capability + auto-detect app path
  const doWarmup = useCallback(async () => {
    setDiagnostics(null);
    setIframeError(null);
    updateDebugState({ didLoad: false, loadCount: 0, lastLoadMs: null, lastRemountReason: null });
    
    // MVP_v2: Always use local /manifold route for same-origin embed
    if (USE_LOCAL_MANIFOLD) {
      const forcedSrc = buildForcedIframeSrc();
      console.log('[Manifold] MVP_v2: Using local embed:', forcedSrc);
      setIframeSrc(forcedSrc);
      updateDebugState({ iframeSrc: forcedSrc });
      setIframeReady(true);
      return;
    }
    
    // A1: If ORIGIN_OVERRIDE is set, skip warmup entirely and use forced src
    if (ORIGIN_OVERRIDE || FORCE_EMBED || FORCE_NO_CACHE) {
      const forcedSrc = buildForcedIframeSrc();
      console.log('[Manifold] Using forced iframe src:', forcedSrc);
      setIframeSrc(forcedSrc);
      updateDebugState({ iframeSrc: forcedSrc });
      setIframeReady(true);
      if (DEBUG_MODE) {
        validateProxyHtml();
      }
      return;
    }
    
    const result = await warmupManifold();
    
    if (result.ok) {
      useProxyRef.current = result.useProxy;
      
      // Auto-detect SPA entry path (only when using proxy)
      if (result.useProxy) {
        const detectedPath = await detectAppPath();
        detectedAppPathRef.current = detectedPath;
      }
      
      const src = getManifoldSrc(result.useProxy, detectedAppPathRef.current);
      if (src) {
        setIframeSrc(src);
        updateDebugState({ iframeSrc: src });
        setIframeReady(true);
        // Validate proxy HTML in debug mode
        if (DEBUG_MODE) {
          validateProxyHtml();
        }
      } else {
        setIframeError("Manifold unavailable — no URL configured");
      }
    } else {
      // Store diagnostics for fail-loud UI
      setDiagnostics(result.diagnostics);
      setIframeError("Manifold unavailable — warmup failed");
    }
  }, [updateDebugState, validateProxyHtml]);
  
  // Warmup on initial mount and on retry
  useEffect(() => {
    if (SAFE_MODE) return;
    doWarmup();
  }, [retryCount, doWarmup]);
  
  // Fetch proxy target origin on mount (always fetch for authoritative status)
  useEffect(() => {
    const fetchProxyTarget = async () => {
      const result = await recheckProxyHealth();
      if (result && result.origin) {
        console.log('[Dashboard] Proxy target origin:', { origin: result.origin, status: result.status });
      }
    };
    
    fetchProxyTarget();
  }, [recheckProxyHealth]);
  
  // B. Block READY timeouts/remounts when upstream is down
  useEffect(() => {
    if (!UPSTREAM_DOWN) return;
    
    // Set authoritative torus error state
    setTorusReady(false);
    setTorusError(`upstream_${upstreamHealth.status}`);
    console.log('[Dashboard] UPSTREAM DOWN - blocking READY timeouts, status:', upstreamHealth.status);
    
    // Clear any pending remount timers
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }, [UPSTREAM_DOWN, upstreamHealth.status]);
  
  // B3. Verify build on iframe src change - gate torus state on verification
  useEffect(() => {
    if (!iframeSrc) return;
    if (UPSTREAM_DOWN) return; // Skip verification if upstream is down
    
    const verify = async () => {
      const result = await verifyIframeBuild(iframeSrc);
      
      if (!result.verified) {
        // Gate: if build stamp is missing, show ERROR
        if (result.status === 200 && !result.hasStamp) {
          setTorusError('WRONG_BUILD_SERVED');
          setTorusReady(false);
          console.log('[Dashboard] BUILD VERIFICATION FAILED - wrong build served');
        } else if (result.status && result.status >= 500) {
          // Already handled by upstream health
        } else if (result.status === null) {
          setTorusError('BUILD_VERIFY_FAILED');
          setTorusReady(false);
        }
      } else {
        // Build verified - clear any build-related errors
        if (torusError === 'WRONG_BUILD_SERVED' || torusError === 'BUILD_VERIFY_FAILED') {
          setTorusError(null);
        }
      }
    };
    
    verify();
  }, [iframeSrc, UPSTREAM_DOWN, verifyIframeBuild, torusError]);

  // D. Auto-retry health loop when upstream is 502 (poll every 2s for 30s)
  useEffect(() => {
    if (!UPSTREAM_DOWN) {
      // Clear health retry loop when upstream comes back
      if (healthRetryRef.current) {
        window.clearInterval(healthRetryRef.current);
        healthRetryRef.current = null;
      }
      return;
    }
    
    let tries = 0;
    const maxTries = 15; // 15 * 2s = 30s
    
    console.log('[Dashboard] Starting health retry loop (502 detected)');
    
    healthRetryRef.current = window.setInterval(async () => {
      tries++;
      console.log('[Dashboard] Health retry attempt', tries, '/', maxTries);
      const result = await recheckProxyHealth();
      
      if (result?.ok) {
        console.log('[Dashboard] Upstream recovered! Reloading iframe...');
        // Upstream is back - reload iframe once
        setTorusError(null);
        setIframeKey(k => k + 1);
        updateDebugState({ lastRemountReason: 'upstream-recovered' });
        
        if (healthRetryRef.current) {
          window.clearInterval(healthRetryRef.current);
          healthRetryRef.current = null;
        }
      }
      
      if (tries >= maxTries) {
        console.log('[Dashboard] Health retry exhausted after 30s');
        if (healthRetryRef.current) {
          window.clearInterval(healthRetryRef.current);
          healthRetryRef.current = null;
        }
      }
    }, 2000);
    
    return () => {
      if (healthRetryRef.current) {
        window.clearInterval(healthRetryRef.current);
        healthRetryRef.current = null;
      }
    };
  }, [UPSTREAM_DOWN, recheckProxyHealth, updateDebugState]);
  
  // Retry handler for diagnostic overlay - regenerates v= timestamp and forces remount
  const handleRetry = useCallback(() => {
    console.log('[Dashboard] Retry triggered - regenerating iframe src');
    setRetryCount(c => c + 1);
    setIframeError(null);
    setTorusError(null);
    setIframeLoaded(false);
    setTorusReady(false);
    // Generate new src with fresh timestamp
    const newSrc = getManifoldSrc(useProxyRef.current, detectedAppPathRef.current);
    if (newSrc) {
      console.log('[Dashboard] Retry: new src =', newSrc);
      setIframeSrc(newSrc);
      setIframeKey(k => k + 1); // Force full remount
      updateDebugState({ iframeSrc: newSrc, lastRemountReason: 'user-retry' });
    }
  }, [updateDebugState]);
  
  // Reset loaded state when iframeSrc changes (NO auto-remount timeout - prevents 502 storms in Replit Preview)
  useEffect(() => {
    if (!iframeSrc) return;
    setIframeLoaded(false);
    console.log('[Dashboard] Iframe src set, awaiting load', { src: iframeSrc });
  }, [iframeSrc]);

  // A) sendToManifold - unified helper to send messages to the iframe
  const sendToManifold = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const msg = { source: 'rep-dashboard', type, ts: Date.now(), payload };
    win.postMessage(msg, '*');
    console.log('[Dashboard] TX', type, payload);
  }, []);

  // Legacy aliases for compatibility
  const postToManifold = sendToManifold;
  const sendToTorus = sendToManifold;

  // Listen for messages from torus
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data || {};
      
      // Source match telemetry (debug only)
      const iframe = iframeRef.current;
      const hasContentWindow = !!iframe?.contentWindow;
      const isFromIframeWindow = hasContentWindow && event.source === iframe.contentWindow;
      
      if (DEBUG_MODE) {
        setIframeWindowKnown(hasContentWindow);
        if (data.type && typeof data.type === 'string') {
          setLastMsgFromIframeWindow(isFromIframeWindow);
        }
      }
      
      // ACCEPT-ALL REP_* MODE (debug only) - log before any filtering
      if (DEBUG_MODE && data.type && typeof data.type === 'string' && String(data.type).startsWith('REP_')) {
        console.log('[Dashboard] REP_* PRE-FILTER', {
          type: data.type,
          origin: event.origin,
          sourceIsIframe: isFromIframeWindow,
          data,
        });
      }
      
      // Add to RX ring buffer (last 25 messages) - capture ALL messages with type
      // For REP_* messages, ALWAYS add to buffer even if filtered (for debugging)
      if (data.type && typeof data.type === 'string') {
        const isRepMessage = String(data.type).startsWith('REP_');
        setRxBuffer(prev => {
          const entry = {
            type: data.type + (isRepMessage && !isFromIframeWindow ? ' [!iframe]' : ''),
            source: data.source || '(none)',
            origin: event.origin,
            ts: Date.now(),
            sourceIsIframe: isFromIframeWindow,
          };
          const updated = [...prev, entry];
          return updated.slice(-25); // Keep last 25
        });
      }
      
      // Security: Validate origin - accept same-origin (proxy) or Manifold host
      const isSameOrigin = event.origin === window.location.origin;
      let isManifoldOrigin = false;
      if (MANIFOLD_URL) {
        try {
          const expectedOrigin = new URL(MANIFOLD_URL.replace(/\/+$/, "")).origin;
          isManifoldOrigin = event.origin === expectedOrigin;
        } catch {
          // Skip if URL can't be parsed
        }
      }
      
      // In DEBUG_MODE, skip filtering but still log mismatches
      const shouldFilter = !DEBUG_MODE;
      
      if (!isSameOrigin && !isManifoldOrigin) {
        // Log ignored REP_* messages for debugging
        if (data.type && String(data.type).startsWith("REP_")) {
          console.log("[Dashboard] Message (origin mismatch)", { origin: event.origin, data, filtered: shouldFilter });
        }
        if (shouldFilter) return;
      }
      
      // Also validate source is from torus or manifold
      if (data.source && data.source !== "rep-torus" && data.source !== "rep-manifold") {
        // Log ignored REP_* messages for debugging
        if (data.type && String(data.type).startsWith("REP_")) {
          console.log("[Dashboard] Message (source mismatch)", { origin: event.origin, data, filtered: shouldFilter });
        }
        if (shouldFilter) return;
      }
      
      // Log ALL incoming messages from torus
      if (data.type) {
        console.log("[Dashboard] RX", data);
      }
      
      // C) Handle REP_MANIFOLD_READY - torus is fully initialized (support both shapes)
      if (data.type === "REP_MANIFOLD_READY") {
        const ts = data.ts ?? data.payload?.ts ?? Date.now();
        setTorusReady(true);
        setTorusError(null);
        setLastReadyTs(ts);
        setRemountCount(0); // Reset remount count on successful READY
        
        // Sync mirror state to torus on ready
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: "MIRROR_STATE", 
            mirror: "baseposting", 
            enabled: basepostingEnabled 
          }, "*");
        }
        
        // Sync spin state from Manifold if provided (default to ON if not provided)
        const manifoldSpinOn = data.payload?.spinOn ?? data.spinOn;
        if (typeof manifoldSpinOn === 'boolean') {
          setSpinEnabled(manifoldSpinOn);
        }
        
        // E) Send initial spin once after READY (default ON)
        if (!sentInitialSpinRef.current && spinEnabled) {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            const spinPayload = {
              source: 'rep-dashboard',
              type: 'REP_SET_SPIN',
              ts: Date.now(),
              payload: { on: true },
            };
            iframe.contentWindow.postMessage(spinPayload, "*");
            console.log("[Dashboard] TX REP_SET_SPIN (initial)", { on: true });
            sentInitialSpinRef.current = true;
          }
        }
        
        // Clear READY timeout
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
        
        // C) Clear handshake timeout - we got READY
        if (handshakeTimeoutRef.current) {
          clearTimeout(handshakeTimeoutRef.current);
          handshakeTimeoutRef.current = null;
        }
        
        // Send ACK back to Manifold iframe
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          const ackPayload = {
            source: 'rep-dashboard',
            type: 'REP_DASHBOARD_ACK',
            ts, // Echo back the same timestamp for tracing
          };
          iframe.contentWindow.postMessage(ackPayload, "*");
          
          if (DEBUG_MODE) {
            console.log("[Dashboard] Sent ACK to Manifold", ackPayload);
          }
          
          // Add outgoing ACK to RX buffer so we can visually confirm handshake
          setRxBuffer(prev => {
            const entry = {
              type: 'REP_DASHBOARD_ACK (TX)',
              source: 'rep-dashboard',
              origin: window.location.origin,
              ts: Date.now(),
              sourceIsIframe: null, // TX messages don't have sourceIsIframe
            };
            const updated = [...prev, entry];
            return updated.slice(-25);
          });
        }
        
        return;
      }
      
      // Handle REP_MANIFOLD_ERROR - torus encountered an error (support both shapes)
      if (data.type === "REP_MANIFOLD_ERROR") {
        const reason = data.reason ?? data.payload?.reason ?? "unknown";
        setTorusError(reason);
        setTorusReady(false);
        return;
      }
      
      // C) Handle REP_MANIFOLD_PONG - response to our PING
      if (data.type === "REP_MANIFOLD_PONG") {
        const ts = data.ts ?? Date.now();
        setManifoldPongTs(Date.now());
        
        // Clear handshake timeout - we got a response
        if (handshakeTimeoutRef.current) {
          clearTimeout(handshakeTimeoutRef.current);
          handshakeTimeoutRef.current = null;
        }
        
        console.log('[Dashboard] RX REP_MANIFOLD_PONG', { 
          ts, 
          roundTripMs: Date.now() - ts,
          sourceIsIframe: isFromIframeWindow,
        });
        return;
      }
      
      // Handle REP_MANIFOLD_BUILD_ID - iframe sends its build signature on boot
      // This is the hard-proof that we're loading the correct build
      if (data.type === "REP_MANIFOLD_BUILD_ID") {
        const buildId = data.buildId ?? data.id ?? 'unknown';
        if (DEBUG_MODE) {
          console.log('[Dashboard] RX REP_MANIFOLD_BUILD_ID', { 
            buildId, 
            sourceIsIframe: isFromIframeWindow,
          });
          setBuildSignature({ 
            id: buildId, 
            fromIframe: isFromIframeWindow,
          });
        }
        return;
      }
      
      // A2: Handle REP_MANIFOLD_BUILD_INFO - same as BUILD_ID but with buildId in payload
      if (data.type === "REP_MANIFOLD_BUILD_INFO") {
        const buildId = data.buildId ?? data.payload?.buildId ?? 'unknown';
        console.log('[Dashboard] BUILD_INFO', { 
          id: buildId, 
          sourceIsIframe: isFromIframeWindow,
          origin: event.origin,
        });
        if (DEBUG_MODE) {
          setBuildSignature({ 
            id: buildId, 
            fromIframe: isFromIframeWindow,
          });
        }
        // Don't return - allow other logic to run if needed
      }

      // Handle DOT_SELECTED - support both nested { dot: {...} } and flat { dotId, kind, ... }
      if (data.type === "DOT_SELECTED") {
        const dot = data.dot ?? data;
        const dotId = dot.dotId;
        if (!dotId) return;
        
        // Normalize ts -> timestamp
        const timestamp = dot.timestamp ?? dot.ts;
        
        setSelectedDot({
          dotId,
          type: dot.kind || "unknown",
          label: dot.label || dotId,
          xp: dot.xp,
          clusterId: dot.clusterId,
          index: dot.index,
          meta: { timestamp, confidence: dot.confidence, ...dot.meta },
        });
        recordEvent("session", "Dot Selected", { dotId });
      }

      // Handle CLEAR_SELECTION - clicked empty space in torus
      if (data.type === "CLEAR_SELECTION") {
        setSelectedDot(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  
  // Ready timeout auto-remount: if torus doesn't signal READY within 8s, remount (max 3 times)
  // DISABLED in DEBUG_MODE to prevent resetting experiments mid-flight
  const READY_TIMEOUT_MS = 8000;
  useEffect(() => {
    if (!iframeSrc || SAFE_MODE) return;
    
    // In DEBUG_MODE, skip remount timeout entirely to avoid disrupting debugging
    if (DEBUG_MODE) {
      console.log('[Dashboard] DEBUG_MODE: READY timeout remounts DISABLED');
      return;
    }
    
    // Reset torus status on iframe src/key change
    setTorusReady(false);
    setTorusError(null);
    
    // Clear any existing timeout
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }
    
    // Start ready timeout
    readyTimeoutRef.current = window.setTimeout(() => {
      if (!torusReady) {
        if (remountCount >= MAX_REMOUNTS) {
          // Max remounts reached - show permanent error, stop retrying
          console.log('[Dashboard] Max remounts reached, stopping retry');
          setTorusError("max_remounts_exceeded");
          updateDebugState({ lastRemountReason: 'max-remounts-exceeded' });
          return;
        }
        
        console.log('[Dashboard] Torus READY timeout, forcing remount', remountCount + 1, '/', MAX_REMOUNTS);
        setTorusError("ready_timeout");
        setRemountCount(c => c + 1);
        setIframeKey(k => k + 1);
        updateDebugState({ lastRemountReason: 'ready-timeout-remount' });
      }
    }, READY_TIMEOUT_MS);
    
    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    };
  }, [iframeSrc, iframeKey, remountCount, torusReady]);
  
  // Ping iframe handler (debug only) - send REP_DASHBOARD_PING and expect REP_MANIFOLD_PONG
  const handlePingIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const hasContentWindow = !!iframe?.contentWindow;
    const pingTs = Date.now();
    
    // Log 3 things as requested
    console.log('[Dashboard] PING →', {
      pingTs,
      iframeSrc,
      contentWindowExists: hasContentWindow,
    });
    
    if (!hasContentWindow) {
      console.log('[Dashboard] PING FAILED: No iframe contentWindow');
      // Still add to buffer to show the attempt
      setRxBuffer(prev => {
        const entry = {
          type: 'REP_DASHBOARD_PING (TX FAILED)',
          source: 'rep-dashboard',
          origin: window.location.origin,
          ts: pingTs,
          sourceIsIframe: null,
        };
        const updated = [...prev, entry];
        return updated.slice(-25);
      });
      return;
    }
    
    const pingPayload = {
      source: 'rep-dashboard',
      type: 'REP_DASHBOARD_PING',
      ts: pingTs,
    };
    
    iframe.contentWindow.postMessage(pingPayload, "*");
    console.log('[Dashboard] TX REP_DASHBOARD_PING', pingPayload);
    
    // Add outgoing PING to RX buffer
    setRxBuffer(prev => {
      const entry = {
        type: 'REP_DASHBOARD_PING (TX)',
        source: 'rep-dashboard',
        origin: window.location.origin,
        ts: pingTs,
        sourceIsIframe: null, // TX messages don't have sourceIsIframe
      };
      const updated = [...prev, entry];
      return updated.slice(-25);
    });
  }, [iframeSrc]);

  const closeDetailPanel = () => {
    setSelectedDot(null);
  };

  // B) Deterministic spin toggle with explicit on/off
  const onToggleSpin = () => {
    setSpinEnabled(prev => {
      const next = !prev;
      sendToManifold("REP_SET_SPIN", { on: next });
      recordEvent("session", next ? "Spin On" : "Spin Off");
      return next;
    });
  };

  // B) Deterministic swarm toggle with explicit on/off
  const onToggleSwarm = () => {
    setSwarmEnabled(prev => {
      const next = !prev;
      sendToManifold("REP_SET_SWARM", { on: next });
      recordEvent("session", next ? "Swarm On" : "Swarm Off");
      return next;
    });
  };

  // Legacy aliases for compatibility
  const toggleSpin = onToggleSpin;
  const toggleSwarm = onToggleSwarm;

  const recordEvent = (type: EventType, label: string, meta?: Record<string, unknown>) => {
    const now = Date.now();
    const dedupeKey = `${type}:${normalizeLabel(label)}`;
    const lastAt = lastRecordedRef[dedupeKey] || 0;
    
    if (now - lastAt < MIN_EVENT_GAP_MS) {
      return;
    }
    
    lastRecordedRef[dedupeKey] = now;
    
    const newEvent: RepEvent = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      label,
      at: now,
      meta,
    };
    setEvents((prev) => {
      const updated = [...prev, newEvent];
      saveEvents(updated);
      return updated;
    });
  };

  const dots = React.useMemo(() => {
    const groups = groupEventsToGroups(events);
    return mapEventGroupsToDots(groups);
  }, [events]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMode === "view" && viewLens === "detail" && frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (frameRef.current) {
      const rect = frameRef.current.getBoundingClientRect();
      setMousePos({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, [activeMode, viewLens]);

  const handleNavClick = (item: "missions" | "activity" | "view") => {
    if (ambientOpen) setAmbientOpen(false);
    
    if (item === "missions") {
      if (activeMode === "missions") {
        recordEvent("session", "Closed Panel", { panel: "missions" });
        setActiveMode(null);
        sendToTorus("SET_MODE", { mode: "ambient" });
      } else {
        recordEvent("mission", "Opened Missions");
        setActiveMode("missions");
        sendToTorus("SET_MODE", { mode: "focus" });
      }
    } else if (item === "activity") {
      if (activeMode === "activity") {
        recordEvent("session", "Closed Panel", { panel: "activity" });
        setActiveMode(null);
        sendToTorus("SET_MODE", { mode: "ambient" });
      } else {
        recordEvent("session", "Opened Activity");
        setActiveMode("activity");
        sendToTorus("SET_MODE", { mode: "focus" });
      }
    } else if (item === "view") {
      if (activeMode === "view") {
        recordEvent("session", "Closed Panel", { panel: "history" });
        setActiveMode(null);
        setLastViewLens("identity");
        sendToTorus("SET_MODE", { mode: "ambient" });
      } else if (activeMode === null) {
        recordEvent("session", "Opened History");
        setActiveMode("view");
        setViewLens("identity");
        setLastViewLens("identity");
        sendToTorus("SET_MODE", { mode: "focus" });
        sendToTorus("SET_LENS", { lens: "identity" });
      } else {
        recordEvent("session", "Opened History");
        setActiveMode("view");
        setViewLens(lastViewLens);
        sendToTorus("SET_MODE", { mode: "focus" });
        sendToTorus("SET_LENS", { lens: lastViewLens });
      }
    }
  };

  const openMissionsPanel = () => {
    if (ambientOpen) setAmbientOpen(false);
    recordEvent("mission", "Opened Missions Panel");
    setOpenPanel("missions");
    setActiveMode("missions");
    sendToTorus("SET_MODE", { mode: "focus" });
  };

  const openActivityPanel = () => {
    if (ambientOpen) setAmbientOpen(false);
    recordEvent("session", "Opened Activity Panel");
    setOpenPanel("activity");
    setActiveMode("activity");
    setActivityTab("identity");
    setViewLens("identity");
    sendToTorus("SET_MODE", { mode: "focus" });
    sendToTorus("SET_LENS", { lens: "identity" });
  };

  const closePanel = () => {
    if (openPanel) {
      recordEvent("session", "Closed Panel", { panel: openPanel });
    }
    setOpenPanel(null);
    setActiveMode(null);
    sendToTorus("SET_MODE", { mode: "ambient" });
  };

  const handleActivityTabChange = (tab: ViewLens) => {
    setActivityTab(tab);
    setViewLens(tab);
    setLastViewLens(tab);
    recordEvent("identity", `Lens: ${tab.toUpperCase()}`, { lens: tab });
    sendToTorus("SET_LENS", { lens: tab });
  };

  const handleLensChange = (lens: ViewLens) => {
    recordEvent("identity", `Lens: ${lens.toUpperCase()}`, { lens });
    setViewLens(lens);
    setLastViewLens(lens);
    sendToTorus("SET_LENS", { lens });
  };

  const toggleAmbient = async () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    
    if (isCurrentlyFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (e) {
        console.log('[Fullscreen] Exit failed:', e);
      }
    } else {
      try {
        const container = document.querySelector('.dashboard-shell') as HTMLElement;
        if (container?.requestFullscreen) {
          await container.requestFullscreen();
        }
      } catch (e) {
        console.log('[Fullscreen] Enter failed:', e);
      }
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      console.log('[Fullscreen] State changed:', isFullscreen);
      
      if (isFullscreen !== ambientOpen) {
        setAmbientOpen(isFullscreen);
        recordEvent("session", isFullscreen ? "Ambient On" : "Ambient Off");
        
        if (isFullscreen) {
          setActiveMode(null);
          setShowFullscreenUI(false); // Hide UI immediately on entering fullscreen
          sendToTorus("SET_MODE", { mode: "ambient" });
          sendToTorus("TOGGLE_SWARM", { enabled: true });
          sendToTorus("SET_VIEW_MODE", { mode: "fullscreen" }); // Switch to fullscreen framing
          setSwarmEnabled(true);
        } else {
          setShowFullscreenUI(false);
          sendToTorus("SET_MODE", { mode: "focus" });
          sendToTorus("TOGGLE_SWARM", { enabled: false });
          sendToTorus("SET_VIEW_MODE", { mode: "normal" }); // Return to normal framing
          setSwarmEnabled(false);
          // Clear any pending hide timer
          if (uiHideTimerRef.current) {
            clearTimeout(uiHideTimerRef.current);
            uiHideTimerRef.current = null;
          }
        }
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [ambientOpen]);
  
  // Mouse-move reveal logic for fullscreen mode
  useEffect(() => {
    if (!ambientOpen) return;
    
    const handleMouseMove = () => {
      setShowFullscreenUI(true);
      // Clear existing timer
      if (uiHideTimerRef.current) {
        clearTimeout(uiHideTimerRef.current);
      }
      // Set new timer to hide UI after 1.5s
      uiHideTimerRef.current = setTimeout(() => {
        setShowFullscreenUI(false);
      }, 1500);
    };
    
    const handleTouchStart = handleMouseMove;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
      if (uiHideTimerRef.current) {
        clearTimeout(uiHideTimerRef.current);
      }
    };
  }, [ambientOpen]);

  const completeMission = (mission: MissionDef) => {
    if (completedMissions.has(mission.id)) return;
    
    const newCompleted = new Set(completedMissions);
    newCompleted.add(mission.id);
    setCompletedMissions(newCompleted);
    saveCompletedMissions(newCompleted);
    
    recordEvent("mission", `Completed: ${mission.title}`, { 
      missionId: mission.id, 
      xp: mission.xp 
    });
    
    // Quiet confirmation only - no celebratory effects
    setMissionFeedback(`Mission recorded`);
    setTimeout(() => setMissionFeedback(null), 2000);
  };

  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin + window.location.pathname;
  }, []);

  const copyShareLink = async () => {
    const url = getShareUrl();
    if (!url) return;
    
    let copied = false;
    
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {}
    }
    
    if (!copied && typeof document !== "undefined") {
      try {
        const input = document.createElement("input");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        copied = true;
      } catch {}
    }
    
    if (copied) {
      setShareCopied(true);
      recordEvent("session", "Copied share link");
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    if (typeof window === "undefined") return;
    const text = `Building my onchain identity with .rep ${totalXP} XP earned so far!`;
    const url = getShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    recordEvent("session", "Shared to Twitter");
    setShareOpen(false);
  };

  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "Escape") {
        if (shareOpen) setShareOpen(false);
        else if (xpPanelOpen) setXpPanelOpen(false);
        else if (identityFocusOpen) setIdentityFocusOpen(false);
        else if (basepostingBindingOpen) setBasepostingBindingOpen(false);
        else if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (err) {
            console.log('[Fullscreen] ESC exit failed:', err);
          }
        }
      }
      if (e.key === "a" || e.key === "A") {
        toggleAmbient();
      }
      
      // FX keyboard shortcuts - work in fullscreen without revealing UI
      const k = e.key.toLowerCase();
      if (k === 's') {
        const newSpin = !spinEnabled;
        setSpinEnabled(newSpin);
        sendToTorus("SET_SPIN", { enabled: newSpin });
        console.log('[HOTKEY] Spin toggled:', newSpin);
      }
      if (k === 'g') {
        const newGhost = !ghostEnabled;
        setGhostEnabled(newGhost);
        sendToTorus("SET_GHOST", { enabled: newGhost });
        console.log('[HOTKEY] Ghost toggled:', newGhost);
      }
      if (k === 'd') {
        const newDisco = !discoEnabled;
        setDiscoEnabled(newDisco);
        sendToTorus("SET_DISCO", { enabled: newDisco });
        console.log('[HOTKEY] Disco toggled:', newDisco);
      }
      if (k === 'f') {
        const newFireworks = !fireworksEnabled;
        setFireworksEnabled(newFireworks);
        sendToTorus("SET_FIREWORKS", { enabled: newFireworks });
        console.log('[HOTKEY] Fireworks toggled:', newFireworks);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shareOpen, xpPanelOpen, identityFocusOpen, basepostingBindingOpen, spinEnabled, ghostEnabled, discoEnabled, fireworksEnabled]);
  
  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (shareOpen && !target.closest(".share-anchor")) {
        setShareOpen(false);
      }
      if (xpPanelOpen && !target.closest(".xp-anchor")) {
        setXpPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareOpen, xpPanelOpen]);
  
  // Baseposting Mirror: real signature binding with wallet
  const [basepostingBindingError, setBasepostingBindingError] = useState<string | null>(null);
  const [basepostingProof, setBasepostingProof] = useState<{
    address: string;
    signature: string;
    confirmedAt: string;
  } | null>(() => {
    try {
      const binding = localStorage.getItem("rep.baseposting.binding");
      if (binding) {
        const data = JSON.parse(binding);
        return { address: data.address, signature: data.signature, confirmedAt: data.confirmedAt };
      }
    } catch {}
    return null;
  });
  
  const confirmBasepostingBinding = async () => {
    const validation = validateBasepostingHandle(basepostingHandleInput);
    if (!validation.valid) {
      setBasepostingHandleError(validation.error);
      return;
    }
    
    if (!walletAddress || !walletConnected) {
      setBasepostingBindingError("Wallet not connected. Please connect your wallet first.");
      return;
    }
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setBasepostingBindingError("No wallet found. Please install MetaMask or another Web3 wallet.");
      return;
    }
    
    const normalizedHandle = validation.normalized;
    const timestamp = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(2, 10);
    const message = `.rep Baseposting Mirror\nI confirm this wallet represents Baseposting identity: ${normalizedHandle}\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    try {
      setBasepostingBindingError(null);
      
      // Request real wallet signature via ethereum provider
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });
      
      // Verify signature using viem if available
      try {
        const { verifyMessage } = await import('viem');
        const isValid = await verifyMessage({
          address: walletAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        });
        if (!isValid) {
          setBasepostingBindingError("Signature verification failed. Please try again.");
          return;
        }
      } catch {
        console.log('[Baseposting] Signature verification skipped - viem not available');
      }
      
      const bindingData = {
        handle: normalizedHandle,
        address: walletAddress,
        message,
        signature,
        nonce,
        confirmedAt: timestamp,
        status: "CONNECTED"
      };
      
      setBasepostingHandle(normalizedHandle);
      setBasepostingSignature(signature);
      setBasepostingEnabled(true);
      setBasepostingStatus("Connected");
      setBasepostingHandleError(null);
      setBasepostingProof({ address: walletAddress, signature, confirmedAt: timestamp });
      
      try {
        localStorage.setItem("rep.baseposting.enabled", "true");
        localStorage.setItem("rep.baseposting.handle", normalizedHandle);
        localStorage.setItem("rep.baseposting.signature", signature);
        localStorage.setItem("rep.baseposting.binding", JSON.stringify(bindingData));
      } catch {}
      
      setBasepostingBindingOpen(false);
      setBasepostingHandleInput("");
      recordEvent("identity", "Baseposting Mirror enabled", { handle: normalizedHandle, address: walletAddress });
      
      // Send mirror state to torus iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: "MIRROR_STATE", mirror: "baseposting", enabled: true }, "*");
      }
      
    } catch (err: any) {
      console.error("[Baseposting] Signature failed:", err);
      if (err?.message?.includes("rejected") || err?.code === 4001) {
        setBasepostingBindingError("Signature request was rejected. Please try again.");
      } else {
        setBasepostingBindingError("Failed to sign message. Please try again.");
      }
    }
  };
  
  const disableBasepostingMirror = () => {
    setBasepostingEnabled(false);
    setBasepostingHandle("");
    setBasepostingSignature(null);
    setBasepostingStatus("OFF");
    setBasepostingProof(null);
    try {
      localStorage.removeItem("rep.baseposting.enabled");
      localStorage.removeItem("rep.baseposting.handle");
      localStorage.removeItem("rep.baseposting.signature");
      localStorage.removeItem("rep.baseposting.binding");
    } catch {}
    recordEvent("identity", "Baseposting Mirror disabled", {});
    
    // Send mirror state to torus iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "MIRROR_STATE", mirror: "baseposting", enabled: false }, "*");
    }
  };
  
  // DEV-only: Rate alarm check (Phase 1C)
  const checkRateAlarm = () => {
    if (!import.meta.env.DEV) return;
    const dbg = (window as any).__repDbg;
    if (!dbg) return;
    const now = Date.now();
    if (dbg.lastTxTs && (now - dbg.lastTxTs) < 500 && dbg.tx > 2) {
      console.warn("[DBG] LOOP SUSPECT - TX rate too high", { tx: dbg.tx, rx: dbg.rx, gap: now - dbg.lastTxTs });
    }
  };
  
  // DEV-only: Send coherence message with counter tracking
  const sendCoherenceToIframe = (coherence: { intensity: number; clarity: number; calm: number }, score?: number) => {
    if (!iframeRef.current?.contentWindow) return;
    
    const payload = {
      type: "REP_MIRROR_COHERENCE",
      source: "rep-dashboard",
      ...coherence,
      score,
    };
    
    iframeRef.current.contentWindow.postMessage(payload, "*");
    
    if (import.meta.env.DEV) {
      const dbg = (window as any).__repDbg;
      if (dbg) {
        dbg.tx++;
        dbg.lastTxTs = Date.now();
        console.log("[DBG] tx_coh", dbg.tx, coherence);
        checkRateAlarm();
      }
    }
  };
  
  // Phase 4: debug_coh=1 cycling from Dashboard (deterministic TX/RX testing without wallet)
  useEffect(() => {
    if (!debugCohUrlParam || !import.meta.env.DEV) return;
    
    // Clear any existing interval first (Phase 2)
    if (debugCohIntervalRef.current) {
      window.clearInterval(debugCohIntervalRef.current);
      debugCohIntervalRef.current = null;
    }
    
    const dbg = (window as any).__repDbg;
    if (dbg) {
      dbg.setInt++;
      console.log("[DBG] setInterval_count (debug_coh)", dbg.setInt);
    }
    
    debugCohIntervalRef.current = window.setInterval(() => {
      debugCohPhaseRef.current = (debugCohPhaseRef.current + 1) % 2;
      const val = debugCohPhaseRef.current === 0 ? 0.1 : 0.9;
      sendCoherenceToIframe({ intensity: val, clarity: val, calm: val });
    }, 2000);
    
    return () => {
      if (debugCohIntervalRef.current) {
        window.clearInterval(debugCohIntervalRef.current);
        debugCohIntervalRef.current = null;
      }
    };
  }, [debugCohUrlParam]);
  
  // Baseposting Mirror: Poll claims API when enabled + wallet connected
  useEffect(() => {
    // Skip real API polling in debug_coh mode (Phase 4)
    if (debugCohUrlParam) return;
    
    const fetchClaims = async () => {
      if (!basepostingEnabled || !walletAddress) return;
      
      // Phase 2: In-flight guard to prevent overlapping fetches
      if (basepostingInFlightRef.current) {
        console.log("[Baseposting] Skipping fetch - already in flight");
        return;
      }
      
      basepostingInFlightRef.current = true;
      
      if (import.meta.env.DEV) {
        const dbg = (window as any).__repDbg;
        if (dbg) {
          dbg.fetch++;
          console.log("[DBG] fetch_count", dbg.fetch);
        }
      }
      
      try {
        const response = await fetch(`/api/mirror/baseposting/claims?address=${walletAddress}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        
        setBasepostingClaims({
          coherence: data.coherence,
          counts: data.counts,
          score: data.score,
          fetchedAt: Date.now(),
        });
        
        // Send coherence to torus iframe for visualization modulation
        if (data.coherence) {
          sendCoherenceToIframe(data.coherence, data.score);
        }
      } catch (err: any) {
        console.error("[Baseposting] Claims fetch failed:", err);
        setBasepostingClaims((prev) => prev ? { ...prev, error: err?.message || "Failed to fetch" } : null);
      } finally {
        basepostingInFlightRef.current = false;
      }
    };
    
    // Initial fetch
    fetchClaims();
    
    // Phase 2: Clear existing interval before setting new one
    if (basepostingPollRef.current) {
      window.clearInterval(basepostingPollRef.current);
      basepostingPollRef.current = null;
    }
    
    // Poll every 10 minutes while enabled (RPC safety)
    if (basepostingEnabled && walletAddress) {
      if (import.meta.env.DEV) {
        const dbg = (window as any).__repDbg;
        if (dbg) {
          dbg.setInt++;
          console.log("[DBG] setInterval_count (poll)", dbg.setInt);
        }
      }
      basepostingPollRef.current = window.setInterval(fetchClaims, 600_000);
    }
    
    return () => {
      if (basepostingPollRef.current) {
        window.clearInterval(basepostingPollRef.current);
        basepostingPollRef.current = null;
      }
    };
  }, [basepostingEnabled, walletAddress, debugCohUrlParam]);
  
  // Short wallet address display
  // Short wallet address from connected wallet
  const shortWallet = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
    : "Not connected";

  const isMissionsMode = activeMode === "missions";
  const isActivityMode = activeMode === "activity";
  const isViewMode = activeMode === "view";

  // SINGLE VISUALIZATION OWNER: When Manifold iframe is active, it owns ALL visualization
  // No Dashboard-level torus/aura/dot rendering should occur when this is true
  // Uses iframeLoaded (onLoad event) rather than iframeReady (handshake) for earlier activation
  const MANIFOLD_ACTIVE = !SAFE_MODE && Boolean(iframeSrc) && iframeLoaded && !iframeError;
  
  // DEV INVARIANT: Enforce single visualization ownership (runs after render via useEffect)
  useEffect(() => {
    if (!import.meta.env.DEV || !MANIFOLD_ACTIVE) return;
    // Delay check to ensure React has finished DOM updates
    const timer = setTimeout(() => {
      const legacyVizElements = document.querySelectorAll('.history-viz, .torus-overlay, .aura-circle, .aura-core');
      if (legacyVizElements.length > 0) {
        console.error(
          '[Invariant Violation] Legacy Aura/Dot visualization mounted while Manifold is active.',
          'Elements found:', legacyVizElements.length,
          'Classes:', Array.from(legacyVizElements).map(el => el.className).join(', '),
          'This is a correctness bug - Dashboard should NOT render visualizations when Manifold iframe owns the canvas.'
        );
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [MANIFOLD_ACTIVE]);

  return (
    <div className={`dashboard-shell ${ambientOpen ? "ambient-on" : ""}`}>
      {/* TORUS IFRAME - with warmup and remount logic */}
      <div 
        className="dashboard-frame" 
        ref={frameRef} 
        onMouseMove={handleMouseMove}
        style={iframeBroughtToFront ? {
          position: 'fixed',
          inset: 0,
          zIndex: 1,
        } : undefined}
      >
        {SAFE_MODE || !iframeReady || iframeError ? (
          <>
            <div className="manifold-fallback" />
            {iframeError && diagnostics && (
              <div className="manifold-diagnostic-overlay">
                <div className="manifold-diagnostic-content">
                  <h3 className="manifold-diagnostic-title">Manifold Connection Failed</h3>
                  <pre className="manifold-diagnostic-json">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                  <p className="manifold-diagnostic-help">
                    Set MANIFOLD_ORIGIN to the exact https://...replit.dev origin you see when opening Manifold directly in a browser tab.
                  </p>
                  <button 
                    className="manifold-diagnostic-retry"
                    onClick={handleRetry}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            {iframeError && !diagnostics && (
              <div className="manifold-error">
                <span className="manifold-error-icon">⚠</span>
                <span className="manifold-error-text">{iframeError}</span>
                <button 
                  className="manifold-diagnostic-retry"
                  onClick={handleRetry}
                  style={{ marginLeft: '12px' }}
                >
                  Retry
                </button>
              </div>
            )}
            {!iframeReady && !iframeError && !SAFE_MODE && (
              <div className="manifold-loading">
                <span className="manifold-loading-text">Loading torus...</span>
              </div>
            )}
          </>
        ) : iframeSrc ? (
          <>
            {/* manifold-stage wrapper for CSS-based fullscreen animation */}
            <div className={`manifold-stage ${ambientOpen ? 'is-fs' : ''}`}>
              <div className="manifold-stage-inner">
                <iframe
                  key={iframeKey}
                  ref={(el) => {
                    (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = el;
                    if (IFRAME_PROOF_MODE) {
                      console.log('[ManifoldIframe] mounted=', !!el);
                      console.log('[ManifoldIframe] src=', iframeSrc);
                    }
                  }}
                  id="manifold-iframe"
                  className="manifold-iframe"
              src={iframeSrc}
              title=".rep Manifold"
              style={iframeBroughtToFront ? {
                width: '100%',
                height: '100%',
                display: 'block',
                opacity: 1,
                visibility: 'visible',
                border: '3px solid rgba(0,255,180,0.65)',
                background: 'rgba(0,255,180,0.08)',
                zIndex: 1,
              } : IFRAME_PROOF_MODE ? {
                width: '100%',
                height: '100%',
                display: 'block',
                opacity: 1,
                visibility: 'visible',
                border: '3px solid rgba(0,255,180,0.65)',
                background: 'rgba(0,255,180,0.06)',
                zIndex: 1,
              } : { 
                width: '100%', 
                height: '100%', 
                display: 'block', 
                background: 'transparent', 
                border: 0 
              }}
              allow="fullscreen; clipboard-read; clipboard-write; accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
              onError={() => {
                console.error('[Dashboard] Manifold iframe error', { src: iframeSrc });
                setIframeError("Manifold unavailable — failed to load iframe");
                updateDebugState({ lastRemountReason: 'iframe-error' });
              }}
              onLoad={(e) => {
                console.log('[Dashboard] Manifold iframe loaded', { src: iframeSrc });
                if (IFRAME_PROOF_MODE) {
                  console.log('[ManifoldIframe] onLoad fired, src=', iframeSrc);
                }
                clearRemountTimer();
                setIframeLoaded(true);
                
                setDebugState(prev => ({
                  ...prev,
                  didLoad: true,
                  loadCount: prev.loadCount + 1,
                  lastLoadMs: Date.now(),
                }));
                
                try {
                  const iframe = e.currentTarget;
                  if (!iframe.contentWindow) {
                    setIframeError("Manifold unavailable — iframe blocked");
                    updateDebugState({ lastRemountReason: 'iframe-blocked' });
                    return;
                  }
                  
                  // C) Handshake watchdog - send PING and set 8s timeout
                  const win = iframe.contentWindow;
                  const pingTs = Date.now();
                  win.postMessage({ source: 'rep-dashboard', type: 'REP_DASHBOARD_PING', ts: pingTs, payload: { pingTs } }, '*');
                  console.log('[Dashboard] TX REP_DASHBOARD_PING', { pingTs });
                  
                  // Clear any existing handshake timeout
                  if (handshakeTimeoutRef.current) {
                    clearTimeout(handshakeTimeoutRef.current);
                  }
                  
                  // Set 8s timeout - if no PONG or READY, set error (NO auto-remount)
                  handshakeTimeoutRef.current = window.setTimeout(() => {
                    // Only trigger if we haven't received PONG or READY
                    if (!torusReady && !manifoldPongTs) {
                      console.log('[Dashboard] Handshake timeout (8s) - no PONG or READY received');
                      setTorusError('no_handshake');
                      // D) NO auto-remount - just set error and stop
                    }
                    handshakeTimeoutRef.current = null;
                  }, 8000);
                  
                } catch {
                }
              }}
                />
              </div>
            </div>
            {IFRAME_PROOF_MODE && (
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                pointerEvents: 'none',
                padding: '12px 24px',
                background: 'rgba(0,0,0,0.7)',
                border: '2px solid rgba(0,255,180,0.8)',
                borderRadius: '8px',
                color: 'rgba(0,255,180,1)',
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                IFRAME EXPECTED HERE
              </div>
            )}
          </>
        ) : null}
        {/* LENS OVERLAY - visual effect layer */}
        {/* UNMOUNTED when MANIFOLD_ACTIVE - Manifold owns all visualization */}
        {!MANIFOLD_ACTIVE && (
          <div 
            className={`torus-overlay ${isViewMode ? "active" : ""} lens-${viewLens}`}
            style={{ '--mx': `${mousePos.x}px`, '--my': `${mousePos.y}px` } as React.CSSProperties}
          />
        )}
        {/* SEMANTIC DOT OVERLAY - shows emphasized dots per lens */}
        {/* UNMOUNTED when MANIFOLD_ACTIVE - Manifold owns all visualization */}
        {!MANIFOLD_ACTIVE && isViewMode && dots.length > 0 && (
          <div className={`history-viz lens-${viewLens} active`}>
            {(() => {
              const topDotsMap = getTopDotsForLens(dots, viewLens);
              const cx = 0.5;
              const cy = 0.5;
              
              const trackArcs: { type: EventType; minTheta: number; maxTheta: number; r: number; color: string }[] = [];
              const types: EventType[] = ["identity", "mission", "session"];
              types.forEach((type) => {
                const typeDots = dots.filter((d) => d.type === type);
                if (typeDots.length > 0) {
                  const thetas = typeDots.map((d) => d.theta);
                  const minTheta = Math.min(...thetas);
                  const maxTheta = Math.max(...thetas);
                  trackArcs.push({
                    type,
                    minTheta,
                    maxTheta,
                    r: ORBIT_RADII[type],
                    color: TYPE_COLORS[type],
                  });
                }
              });
              
              const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
                const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
                const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
                const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
                return `M ${start.x * 100} ${start.y * 100} A ${r * 100} ${r * 100} 0 ${largeArc} 1 ${end.x * 100} ${end.y * 100}`;
              };

              return (
                <>
                  <svg className="track-arcs-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {trackArcs.map((arc) => (
                      <path
                        key={arc.type}
                        d={describeArc(cx, cy, arc.r, arc.minTheta, arc.maxTheta)}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth="0.15"
                        opacity="0.15"
                      />
                    ))}
                    {dots.map((dot) => {
                      const rank = topDotsMap.get(dot.id);
                      if (rank === undefined) return null;
                      return (
                        <line
                          key={`conn-${dot.id}`}
                          x1={cx * 100}
                          y1={cy * 100}
                          x2={dot.x * 100}
                          y2={dot.y * 100}
                          stroke={dot.color}
                          strokeWidth="0.1"
                          opacity="0.12"
                        />
                      );
                    })}
                  </svg>
                  {dots.map((dot) => {
                    const rank = topDotsMap.get(dot.id);
                    const isEmphasized = rank !== undefined;
                    const drift = isEmphasized 
                      ? computeDrift(dot, viewLens, rank, dots, topDotsMap)
                      : { x: 0, y: 0 };
                    return (
                      <div
                        key={dot.id}
                        className={`semantic-dot ${isEmphasized ? "emphasized" : "deemphasized"}`}
                        style={{ 
                          left: `${dot.x * 100}%`, 
                          top: `${dot.y * 100}%`,
                          width: `${dot.size}px`,
                          height: `${dot.size}px`,
                          background: isEmphasized ? dot.color : `${dot.color}80`,
                          boxShadow: isEmphasized ? `0 0 12px ${dot.color}, 0 0 24px ${dot.color}50` : "none",
                          transform: `translate(-50%, -50%) translate(${drift.x}px, ${drift.y}px) scale(${isEmphasized ? 1.3 : 1})`,
                        }}
                      />
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* TOP BAR - Controls cluster top-left - Hidden in fullscreen except on mouse move */}
      <div className={`top-bar-controls-cluster ${ambientOpen ? (showFullscreenUI ? 'ambient-reveal' : 'ambient-hidden') : ''}`}>
        {/* Claim .rep */}
        <button 
          className="rep-name-pill clickable" 
          onClick={() => setIdentityFocusOpen(true)}
          title={claimedHandle || "Claim your .rep identity"}
        >
          <span className="rep-name-text">
            {claimedHandle ? `${claimedHandle}.rep` : "Claim .rep"}
          </span>
        </button>
        {/* XP Badge */}
        <div className="header-xp-anchor">
          <button className="xp-chip clickable" onClick={() => { setXpPanelOpen(!xpPanelOpen); setShareOpen(false); }}>
            <span className="xp-label">XP</span>
            <span className="xp-value">{totalXP}</span>
          </button>
          {xpPanelOpen && (
            <div className="anchored-popover xp-popover">
              <div className="popover-header">XP</div>
              <div className="xp-panel-number">{totalXP}</div>
              <div className="xp-panel-meaning">XP reflects sustained, intentional participation.</div>
              <div className="popover-divider" />
              <div className="popover-section-label">Current State</div>
              <div className="xp-panel-state">
                {totalXP >= 100 ? "Strong continuity established." : "Continuity is building."}
              </div>
              <div className="popover-divider" />
              <div className="xp-panel-nudge">Complete 1 mission to strengthen continuity.</div>
              <button 
                className="xp-panel-cta" 
                onClick={() => { setXpPanelOpen(false); setOpenPanel("missions"); }}
              >
                View Missions
              </button>
            </div>
          )}
        </div>
        {/* SHARE */}
        <div className="header-share-anchor">
          <button className="rep-share-btn" onClick={() => { setShareOpen(!shareOpen); setXpPanelOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>SHARE</span>
          </button>
          {shareOpen && (
            <div className="anchored-popover share-popover">
              <div className="popover-header">Share your identity</div>
              <div className="popover-content">
                <button className="share-option" onClick={copyShareLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span>{shareCopied ? "Copied!" : "Copy Link"}</span>
                </button>
                <button className="share-option twitter" onClick={shareToTwitter}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Share on X</span>
                </button>
                {basepostingEnabled && (
                  <>
                    <div className="popover-divider" />
                    <div className="popover-section-label">Selective Disclosure</div>
                    <label className="share-checkbox">
                      <input 
                        type="checkbox" 
                        checked={shareBasepostingActive} 
                        onChange={(e) => setShareBasepostingActive(e.target.checked)} 
                      />
                      <span>Share Baseposting: {basepostingStatus}</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        
        {/* Basepost Toggle - Only enabled when wallet connected */}
        <button 
          className={`baseposting-view-toggle ${basepostingViewEnabled ? 'active' : ''} ${!walletConnected ? 'disabled' : ''}`}
          onClick={() => {
            if (!walletConnected) return;
            const newEnabled = !basepostingViewEnabled;
            console.log('[BASEPOSTING_CLICK]', { enabled: newEnabled });
            handleBasepostingViewToggle();
          }}
          disabled={!walletConnected}
          title={!walletConnected ? 'Connect wallet to enable Baseposting' : (basepostingViewEnabled ? 'Disable Baseposting View' : 'Enable Baseposting View')}
          style={{ pointerEvents: 'auto', cursor: walletConnected ? 'pointer' : 'not-allowed' }}
        >
          <span className="baseposting-icon">🦎</span>
          <span className="baseposting-label">{basepostingViewEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* WALLET CONNECT - Uses production auth flow with signature */}
      <div className="wallet-connect-fixed">
        {!walletConnected ? (
          <button 
            className="wallet-connect-btn"
            onClick={handleConnectWallet}
            disabled={isAuthenticating}
            title="Login with your wallet"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="5" width="22" height="14" rx="2" ry="2" />
              <path d="M17 12h.01" />
            </svg>
            <span>{isAuthenticating ? 'Signing...' : 'Login'}</span>
          </button>
        ) : (
          <div className="wallet-connected-container">
            <button 
              className="wallet-address-pill"
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              title={walletAddress || "Connected wallet"}
            >
              <span className="wallet-dot connected"></span>
              <span className="wallet-address">
                {repName ? `${repName}.rep` : (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected')}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: walletDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {walletDropdownOpen && (
              <div className="anchored-popover wallet-popover">
                <div className="popover-header">Identity</div>
                {repName && <div className="wallet-rep-name">{repName}.rep</div>}
                <div className="wallet-full-address">{walletAddress}</div>
                <div className="popover-divider" />
                <button 
                  className="wallet-disconnect-btn"
                  onClick={() => { logout(); setWalletDropdownOpen(false); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
        {authError && (
          <div className="wallet-hint-toast">
            <span>{authError}</span>
            <button className="wallet-hint-dismiss" onClick={clearError}>×</button>
          </div>
        )}
      </div>

      {/* FULLSCREEN BUTTON - Hidden in fullscreen except on mouse move */}
      <button 
        className={`fullscreen-btn-pinned ${ambientOpen ? (showFullscreenUI ? 'ambient-reveal' : 'ambient-hidden') : ''}`}
        onClick={toggleAmbient}
        title={ambientOpen ? "Exit Fullscreen (ESC)" : "Fullscreen"}
        style={{ pointerEvents: 'auto' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {ambientOpen ? (
            <>
              <polyline points="4 14 4 20 10 20" />
              <polyline points="20 10 20 4 14 4" />
              <polyline points="14 20 20 20 20 14" />
              <polyline points="10 4 4 4 4 10" />
            </>
          ) : (
            <>
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <polyline points="21 15 21 21 15 21" />
              <polyline points="3 9 3 3 9 3" />
            </>
          )}
        </svg>
      </button>
      
      {/* BASEPOSTING VIEW SUMMARY PANEL */}
      {basepostingViewEnabled && walletConnected && (
        <div className="baseposting-view-panel">
          <div className="baseposting-panel-header">
            <span className="baseposting-panel-title">🦎 Baseposting View</span>
            <button className="baseposting-panel-close" onClick={handleBasepostingViewToggle}>×</button>
          </div>
          {basepostingViewSummary?.loading ? (
            <div className="baseposting-panel-loading">Loading activity...</div>
          ) : basepostingViewSummary?.error ? (
            <div className="baseposting-panel-error">{basepostingViewSummary.error}</div>
          ) : basepostingViewSummary ? (
            <>
              <div className="baseposting-panel-summary">
                <div className="baseposting-stat">
                  <span className="baseposting-stat-value">{basepostingViewSummary.txCount}</span>
                  <span className="baseposting-stat-label">transactions</span>
                </div>
                <div className="baseposting-stat">
                  <span className="baseposting-stat-value">{basepostingViewSummary.nftMints}</span>
                  <span className="baseposting-stat-label">mints</span>
                </div>
                <div className="baseposting-time-window">Last {basepostingViewSummary.timeWindow}</div>
              </div>
              {basepostingViewSummary.highlights.length > 0 && (
                <div className="baseposting-highlights">
                  {basepostingViewSummary.highlights.map((h, i) => (
                    <span key={i} className="baseposting-highlight">{h}</span>
                  ))}
                </div>
              )}
              <div className="baseposting-panel-actions">
                <button 
                  className="baseposting-share-btn"
                  onClick={handleShareToBase}
                  disabled={basepostingShareState.loading}
                >
                  {basepostingShareState.loading ? 'Preparing...' : '🚀 Share to Base'}
                </button>
                <button 
                  className="baseposting-copy-btn"
                  onClick={handleCopyCaption}
                >
                  {basepostingShareState.copied ? '✓ Copied!' : '📋 Copy Caption'}
                </button>
              </div>
              <button 
                className="baseposting-refresh-btn"
                onClick={fetchBasepostingViewSummary}
                disabled={basepostingViewSummary.loading}
              >
                ↻ Refresh
              </button>
            </>
          ) : (
            <div className="baseposting-panel-empty">No activity data</div>
          )}
        </div>
      )}

      {/* LEFT RAIL - nested expansion panels (not floating modals) */}
      <nav className={`hud-left-rail ${ambientOpen ? "ambient-hide" : ""}`}>
        {/* MISSIONS SECTION */}
        <div className="rail-section">
          <button 
            className={`rail-header ${openPanel === "missions" ? "open" : ""}`} 
            onClick={() => setOpenPanel(openPanel === "missions" ? null : "missions")}
          >
            <span className="rail-header-title">MISSIONS</span>
            {openPanel === "missions" && (
              <div className="rail-header-right">
                <span className="rail-xp-pill">{totalXP} XP</span>
                <span className="rail-close" onClick={(e) => { e.stopPropagation(); closePanel(); }}>×</span>
              </div>
            )}
          </button>
          <div className={`rail-panel ${openPanel === "missions" ? "open" : ""}`}>
            <div className="rail-panel-body">
              {missionFeedback && (
                <div className="mission-feedback">{missionFeedback}</div>
              )}
              {activeMissions.length > 0 ? (
                <>
                  {(showAllMissions ? activeMissions : activeMissions.slice(0, DEFAULT_MISSIONS_COUNT)).map((mission, i) => (
                    <div className={`rail-mission-row ${i === 0 ? "featured" : ""}`} key={mission.id}>
                      <div className="rail-mission-header">
                        <div className="rail-mission-info">
                          <div className="rail-mission-title">{mission.title}</div>
                          <div className="rail-mission-desc">{mission.description}</div>
                        </div>
                        <span className="rail-mission-xp">+{mission.xp} XP</span>
                      </div>
                      <div className="rail-mission-actions">
                        {mission.type === "manual" ? (
                          <button className="rail-btn" onClick={() => completeMission(mission)}>Complete</button>
                        ) : mission.ctaRoute ? (
                          <button className="rail-btn" onClick={() => {
                            recordEvent("mission", `Started: ${mission.title}`, { missionId: mission.id });
                            if (typeof window !== "undefined") {
                              window.location.href = mission.ctaRoute!;
                            }
                          }}>{mission.ctaLabel || "Start"}</button>
                        ) : (
                          <span className="rail-mission-status" title="Completes automatically when requirements are met.">AUTO-TRACKED</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {activeMissions.length > DEFAULT_MISSIONS_COUNT && (
                    <button 
                      className="rail-btn rail-btn-full" 
                      onClick={() => setShowAllMissions(!showAllMissions)}
                    >
                      {showAllMissions ? "Show less" : `View all (${activeMissions.length})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="rail-empty-msg">All missions complete! Check back soon.</div>
              )}
              <div className="rail-divider" />
              <div className="rail-streak">Streak: {streakDays} day{streakDays !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </div>

        {/* ACTIVITY SECTION */}
        <div className="rail-section">
          <button 
            className={`rail-header ${openPanel === "activity" ? "open" : ""}`} 
            onClick={() => {
              if (openPanel === "activity") {
                closePanel();
              } else {
                openActivityPanel();
              }
            }}
          >
            <span className="rail-header-title">ACTIVITY</span>
            {openPanel === "activity" && (
              <div className="rail-header-right">
                <span className="rail-close" onClick={(e) => { e.stopPropagation(); closePanel(); }}>×</span>
              </div>
            )}
          </button>
          <div className={`rail-panel ${openPanel === "activity" ? "open" : ""}`}>
            <div className="rail-panel-body">
              <div className="rail-activity-layout">
                <div className="rail-activity-content">
                  <div className="rail-activity-title">ACTIVITY — QUICK TAKE</div>
                  <div className="rail-section-label">Quick Take</div>
                  <div className="rail-quick-take">{VIEW_DATA.identity.quickTake}</div>
                  <div className="rail-divider" />
                  <div className="rail-section-label">Recent</div>
                  {RECENT_ACTIVITY.slice(0, 3).map((item, i) => (
                    <div className="rail-activity-row" key={i}>
                      <span className="rail-dot" />
                      <span className="rail-activity-label">{item.label}</span>
                      <span className="rail-activity-time">{item.time}</span>
                    </div>
                  ))}
                  {basepostingEnabled && (
                    <div className="rail-activity-row baseposting-row">
                      <span className="rail-dot baseposting" />
                      <span className="rail-activity-label">Baseposting presence — {basepostingStatus} (signals pending)</span>
                      <span className="rail-activity-time">mirrored</span>
                    </div>
                  )}
                  <div className="rail-divider" />
                  <div className="rail-section-label">Context</div>
                  <div className="rail-context-row">
                    <span className="rail-context-label">Name status</span>
                    <span className="rail-context-value">{claimedHandle ? "claimed" : "unclaimed"}</span>
                  </div>
                  <div className="rail-context-row">
                    <span className="rail-context-label">Wallet age</span>
                    <span className="rail-context-value">14d</span>
                  </div>
                  {basepostingEnabled && (
                    <div className="rail-context-row">
                      <span className="rail-context-label">Baseposting</span>
                      <span className="rail-context-value">{basepostingStatus}</span>
                    </div>
                  )}
                  <div className="rail-divider" />
                  <div className="rail-next-action">Complete 1 mission to strengthen continuity.</div>
                  <div className="rail-decay-notice">Signal fades with inactivity; returns with sustained behavior.</div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* INSPECTOR SECTION - shows when a dot is selected */}
        {selectedDot && (
          <div className="rail-section rail-inspector-section">
            <div className="rail-inspector-header">
              <div className="rail-inspector-nav">
                <button 
                  className="rail-inspector-nav-btn"
                  onClick={() => {
                    const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                    const currentIndex = selectedDot.index ?? 0;
                    const prevIndex = currentIndex === 0 ? TOTAL_DOTS - 1 : currentIndex - 1;
                    console.log('[NAV_CLICK]', { from: selectedDot.dotId, to: `dot-${prevIndex + 1}`, index: prevIndex });
                    iframe?.contentWindow?.postMessage({ type: 'SELECT_DOT_BY_INDEX', index: prevIndex }, '*');
                  }}
                  aria-label="Previous dot"
                >
                  ◀
                </button>
                <span className="rail-inspector-title">{selectedDot.label}</span>
                <button 
                  className="rail-inspector-nav-btn"
                  onClick={() => {
                    const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                    const currentIndex = selectedDot.index ?? 0;
                    const nextIndex = (currentIndex + 1) % TOTAL_DOTS;
                    console.log('[NAV_CLICK]', { from: selectedDot.dotId, to: `dot-${nextIndex + 1}`, index: nextIndex });
                    iframe?.contentWindow?.postMessage({ type: 'SELECT_DOT_BY_INDEX', index: nextIndex }, '*');
                  }}
                  aria-label="Next dot"
                >
                  ▶
                </button>
              </div>
              <button 
                className="rail-inspector-close"
                onClick={() => {
                  setSelectedDot(null);
                  const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                  iframe?.contentWindow?.postMessage({ type: 'CLEAR_SELECTION' }, '*');
                }}
              >
                ×
              </button>
            </div>
            <div className="rail-inspector-body">
              <div className="rail-inspector-row">
                <span className="rail-inspector-label">Type</span>
                <span className="rail-inspector-value">{selectedDot.type}</span>
              </div>
              {selectedDot.xp !== undefined && (
                <div className="rail-inspector-row">
                  <span className="rail-inspector-label">XP Earned</span>
                  <span className="rail-inspector-value">{selectedDot.xp}</span>
                </div>
              )}
              {selectedDot.clusterId && (
                <div className="rail-inspector-row">
                  <span className="rail-inspector-label">Cluster</span>
                  <span className="rail-inspector-value">{selectedDot.clusterId}</span>
                </div>
              )}
            </div>
            <div className="rail-inspector-actions">
              <button 
                className="rail-control-btn"
                onClick={() => {
                  console.log('[ZOOM_TO_DOT_CLICK]', { dotId: selectedDot.dotId, index: selectedDot.index });
                  const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                  iframe?.contentWindow?.postMessage({ type: 'ZOOM_TO_DOT', dotId: selectedDot.dotId }, '*');
                }}
              >
                Zoom
              </button>
              <button 
                className="rail-control-btn"
                onClick={() => setDotListOpen(true)}
              >
                List All
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* BOTTOM-LEFT SETTINGS HUD - Expandable FX Controls */}
      <div className={`settings-hud ${ambientOpen ? "ambient-hide" : ""}`}>
        <button 
          className={`settings-hud-toggle ${settingsExpanded ? "open" : ""}`}
          onClick={() => setSettingsExpanded(!settingsExpanded)}
        >
          <span>SETTINGS</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className={`settings-hud-panel ${settingsExpanded ? "open" : ""}`}>
          <div className="settings-hud-row">
            <button 
              className={`rail-control-btn ${spinEnabled ? 'active' : ''}`}
              onClick={() => {
                const newValue = !spinEnabled;
                setSpinEnabled(newValue);
                const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.postMessage({ type: 'SET_SPIN', enabled: newValue }, '*');
              }}
            >
              Spin
            </button>
            <button 
              className={`rail-control-btn ${ghostEnabled ? 'active' : ''}`}
              onClick={() => {
                const newValue = !ghostEnabled;
                setGhostEnabled(newValue);
                const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.postMessage({ type: 'SET_GHOST', enabled: newValue }, '*');
              }}
            >
              Ghost
            </button>
            <button 
              className={`rail-control-btn ${discoEnabled ? 'active' : ''}`}
              onClick={() => {
                const newValue = !discoEnabled;
                setDiscoEnabled(newValue);
                const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.postMessage({ type: 'SET_DISCO', enabled: newValue }, '*');
              }}
            >
              Disco
            </button>
            <button 
              className={`rail-control-btn ${fireworksEnabled ? 'active' : ''}`}
              onClick={() => {
                const newValue = !fireworksEnabled;
                setFireworksEnabled(newValue);
                const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.postMessage({ type: 'SET_FIREWORKS', enabled: newValue }, '*');
              }}
            >
              Fireworks
            </button>
          </div>
          <button 
            className="rail-control-btn settings-reset-btn"
            onClick={() => {
              console.log('[DASH_RESET_VIEW_CLICK]');
              const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
              iframe?.contentWindow?.postMessage({ type: 'RESET_VIEW' }, '*');
            }}
          >
            Reset View
          </button>
          
          {/* MVP Debug Status - Baseposting Pipeline */}
          <div className="mvp-debug-status">
            <div className="debug-status-row">
              <span className="debug-label">Wallet:</span>
              <span className="debug-value">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}</span>
            </div>
            <div className="debug-status-row">
              <span className="debug-label">Name:</span>
              <span className="debug-value">{claimedHandle ? `${claimedHandle}.rep` : 'None'}</span>
            </div>
            <div className="debug-status-row">
              <span className="debug-label">Baseposting:</span>
              <span className="debug-value">{basepostingViewEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <div className="debug-status-row">
              <span className="debug-label">Events:</span>
              <span className="debug-value">{basepostingViewSummary?.nftMints ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* IDENTITY FOCUS OVERLAY */}
      {identityFocusOpen && (
        <div className="identity-focus-overlay">
          <div className="identity-focus-panel">
            <div className="identity-focus-header">
              <span className="identity-focus-title">Identity Focus</span>
              <button className="identity-focus-close" onClick={() => setIdentityFocusOpen(false)}>×</button>
            </div>
            <div className="identity-focus-content">
              <div className="identity-focus-row">
                <span className="identity-focus-label">Handle</span>
                <span className="identity-focus-value">{claimedHandle ? `${claimedHandle}.rep` : "Not claimed"}</span>
              </div>
              <div className="identity-focus-row">
                <span className="identity-focus-label">Wallet</span>
                <span className="identity-focus-value">{shortWallet}</span>
              </div>
              <div className="identity-focus-row">
                <span className="identity-focus-label">XP</span>
                <span className="identity-focus-value">{totalXP}</span>
              </div>
              <div className="identity-focus-divider" />
              <div className="identity-focus-section-title">Mirrors</div>
              <div className="identity-focus-mirror-row">
                <span className="identity-focus-label">Baseposting Mirror</span>
                <span className="identity-focus-value">
                  {basepostingEnabled ? `ON — ${basepostingStatus} (signals pending)` : "OFF"}
                </span>
              </div>
              {basepostingEnabled && basepostingHandle && (
                <div className="identity-focus-row">
                  <span className="identity-focus-label">Bound Handle</span>
                  <span className="identity-focus-value baseposting-handle">@{basepostingHandle}</span>
                </div>
              )}
              {basepostingEnabled && basepostingProof && (
                <>
                  <div className="identity-focus-row proof-row">
                    <span className="identity-focus-label">Proof</span>
                    <span className="identity-focus-value proof-value">signed by {basepostingProof.address.slice(0, 6)}...{basepostingProof.address.slice(-4)}</span>
                  </div>
                  <div className="identity-focus-row proof-row">
                    <span className="identity-focus-label">Sig</span>
                    <span className="identity-focus-value proof-value">{basepostingProof.signature.slice(0, 10)}...{basepostingProof.signature.slice(-6)}</span>
                  </div>
                  <div className="identity-focus-row proof-row">
                    <span className="identity-focus-label">Confirmed</span>
                    <span className="identity-focus-value proof-value">{new Date(basepostingProof.confirmedAt).toLocaleString()}</span>
                  </div>
                </>
              )}
              {!basepostingEnabled ? (
                <button className="identity-focus-btn" onClick={() => setBasepostingBindingOpen(true)}>
                  Enable Baseposting Mirror
                </button>
              ) : (
                <button className="identity-focus-btn danger" onClick={disableBasepostingMirror}>
                  Disable Mirror
                </button>
              )}
              <div className="identity-focus-helper">
                Opt-in mirror. Computes presence signals, not content. You can disable anytime.
              </div>
            </div>
            <button className="identity-focus-back" onClick={() => setIdentityFocusOpen(false)}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      
      {/* BASEPOSTING BINDING MODAL */}
      {basepostingBindingOpen && (
        <div className="baseposting-modal-overlay" onClick={() => setBasepostingBindingOpen(false)}>
          <div className="baseposting-modal" onClick={(e) => e.stopPropagation()}>
            <div className="baseposting-modal-header">
              <span>Enable Baseposting Mirror</span>
              <button className="baseposting-modal-close" onClick={() => setBasepostingBindingOpen(false)}>×</button>
            </div>
            <div className="baseposting-modal-content">
              <div className="baseposting-modal-helper">
                Enter your Baseposting handle to mirror presence signals. No content is stored or displayed.
              </div>
              <input 
                type="text"
                className={`baseposting-modal-input ${basepostingHandleError ? "error" : ""}`}
                placeholder="your-handle"
                value={basepostingHandleInput}
                onChange={(e) => {
                  setBasepostingHandleInput(e.target.value);
                  setBasepostingHandleError(null);
                }}
                autoFocus
              />
              {basepostingHandleError && (
                <div className="baseposting-modal-error">{basepostingHandleError}</div>
              )}
              {basepostingBindingError && (
                <div className="baseposting-modal-error">{basepostingBindingError}</div>
              )}
              <div className="baseposting-modal-signature-note">
                Clicking confirm will request a wallet signature to bind this handle.
              </div>
              <button 
                className="baseposting-modal-confirm"
                disabled={!basepostingHandleInput.trim()}
                onClick={confirmBasepostingBinding}
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* DOT LIST DRAWER - shows all dots with filters */}
      {dotListOpen && (
        <div className="dot-list-overlay" onClick={() => setDotListOpen(false)}>
          <div className="dot-list-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="dot-list-header">
              <span className="dot-list-title">All Dots</span>
              <select 
                className="dot-list-filter"
                value={dotTypeFilter}
                onChange={(e) => setDotTypeFilter(e.target.value as DotTypeFilter)}
              >
                <option value="ALL">All Types</option>
                <option value="DEFI">DeFi</option>
                <option value="NFT">NFT</option>
                <option value="SOCIAL">Social</option>
                <option value="GAMING">Gaming</option>
                <option value="GOVERNANCE">Governance</option>
                <option value="STAKING">Staking</option>
              </select>
              <button 
                className="dot-list-close"
                onClick={() => setDotListOpen(false)}
                aria-label="Close list"
              >
                &times;
              </button>
            </div>
            <div className="dot-list-body">
              {/* Generate dots from known dot data or defaults */}
              {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
                const types = ['DEFI', 'NFT', 'SOCIAL', 'GAMING', 'GOVERNANCE', 'STAKING', 'DEFI', 'NFT'];
                const type = types[i];
                const xp = 10 + (i % 3) * 5;
                const clusterId = `cluster-${Math.floor(i / 2) + 1}`;
                
                // Apply filter
                if (dotTypeFilter !== 'ALL' && type !== dotTypeFilter) return null;
                
                return (
                  <div 
                    key={i}
                    className={`dot-list-item ${selectedDot?.index === i ? 'dot-list-item-selected' : ''}`}
                    onClick={() => {
                      const iframe = document.getElementById('manifold-iframe') as HTMLIFrameElement;
                      iframe?.contentWindow?.postMessage({ type: 'SELECT_DOT_BY_INDEX', index: i }, '*');
                      setDotListOpen(false);
                    }}
                  >
                    <span className="dot-list-item-type" style={{ color: getDotTypeColor(type) }}>
                      {type}
                    </span>
                    <span className="dot-list-item-xp">{xp} XP</span>
                    <span className="dot-list-item-cluster">{clusterId}</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}

      {/* COVER BADGE - appears when iframe is covered (debug only) */}
      {DEBUG_MODE && coverReport?.covered && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9997,
            pointerEvents: 'none',
            padding: '8px 16px',
            background: 'rgba(255,80,80,0.85)',
            border: '2px solid rgba(255,200,100,0.8)',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          IFRAME COVERED BY: {coverReport.coveringElement}
        </div>
      )}
      
      
      {/* DEBUG PANEL - hidden by default, show with VITE_IFRAME_DEBUG=1 or ?debug=1 */}
      {DEBUG_PANEL_ENABLED && (
        <div className="manifold-debug-panel">
          <div className="manifold-debug-title">IFRAME DEBUG</div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">src:</span>
            <span className="manifold-debug-value mono">{debugState.iframeSrc || '(none)'}</span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">didLoad:</span>
            <span className={`manifold-debug-value ${debugState.didLoad ? 'ok' : 'warn'}`}>
              {debugState.didLoad ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">loadCount:</span>
            <span className="manifold-debug-value">{debugState.loadCount}</span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">lastLoadMs:</span>
            <span className="manifold-debug-value">
              {debugState.lastLoadMs 
                ? `${Math.round((Date.now() - debugState.lastLoadMs) / 1000)}s ago`
                : '(never)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">remountReason:</span>
            <span className={`manifold-debug-value ${debugState.lastRemountReason ? 'warn' : ''}`}>
              {debugState.lastRemountReason || '(none)'}
            </span>
          </div>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">container:</span>
            <span className={`manifold-debug-value ${debugState.containerWidth === 0 || debugState.containerHeight === 0 ? 'warn' : 'ok'}`}>
              {debugState.containerWidth}x{debugState.containerHeight}
            </span>
          </div>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">proxyStatus:</span>
            <span className={`manifold-debug-value ${debugState.proxyStatus === 200 ? 'ok' : 'warn'}`}>
              {debugState.proxyStatus ?? '(pending)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">htmlLen:</span>
            <span className="manifold-debug-value">{debugState.proxyHtmlLength ?? '?'}</span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">hasCanvas:</span>
            <span className={`manifold-debug-value ${debugState.proxyHasCanvas ? 'ok' : 'warn'}`}>
              {debugState.proxyHasCanvas === null ? '?' : debugState.proxyHasCanvas ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-divider" />
          {/* A1: Override mode status */}
          {(ORIGIN_OVERRIDE || FORCE_EMBED || FORCE_NO_CACHE) && (
            <>
              <div className="manifold-debug-title" style={{ marginTop: '8px', color: '#00ff64' }}>OVERRIDE MODE</div>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">origin:</span>
                <span className="manifold-debug-value ok" style={{ fontSize: '8px', wordBreak: 'break-all' }}>
                  {ORIGIN_OVERRIDE || '(proxy)'}
                </span>
              </div>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">path:</span>
                <span className="manifold-debug-value ok">{PATH_OVERRIDE}</span>
              </div>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">embed:</span>
                <span className={`manifold-debug-value ${FORCE_EMBED ? 'ok' : ''}`}>{FORCE_EMBED ? 'ON' : 'off'}</span>
              </div>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">noCache:</span>
                <span className={`manifold-debug-value ${FORCE_NO_CACHE ? 'ok' : ''}`}>{FORCE_NO_CACHE ? 'ON' : 'off'}</span>
              </div>
              <div className="manifold-debug-divider" />
            </>
          )}
          {/* A. UPSTREAM HEALTH - Authoritative status */}
          <div className="manifold-debug-title" style={{ marginTop: '8px', color: UPSTREAM_DOWN ? '#ff6464' : '#00ffb4' }}>
            UPSTREAM HEALTH
          </div>
          {UPSTREAM_DOWN && (
            <div style={{
              background: 'rgba(255,80,80,0.3)',
              border: '1px solid rgba(255,100,100,0.6)',
              borderRadius: '4px',
              padding: '4px 6px',
              marginBottom: '4px',
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#ff6464',
              fontSize: '10px',
              letterSpacing: '1px',
            }}>
              UPSTREAM DOWN ({upstreamHealth.status})
            </div>
          )}
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">status:</span>
            <span className={`manifold-debug-value ${upstreamHealth.ok ? 'ok' : 'warn'}`} style={{ fontWeight: 'bold' }}>
              {upstreamHealth.status ?? '(pending)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">origin:</span>
            <span className={`manifold-debug-value ${upstreamHealth.ok ? 'ok' : 'warn'}`} style={{ fontSize: '8px', wordBreak: 'break-all' }}>
              {upstreamHealth.origin || '(loading...)'}
            </span>
          </div>
          {upstreamHealth.error && (
            <div className="manifold-debug-row">
              <span className="manifold-debug-label">error:</span>
              <span className="manifold-debug-value warn" style={{ fontSize: '8px', wordBreak: 'break-all' }}>
                {upstreamHealth.error}
              </span>
            </div>
          )}
          {/* C. OPEN UPSTREAM (WAKE) button */}
          {upstreamHealth.origin && (
            <button 
              className="manifold-debug-button" 
              onClick={() => {
                const wakeUrl = `${upstreamHealth.origin}/?embed=1&v=${Date.now()}`;
                window.open(wakeUrl, "_blank");
              }}
              style={{ 
                background: UPSTREAM_DOWN ? 'rgba(255,100,100,0.25)' : 'rgba(0,255,180,0.15)',
                fontWeight: UPSTREAM_DOWN ? 'bold' : 'normal',
                marginTop: '4px',
              }}
            >
              {UPSTREAM_DOWN ? 'OPEN UPSTREAM (WAKE)' : 'OPEN UPSTREAM'}
            </button>
          )}
          <button 
            className="manifold-debug-button" 
            onClick={recheckProxyHealth}
            style={{ background: 'rgba(100,200,255,0.15)', marginTop: '2px' }}
          >
            Recheck Health
          </button>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-title" style={{ marginTop: '8px' }}>PROXY TARGET</div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">origin:</span>
            <span className={`manifold-debug-value ${proxyTargetOrigin ? 'ok' : 'warn'}`} style={{ fontSize: '8px', wordBreak: 'break-all' }}>
              {proxyTargetOrigin?.origin || '(loading...)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">host:</span>
            <span className={`manifold-debug-value ${proxyTargetOrigin ? 'ok' : 'warn'}`} style={{ fontSize: '9px' }}>
              {proxyTargetOrigin?.host || '?'}
            </span>
          </div>
          <div className="manifold-debug-divider" />
          {/* B) BUILD VERIFICATION - Cryptographic proof-of-build */}
          <div className="manifold-debug-title" style={{ marginTop: '8px', color: buildVerification?.verified ? '#00ffb4' : '#ff6464' }}>
            BUILD VERIFICATION
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">verified:</span>
            <span className={`manifold-debug-value ${buildVerification?.verified ? 'ok' : 'warn'}`} style={{ fontWeight: 'bold' }}>
              {buildVerification === null ? '(pending...)' : buildVerification.verified ? 'YES ✓' : 'NO ✗'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">buildId:</span>
            <span className={`manifold-debug-value ${buildVerification?.buildId ? 'ok' : 'warn'}`} style={{ fontSize: '8px', wordBreak: 'break-all' }}>
              {buildVerification?.buildId || '(none)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">hasStamp:</span>
            <span className={`manifold-debug-value ${buildVerification?.hasStamp ? 'ok' : 'warn'}`}>
              {buildVerification === null ? '?' : buildVerification.hasStamp ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">hasScripts:</span>
            <span className={`manifold-debug-value ${buildVerification?.hasScripts ? 'ok' : 'warn'}`}>
              {buildVerification === null ? '?' : buildVerification.hasScripts ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">assetRefs:</span>
            <span className={`manifold-debug-value ${buildVerification?.hasAssetRefs ? 'ok' : 'warn'}`}>
              {buildVerification === null ? '?' : buildVerification.hasAssetRefs ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">baseTag:</span>
            <span className={`manifold-debug-value ${buildVerification?.hasBaseTag ? 'ok' : 'warn'}`}>
              {buildVerification === null ? '?' : buildVerification.hasBaseTag ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">status:</span>
            <span className={`manifold-debug-value ${buildVerification?.status === 200 ? 'ok' : 'warn'}`}>
              {buildVerification?.status ?? '?'}
            </span>
          </div>
          {buildVerification?.error && (
            <div className="manifold-debug-row">
              <span className="manifold-debug-label">error:</span>
              <span className="manifold-debug-value warn" style={{ fontSize: '8px', wordBreak: 'break-all' }}>
                {buildVerification.error}
              </span>
            </div>
          )}
          {!buildVerification?.verified && buildVerification?.sample && (
            <div style={{ 
              fontSize: '7px', 
              fontFamily: 'monospace', 
              color: 'rgba(255,100,100,0.9)',
              background: 'rgba(255,50,50,0.15)',
              padding: '4px',
              borderRadius: '2px',
              marginTop: '4px',
              marginBottom: '4px',
              maxHeight: '60px',
              overflowY: 'auto',
              wordBreak: 'break-all',
            }}>
              HTML sample: {buildVerification.sample.slice(0, 200)}...
            </div>
          )}
          <button 
            className="manifold-debug-button" 
            onClick={() => iframeSrc && verifyIframeBuild(iframeSrc)}
            style={{ background: 'rgba(100,200,255,0.15)', marginTop: '4px' }}
          >
            Re-verify Build
          </button>
          <div className="manifold-debug-divider" />
          
          {/* B2) ASSET HEALTH - Check if JS/CSS assets load through proxy */}
          <div className="manifold-debug-title" style={{ marginTop: '8px', color: assetHealth?.ok ? '#00ffb4' : '#ff9f43' }}>
            ASSET HEALTH
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">status:</span>
            <span className={`manifold-debug-value ${assetHealth?.ok ? 'ok' : 'warn'}`} style={{ fontWeight: 'bold' }}>
              {assetHealth === null ? '(not checked)' : assetHealth.ok ? 'ALL OK' : 'ISSUES'}
            </span>
          </div>
          {assetHealth && (
            <>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">scripts:</span>
                <span className="manifold-debug-value">{assetHealth.totalScripts}</span>
              </div>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">css:</span>
                <span className="manifold-debug-value">{assetHealth.totalCss}</span>
              </div>
              {assetHealth.assets.slice(0, 4).map((a, i) => (
                <div key={i} className="manifold-debug-row" style={{ fontSize: '8px' }}>
                  <span className="manifold-debug-label" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.type}:
                  </span>
                  <span className={`manifold-debug-value ${a.ok ? 'ok' : 'warn'}`}>
                    {a.status || 'ERR'} {a.url.split('/').pop()?.slice(0, 15)}
                  </span>
                </div>
              ))}
              {assetHealth.error && (
                <div className="manifold-debug-row">
                  <span className="manifold-debug-value warn" style={{ fontSize: '8px' }}>
                    {assetHealth.error}
                  </span>
                </div>
              )}
            </>
          )}
          <button 
            className="manifold-debug-button" 
            onClick={checkAssetHealth}
            style={{ background: 'rgba(255,159,67,0.15)', marginTop: '4px' }}
          >
            Check Asset 200
          </button>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-title" style={{ marginTop: '8px' }}>BUILD SIGNATURE (postMessage)</div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">id:</span>
            <span className={`manifold-debug-value ${buildSignature?.fromIframe ? 'ok' : buildSignature ? 'warn' : ''}`} style={{ fontSize: '8px', wordBreak: 'break-all' }}>
              {buildSignature?.id || '(awaiting...)'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">fromIframe:</span>
            <span className={`manifold-debug-value ${buildSignature?.fromIframe ? 'ok' : buildSignature ? 'warn' : ''}`}>
              {buildSignature === null ? '?' : buildSignature.fromIframe ? 'YES ✓' : 'NO ✗'}
            </span>
          </div>
          <div className="manifold-debug-divider" />
          <button className="manifold-debug-button" onClick={handleForceRemount}>
            Force Remount
          </button>
          <button className="manifold-debug-button" onClick={validateProxyHtml}>
            Re-check Proxy
          </button>
          <div className="manifold-debug-divider" />
          <button 
            className="manifold-debug-button" 
            onClick={() => window.open("/manifold-proxy-info", "_blank")}
            style={{ background: 'rgba(0,255,180,0.15)' }}
          >
            OPEN PROXY INFO
          </button>
          <button 
            className="manifold-debug-button" 
            onClick={() => iframeSrc && window.open(iframeSrc, "_blank")}
            style={{ background: 'rgba(100,200,255,0.15)' }}
          >
            OPEN PROXY IFRAME
          </button>
          <button 
            className="manifold-debug-button" 
            onClick={() => window.open("/manifold-proxy/", "_blank")}
            style={{ background: 'rgba(255,200,100,0.15)' }}
          >
            OPEN PROXY ROOT
          </button>
          {/* A5: OPEN DIRECT MANIFOLD button when ORIGIN_OVERRIDE is set */}
          {ORIGIN_OVERRIDE && (
            <button 
              className="manifold-debug-button" 
              onClick={() => {
                const pathPart = PATH_OVERRIDE.startsWith("/") ? PATH_OVERRIDE : "/" + PATH_OVERRIDE;
                const directUrl = `${ORIGIN_OVERRIDE.replace(/\/$/, "")}${pathPart}?embed=1&v=${Date.now()}`;
                window.open(directUrl, "_blank");
              }}
              style={{ background: 'rgba(0,255,100,0.25)', fontWeight: 'bold' }}
            >
              OPEN DIRECT MANIFOLD
            </button>
          )}
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-title" style={{ marginTop: '8px' }}>COVER DETECTOR</div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">status:</span>
            <span className={`manifold-debug-value ${coverReport?.covered ? 'warn' : 'ok'}`}>
              {coverReport?.covered ? 'COVERED' : 'VISIBLE_OK'}
            </span>
          </div>
          {coverReport?.covered && (
            <>
              <div className="manifold-debug-row">
                <span className="manifold-debug-label">coveredBy:</span>
                <span className="manifold-debug-value warn" style={{ fontSize: '8px' }}>
                  {coverReport.coveringElement}
                </span>
              </div>
              <div style={{ 
                fontSize: '7px', 
                fontFamily: 'monospace', 
                color: 'rgba(255,200,100,0.8)',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px',
                borderRadius: '2px',
                marginBottom: '4px',
                maxHeight: '60px',
                overflowY: 'auto',
              }}>
                {coverReport.domPath.map((p, i) => (
                  <div key={i}>{i === 0 ? '→ ' : '  '}{p}</div>
                ))}
              </div>
              <div style={{ fontSize: '7px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                z:{coverReport.styles.zIndex} | pos:{coverReport.styles.position} | pe:{coverReport.styles.pointerEvents}
              </div>
            </>
          )}
          <button 
            className="manifold-debug-button" 
            onClick={runCoverDetector}
            style={{ background: 'rgba(100,200,255,0.15)' }}
          >
            Check Cover Now
          </button>
          <button 
            className="manifold-debug-button" 
            onClick={iframeBroughtToFront ? handleResetZ : handleBringToFront}
            style={{ background: iframeBroughtToFront ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,180,0.2)' }}
          >
            {iframeBroughtToFront ? 'Reset Iframe Z' : 'Bring Iframe To Front'}
          </button>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-title" style={{ marginTop: '8px' }}>SOURCE MATCH</div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">iframeWindowKnown:</span>
            <span className={`manifold-debug-value ${iframeWindowKnown ? 'ok' : 'warn'}`}>
              {iframeWindowKnown ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="manifold-debug-row">
            <span className="manifold-debug-label">lastMsgFromIframe:</span>
            <span className={`manifold-debug-value ${lastMsgFromIframeWindow === true ? 'ok' : lastMsgFromIframeWindow === false ? 'warn' : ''}`}>
              {lastMsgFromIframeWindow === null ? '(none)' : lastMsgFromIframeWindow ? 'YES' : 'NO'}
            </span>
          </div>
          <button 
            className="manifold-debug-button" 
            onClick={handlePingIframe}
            style={{ background: 'rgba(255,150,0,0.2)', marginTop: '4px' }}
          >
            Ping Iframe
          </button>
          <div className="manifold-debug-divider" />
          <div className="manifold-debug-title" style={{ marginTop: '8px' }}>RX BUFFER ({rxBuffer.length})</div>
          <div style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            fontSize: '8px', 
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: '2px',
          }}>
            {rxBuffer.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.4)' }}>(no messages)</div>
            ) : (
              rxBuffer.slice().reverse().map((msg, i) => {
                // Color coding: green for REP_* from iframe, yellow for REP_* not from iframe, gray for other
                const isRep = msg.type.startsWith('REP_');
                const fromIframe = msg.sourceIsIframe === true;
                const isTx = msg.type.includes('(TX)');
                let color = 'rgba(255,255,255,0.6)';
                if (isRep && fromIframe) color = 'rgba(0,255,180,1)'; // Green: REP_* from iframe
                else if (isRep && !isTx) color = 'rgba(255,200,100,1)'; // Yellow: REP_* NOT from iframe
                else if (isTx) color = 'rgba(100,200,255,1)'; // Blue: TX messages
                
                return (
                  <div key={i} style={{ 
                    color,
                    marginBottom: '2px',
                    wordBreak: 'break-all',
                  }}>
                    {msg.type} | {msg.sourceIsIframe === null ? 'TX' : msg.sourceIsIframe ? '✓iframe' : '✗!iframe'}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
