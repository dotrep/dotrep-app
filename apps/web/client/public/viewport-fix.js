// Safari Mobile viewport fix
(function() {
  // Check if we're on iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    // Update the viewport meta tag for iOS devices
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
    } else {
      // Create viewport meta if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    }
    
    // Add class to body for iOS-specific styling
    document.body.classList.add('ios-device');
    
    // Fix for 100vh issue on iOS Safari
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set the property initially and on resize
    setVhProperty();
    window.addEventListener('resize', setVhProperty);
    window.addEventListener('orientationchange', setVhProperty);
  }
})();