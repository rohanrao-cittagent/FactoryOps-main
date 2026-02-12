import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2, Zap, CheckCircle2, BarChart3, Cpu,
    ArrowLeft, Activity, Workflow, ShieldAlert, Sliders,
    Play, Save, RotateCcw, Database, Layers, Binary,
    Filter, ChevronRight, AlertTriangle, TrendingUp, Info,
    Loader2
} from 'lucide-react';
import { mockDevices } from '../data/mockDevices';
import './Analytics.css';

const ModeCard = ({ title, description, features, icon: Icon, buttonText, isAutopilot, onClick, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            className={`analytics-logic-hub ${isAutopilot ? 'autopilot-mode' : 'standard-mode'}`}
        >
            <div className="hub-glass-overlay" />

            {isAutopilot && (
                <div className="hub-badge-premium">
                    <Cpu size={14} />
                    <span>RECOMMENDED</span>
                </div>
            )}

            <div className="hub-header">
                <div className="hub-icon-container">
                    <Icon size={28} strokeWidth={1.5} />
                    <div className="hub-icon-glow" />
                </div>
            </div>

            <div className="hub-body">
                <h2 className="hub-title-gradient">{title}</h2>
                <p className="hub-description">{description}</p>

                <div className="features-section">
                    <span className="features-label">Protocol Inclusion:</span>
                    <ul className="hub-features-list">
                        {features.map((feature, i) => (
                            <li key={i}>
                                <div className="feature-check-icon">
                                    <CheckCircle2 size={14} />
                                </div>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="hub-footer">
                <button
                    className={`btn-hub-action ${isAutopilot ? 'neon' : 'outline'}`}
                    onClick={() => onClick(isAutopilot ? 'autopilot' : 'standard')}
                >
                    <span>{buttonText}</span>
                    {isAutopilot && <Zap size={16} fill="currentColor" />}
                </button>
            </div>
        </motion.div>
    );
};

const StandardDashboard = ({ onBack }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        algorithm: 'Random Forest',
        learningRate: 0.001,
        epochs: 50,
        batchSize: 32,
        features: ['FFT', 'RMS'],
        split: 80
    });

    useEffect(() => {
        setDevices(mockDevices);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="analytics-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Initializing Manual Config Hub...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="detail-dashboard"
        >
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="title-with-icon">
                        <Settings2 size={24} className="text-secondary" />
                        <h1>Standard Mode Config</h1>
                    </div>
                    <p className="subtitle">Manual control over model architecture, hyperparameters, and feature engineering.</p>
                </div>
                <button className="btn-switch-mode" onClick={onBack}>
                    Back to Selection
                </button>
            </header>

            <div className="dashboard-grid">
                {/* Protocol 1: Architecture */}
                <div className="dash-card">
                    <div className="card-header">
                        <Binary size={20} className="text-secondary" />
                        <h3>Base Architecture</h3>
                    </div>
                    <div className="config-form">
                        <div className="parameter-group">
                            <label className="param-label">Select Algorithm</label>
                            <div className="custom-select-box">
                                <span>{config.algorithm}</span>
                                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                            </div>
                        </div>
                        <div className="parameter-group">
                            <div className="param-label">
                                <span>Train/Test Split</span>
                                <span className="param-value">{config.split}%</span>
                            </div>
                            <input
                                type="range"
                                className="param-slider"
                                value={config.split}
                                onChange={(e) => setConfig({ ...config, split: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Protocol 2: Hyperparameters */}
                <div className="dash-card">
                    <div className="card-header">
                        <Sliders size={20} className="text-primary" />
                        <h3>Hyperparameters</h3>
                    </div>
                    <div className="config-form">
                        <div className="grid-params">
                            <div className="parameter-group">
                                <label className="param-label">Epochs</label>
                                <input type="number" className="param-number-input" value={config.epochs} readOnly />
                            </div>
                            <div className="parameter-group">
                                <label className="param-label">Batch Size</label>
                                <input type="number" className="param-number-input" value={config.batchSize} readOnly />
                            </div>
                        </div>
                        <div className="toggle-list">
                            <label className="toggle-item">
                                <span>Accelerate GPU</span>
                                <div className="toggle-switch active"><div className="toggle-knob" /></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Protocol 3: Control Actions */}
                <div className="dash-card">
                    <div className="card-header">
                        <Workflow size={20} className="text-dim" />
                        <h3>Action Control</h3>
                    </div>
                    <div className="action-buttons" style={{ height: '100%', justifyContent: 'center' }}>
                        <button className="btn-dash primary">DEPLOY MODEL</button>
                        <button className="btn-dash outline" style={{ marginTop: '0.75rem' }}>EXPORT WEIGHTS</button>
                    </div>
                </div>

                {/* Protocol 4: Main Visualization (Full Width) */}
                <div className="dash-card main-chart" style={{ gridColumn: 'span 3' }}>
                    <div className="card-header">
                        <Activity size={20} className="text-secondary" />
                        <h3>Real-time Training Convergence Pattern</h3>
                    </div>
                    <div className="chart-placeholder" style={{ minHeight: '250px' }}>
                        <div className="wave-animation">
                            {[...Array(40)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="wave-bar"
                                    animate={{ height: Math.max(10, 80 - i * 1.5 + Math.random() * 25) }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Standard Mode Insights Section */}
            <div className="insights-container standard-insights">
                <div className="insights-header">
                    <h3>SESSION ANALYTICS & LOGS (FLEET OVERVIEW)</h3>
                </div>
                <div className="insights-list">
                    {devices.length > 0 ? devices.map((dev, i) => (
                        <div key={i} className="insight-row standard-row">
                            <div className={`insight-icon-box ${dev.status === 'Running' ? 'info' : 'warning'}`}>
                                {dev.status === 'Running' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            </div>
                            <div className="insight-content">
                                <h4>{dev.name} - {dev.type}</h4>
                                <p>Health: {dev.health}% • Location: {dev.location} • Uptime: {dev.uptime}</p>
                                <span className={`insight-badge ${dev.status === 'Running' ? 'info' : 'warning'}`}>
                                    {dev.status === 'Running' ? 'OPERATIONAL' : 'CHECK REQUIRED'}
                                </span>
                            </div>
                            <ChevronRight size={20} className="insight-arrow" />
                        </div>
                    )) : (
                        <div className="insight-row empty">
                            <p>No equipment data available from backend.</p>
                        </div>
                    )}
                </div>
                <div className="insights-footer">
                    <button className="btn-insight-action">View Session Logs</button>
                    <button className="btn-insight-action">Download Weights (.pth)</button>
                </div>
            </div>
        </motion.div>
    );
};

const AutopilotDashboard = ({ onBack }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setDevices(mockDevices);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="analytics-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Establishing Autopilot Connection...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="detail-dashboard autopilot-dash"
        >
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="title-with-icon">
                        <Zap size={24} className="text-secondary" />
                        <h1>Autopilot Active</h1>
                    </div>
                    <p className="subtitle">Monitoring {devices.length} sensor points across fleet. Models optimized recently.</p>
                </div>
                <button className="btn-switch-mode" onClick={onBack}>
                    Switch Mode
                </button>
            </header>

            {/* Protocol Status Cards */}
            <div className="autopilot-top-grid">
                <div className="protocol-card">
                    <div className="card-icon-bg"><Activity size={20} /></div>
                    <span className="label">DATA INGESTION</span>
                    <div className="status-row">
                        <div className="status-indicator active" />
                        <strong>Active</strong>
                    </div>
                    <span className="metadata">Latency: &lt;50ms</span>
                </div>
                <div className="protocol-card">
                    <div className="card-icon-bg"><Sliders size={20} /></div>
                    <span className="label">FEATURE ENG.</span>
                    <div className="status-row">
                        <div className="status-indicator active" />
                        <strong>Active</strong>
                    </div>
                    <span className="metadata">Features: {devices.length * 4}</span>
                </div>
                <div className="protocol-card">
                    <div className="card-icon-bg"><Zap size={20} /></div>
                    <span className="label">MODEL TRAINING</span>
                    <div className="status-row">
                        <div className="status-indicator optimized" />
                        <strong>Optimized</strong>
                    </div>
                    <span className="metadata">Accuracy: 94.7%</span>
                </div>
            </div>

            {/* Critical Insights Section */}
            <div className="insights-container">
                <div className="insights-header">
                    <h3>CRITICAL INSIGHTS (LIVE FLEET DATA)</h3>
                </div>
                <div className="insights-list">
                    {devices.filter(d => d.health < 80).map((dev, i) => (
                        <div key={i} className="insight-row">
                            <div className={`insight-icon-box ${dev.health < 50 ? 'critical' : 'warning'}`}>
                                <AlertTriangle size={18} />
                            </div>
                            <div className="insight-content">
                                <h4>Degradation detected on {dev.id} ({dev.name})</h4>
                                <p>Health Drop: {100 - dev.health}% • Manufacturer: {dev.manufacturer} • Model: {dev.model}</p>
                                <span className={`insight-badge ${dev.health < 50 ? 'critical' : 'warning'}`}>
                                    {dev.health < 50 ? 'URGENT CHECK REQUIRED' : 'RECOMMENDED: INSPECTION'}
                                </span>
                            </div>
                            <ChevronRight size={20} className="insight-arrow" />
                        </div>
                    ))}
                    {devices.filter(d => d.health < 80).length === 0 && (
                        <div className="insight-row empty">
                            <div className="insight-icon-box info">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="insight-content">
                                <h4>All systems nominal</h4>
                                <p>No critical performance drifts detected across {devices.length} devices.</p>
                                <span className="insight-badge info">OPTIMIZED</span>
                            </div>
                        </div>
                    )
                    }
                </div>
                <div className="insights-footer">
                    <button className="btn-insight-action">View All Insights</button>
                    <button className="btn-insight-action">Export Summary</button>
                </div>
            </div>
        </motion.div>
    );
};

const Analytics = () => {
    const [activeView, setActiveView] = useState('selection');

    const modes = [
        {
            title: 'Standard Mode',
            description: 'Build and run your own specific models based on your manual configuration. Full control over all parameters, feature engineering, and model selection.',
            features: [
                'Manual model configuration',
                'Custom feature engineering',
                'Full parameter control',
                'Advanced validation options'
            ],
            icon: Settings2,
            buttonText: 'Enter Standard Mode',
            isAutopilot: false
        },
        {
            title: 'Autopilot Mode',
            description: 'System-managed ML pipelines. We automatically select the best algorithm, retrain periodically, and surface only the critical insights.',
            features: [
                'Zero configuration',
                'Auto model selection & tuning',
                'Continuous learning',
                'Critical insights only'
            ],
            icon: Zap,
            buttonText: 'Enable Autopilot',
            isAutopilot: true
        }
    ];

    return (
        <div className="analytics-page-root">
            <AnimatePresence mode="wait">
                {activeView === 'selection' ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="analytics-modes-grid"
                    >
                        {modes.map((mode, i) => (
                            <ModeCard
                                key={i}
                                {...mode}
                                delay={0.2 + i * 0.15}
                                onClick={(view) => setActiveView(view)}
                            />
                        ))}
                    </motion.div>
                ) : activeView === 'standard' ? (
                    <StandardDashboard key="standard" onBack={() => setActiveView('selection')} />
                ) : (
                    <AutopilotDashboard key="autopilot" onBack={() => setActiveView('selection')} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Analytics;
