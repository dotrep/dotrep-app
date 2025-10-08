import React, { useState } from "react";
import { XPProvider, useXP } from "../context/XPContext";
import PulseRing from "./PulseRing";
import XPBar from "./XPBar";
import UploadDropZone from "./UploadDropZone";
import VaultFileList from "./VaultFileList";
import DebugPanel from "./DebugPanel";

const Picture6DashboardContent = () => {
  const [files, setFiles] = useState([]);
  const { xp, addXP } = useXP();

  const handleUpload = (newFiles) => {
    const filesWithTimestamp = newFiles.map((file) => ({
      name: file.name,
      timestamp: new Date().toISOString(),
    }));
    setFiles((prev) => [...prev, ...filesWithTimestamp]);
    addXP(newFiles.length * 50);
  };

  const handleAddXP = () => addXP(10);

  const handleSimUpload = () => {
    const simulatedFile = {
      name: "test-file.txt",
      timestamp: new Date().toISOString(),
    };
    setFiles((prev) => [...prev, simulatedFile]);
    addXP(50);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 space-y-12">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row items-center justify-center space-y-12 md:space-y-0 md:space-x-24">
        <PulseRing xp={xp} />
        <div className="flex flex-col space-y-6 w-full max-w-md">
          <div className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-bold mb-6">Upload</h2>
            <UploadDropZone onUpload={handleUpload} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-white text-2xl font-bold mb-4">
              My Vault Files
            </h2>
            <VaultFileList files={files} />
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="w-full max-w-2xl">
        <XPBar xp={xp} maxXp={1000} rank="Sentinel" />
      </div>

      {/* Daily Disc Game Embed */}
      <div className="w-full max-w-4xl mt-12">
        <h2 className="text-white text-2xl font-bold mb-4">
          🎯 Daily Disc Challenge
        </h2>
        <iframe
          src="/disc-game/index.html"
          title="DISC Game"
          className="w-full h-[600px] rounded-xl border border-cyan-500 shadow-2xl"
          style={{ backgroundColor: "black" }}
        />
      </div>

      {/* Debug Panel */}
      <div className="w-full max-w-lg">
        <DebugPanel onAddXP={handleAddXP} onSimUpload={handleSimUpload} />
      </div>
    </div>
  );
};

const Picture6Dashboard = () => (
  <XPProvider>
    <Picture6DashboardContent />
  </XPProvider>
);

export default Picture6Dashboard;
