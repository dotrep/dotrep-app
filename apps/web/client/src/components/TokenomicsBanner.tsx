import React from "react";

export default function TokenomicsBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-black text-xs p-2 text-center font-semibold rounded-lg shadow-md border border-yellow-400">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PHBhdGggZD0iTTAgMGgxMHYxMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30"></div>
      <div className="relative z-10 flex items-center justify-center space-x-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
          <circle cx="12" cy="12" r="8" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
        </svg>
        <span>You're earning XP that may become FSN tokens. Airdrop claim coming soon!</span>
      </div>
    </div>
  );
}