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
    Heart,
    Clock,
    Droplets,
    Battery,
    Play,
    Pause,
    Plus
} from 'lucide-react';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import RuleModal from '../components/Rules/RuleModal';
import MetricDetailOverlay from '../components/Dashboard/MetricDetailOverlay';
import { useToast } from '../components/Shared/Toast';
import { NotificationService } from '../services/NotificationService';
import { mockDevices } from '../data/mockDevices';
import './DeviceDetails.css';

const MetricCard = ({ title, value, unit, icon: Icon, min, max, optimal, percent, onClick }) => (
    <div className="metric-status-card glass-card" onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="m-card-header">
            <div className="m-title-group">
                <Icon size={16} className="m-icon" />
                <span className="m-label">{title.toUpperCase()}</span>
            </div>
            <span className="m-value">{value}<span className="m-unit">{unit}</span></span>
        </div>
        <div className="m-status-bar-container">
            <div className="m-status-bar-bg">
                <motion.div
                    className="m-status-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                ></motion.div>
                <div className="m-status-marker" style={{ left: '80%' }}></div>
            </div>
            <div className="m-range-labels">
                <span>MIN: {min || 0}</span>
                <span>MAX: {max || 100}</span>
                <span className="optimal-tag">OPTIMAL: {optimal || 'N/A'}</span>
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
    const [selectedMetricView, setSelectedMetricView] = useState(null);
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
                const initialTelemetry = Array.from({ length: 15 }).map((_, i) => {
                    const time = new Date(Date.now() - (15 - i) * 3000);
                    return {
                        timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        efficiency: Math.floor(70 + Math.random() * 20),
                        healthScore: Math.floor(85 + Math.random() * 10),
                        uptime: Number((99.5 + Math.random() * 0.4).toFixed(1)),
                        powerWastage: Number((Math.random() * 0.5).toFixed(2)),
                        revenueImpact: Number((Math.random() * 50).toFixed(2)),
                        pressure: Number((foundDevice.metrics?.pressure?.value || 120 + (Math.random() * 10 - 5)).toFixed(1)),
                        temperature: Number((foundDevice.metrics?.temperature?.value || 80 + (Math.random() * 10 - 5)).toFixed(1)),
                        vibration: Number((foundDevice.metrics?.vibration?.value || 2 + (Math.random() * 1)).toFixed(2)),
                        power: Number((foundDevice.metrics?.power?.value || 3.5 + (Math.random() * 0.5)).toFixed(2))
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
                const fluctuate = (val, range, decimals = 1) => Number((val + (Math.random() - 0.5) * range).toFixed(decimals));

                if (updatedMetrics.pressure) {
                    updatedMetrics.pressure.value = fluctuate(updatedMetrics.pressure.value, 1.5);
                    updatedMetrics.pressure.percent = Math.min(100, Math.max(0, updatedMetrics.pressure.percent + (Math.random() - 0.5) * 2));
                }
                if (updatedMetrics.temperature) {
                    updatedMetrics.temperature.value = fluctuate(updatedMetrics.temperature.value, 1.2);
                    updatedMetrics.temperature.percent = Math.min(100, Math.max(0, updatedMetrics.temperature.percent + (Math.random() - 0.5) * 1.5));
                }
                if (updatedMetrics.vibration) {
                    updatedMetrics.vibration.value = fluctuate(updatedMetrics.vibration.value, 0.1, 2);
                    updatedMetrics.vibration.percent = Math.min(100, Math.max(0, updatedMetrics.vibration.percent + (Math.random() - 0.5) * 3));
                }
                if (updatedMetrics.power) {
                    updatedMetrics.power.value = fluctuate(updatedMetrics.power.value, 0.2, 1);
                    updatedMetrics.power.percent = Math.min(100, Math.max(0, updatedMetrics.power.percent + (Math.random() - 0.5) * 2));
                }

                // New simulated fields if not in original mock
                if (!updatedMetrics.oil) updatedMetrics.oil = { value: 0.85, unit: 'LPI', min: 0.5, max: 2.0, optimal: '1.2', percent: 65 };
                updatedMetrics.oil.value = fluctuate(updatedMetrics.oil.value, 0.05, 2);
                updatedMetrics.oil.percent = Math.min(100, Math.max(20, updatedMetrics.oil.percent + (Math.random() - 0.5) * 1));

                if (!updatedMetrics.energy) updatedMetrics.energy = { value: 452, unit: 'kWh', min: 200, max: 800, optimal: '400', percent: 55 };
                updatedMetrics.energy.value = fluctuate(updatedMetrics.energy.value, 10, 0);
                updatedMetrics.energy.percent = Math.min(100, Math.max(10, updatedMetrics.energy.percent + (Math.random() - 0.5) * 0.5));

                return { ...prev, metrics: updatedMetrics };
            });

            setTelemetry(prev => {
                const now = new Date();
                const last = prev[prev.length - 1];
                const newEntry = {
                    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    efficiency: Math.floor(75 + Math.random() * 15),
                    healthScore: Math.floor(90 + (Math.random() - 0.5) * 5),
                    uptime: Number((99.6 + (Math.random() - 0.5) * 0.2).toFixed(1)),
                    powerWastage: Number((Math.max(0, (last?.powerWastage || 0.2) + (Math.random() - 0.5) * 0.1)).toFixed(2)),
                    revenueImpact: Number((Math.max(0, (last?.revenueImpact || 20) + (Math.random() - 0.5) * 5)).toFixed(2)),
                    pressure: device.metrics?.pressure?.value || 117.8,
                    temperature: device.metrics?.temperature?.value || 96,
                    vibration: device.metrics?.vibration?.value || 2.58,
                    power: device.metrics?.power?.value || 4.5
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
            healthScore: t.healthScore || 0,
            uptime: t.uptime || 0,
            powerWastage: t.powerWastage || 0,
            revenueImpact: t.revenueImpact || 0,
            vibration: t.vibration || 0
        }))
        : [
            { name: 'Waiting...', efficiency: 0, healthScore: 0, uptime: 0, powerWastage: 0, revenueImpact: 0, vibration: 0 },
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
                        title="Equipment Health Score"
                        value={device.health || 92}
                        unit="%"
                        icon={Shield}
                        min={0} max={100} optimal="90+"
                        percent={device.health}
                    />
                    <MetricCard
                        title="Uptime & Availability"
                        value={99.8}
                        unit="%"
                        icon={Clock}
                        min={95} max={100} optimal="99.5+"
                        percent={99}
                    />
                    <MetricCard
                        title="Pressure (PSI)"
                        value={device.metrics?.pressure?.value || 117.8}
                        unit="PSI"
                        icon={Gauge}
                        {...device.metrics?.pressure}
                        onClick={() => setSelectedMetricView({ title: 'Pressure', ...device.metrics?.pressure })}
                    />
                    <MetricCard
                        title="Temperature (°C)"
                        value={device.metrics?.temperature?.value || 96}
                        unit="°C"
                        icon={Thermometer}
                        {...device.metrics?.temperature}
                        onClick={() => setSelectedMetricView({ title: 'Temperature', ...device.metrics?.temperature })}
                    />
                    <MetricCard
                        title="Power & Motor Load"
                        value={device.metrics?.power?.value || 4.5}
                        unit="kW"
                        icon={Zap}
                        {...device.metrics?.power}
                        onClick={() => setSelectedMetricView({ title: 'Power Consumption', ...device.metrics?.power })}
                    />
                    <MetricCard
                        title="Oil Condition"
                        value={0.85}
                        unit="LPI"
                        icon={Droplets}
                        min={0.5} max={2.0} optimal="1.2"
                        percent={65}
                    />
                    <MetricCard
                        title="Vibration (MM/S)"
                        value={device.metrics?.vibration?.value || 2.58}
                        unit="MM/S"
                        icon={Activity}
                        {...device.metrics?.vibration}
                        onClick={() => setSelectedMetricView({ title: 'Vibration', ...device.metrics?.vibration })}
                    />
                    <MetricCard
                        title="Energy Consumption"
                        value={452}
                        unit="kWh"
                        icon={Battery}
                        min={200} max={800} optimal="400"
                        percent={55}
                    />
                </section>

                <section className="performance-analytics-section glass-card">
                    <div className="chart-controls-row">
                        <div className="chart-title-stack">
                            <h3>Performance Trends</h3>
                            <span className="subtext">(Recent Telemetry)</span>
                        </div>
                        <div className="metric-toggle-group scrollable">
                            <button
                                className={`toggle-tab ${activeMetric === 'efficiency' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('efficiency')}
                            >
                                Efficiency
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'healthScore' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('healthScore')}
                            >
                                Health
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'uptime' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('uptime')}
                            >
                                Uptime
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'powerWastage' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('powerWastage')}
                            >
                                Wastage
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'revenueImpact' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('revenueImpact')}
                            >
                                Revenue
                            </button>
                        </div>
                    </div>

                    <div className="main-chart-area">
                        <PerformanceChart
                            data={chartData}
                            title=""
                            dataKey={activeMetric}
                            color={
                                activeMetric === 'efficiency' ? "#6366f1" :
                                    activeMetric === 'healthScore' ? "#10b981" :
                                        activeMetric === 'uptime' ? "#f59e0b" :
                                            activeMetric === 'powerWastage' ? "#f43f5e" :
                                                "#a855f7"
                            }
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

                <MetricDetailOverlay
                    isOpen={!!selectedMetricView}
                    onClose={() => setSelectedMetricView(null)}
                    metric={selectedMetricView}
                    deviceName={device.name}
                    history={telemetry}
                />

                <ToastContainer />
            </main>
        </div>
    );
};

export default DeviceDetails;
