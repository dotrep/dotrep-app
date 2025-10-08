import React, { useState, useRef } from 'react';

interface EmailReceiverProps {
  fsnName: string;
  userId: number;
  onFileReceived?: () => void;
}

/**
 * Component that shows users how to receive files via email to their FSN vault
 * and provides a test feature to demonstrate the functionality
 */
const EmailReceiver: React.FC<EmailReceiverProps> = ({ fsnName, userId, onFileReceived }) => {
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email formats that can be used to send files
  const emailFormat1 = `${fsnName}.fsn@fsnvault.com`;
  const emailFormat2 = `${fsnName}@fsn.fsnvault.com`;
  
  // Copy email to clipboard
  const copyToClipboard = (text: string, format: number) => {
    navigator.clipboard.writeText(text).then(() => {
      if (format === 1) {
        setCopied1(true);
        setTimeout(() => setCopied1(false), 2000);
      } else {
        setCopied2(true);
        setTimeout(() => setCopied2(false), 2000);
      }
    });
  };
  
  // Handle test file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target || typeof event.target.result !== 'string') return;
      
      const base64Content = event.target.result.split(',')[1]; // Remove data URL prefix
      await testEmailFunction(file.name, base64Content, file.type);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Test the email functionality by sending a file directly to the vault
  const testEmailFunction = async (fileName: string, fileContent: string, fileType: string) => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/vault/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fsnName,
          testFile: {
            name: fileName,
            content: fileContent,
            type: fileType
          }
        })
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success && onFileReceived) {
        onFileReceived();
      }
    } catch (error) {
      console.error('Error testing email functionality:', error);
      setTestResult({
        success: false,
        message: 'An error occurred while testing the email functionality'
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="email-receiver">
      <div className="email-receiver-header">
        <h3>Receive Files via Email</h3>
        <p>Share these email addresses with others to receive files directly in your vault:</p>
      </div>
      
      <div className="email-format-container">
        <div className="email-format-box">
          <div className="email-format">
            <span className="email-text">{emailFormat1}</span>
            <button 
              className="copy-button"
              onClick={() => copyToClipboard(emailFormat1, 1)}
              aria-label="Copy email format 1"
            >
              {copied1 ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="email-format-note">
            Format 1: username.fsn@fsnvault.com
          </div>
        </div>
        
        <div className="email-format-box">
          <div className="email-format">
            <span className="email-text">{emailFormat2}</span>
            <button 
              className="copy-button"
              onClick={() => copyToClipboard(emailFormat2, 2)}
              aria-label="Copy email format 2"
            >
              {copied2 ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="email-format-note">
            Format 2: username@fsn.fsnvault.com
          </div>
        </div>
      </div>
      
      <div className="email-instructions">
        <h4>How it Works:</h4>
        <ol>
          <li>Tell someone to send files to one of your FSN email addresses</li>
          <li>Any files attached to the email will automatically appear in your vault</li>
          <li>You'll receive a notification when new files arrive</li>
        </ol>
        
        {/* Test Feature */}
        <div className="email-test-feature">
          <h4>Try it now:</h4>
          <p>Select a file to test how it works:</p>
          
          <div className="email-test-upload">
            <input
              type="file"
              id="test-file-upload"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isLoading}
              className="email-test-input"
            />
            <label 
              htmlFor="test-file-upload" 
              className={`email-test-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Select a file to test'}
            </label>
          </div>
          
          {testResult && (
            <div className={`email-test-result ${testResult.success ? 'success' : 'error'}`}>
              <p>{testResult.message}</p>
              {testResult.success && (
                <p className="email-test-success-note">
                  The file has been added to your vault! Check your files list above.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="email-security-note">
          <p>
            <strong>Security Note:</strong> Anyone with your FSN name can send you files.
            Be cautious about which files you open from untrusted sources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailReceiver;