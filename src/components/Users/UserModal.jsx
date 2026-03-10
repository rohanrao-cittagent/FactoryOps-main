import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Lock } from 'lucide-react';
import './UserModal.css';

const ROLES = ['Admin', 'Manager', 'Operator', 'Viewer'];

const UserModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Operator');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({ 
                name, 
                email, 
                password, 
                role 
            });
            // Reset form after successful submission
            setName('');
            setEmail('');
            setPassword('');
            setRole('Operator');
        } catch (error) {
            console.error('Error in handleSubmit:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="user-modal-overlay">
                    <motion.div
                        className="user-modal-container"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <header className="user-modal-header">
                            <h2>Add New Team Member</h2>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className="user-modal-content">
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <input
                                        type="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <small className="hint-text">Min. 8 characters</small>
                            </div>

                            <div className="form-group">
                                <label>System Role</label>
                                <div className="role-selector">
                                    {ROLES.map(r => (
                                        <div
                                            key={r}
                                            className={`role-option ${role === r ? 'active' : ''}`}
                                            onClick={() => setRole(r)}
                                        >
                                            <Shield size={14} />
                                            <span>{r}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <footer className="user-modal-footer">
                            <button className="modal-btn outline" onClick={onClose}>CANCEL</button>
                            <button
                                className="modal-btn btn-neon"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'CREATING...' : 'CREATE USER'}
                            </button>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserModal;
