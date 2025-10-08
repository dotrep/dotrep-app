import React from "react";

export default function MyPassport() {
  const categories = {
    Save: [
      { name: "Staked BTC", completed: true },
      { name: "Completed savings goal", completed: false }
    ],
    Build: [
      { name: "Joined mining quest", completed: true }
    ],
    Store: [
      { name: "Uploaded 1st file", completed: true },
      { name: "Secured vault", completed: false }
    ],
    Transact: [
      { name: "Made 1st crypto deposit", completed: true }
    ],
  };

  return (
    <div className="bg-gray-900/80 text-white p-4 rounded-2xl backdrop-blur-sm border border-cyan-800/40 shadow-[0_0_35px_rgba(0,240,255,0.15)]">
      <div className="flex items-center mb-3">
        <div className="w-7 h-7 mr-2 flex items-center justify-center bg-cyan-900/30 rounded-full border border-cyan-700/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
            <rect width="18" height="14" x="3" y="7" rx="2" />
            <line x1="8" x2="16" y1="7" y2="7" />
            <line x1="12" x2="12" y1="3" y2="7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-cyan-300">My Passport</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(categories).map(([section, items]) => (
          <div key={section} className="mb-3 border border-cyan-800/20 rounded-xl p-3 bg-gray-800/40">
            <h3 className="text-sm mb-2 font-semibold text-cyan-200 border-b border-cyan-800/30 pb-1">{section}</h3>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center text-xs">
                  <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                    item.completed ? 'bg-green-500/20 border border-green-500/40' : 'bg-gray-700/40 border border-gray-600/30'
                  }`}>
                    {item.completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={item.completed ? 'text-cyan-100' : 'text-cyan-600'}>
                    {item.name}
                    {item.completed && (
                      <span className="ml-1 text-xs text-green-400">✓</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}