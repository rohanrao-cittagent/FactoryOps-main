import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, UserPlus, Github, Chrome, Factory } from 'lucide-react';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        org: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Mock signup delay
        setTimeout(() => {
            localStorage.setItem('factoryops_user', JSON.stringify({
                name: formData.name,
                email: formData.email,
                role: 'Administrator',
                org: formData.org
            }));
            setIsLoading(false);
            navigate('/');
        }, 1500);
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
                    <h1>Join the <br />Revolution.</h1>
                    <p>
                        Scale your operations with the most advanced
                        industrial automation platform. Create your
                        enterprise account in seconds.
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
                        <h1>Create Account</h1>
                        <p>Start managing your factory floor today</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSignup}>
                        <div className="auth-input-group">
                            <label>Full Name</label>
                            <div className="auth-input-wrapper">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    className="auth-input"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Organization</label>
                            <div className="auth-input-wrapper">
                                <Building className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="org"
                                    className="auth-input"
                                    placeholder="Tech Manufacturing Inc."
                                    value={formData.org}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    className="auth-input"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    name="password"
                                    className="auth-input"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="remember-me">
                                <input type="checkbox" required />
                                <span>I agree to the Terms & Privacy</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={isLoading}
                        >
                            {isLoading ? 'CREATING ACCOUNT...' : 'GET STARTED'}
                        </button>
                    </form>

                    <div className="auth-divider">Or join with</div>

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
                        Already have an account? <Link to="/login" className="auth-link">Sign in instead</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
