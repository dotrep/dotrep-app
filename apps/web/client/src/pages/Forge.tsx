import React from "react";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";

export default function Forge() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
      <SharedNetworkAnimation className="network-background" />
      <div className="text-center p-8 max-w-lg z-10 bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-cyan-900/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <h1 className="text-4xl font-bold mb-6 text-cyan-300">The Forge</h1>
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="cyan" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15M12 3L7 8M12 3L17 8" stroke="cyan" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping"></div>
          </div>
        </div>
        <p className="text-xl mb-3 text-cyan-100">
          Lock XP or NFTs here to transform them.
        </p>
        <p className="text-cyan-400 border border-cyan-800/40 rounded-xl px-4 py-2 inline-block">Coming soon</p>
      </div>
    </div>
  );
}