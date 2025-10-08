import React from "react";
import { Progress } from "@/components/ui/progress";
import PlanetIcon from "@/components/PlanetIcon";

interface XPProgressCardProps {
  xp?: number;
  level?: string;
}

export default function XPProgressCard({ 
  xp = 420, 
  level = "Explorer" 
}: XPProgressCardProps) {
  const nextLevelXP = 1000; // example threshold
  const percent = (xp / nextLevelXP) * 100;

  return (
    <div className="bg-gray-900/80 text-cyan-100 p-4 rounded-2xl shadow-[0_0_35px_rgba(0,240,255,0.15)] backdrop-blur-sm w-full border border-cyan-800/40">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 mr-2 flex items-center justify-center">
          <PlanetIcon size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold mb-0 text-cyan-300">XP Progress</h2>
          <p className="text-xs mb-0">Current Rank: <span className="font-semibold text-cyan-200">{level}</span></p>
        </div>
      </div>
      
      <div className="mb-2">
        <Progress 
          value={percent} 
          className="h-2 bg-cyan-950/60" 
        />
      </div>
      <p className="text-xs mb-3 text-cyan-200">{xp} XP / {nextLevelXP} XP to next level</p>

      <div>
        <h3 className="text-sm font-semibold mb-2 text-cyan-200 border-b border-cyan-800/40 pb-1">Upcoming Unlocks</h3>
        <ul className="space-y-1.5 text-xs">
          {[
            { name: "Vault Skin: Holo Gradient", xp: 600 },
            { name: "New Rank: Pathfinder", xp: 1000 },
            { name: "Badge: \"Signal Rookie\"", xp: 800 }
          ].map((unlock, i) => (
            <li key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${xp >= unlock.xp ? 'bg-green-400' : 'bg-cyan-700'}`}></div>
                <span>{unlock.name}</span>
              </div>
              <span className={`text-[10px] ${xp >= unlock.xp ? 'text-green-400' : 'text-cyan-600'}`}>
                {xp >= unlock.xp ? 'Unlocked!' : `${unlock.xp} XP`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}