import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Github, Chrome, Factory } from 'lucide-react';
import './Auth.css';

import { api } from '../api/client';
import { useToast } from '../components/Shared/Toast';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const { showToast } = useToast(); // If Toast context is available

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.login({ email, password });
            const user = response.data;

            localStorage.setItem('factoryops_user', JSON.stringify(user));
            // showToast(`Welcome back, ${user.name}`, 'success');
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login Failed: ' + (error.response?.data?.detail || 'Invalid credentials'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="auth-side-branding"
            >
                <div className="auth-brand-content">
                    <div className="auth-brand-logo">
                        <Factory size={32} />
                    </div>
                    <div className="auth-brand-title">FactoryOps</div>
                    <h1>Intelligence <br />at Scale.</h1>
                    <p>
                        Welcome to the next generation of industrial operations.
                        Monitor, automate, and optimize your entire factory floor
                        with real-time precision.
                    </p>
                </div>
            </motion.div>

            <div className="auth-side-form">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="auth-card"
                >
                    <div className="auth-header">
                        <h1>Welcome Back</h1>
                        <p>Enter your credentials to access the hub</p>
                    </div>

                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Password</label>
                            <div className="auth-input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    className="auth-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span>Remember for 30 days</span>
                            </label>
                            <a href="#" className="auth-link">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={isLoading}
                        >
                            {isLoading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}
                        </button>
                    </form>

                    <div className="auth-divider">Or continue with</div>

                    <div className="social-auth-grid">
                        <button className="social-btn">
                            <Chrome size={18} />
                            Google
                        </button>
                        <button className="social-btn">
                            <Github size={18} />
                            Azure AD
                        </button>
                    </div>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/signup" className="auth-link">Create one now</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
