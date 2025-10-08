import React, { useState } from "react";
import { XPProvider, useXP } from "../context/XPContext";
import PulseRing from "./PulseRing";
import XPBar from "./XPBar";
import UploadDropZone from "./UploadDropZone";
import VaultFileList from "./VaultFileList";
import DebugPanel from "./DebugPanel";

const DashboardContent = () => {
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 space-y-8">
      <XPBar xp={xp} maxXp={1000} rank="Sentinel" />

      <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-16">
        <PulseRing xp={xp} />
        <UploadDropZone onUpload={handleUpload} />
      </div>

      <div className="w-full max-w-4xl">
        <VaultFileList files={files} />
      </div>

      <DebugPanel onAddXP={handleAddXP} onSimUpload={handleSimUpload} />
    </div>
  );
};

const Dashboard = () => (
  <XPProvider>
    <DashboardContent />
  </XPProvider>
);

export default Dashboard;
