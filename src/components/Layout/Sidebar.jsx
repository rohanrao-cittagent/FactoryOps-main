import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Cpu,
  ShieldCheck,
  FileBox,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  Factory,
  MessageSquare
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const menuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users size={22} />, label: 'Users', path: '/users' },
    { icon: <Cpu size={22} />, label: 'Devices', path: '/devices' },
    { icon: <ShieldCheck size={22} />, label: 'Rules', path: '/rules' },
    { icon: <FileBox size={22} />, label: 'Reporting', path: '/reporting' },
    { icon: <BarChart3 size={22} />, label: 'Analytics', path: '/analytics' },
    { icon: <MessageSquare size={22} />, label: 'Assistance', path: '/assistance' },
  ];

  return (
    <motion.aside
      className={`floating-dock ${isExpanded ? 'expanded' : ''}`}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      animate={{ width: isExpanded ? 300 : 88 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dock-logo">
        <div className="logo-orb">
          <Factory size={22} />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="logo-text"
            >
              <div className="brand-stack">
                <span className="brand-citta">Cittagent</span>
                <span className="brand-ops">FactoryOps</span>
              </div>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="dock-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `dock-link ${isActive ? 'active' : ''}`}
          >
            <div className="link-icon">{item.icon}</div>
            <AnimatePresence>
              {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="link-label"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
        ))}
      </nav>

      <div className="dock-footer">
        <NavLink to="/settings" className="dock-link">
          <div className="link-icon"><Settings size={22} /></div>
          {isExpanded && <span className="link-label">Settings</span>}
        </NavLink>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
