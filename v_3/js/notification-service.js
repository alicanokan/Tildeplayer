/**
 * Notification Service for providing UI feedback
 */

class NotificationService {
    constructor() {
        this.container = null;
        this.initialize();
    }
    
    initialize() {
        // Create the notification container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
            
            // Add styles for notifications
            if (!document.getElementById('notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.textContent = `
                    #notification-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        max-width: 350px;
                        z-index: 10000;
                    }
                    .notification {
                        background: white;
                        color: #333;
                        padding: 12px 20px;
                        margin-bottom: 10px;
                        border-radius: 5px;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                        animation: slide-in 0.3s ease-out forwards;
                        position: relative;
                        overflow: hidden;
                    }
                    .notification.info {
                        border-left: 4px solid #2196F3;
                    }
                    .notification.success {
                        border-left: 4px solid #4CAF50;
                    }
                    .notification.warning {
                        border-left: 4px solid #FF9800;
                    }
                    .notification.error {
                        border-left: 4px solid #F44336;
                    }
                    .notification .progress {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        height: 3px;
                        width: 100%;
                        background: rgba(0,0,0,0.1);
                    }
                    .notification .progress-bar {
                        height: 100%;
                        width: 100%;
                    }
                    .notification.info .progress-bar {
                        background: #2196F3;
                    }
                    .notification.success .progress-bar {
                        background: #4CAF50;
                    }
                    .notification.warning .progress-bar {
                        background: #FF9800;
                    }
                    .notification.error .progress-bar {
                        background: #F44336;
                    }
                    .notification-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .notification-close {
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        opacity: 0.7;
                    }
                    .notification-close:hover {
                        opacity: 1;
                    }
                    @keyframes slide-in {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes progress {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            this.container = document.getElementById('notification-container');
        }
    }
    
    show(title, message, type = 'info', duration = 5000) {
        // Ensure the container exists
        if (!this.container) {
            this.initialize();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add content
        notification.innerHTML = `
            <div class="notification-close">&times;</div>
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <div class="progress">
                <div class="progress-bar" style="animation: progress ${duration}ms linear forwards;"></div>
            </div>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Setup close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    remove(notification) {
        // Apply fade-out animation
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease-out';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }
}

// Create a global notification service
if (!window.notificationService) {
    window.notificationService = new NotificationService();
    console.log('NotificationService: Global instance created');
}

// Simple helper function for showing notifications
window.showNotification = function(message, type = 'info', duration = 5000) {
    if (window.notificationService) {
        return window.notificationService.show('Notification', message, type, duration);
    } else {
        alert(message);
        return null;
    }
}; 