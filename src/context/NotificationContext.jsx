import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // Add a new notification
    const addNotification = (title, message, type = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newNotification = {
            id,
            title,
            message,
            type, // 'info', 'success', 'warning', 'error'
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    // Simulate initial "real" history
    useEffect(() => {
        const initialHistory = [
            {
                id: '1',
                title: 'New User Added',
                message: 'Alex Rivera was added to the Engineering team.',
                type: 'info',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
                read: false
            },
            {
                id: '2',
                title: 'Rule Created',
                message: 'Automation rule "High Temp Shutdown" was created successfully.',
                type: 'success',
                timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
                read: true
            },
            {
                id: '3',
                title: 'Machine Warning',
                message: 'Compressor-01 is running at 95% load capacity.',
                type: 'warning',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
                read: true
            }
        ];
        setNotifications(initialHistory);

        // Simulate a "live" event happening shortly after load
        const timer = setTimeout(() => {
            addNotification('System Alert', 'Database backup completed successfully.', 'success');
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};
