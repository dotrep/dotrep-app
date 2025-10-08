import React, { useState, useEffect } from 'react';
import { Settings, User, PaintBucket, Palette } from 'lucide-react';
import '../styles/dashboard-extensions.css';

interface ThemeOption {
  id: string;
  name: string;
  class: string;
}

interface AvatarOption {
  id: number;
  src: string;
  alt: string;
}

interface ProfileCustomizationProps {
  userId?: number | null;
  onThemeChange?: (theme: string) => void;
  onAvatarChange?: (avatarId: number) => void;
}

/**
 * Profile customization component that lets users personalize their FSN experience
 * with themes, avatars, and other visual preferences
 */
const ProfileCustomization: React.FC<ProfileCustomizationProps> = ({
  userId,
  onThemeChange,
  onAvatarChange
}) => {
  const [activeTheme, setActiveTheme] = useState<string>('cyberblue');
  const [activeAvatar, setActiveAvatar] = useState<number>(1);
  const [showHexagonEditor, setShowHexagonEditor] = useState<boolean>(false);
  const [hexagonStyle, setHexagonStyle] = useState<string>('classic');
  
  // Available theme options
  const themeOptions: ThemeOption[] = [
    { id: 'cyberblue', name: 'Cyber Blue', class: 'cyberblue' },
    { id: 'neonpink', name: 'Neon Pink', class: 'neonpink' },
    { id: 'emerald', name: 'Emerald', class: 'emerald' },
    { id: 'sunset', name: 'Sunset', class: 'sunset' }
  ];
  
  // Avatar options (would use real images in production)
  const avatarOptions: AvatarOption[] = [
    { id: 1, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%228%22%20r%3D%225%22%2F%3E%3Cpath%20d%3D%22M20%2021a8 8 0 10-16 0%22%2F%3E%3C%2Fsvg%3E', alt: 'Default Avatar' },
    { id: 2, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%2220%22%20height%3D%2220%22%20rx%3D%225%22%20ry%3D%225%22%2F%3E%3Cpath%20d%3D%22M16%2211.37A4%204%200%201%201%2012.63%208%204%204%200%200%201%2016%2011.37z%22%2F%3E%3Cline%20x1%3D%2217.5%22%20y1%3D%226.5%22%20x2%3D%2217.51%22%20y2%3D%226.5%22%2F%3E%3C%2Fsvg%3E', alt: 'Social Avatar' },
    { id: 3, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M21%2012.79A9%209%200%201%201%2011.21%203%207%207%200%200%200%2021%2012.79z%22%2F%3E%3C%2Fsvg%3E', alt: 'Night Owl' },
    { id: 4, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M12%2019.5L4.5%2012l7.5-7.5%22%2F%3E%3Cpath%20d%3D%22M19.5%2012l-7.5%207.5-7.5-7.5%22%2F%3E%3C%2Fsvg%3E', alt: 'Geometric' },
    { id: 5, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M13%202L3%2014h9l-1%208%2010-12h-9l1-8z%22%2F%3E%3C%2Fsvg%3E', alt: 'Energy' },
    { id: 6, src: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2366fcf1%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolygon%20points%3D%2212%202%2015.09%208.26%2022%209.27%2017%2014.14%2018.18%2021.02%2012%2017.77%205.82%2021.02%207%2014.14%202%209.27%208.91%208.26%2012%202%22%2F%3E%3C%2Fsvg%3E', alt: 'Star' },
  ];
  
  // Load user preferences (would connect to API in production)
  useEffect(() => {
    if (!userId) return;
    
    // In production, fetch actual user preferences
    // For demo, we'll use localStorage
    const savedTheme = localStorage.getItem('fsn_user_theme');
    const savedAvatar = localStorage.getItem('fsn_user_avatar');
    
    if (savedTheme) setActiveTheme(savedTheme);
    if (savedAvatar) setActiveAvatar(parseInt(savedAvatar));
  }, [userId]);
  
  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('fsn_user_theme', themeId);
    
    if (onThemeChange) onThemeChange(themeId);
    
    // Apply theme changes to the dashboard
    const root = document.documentElement;
    switch(themeId) {
      case 'neonpink':
        root.style.setProperty('--primary-color', '#ff69b4');
        root.style.setProperty('--accent-color', '#ff1493');
        break;
      case 'emerald':
        root.style.setProperty('--primary-color', '#50e3c2');
        root.style.setProperty('--accent-color', '#00b894');
        break;
      case 'sunset':
        root.style.setProperty('--primary-color', '#ff7675');
        root.style.setProperty('--accent-color', '#fd79a8');
        break;
      default: // cyberblue
        root.style.setProperty('--primary-color', '#66fcf1');
        root.style.setProperty('--accent-color', '#00f0ff');
    }
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `✓ Theme changed to ${themeId.charAt(0).toUpperCase() + themeId.slice(1)}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };
  
  // Handle avatar change
  const handleAvatarChange = (avatarId: number) => {
    setActiveAvatar(avatarId);
    localStorage.setItem('fsn_user_avatar', avatarId.toString());
    
    if (onAvatarChange) onAvatarChange(avatarId);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `✓ Avatar updated successfully!`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };
  
  return (
    <div className="profile-customization">
      <div className="profile-header">
        <div className="profile-title">
          <Settings size={18} className="settings-icon" style={{ marginRight: '8px' }} />
          Customize Your FSN Experience
        </div>
      </div>
      
      <div className="customization-section">
        <h3>
          <PaintBucket size={16} style={{ marginRight: '8px' }} />
          Interface Theme
        </h3>
        <div className="theme-description">
          Choose a color theme for your FSN experience
        </div>
        
        <div className="theme-selector">
          {themeOptions.map(theme => (
            <div
              key={theme.id}
              className={`theme-option ${theme.class} ${activeTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
              title={theme.name}
            />
          ))}
        </div>
      </div>
      
      <div className="customization-section">
        <h3>
          <User size={16} style={{ marginRight: '8px' }} />
          Profile Avatar
        </h3>
        <div className="avatar-description">
          Select an avatar for your FSN identity
        </div>
        
        <div className="avatar-options">
          {avatarOptions.map(avatar => (
            <div
              key={avatar.id}
              className={`avatar-option ${activeAvatar === avatar.id ? 'active' : ''}`}
              onClick={() => handleAvatarChange(avatar.id)}
            >
              <img src={avatar.src} alt={avatar.alt} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="customization-section">
        <h3>
          <Palette size={16} style={{ marginRight: '8px' }} />
          Hexagon Style
        </h3>
        <div className="hexagon-description">
          Customize your FSN hexagon identity
        </div>
        
        <button 
          className="customize-button"
          onClick={() => setShowHexagonEditor(true)}
        >
          Open Hexagon Editor
        </button>
      </div>

      {/* Hexagon Editor Modal */}
      {showHexagonEditor && (
        <div className="quest-modal-overlay" onClick={() => setShowHexagonEditor(false)}>
          <div className="quest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quest-modal-header">
              <div className="quest-modal-title">
                <h3>FSN Hexagon Editor</h3>
              </div>
              <button 
                className="quest-modal-close"
                onClick={() => setShowHexagonEditor(false)}
              >
                ×
              </button>
            </div>
            
            <div className="quest-modal-content">
              <p className="quest-modal-description">
                Customize your FSN hexagon identity with different styles and effects.
              </p>
              
              <div className="hexagon-styles">
                <h4>Hexagon Styles</h4>
                <div className="hexagon-style-grid">
                  {['classic', 'neon', 'pulse', 'matrix'].map(style => (
                    <div
                      key={style}
                      className={`hexagon-style-option ${hexagonStyle === style ? 'active' : ''}`}
                      onClick={() => setHexagonStyle(style)}
                    >
                      <div className={`hexagon-preview ${style}`}>
                        <span>.fsn</span>
                      </div>
                      <span className="style-name">{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="quest-modal-actions">
                <button 
                  className="quest-complete-btn"
                  onClick={() => {
                    localStorage.setItem('fsn_hexagon_style', hexagonStyle);
                    setShowHexagonEditor(false);
                    
                    // Show success notification with style name
                    const notification = document.createElement('div');
                    notification.className = 'theme-notification';
                    notification.innerHTML = `✓ Hexagon style "${hexagonStyle.charAt(0).toUpperCase() + hexagonStyle.slice(1)}" applied successfully!`;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                      if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                      }
                    }, 3000);
                  }}
                >
                  Apply Style
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCustomization;