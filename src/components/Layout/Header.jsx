import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import './Header.css';

const Header = ({ title = "Dashboard Overview" }) => {
    const { theme, toggleTheme } = useTheme();
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotification();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const menuRef = useRef(null);
    const notificationRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const savedUser = localStorage.getItem('factoryops_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('factoryops_user');
        navigate('/login');
    };

    const handleNotificationClick = (id) => {
        markAsRead(id);
    };

    return (
        <header className="floating-header">
            <div className="header-pill">
                <div className="header-breadcrumbs">
                    <span className="brand-text">
                        <span className="b-citta">Cittagent</span>
                        <span className="b-divider">/</span>
                        <span className="b-ops">FactoryOps</span>
                    </span>
                    <span className="separator">/</span>
                    <span className="current">{title}</span>
                </div>

                <div className="header-center-search">
                    <Search size={18} />
                    <input type="text" placeholder="Jump to command... (⌘K)" />
                </div>

                <div className="header-controls">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="control-icon-btn theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.div>

                    {/* Notification Bell */}
                    <div className="notification-wrapper" ref={notificationRef}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="control-icon-btn"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="pill-badge">{unreadCount}</span>}
                        </motion.div>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="notification-dropdown-menu"
                                >
                                    <div className="notification-header">
                                        <span className="title">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="mark-read" onClick={markAllAsRead}>Mark all read</span>
                                        )}
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="empty-notifications">No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`notification-item ${n.read ? 'read' : 'unread'} ${n.type}`}
                                                    onClick={() => handleNotificationClick(n.id)}
                                                >
                                                    <div className="notif-indicator"></div>
                                                    <div className="notif-content">
                                                        <div className="notif-title">{n.title}</div>
                                                        <div className="notif-message">{n.message}</div>
                                                        <div className="notif-time">
                                                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="notification-footer" onClick={clearAll}>
                                        Clear History
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="header-profile-section" ref={menuRef}>
                        <div className="profile-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <div className="profile-text">
                                <span className="name">{user?.name || "Sarah Chen"}</span>
                                <span className="role">{user?.role || "Lead Engineer"}</span>
                            </div>
                            <div className="avatar-wrapper">
                                <img
                                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"}
                                    alt={user?.name || "Sarah Chen"}
                                    className="profile-orb"
                                />
                                <div className="avatar-chevron">
                                    <ChevronDown size={12} strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="profile-dropdown-menu"
                                >
                                    <div className="dropdown-header">
                                        <span className="email">{user?.email || "sarah.chen@factoryops.ai"}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-items">
                                        <div className="dropdown-item">
                                            <User size={16} />
                                            <span>Profile Settings</span>
                                        </div>
                                        <div className="dropdown-item">
                                            <Settings size={16} />
                                            <span>Preferences</span>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <div className="dropdown-item logout" onClick={handleLogout}>
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
