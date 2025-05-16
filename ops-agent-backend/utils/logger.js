/**
 * Utility for consistent logging across the application
 */

// Create a custom logging function that ensures output is visible
const logToConsole = (level, message, data) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Force flush to stdout
    if (data) {
        if (typeof data === 'object') {
            try {
                const dataStr = JSON.stringify(data, null, 2);
                process.stdout.write(`${logPrefix} ${message} ${dataStr}\n`);
            } catch (e) {
                process.stdout.write(`${logPrefix} ${message} [Object could not be stringified]\n`);
            }
        } else {
            process.stdout.write(`${logPrefix} ${message} ${data}\n`);
        }
    } else {
        process.stdout.write(`${logPrefix} ${message}\n`);
    }
};

// Helper functions for different log levels
const info = (message, data) => logToConsole('info', message, data);
const error = (message, data) => logToConsole('error', message, data);
const warn = (message, data) => logToConsole('warn', message, data);
const debug = (message, data) => logToConsole('debug', message, data);

export { logToConsole, info, error, warn, debug }; 