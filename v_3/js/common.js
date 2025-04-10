// Common utility functions for the music player app

// Get the absolute path to the @audio directory
function getAudioDirectoryPath() {
    // Get the base path - this works whether we're on index.html or upload.html
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const audioDir = basePath + '@audio/';
    
    return audioDir;
}

// Check if a file exists in the @audio directory
// Note: This function cannot actually check if the file exists due to browser security restrictions,
// but it constructs the full URL that would point to the file
function getAudioFilePath(filename) {
    const audioDir = getAudioDirectoryPath();
    return audioDir + filename;
}

// Helper function to extract just the filename from an @audio/ path
function getFilenameFromPath(path) {
    return path.split('/').pop();
}

// Convert relative @audio/ path to absolute URL
function convertAudioPathToUrl(path) {
    // Remove the @audio/ prefix if present
    const filename = path.replace(/^@audio\//, '');
    
    // Check if we're running on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        // Use the GitHub Pages URL structure
        const repoName = 'Tildeplayer'; // Your repository name
        return `/${repoName}/@audio/${filename}`;
    } else {
        // Local development - use relative path
        return `/@audio/${filename}`;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Safely execute a storage operation with error handling and a fallback value
 * @param {Function} operation - An async function that performs the storage operation
 * @param {*} fallbackValue - The value to return if the operation fails
 * @returns {Promise<*>} - The result of the operation or the fallback value
 */
async function safeStorageOperation(operation, fallbackValue) {
    try {
        // Execute the provided operation
        const result = await operation();
        
        // Return the result or fallback if the result is null/undefined
        return result !== null && result !== undefined ? result : fallbackValue;
    } catch (error) {
        console.error('Storage operation failed:', error);
        
        // Show notification if notification service is available
        if (window.notificationService) {
            window.notificationService.show(
                'Storage Error',
                `Storage operation failed: ${error.message}`,
                'warning',
                5000
            );
        }
        
        // Return the fallback value
        return fallbackValue;
    }
}

// Create a global notification service
class NotificationService {
    constructor() {
        this.container = null;
        this.initialize();
    }

    initialize() {
        // Create notification container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
            
            // Add styles for notifications
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    max-width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    pointer-events: none;
                }
                
                .notification {
                    background-color: #333;
                    color: white;
                    padding: 12px 16px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s ease;
                    max-width: 350px;
                    pointer-events: auto;
                    position: relative;
                    word-break: break-word;
                }
                
                .notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .notification.info {
                    background-color: #2196F3;
                    border-left: 4px solid #0b7dda;
                }
                
                .notification.success {
                    background-color: #4CAF50;
                    border-left: 4px solid #3d8b40;
                }
                
                .notification.warning {
                    background-color: #ff9800;
                    border-left: 4px solid #e68900;
                }
                
                .notification.error {
                    background-color: #f44336;
                    border-left: 4px solid #d32f2f;
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                .notification-content {
                    padding-right: 20px;
                }
                
                .notification-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                
                .notification-message {
                    margin: 0;
                }
                
                .notification-buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 8px;
                }
                
                .notification-button {
                    background-color: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 8px;
                }
                
                .notification-button:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show a notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
     * @param {number} duration - How long the notification should remain visible (in ms)
     * @param {Function} callback - Optional callback for action button
     * @param {string} buttonText - Optional text for action button
     */
    show(title, message = '', type = 'info', duration = 5000, callback = null, buttonText = null) {
        // Initialize if not already done
        if (!this.container) {
            this.initialize();
        }
        
        // If only one string arg is provided, use it as message and set default title
        if (arguments.length === 1) {
            message = title;
            title = type === 'error' ? 'Error' :
                   type === 'warning' ? 'Warning' :
                   type === 'success' ? 'Success' : 'Information';
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Create notification content
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        // Add title if provided
        if (title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'notification-title';
            titleElement.textContent = title;
            content.appendChild(titleElement);
        }
        
        // Add message - support HTML content if needed
        const messageElement = document.createElement('div');
        messageElement.className = 'notification-message';
        
        if (typeof message === 'string' && (message.includes('<') && message.includes('>'))) {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        
        content.appendChild(messageElement);
        notification.appendChild(content);
        
        // Add close button
        const closeButton = document.createElement('span');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            this.hide(notification);
        });
        notification.appendChild(closeButton);
        
        // Add action button if callback provided
        if (callback && typeof callback === 'function') {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'notification-buttons';
            
            const actionButton = document.createElement('button');
            actionButton.className = 'notification-button';
            actionButton.textContent = buttonText || 'OK';
            actionButton.addEventListener('click', () => {
                callback();
                this.hide(notification);
            });
            
            buttonsContainer.appendChild(actionButton);
            content.appendChild(buttonsContainer);
        }
        
        // Add to container
        this.container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after duration (if duration > 0)
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }
        
        return notification;
    }

    /**
     * Hide a notification
     * @param {Element} notification - The notification element to hide
     */
    hide(notification) {
        // If notification is already being removed, do nothing
        if (notification.classList.contains('removing')) {
            return;
        }
        
        notification.classList.remove('show');
        notification.classList.add('removing');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.hide(notification);
        });
    }
}

// Create the global notification service instance
window.notificationService = new NotificationService();

// Legacy function for backward compatibility
function showNotification(message, type = 'info', duration = 3000) {
    // Pass to the new notification service
    window.notificationService.show(message, '', type, duration);
} 