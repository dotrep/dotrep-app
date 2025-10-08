import WalletExplorer from "@/pages/WalletExplorer";
import React from "react";
import Picture6Dashboard from "./components/Picture6Dashboard";

const App = () => {
  if (typeof window !== "undefined" && window.location.pathname === "/wallet") {
    return <WalletExplorer />;
  }

  return <Picture6Dashboard />;
};

export default App;
