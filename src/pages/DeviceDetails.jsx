import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Bell,
    ClipboardList,
    Settings,
    History,
    Activity,
    Thermometer,
    Gauge,
    Zap,
    Loader2,
    AlertCircle,
    Shield,
    Play,
    Pause,
    Plus
} from 'lucide-react';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import RuleModal from '../components/Rules/RuleModal';
import { useToast } from '../components/Shared/Toast';
import { NotificationService } from '../services/NotificationService';
import { mockDevices } from '../data/mockDevices';
import './DeviceDetails.css';

const MetricCard = ({ title, value, unit, icon: Icon, min, max, optimal, percent }) => (
    <div className="metric-status-card glass-card">
        <div className="m-card-header">
            <div className="m-title-group">
                <Icon size={18} className="m-icon" />
                <span className="m-label">{title.toUpperCase()}</span>
            </div>
            <span className="m-value">{value}<span className="m-unit">{unit}</span></span>
        </div>
        <div className="m-status-bar-container">
            <div className="m-status-bar-bg">
                <div className="m-status-bar-fill" style={{ width: `${percent || 0}%` }}></div>
                <div className="m-status-marker" style={{ left: '80%' }}></div>
            </div>
            <div className="m-range-labels">
                <span>MIN: {min || 0}</span>
                <span>MAX: {max || 100}</span>
                <span className="optimal-tag">OPTIMAL: {optimal || 50}</span>
            </div>
        </div>
    </div>
);

const DeviceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeMetric, setActiveMetric] = useState('efficiency');
    const [device, setDevice] = useState(null);
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeHubTab, setActiveHubTab] = useState(null);
    const [appliedRules, setAppliedRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const { showToast, ToastContainer } = useToast();

    const loadFilteredRules = (foundDevice) => {
        const savedRules = localStorage.getItem('factoryops_rules');
        if (savedRules) {
            const allRules = JSON.parse(savedRules);
            const filtered = allRules.filter(rule => {
                if (rule.status !== 'Active') return false;

                const ruleDevice = (rule.devices || '').toLowerCase();
                const deviceName = (foundDevice.name || '').toLowerCase();
                const deviceType = (foundDevice.type || '').toLowerCase();
                const deviceId = (foundDevice.id || '').toLowerCase();
                const deviceFullId = (foundDevice.fullId || '').toLowerCase();

                // 1. Global rules
                if (ruleDevice === 'all machines' || rule.target === 'All Machines') return true;

                // 2. Specific device rules (matches ID or Name)
                if (ruleDevice === deviceId || ruleDevice === deviceName || ruleDevice === deviceFullId) return true;

                // 3. Category/Type rules
                const categories = ['boiler', 'compressor', 'pump', 'generator', 'chiller'];
                for (const cat of categories) {
                    if (ruleDevice.includes(cat) && deviceType.includes(cat)) return true;
                }

                return false;
            });
            setAppliedRules(filtered);
        }
    };

    useEffect(() => {
        const fetchDevice = () => {
            const foundDevice = mockDevices.find(d => d.id === id);
            if (foundDevice) {
                // Initialize with some historical data
                const initialTelemetry = Array.from({ length: 10 }).map((_, i) => {
                    const time = new Date(Date.now() - (10 - i) * 3000);
                    return {
                        timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        efficiency: Math.floor(70 + Math.random() * 20),
                        vibration: Number((2 + Math.random() * 3).toFixed(1))
                    };
                });

                setDevice({ ...foundDevice });
                setTelemetry(initialTelemetry);
                setError(null);
                loadFilteredRules(foundDevice);
            } else {
                setError('The requested equipment could not be found.');
            }
            setLoading(false);
        };

        fetchDevice();
    }, [id]);

    // Live Telemetry Simulation
    useEffect(() => {
        if (!device || loading) return;

        const interval = setInterval(() => {
            setDevice(prev => {
                if (!prev) return prev;

                // Simulate metric fluctuations
                const updatedMetrics = { ...prev.metrics };
                if (updatedMetrics.pressure) {
                    const change = (Math.random() - 0.5) * 2;
                    updatedMetrics.pressure.value = Number((updatedMetrics.pressure.value + change).toFixed(1));
                    updatedMetrics.pressure.percent = Math.min(100, Math.max(0, updatedMetrics.pressure.percent + (change * 2)));
                }
                if (updatedMetrics.temperature) {
                    const change = (Math.random() - 0.5) * 1.5;
                    updatedMetrics.temperature.value = Number((updatedMetrics.temperature.value + change).toFixed(1));
                    updatedMetrics.temperature.percent = Math.min(100, Math.max(0, updatedMetrics.temperature.percent + (change * 1.5)));
                }
                if (updatedMetrics.vibration) {
                    const change = (Math.random() - 0.5) * 0.4;
                    updatedMetrics.vibration.value = Number((updatedMetrics.vibration.value + change).toFixed(2));
                    updatedMetrics.vibration.percent = Math.min(100, Math.max(0, updatedMetrics.vibration.percent + (change * 10)));
                }
                if (updatedMetrics.power) {
                    const change = (Math.random() - 0.5) * 0.2;
                    updatedMetrics.power.value = Number((updatedMetrics.power.value + change).toFixed(2));
                    updatedMetrics.power.percent = Math.min(100, Math.max(0, updatedMetrics.power.percent + (change * 5)));
                }

                return { ...prev, metrics: updatedMetrics };
            });

            setTelemetry(prev => {
                const now = new Date();
                const newEntry = {
                    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    efficiency: Math.floor(75 + Math.random() * 15),
                    vibration: Number((device.metrics?.vibration?.value || 3).toFixed(2))
                };

                // Keep last 15 entries
                const updated = [...prev, newEntry];
                if (updated.length > 15) return updated.slice(-15);
                return updated;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [device?.id, loading]);

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleSaveRule = (updatedRuleData) => {
        const savedRules = localStorage.getItem('factoryops_rules');
        const allRules = savedRules ? JSON.parse(savedRules) : [];

        let updatedAllRules;
        if (editingRule) {
            // Update existing rule
            updatedAllRules = allRules.map(r =>
                r.id === editingRule.id ? { ...updatedRuleData, id: r.id } : r
            );
        } else {
            // Create new rule
            const newRule = {
                ...updatedRuleData,
                id: `rule-${Date.now()}`,
                status: 'Active' // Force active for rules created from device details
            };
            updatedAllRules = [...allRules, newRule];
        }

        localStorage.setItem('factoryops_rules', JSON.stringify(updatedAllRules));
        loadFilteredRules(device);

        if (!editingRule) {
            // New rule created
            NotificationService.sendEmail(
                'operator@factoryops.com',
                `New Asset Protocol: ${updatedRuleData.name}`,
                `A new automation rule "${updatedRuleData.name}" has been linked to ${device.name}. Rule logic: ${updatedRuleData.condition}`
            ).then(() => {
                showToast(`Asset protocol linked! Email notification sent.`, 'success');
            });
        }

        setIsModalOpen(false);
    };

    // Format telemetry for chart
    const chartData = telemetry.length > 0
        ? telemetry.map((t) => ({
            name: t.timestamp,
            efficiency: t.efficiency || 0,
            vibration: t.vibration || 0
        }))
        : [
            { name: 'Waiting...', efficiency: 0, vibration: 0 },
        ];

    if (loading) {
        return (
            <div className="details-loading">
                <Loader2 className="animate-spin text-secondary" size={48} />
                <p>Syncing device telemetry...</p>
            </div>
        );
    }

    if (error || !device) {
        return (
            <div className="details-error">
                <AlertCircle size={48} className="text-warning" />
                <h3>Device Synchronization Failed</h3>
                <p>{error || 'The requested equipment could not be found.'}</p>
                <button className="btn-dash primary" onClick={() => navigate(-1)}>Return to Fleet</button>
            </div>
        );
    }

    return (
        <div className="device-details-container">
            <header className="details-header-nav">
                <button className="back-btn-minimal" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} />
                    <span>Back to Fleet</span>
                </button>
            </header>

            <main className="details-main-layout">
                {/* Device Information Header */}
                <section className="device-info-panel glass-card">
                    <div className="info-grid-header">
                        <span className="info-title">DEVICE INFORMATION</span>
                        <div className="health-score-container">
                            <span className="health-score-label">HEALTH SCORE</span>
                            <span className={`health-score-value ${device.health < 50 ? 'critical' : device.health < 80 ? 'warning' : ''}`}>
                                {device.health}%
                            </span>
                        </div>
                    </div>

                    <div className="info-details-grid">
                        <div className="info-item">
                            <span className="i-label">NAME</span>
                            <span className="i-value">{device.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">STATUS</span>
                            <span className={`i-value status-${device.status.toLowerCase()}`}>
                                <span className="status-dot"></span>
                                {device.status}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">ID</span>
                            <span className="i-value text-muted">{device.fullId || device.id}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">TYPE</span>
                            <span className="i-value">{device.type}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">MANUFACTURER</span>
                            <span className="i-value">{device.manufacturer}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">MODEL</span>
                            <span className="i-value">{device.model}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">UPTIME</span>
                            <span className="i-value">{device.uptime}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">LOCATION</span>
                            <span className="i-value">{device.location}</span>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <section className="metrics-summary-grid">
                    <MetricCard
                        title="Pressure (PSI)"
                        value={device.metrics?.pressure?.value || 0}
                        icon={Gauge}
                        {...device.metrics?.pressure}
                    />
                    <MetricCard
                        title="Temperature (°C)"
                        value={device.metrics?.temperature?.value || 0}
                        icon={Thermometer}
                        {...device.metrics?.temperature}
                    />
                    <MetricCard
                        title="Vibration (MM/S)"
                        value={device.metrics?.vibration?.value || 0}
                        icon={Activity}
                        {...device.metrics?.vibration}
                    />
                    <MetricCard
                        title="Power Consumption"
                        value={device.metrics?.power?.value || 0}
                        unit="kW"
                        icon={Zap}
                        {...device.metrics?.power}
                    />
                </section>

                <section className="performance-analytics-section glass-card">
                    <div className="chart-controls-row">
                        <div className="chart-title-stack">
                            <h3>Performance Trends</h3>
                            <span className="subtext">(Recent Telemetry)</span>
                        </div>
                        <div className="metric-toggle-group">
                            <button
                                className={`toggle-tab ${activeMetric === 'efficiency' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('efficiency')}
                            >
                                Efficiency
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'vibration' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('vibration')}
                            >
                                Vibration
                            </button>
                        </div>
                    </div>

                    <div className="main-chart-area">
                        <PerformanceChart
                            data={chartData}
                            title=""
                            dataKey={activeMetric}
                            color={activeMetric === 'efficiency' ? "var(--accent-primary)" : "#f87171"}
                        />
                    </div>
                </section>

                <section className="interaction-hub-grid">
                    <button
                        className={`hub-btn ${activeHubTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'alerts' ? null : 'alerts')}
                    >
                        <div className="hub-icon-box"><Bell size={20} /></div>
                        <span>Alerts</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'maintenance' ? null : 'maintenance')}
                    >
                        <div className="hub-icon-box"><ClipboardList size={20} /></div>
                        <span>Maintenance Log</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'configuration' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'configuration' ? null : 'configuration')}
                    >
                        <div className="hub-icon-box"><Settings size={20} /></div>
                        <span>Configuration</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'history' ? null : 'history')}
                    >
                        <div className="hub-icon-box"><History size={20} /></div>
                        <span>Historical Data</span>
                    </button>
                </section>

                <AnimatePresence>
                    {activeHubTab && (
                        <motion.section
                            className="hub-content-panel glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            {activeHubTab === 'configuration' && (
                                <div className="applied-rules-container">
                                    <div className="panel-header">
                                        <div className="p-header-top">
                                            <div className="p-title-stack">
                                                <h4>Applied Automation Rules</h4>
                                                <p>Protocols currently governing this asset</p>
                                            </div>
                                            <button className="add-rule-btn-h" onClick={handleAddRule}>
                                                <Plus size={16} />
                                                <span>ADD RULE</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="applied-rules-list">
                                        {appliedRules.length > 0 ? (
                                            appliedRules.map(rule => (
                                                <div key={rule.id} className="applied-rule-card">
                                                    <div className="rule-info">
                                                        <div className="rule-badge">
                                                            <Shield size={14} />
                                                            <span>{rule.name}</span>
                                                        </div>
                                                        <code className="rule-logic-preview">{rule.condition}</code>
                                                    </div>
                                                    <div className="rule-actions-hub">
                                                        <button
                                                            className="edit-rule-btn-mini"
                                                            onClick={() => handleEditRule(rule)}
                                                            title="Edit Rule"
                                                        >
                                                            <Settings size={14} />
                                                        </button>
                                                        <div className="rule-status-tag active">
                                                            <div className="pulse-dot"></div>
                                                            ACTIVE
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state-hub">
                                                <AlertCircle size={24} />
                                                <p>No active rules target this device.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeHubTab === 'alerts' && (
                                <div className="empty-state-hub">
                                    <Bell size={24} />
                                    <p>Recent alerts for this device will appear here.</p>
                                </div>
                            )}
                            {activeHubTab === 'maintenance' && (
                                <div className="empty-state-hub">
                                    <ClipboardList size={24} />
                                    <p>Maintenance and service history logs.</p>
                                </div>
                            )}
                            {activeHubTab === 'history' && (
                                <div className="empty-state-hub">
                                    <History size={24} />
                                    <p>Full historical telemetry data export.</p>
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

                <RuleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveRule}
                    editingRule={editingRule}
                />

                <ToastContainer />
            </main>
        </div>
    );
};

export default DeviceDetails;
