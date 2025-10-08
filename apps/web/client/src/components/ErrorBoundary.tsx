// Error boundary component to catch React errors
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>The application encountered an unexpected error.</p>
            {this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button onClick={this.handleRetry} className="retry-button">
              Try Again
            </button>
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              background: #001a2e;
            }

            .error-content {
              text-align: center;
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid #ef4444;
              border-radius: 12px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
            }

            .error-content h2 {
              color: #ef4444;
              margin-bottom: 16px;
              font-size: 1.5rem;
            }

            .error-content p {
              color: #b0bec5;
              margin-bottom: 24px;
            }

            .error-details {
              text-align: left;
              margin-bottom: 24px;
            }

            .error-details summary {
              color: #66fcf1;
              cursor: pointer;
              margin-bottom: 8px;
            }

            .error-details pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 12px;
              border-radius: 6px;
              color: #ffffff;
              font-size: 0.9rem;
              overflow-x: auto;
            }

            .retry-button {
              background: #66fcf1;
              color: #001a2e;
              border: none;
              border-radius: 6px;
              padding: 12px 24px;
              cursor: pointer;
              font-weight: bold;
              transition: all 0.2s;
            }

            .retry-button:hover {
              background: #00f0ff;
              transform: translateY(-1px);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}