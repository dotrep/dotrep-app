import React from "react";

export default function RepLizard() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        width: "80px",
        height: "80px",
        background: "url('/Avatar2.png') center/contain no-repeat",
        animation: "pulse 3s infinite ease-in-out",
      }}
    />
  );
}
