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
import { api } from '../api/client';
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

    const loadFilteredRules = async (foundDevice) => {
        try {
            const response = await api.getRules();
            const allRules = Array.isArray(response) ? response : (response.data || []);
            const filtered = allRules.filter(rule => {
                if (rule.status !== 'Active') return false;

                const ruleDevice = (rule.devices || '').toLowerCase();
                const deviceName = (foundDevice.name || '').toLowerCase();
                const deviceType = (foundDevice.type || '').toLowerCase();
                const deviceId = (foundDevice.id || '').toLowerCase();
                const deviceFullId = (foundDevice.fullId || foundDevice.id || '').toLowerCase();

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
        } catch (error) {
            console.error("Failed to load filtered rules:", error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Device basic info
                const deviceRes = await api.getEquipmentById(id);
                const foundDevice = deviceRes.data;

                if (!foundDevice) {
                    setError('The requested equipment could not be found.');
                    setLoading(false);
                    return;
                }

                // 2. Fetch Telemetry history (last 15 points)
                const telemetryRes = await api.getTelemetry(id);
                const historyRaw = telemetryRes.data || [];

                // Transform telemetry for chart (Recharts needs ascending order)
                const initialTelemetry = historyRaw.slice(0, 15).reverse().map(item => ({
                    timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    efficiency: item.efficiency,
                    healthScore: item.healthScore,
                    uptime: item.uptime,
                    pressure: item.pressure,
                    temperature: item.temperature,
                    vibration: item.vibration,
                    power: item.power
                }));

                setDevice(foundDevice);
                setTelemetry(initialTelemetry);
                loadFilteredRules(foundDevice);
            } catch (err) {
                console.error("Error loading device details:", err);
                setError('Failed to sync with equipment telemetry stream.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id]);

    // Live Telemetry Polling
    useEffect(() => {
        if (!device || loading) return;

        const refreshData = async () => {
            try {
                // 1. Refresh Device Info (for status updates)
                const deviceRes = await api.getEquipmentById(id);
                if (deviceRes.data) {
                    setDevice(prev => ({
                        ...prev,
                        ...deviceRes.data,
                    }));
                }

                // 2. Fetch Latest Telemetry history
                const telemetryRes = await api.getTelemetry(id);
                const historyRaw = telemetryRes.data || [];

                // Transform telemetry for chart and latest metrics
                const updatedTelemetry = historyRaw.slice(0, 15).reverse().map(item => ({
                    timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    efficiency: item.efficiency,
                    healthScore: item.healthScore,
                    uptime: item.uptime,
                    pressure: item.pressure,
                    temperature: item.temperature,
                    vibration: item.vibration,
                    power: item.power
                }));

                setTelemetry(updatedTelemetry);

                // 3. Update active device metrics from latest telemetry point
                if (historyRaw.length > 0) {
                    const latest = historyRaw[0]; // historyRaw is sorted DESC (latest first)
                    setDevice(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            health: latest.health,
                            efficiency: latest.efficiency,
                            metrics: {
                                ...prev.metrics,
                                pressure: { ...prev.metrics?.pressure, value: latest.pressure, percent: (latest.pressure / 150) * 100 },
                                temperature: { ...prev.metrics?.temperature, value: latest.temperature, percent: (latest.temperature / 120) * 100 },
                                vibration: { ...prev.metrics?.vibration, value: latest.vibration, percent: (latest.vibration / 10) * 100 },
                                power: { ...prev.metrics?.power, value: latest.power, percent: (latest.power / 500) * 100 }
                            }
                        };
                    });
                }
            } catch (err) {
                console.warn("Live refresh failed:", err);
            }
        };

        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, [id, device?.id, loading]);

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleSaveRule = async (updatedRuleData) => {
        try {
            if (editingRule) {
                // Update existing rule
                await api.updateRule(editingRule.id, updatedRuleData);
                showToast('Rule updated successfully', 'success');
            } else {
                // Create new rule
                const ruleToCreate = {
                    ...updatedRuleData,
                    status: 'Active' // Force active for rules created from device details
                };
                await api.createRule(ruleToCreate);

                // Trigger email notification for new rule
                NotificationService.sendEmail(
                    'operator@factoryops.com',
                    `New Asset Protocol: ${updatedRuleData.name}`,
                    `A new automation rule "${updatedRuleData.name}" has been linked to ${device.name}. Rule logic: ${updatedRuleData.condition}`
                ).then(() => {
                    showToast(`Asset protocol linked! Email notification sent.`, 'success');
                }).catch(err => {
                    console.error("Email notification failed", err);
                    showToast(`Asset protocol linked!`, 'success');
                });
            }

            // Reload rules
            await loadFilteredRules(device);
        } catch (error) {
            console.error("Failed to save rule:", error);
            showToast('Failed to save rule', 'error');
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
                        value={device.health || '--'}
                        unit="%"
                        icon={Shield}
                        min={0} max={100} optimal="90+"
                        percent={device.health || 0}
                        onClick={() => setSelectedMetricView({ title: 'Equipment Health Score', value: device.health || '--', unit: '%', min: 0, max: 100, optimal: '90+', percent: device.health || 0 })}
                    />
                    <MetricCard
                        title="Uptime & Availability"
                        value={device.uptime || '--'}
                        unit="%"
                        icon={Clock}
                        min={95} max={100} optimal="99.5+"
                        percent={parseFloat(device.uptime) || 0}
                        onClick={() => setSelectedMetricView({ title: 'Uptime & Availability', value: device.uptime || '--', unit: '%', min: 95, max: 100, optimal: '99.5+', percent: parseFloat(device.uptime) || 0 })}
                    />
                    <MetricCard
                        title="Pressure (PSI)"
                        value={device.metrics?.pressure?.value || device.pressure || '--'}
                        unit="PSI"
                        icon={Gauge}
                        {...(device.metrics?.pressure || { percent: (device.pressure / 150) * 100 })}
                        onClick={() => setSelectedMetricView({ title: 'Pressure', ...(device.metrics?.pressure || { value: device.pressure, percent: (device.pressure / 150) * 100 }) })}
                    />
                    <MetricCard
                        title="Temperature (°C)"
                        value={device.metrics?.temperature?.value || device.temp || '--'}
                        unit="°C"
                        icon={Thermometer}
                        {...(device.metrics?.temperature || { percent: (device.temp / 120) * 100 })}
                        onClick={() => setSelectedMetricView({ title: 'Temperature', ...(device.metrics?.temperature || { value: device.temp, percent: (device.temp / 120) * 100 }) })}
                    />
                    <MetricCard
                        title="Power & Motor Load"
                        value={device.metrics?.power?.value || device.power || '--'}
                        unit="kW"
                        icon={Zap}
                        {...(device.metrics?.power || { percent: (device.power / 500) * 100 })}
                        onClick={() => setSelectedMetricView({ title: 'Power Consumption', ...(device.metrics?.power || { value: device.power, percent: (device.power / 500) * 100 }) })}
                    />
                    <MetricCard
                        title="Line Current (A)"
                        value={device.current || '--'}
                        unit="A"
                        icon={Droplets}
                        min={0.0} max={2.0} optimal="0.8"
                        percent={(device.current / 2) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Line Current', value: device.current || '--', unit: 'A', min: 0.0, max: 2.0, optimal: '0.8', percent: (device.current / 2) * 100 || 0 })}
                    />
                    <MetricCard
                        title="Vibration (MM/S)"
                        value={device.metrics?.vibration?.value || device.vibration || '--'}
                        unit="MM/S"
                        icon={Activity}
                        {...(device.metrics?.vibration || { percent: (device.vibration / 10) * 100 })}
                        onClick={() => setSelectedMetricView({ title: 'Vibration', ...(device.metrics?.vibration || { value: device.vibration, percent: (device.vibration / 10) * 100 }) })}
                    />
                    <MetricCard
                        title="Line Voltage (V)"
                        value={device.voltage || '--'}
                        unit="V"
                        icon={Battery}
                        min={200} max={250} optimal="230"
                        percent={((device.voltage - 200) / 50) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Line Voltage', value: device.voltage || '--', unit: 'V', min: 200, max: 250, optimal: '230', percent: ((device.voltage - 200) / 50) * 100 || 0 })}
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
                                className={`toggle-tab ${activeMetric === 'temperature' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('temperature')}
                            >
                                Temperature
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'pressure' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('pressure')}
                            >
                                Pressure
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
                            color={
                                activeMetric === 'efficiency' ? "#6366f1" :
                                    activeMetric === 'healthScore' ? "#10b981" :
                                        activeMetric === 'uptime' ? "#f59e0b" :
                                            activeMetric === 'temperature' ? "#f43f5e" :
                                                activeMetric === 'pressure' ? "#3b82f6" :
                                                    activeMetric === 'vibration' ? "#a855f7" :
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
