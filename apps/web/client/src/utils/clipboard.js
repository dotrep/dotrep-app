// Utility functions for clipboard and sharing functionality

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export const downloadPNG = async (targetElementId, filename = 'fsn_beacon_card') => {
  const html2canvas = (await import('html2canvas')).default;
  
  const target = document.getElementById(targetElementId);
  if (!target) {
    console.error('Target element not found');
    return false;
  }
  
  try {
    const canvas = await html2canvas(target, {
      backgroundColor: '#001122',
      scale: 2, // Higher resolution
      useCORS: true
    });
    
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL();
    link.click();
    return true;
  } catch (error) {
    console.error('Error generating PNG:', error);
    return false;
  }
};

export const formatTimestamp = (date = new Date()) => {
  return date.toLocaleString();
};