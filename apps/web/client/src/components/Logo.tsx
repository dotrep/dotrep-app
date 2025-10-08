import React from "react";
import logoImage from "@assets/FreeSpace_Logo.jpg";

const Logo: React.FC = () => {
  return (
    <div className="logo-container">
      <img 
        src={logoImage} 
        alt="FreeSpace Network" 
        className="logo"
      />
    </div>
  );
};

export default Logo;
