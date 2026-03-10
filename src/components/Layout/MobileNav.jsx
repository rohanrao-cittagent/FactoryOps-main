import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard,
    Cpu,
    ShieldCheck,
    BarChart3,
    FileBox,
    Users,
    Sun,
    Moon,
    Bell,
    LogOut,
    ChevronUp,
    MessageSquare,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import './MobileNav.css';

const navItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Cpu size={22} />, label: 'Devices', path: '/devices' },
    { icon: <ShieldCheck size={22} />, label: 'Rules', path: '/rules' },
    { icon: <Users size={22} />, label: 'Users', path: '/users' },
    { icon: <BarChart3 size={22} />, label: 'Analytics', path: '/analytics' },
    { icon: <FileBox size={22} />, label: 'Reports', path: '/reporting' },
    { icon: <MessageSquare size={22} />, label: 'Assistance', path: '/assistance' },
];

const MobileNav = () => {
    const { theme, toggleTheme } = useTheme();
    const { notifications, markAllAsRead, clearAll } = useNotification();
    const navigate = useNavigate();
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        const handleOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
        <>
            {/* Notification Drawer (Alerts) */}
            <AnimatePresence>
                {notifOpen && (
                    <motion.div
                        ref={notifRef}
                        className="mobile-notif-sheet"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="mobile-sheet-handle" />
                        <div className="mobile-sheet-header">
                            <span className="mobile-sheet-title">Alerts & Notifications</span>
                            {unreadCount > 0 && (
                                <span className="mobile-sheet-action" onClick={markAllAsRead}>
                                    Mark all read
                                </span>
                            )}
                        </div>
                        <div className="mobile-notif-list">
                            {notifications.length === 0 ? (
                                <div className="mobile-notif-empty">No active alerts</div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className={`mobile-notif-item ${n.type} ${n.read ? 'read' : 'unread'}`}>
                                        <div className="mobile-notif-dot" />
                                        <div className="mobile-notif-body">
                                            <div className="mobile-notif-title">{n.title}</div>
                                            <div className="mobile-notif-msg">{n.message}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button className="mobile-sheet-clear" onClick={() => { clearAll(); setNotifOpen(false); }}>
                                Clear All History
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav Bar (Scrollable) */}
            <nav className="mobile-bottom-nav">
                <div className="mobile-nav-scroll-container">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="mobile-nav-icon">{item.icon}</div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Alerts (Bell) Integrated */}
                    <div
                        className={`mobile-nav-item ${notifOpen ? 'active' : ''}`}
                        onClick={() => setNotifOpen(!notifOpen)}
                    >
                        <div className="mobile-nav-icon mobile-notif-trigger">
                            <Bell size={22} />
                            {unreadCount > 0 && <span className="mobile-nav-badge">{unreadCount}</span>}
                        </div>
                        <span className="mobile-nav-label">Alerts</span>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MobileNav;
