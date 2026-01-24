import { useMemo } from "react";
import { useLocation } from "wouter";
import "./rep-dashboard.css";

// ✅ 1) Put your STAGING URL here (no trailing slash)
const STAGING_ORIGIN =
  "https://afd8087d-6351-476c-ad91-d72a921ee8e3-00-2cwomguysjd0q.janeway.replit.dev/";

function getParam(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function RepDashboardV2() {
  const [, setLocation] = useLocation();

  const iframeSrc = useMemo(() => {
    const dev = getParam("dev") === "1";
    const embed = "1";
    const nobadge = "1";

    const url = new URL(STAGING_ORIGIN);
    // If STAGING dashboard route is different, change this path:
    url.pathname = "/rep-dashboard"; // <-- OR "/dashboard" OR "/" depending on STAGING
    url.searchParams.set("embed", embed);
    url.searchParams.set("nobadge", nobadge);
    if (dev) url.searchParams.set("dev", "1");

    return url.toString();
  }, []);

  return (
    <div className="rep-dashboard" style={{ padding: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(10, 14, 20, 0.7)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <button
          className="action-button action-button-secondary"
          onClick={() => setLocation("/")}
          style={{ padding: "10px 12px" }}
        >
          ← Back
        </button>

        <div style={{ opacity: 0.9, fontWeight: 600 }}>
          Dashboard (embedded STAGING)
        </div>

        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
          Tip: add <code>?dev=1</code> in MVP2 URL for bypass mode
        </div>
      </div>

      <div style={{ height: "calc(100vh - 56px)" }}>
        <iframe
          title="dotrep-staging dashboard"
          src={iframeSrc}
          style={{
            width: "100%",
            height: "100%",
            border: "0",
            display: "block",
            background: "#0b0f14",
          }}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
