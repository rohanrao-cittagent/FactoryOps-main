import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Github, Chrome, Factory } from 'lucide-react';
import './Auth.css';

import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useToast } from '../components/Shared/Toast';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast, ToastContainer } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user info in localStorage
            const userData = {
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'User',
                avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`,
                idToken: await user.getIdToken()
            };
            
            localStorage.setItem('factoryops_user', JSON.stringify(userData));
            showToast(`Welcome back, ${userData.name}!`, 'success');

            // Delay navigation slightly to show toast
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = 'Invalid credentials';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many login attempts. Please try again later';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            const userData = {
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'User',
                avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`,
                idToken: await user.getIdToken()
            };
            
            localStorage.setItem('factoryops_user', JSON.stringify(userData));
            showToast(`Welcome, ${userData.name}!`, 'success');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Google login failed:', error);
            showToast('Google login failed. Please try again', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setIsLoading(true);
        try {
            const provider = new GithubAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            const userData = {
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'User',
                avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`,
                idToken: await user.getIdToken()
            };
            
            localStorage.setItem('factoryops_user', JSON.stringify(userData));
            showToast(`Welcome, ${userData.name}!`, 'success');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('GitHub login failed:', error);
            showToast('GitHub login failed. Please try again', 'error');
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
                        <button 
                            type="button"
                            className="social-btn"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <Chrome size={18} />
                            Google
                        </button>
                        <button 
                            type="button"
                            className="social-btn"
                            onClick={handleGithubLogin}
                            disabled={isLoading}
                        >
                            <Github size={18} />
                            GitHub
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
