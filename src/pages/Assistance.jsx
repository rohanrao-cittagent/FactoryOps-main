import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare, Lightbulb, Search, Zap, BarChart3, Users, Cpu, Clock } from 'lucide-react';
import api from '../api/client';
import './Assistance.css';

const Assistance = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'Hello! I\'m your Factory Assistant. I can answer questions about your machines, shifts, users, and analytics. What would you like to know?',
            timestamp: new Date(),
            category: null
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputValue,
            timestamp: new Date(),
            category: null
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);
        setError(null);

        try {
            // Call assistance API
            const response = await api.getAssistanceAnswer(inputValue);
            
            const botMessage = {
                id: messages.length + 2,
                type: 'bot',
                text: response.answer,
                timestamp: new Date(),
                category: response.category,
                data: response.data || null
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Error getting assistance:', err);
            setError('Failed to get response. Please try again.');
            
            const errorMessage = {
                id: messages.length + 2,
                type: 'bot',
                text: 'Sorry, I encountered an error processing your request. Please try again or rephrase your question.',
                timestamp: new Date(),
                category: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickQuestion = (question) => {
        setInputValue(question);
    };

    const quickQuestions = [
        { icon: Cpu, text: 'Which machine needs maintenance?', category: 'machines' },
        { icon: BarChart3, text: 'What\'s my total equipment efficiency?', category: 'analytics' },
        { icon: Clock, text: 'What\'s the current shift status?', category: 'shifts' },
        { icon: Users, text: 'Who\'s on duty today?', category: 'users' },
        { icon: Zap, text: 'Show power consumption trends', category: 'analytics' },
        { icon: Lightbulb, text: 'What\'s my system health score?', category: 'analytics' }
    ];

    const getCategoryColor = (category) => {
        const colors = {
            machines: '#ef4444',
            shifts: '#f59e0b',
            users: '#0ea5e9',
            analytics: '#10b981',
            general: '#6366f1',
            error: '#ef4444'
        };
        return colors[category] || colors.general;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            machines: Cpu,
            shifts: Clock,
            users: Users,
            analytics: BarChart3,
            general: MessageSquare,
            error: null
        };
        return icons[category] || MessageSquare;
    };

    return (
        <div className="assistance-container">
            {/* Header */}
            <div className="assistance-header">
                <div className="header-content">
                    <h1>Factory Assistant</h1>
                    <p>Ask me anything about your machines, shifts, users, and analytics</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="messages-container">
                {messages.length === 1 && (
                    <div className="quick-questions-section">
                        <h3>Quick Questions</h3>
                        <div className="quick-grid">
                            {quickQuestions.map((q, idx) => {
                                const IconComponent = q.icon;
                                return (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="quick-button"
                                        onClick={() => handleQuickQuestion(q.text)}
                                    >
                                        <IconComponent size={20} style={{ color: getCategoryColor(q.category) }} />
                                        <span>{q.text}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="messages-list">
                    {messages.map((msg, idx) => {
                        const CategoryIcon = msg.category ? getCategoryIcon(msg.category) : null;
                        
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className={`message ${msg.type}`}
                            >
                                <div className="message-bubble">
                                    {msg.type === 'bot' && CategoryIcon && (
                                        <div className="category-badge" style={{ 
                                            backgroundColor: getCategoryColor(msg.category),
                                            color: 'white'
                                        }}>
                                            <CategoryIcon size={14} />
                                            <span>{msg.category?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <p className="message-text">{msg.text}</p>
                                    
                                    {/* Display data if available */}
                                    {msg.data && (
                                        <div className="message-data">
                                            {Array.isArray(msg.data) ? (
                                                <ul>
                                                    {msg.data.map((item, i) => (
                                                        <li key={i}>{JSON.stringify(item)}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                                            )}
                                        </div>
                                    )}
                                    
                                    <span className="message-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                    
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="message bot"
                        >
                            <div className="message-bubble loading">
                                <Loader2 size={20} className="animate-spin" />
                                <p>Thinking...</p>
                            </div>
                        </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="error-banner"
                >
                    <p>{error}</p>
                </motion.div>
            )}

            {/* Input Area */}
            <div className="input-section">
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Ask me anything about machines, shifts, users, or analytics..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={loading}
                        className="message-input"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={loading || !inputValue.trim()}
                        className="send-button"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
                <p className="input-hint">💡 Try asking: "Which machines need maintenance?" or "What's my system efficiency?"</p>
            </div>
        </div>
    );
};

export default Assistance;
