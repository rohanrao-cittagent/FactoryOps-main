import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onManualClose }) => {
    return (
        <motion.div
            className={`toast-notification glass-card ${type}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        >
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' && <CheckCircle size={20} />}
                    {type === 'error' && <AlertCircle size={20} />}
                    {type === 'info' && <Info size={20} />}
                </div>
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close" onClick={onManualClose}>
                <X size={14} />
            </button>
            <div className="toast-progress">
                <motion.div
                    className="toast-progress-bar"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: duration / 1000, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );
};

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const ToastContainer = () => (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        {...t}
                        onManualClose={() => removeToast(t.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );

    return { showToast, ToastContainer };
};
