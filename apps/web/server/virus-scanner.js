/**
 * Simple virus scanning implementation for FSN Vault
 * Note: In a production environment, you would integrate with a proper
 * virus scanning service or library. This is a simplified implementation
 * for demonstration purposes.
 */

// List of suspicious file patterns (simplistic approach)
const SUSPICIOUS_PATTERNS = [
  /eval\(.*\)/i,                   // JavaScript eval calls
  /script>.*<\/script/i,           // Script tags
  /\.exe$/i,                       // Executable files
  /\.bat$/i,                       // Batch files
  /EICAR-STANDARD-ANTIVIRUS-TEST/, // EICAR test virus signature
  /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}/ // Part of EICAR test string
];

// File types that require additional scanning
const HIGH_RISK_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.jar', '.dll', '.sh'
];

/**
 * Performs a basic virus scan on a file buffer
 * @param {Buffer} fileBuffer - Buffer containing the file contents
 * @returns {Promise<{clean: boolean, threat?: string}>} - Scan results
 */
async function scanFile(fileBuffer) {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      return { clean: false, threat: 'Empty or invalid file' };
    }
    
    // Convert buffer to string for pattern matching
    // Note: This is inefficient for large files but works for demonstration
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 10000));
    
    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(fileContent)) {
        return { 
          clean: false, 
          threat: `Suspicious pattern detected: ${pattern}` 
        };
      }
    }
    
    // Size check - reject extremely large files
    const MAX_SIZE_MB = 50;
    if (fileBuffer.length > MAX_SIZE_MB * 1024 * 1024) {
      return { 
        clean: false, 
        threat: `File exceeds maximum size limit of ${MAX_SIZE_MB}MB` 
      };
    }
    
    // All checks passed
    return { clean: true };
  } catch (error) {
    console.error('Error scanning file:', error);
    return { 
      clean: false, 
      threat: 'Error during virus scan' 
    };
  }
}

/**
 * Determines if a file needs additional scanning based on its extension
 * @param {string} filename - The name of the file
 * @returns {boolean} - Whether the file is high risk
 */
function isHighRiskFile(filename) {
  if (!filename) return false;
  
  const lowercaseFilename = filename.toLowerCase();
  return HIGH_RISK_EXTENSIONS.some(ext => lowercaseFilename.endsWith(ext));
}

module.exports = {
  scanFile,
  isHighRiskFile
};