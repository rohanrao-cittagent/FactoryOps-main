import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, UserPlus, Github, Chrome, Factory } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useToast } from '../components/Shared/Toast';

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { showToast, ToastContainer } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        org: '',
        role: 'Worker', // Default
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Update profile with display name
            await updateProfile(user, {
                displayName: formData.name,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            });

            showToast('Account created successfully! Redirecting to login...', 'success');

            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (error) {
            console.error("Signup error:", error);
            let errorMessage = 'Failed to create account';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Update profile with organization and role if not already set
            if (!user.displayName) {
                await updateProfile(user, {
                    displayName: formData.name || user.email.split('@')[0]
                });
            }

            showToast('Account created successfully!', 'success');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Google signup failed:', error);
            showToast('Google signup failed. Please try again', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubSignup = async () => {
        setIsLoading(true);
        try {
            const provider = new GithubAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Update profile with organization and role if not already set
            if (!user.displayName) {
                await updateProfile(user, {
                    displayName: formData.name || user.email.split('@')[0]
                });
            }

            showToast('Account created successfully!', 'success');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('GitHub signup failed:', error);
            showToast('GitHub signup failed. Please try again', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <ToastContainer />
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
                            <label>Role</label>
                            <div className="role-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                                {['Admin', 'Worker', 'Viewer', 'Tester'].map((r) => (
                                    <div
                                        key={r}
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${formData.role === r ? '#3b82f6' : '#cbd5e1'}`,
                                            background: formData.role === r ? '#bfdbfe' : '#f8fafc',
                                            color: formData.role === r ? '#1e3a8a' : '#334155',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {r}
                                    </div>
                                ))}
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
                        <button 
                            type="button"
                            className="social-btn"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                        >
                            <Chrome size={18} />
                            Google
                        </button>
                        <button 
                            type="button"
                            className="social-btn"
                            onClick={handleGithubSignup}
                            disabled={isLoading}
                        >
                            <Github size={18} />
                            GitHub
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
