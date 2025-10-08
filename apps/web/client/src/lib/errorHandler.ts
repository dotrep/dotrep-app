// Global error handler to catch unhandled promise rejections
export class ErrorHandler {
  private static instance: ErrorHandler;
  private listeners: Set<(error: any) => void> = new Set();

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Filter out Web3/wagmi fetch errors that are expected during development
      const reason = event.reason;
      const isWeb3FetchError = reason && 
        reason.message && 
        reason.message.includes('Failed to fetch') &&
        reason.stack && 
        (reason.stack.includes('chunk-UC55GIYL.js') || 
         reason.stack.includes('wagmi') ||
         reason.stack.includes('viem'));

      if (isWeb3FetchError) {
        // Silently handle Web3 fetch errors - these are expected during development
        event.preventDefault();
        return;
      }

      console.warn('Unhandled promise rejection:', event.reason);
      
      // Prevent the default browser behavior (console error)
      event.preventDefault();
      
      // Notify listeners
      this.notifyListeners(event.reason);
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.warn('Global error:', event.error);
      this.notifyListeners(event.error);
    });
  }

  addListener(callback: (error: any) => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: (error: any) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners(error: any) {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error handler listener:', e);
      }
    });
  }

  // Method to handle promise rejections gracefully
  static async handlePromise<T>(promise: Promise<T>): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      console.warn('Promise rejected, handled gracefully:', error);
      return null;
    }
  }

  // Wrap async functions to handle errors gracefully
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<R | null> {
    return async (...args: T) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.warn('Async function error handled:', error);
        return null;
      }
    };
  }
}

// Initialize error handler
export const errorHandler = ErrorHandler.getInstance();

// Export utility functions
export const handlePromise = ErrorHandler.handlePromise;
export const wrapAsync = ErrorHandler.wrapAsync;