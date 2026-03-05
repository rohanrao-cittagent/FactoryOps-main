import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import api from '../api/client';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: "Hello! I'm your FactoryOps AI assistant. You can ask me about machine status, shifts, uptime, and efficiency across the factory. How can I help you today?",
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const suggestions = [
        "Status of Boiler-04?",
        "What are the shifts for D6?",
        "Show me uptime for Boiler-04",
        "Which machines need maintenance?",
        "Overall factory efficiency?"
    ];

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        // creative hack to simulate form submission with the new input
        // Since state update is async, we call handleSend directly with a synthetic event
        // but we need the input logic to run. 
        // Better way: extract send logic or just set input and let user press send?
        // Let's set input and auto-send:
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => { } };
            // We need to pass the suggestion directly because 'input' state won't be updated yet in this closure
            sendDirectMessage(suggestion);
        }, 0);
    };

    const sendDirectMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await api.chat(text);
            const botMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: response.data.reply,
                timestamp: response.data.timestamp
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: "I'm having trouble connecting to the server. Please try again later.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        sendDirectMessage(input);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="chatbot-container"
        >
            <div className="chat-header">
                <div className="bot-avatar-large">
                    <Sparkles size={24} />
                </div>
                <div className="chat-info">
                    <h2>Factory Assistant</h2>
                    <p>AI-powered operational support</p>
                </div>
            </div>

            <div className="messages-area">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.sender}`}>
                        <div className="message-avatar">
                            {msg.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
                        </div>
                        <div className="message-bubble">
                            {msg.text.split('\n').map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                            <span className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message bot">
                        <div className="message-avatar">
                            <Bot size={20} />
                        </div>
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <div className="suggestions-wrapper">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick(s)}
                        >
                            {s}
                        </div>
                    ))}
                </div>
                <form className="input-wrapper" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask about machine status, efficiency, or alerts..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" className="send-btn" disabled={!input.trim() || isTyping}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default Chatbot;
