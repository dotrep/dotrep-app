import React from "react";
import homepageImage from "@assets/Homepage.png";

interface BackgroundProps {
  children: React.ReactNode;
}

const Background: React.FC<BackgroundProps> = ({ children }) => {
  return (
    <div 
      className="background-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Actual background image from design */}
      <img 
        src={homepageImage} 
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          opacity: 0.25, // Setting to low opacity for overlay verification
        }}
        className="design-reference"
      />
      
      {/* Grid with dots background */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#0A1A2F",
          backgroundImage: `
            linear-gradient(to right, rgba(30, 74, 111, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(30, 74, 111, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "center",
          zIndex: -3,
        }}
        className="grid-background"
      />
      
      {/* Overlay for glowing dots */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `radial-gradient(circle, #00D4FF 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          backgroundPosition: "center",
          opacity: 0.3,
          zIndex: -2,
          pointerEvents: "none",
        }}
        className="grid-dots"
      />
      
      {/* Content container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
        className="content-wrapper"
      >
        {children}
      </div>
    </div>
  );
};

export default Background;