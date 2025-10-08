import React from "react";
import WalletExplorer from "./pages/WalletExplorer";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/wallet") {
    return <WalletExplorer />;
  }
  return (
    <div style={{padding:"2rem", color:"#111", fontFamily:"sans-serif"}}>
      <h1>dotrep web</h1>
      <p>App is running. Visit <code>/wallet</code> for Wallet Explorer.</p>
    </div>
  );
}
