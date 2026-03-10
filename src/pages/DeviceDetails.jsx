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
    Plus,
    Trash2
} from 'lucide-react';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import RuleModal from '../components/Rules/RuleModal';
import ShiftModal from '../components/Devices/ShiftModal';
import HealthConfigModal from '../components/Devices/HealthConfigModal';
import MetricDetailOverlay from '../components/Dashboard/MetricDetailOverlay';
import { useToast } from '../components/Shared/Toast';
import api from '../api/client';
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
    const [activeMetric, setActiveMetric] = useState('temperature');
    const [device, setDevice] = useState(null);
    const [telemetry, setTelemetry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeHubTab, setActiveHubTab] = useState(null);
    const [appliedRules, setAppliedRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [selectedMetricView, setSelectedMetricView] = useState(null);
    const [timeRange, setTimeRange] = useState('24h');
    const [shifts, setShifts] = useState([]);
    const [healthConfigs, setHealthConfigs] = useState([]);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showHealthModal, setShowHealthModal] = useState(false);
    const { showToast, ToastContainer } = useToast();

    const loadRules = async (deviceId) => {
        try {
            const rulesData = await api.getRules();
            const rules = rulesData.data || [];
            const filtered = rules.filter(rule => {
                // Check if rule applies to this device
                // Rules can be for: all_devices (empty/no device_ids), or specific device_ids
                if (rule.scope === 'all_devices' || !rule.device_ids || rule.device_ids.length === 0) {
                    return true;
                }
                // Check if current device is in the device_ids array
                return rule.device_ids.includes(deviceId) || rule.device_ids.includes(id);
            });
            console.log(`Loaded ${filtered.length} rules for device ${deviceId}:`, filtered);
            setAppliedRules(filtered);
        } catch (err) {
            console.error('Error loading rules:', err);
        }
    };

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                setLoading(true);

                // Fetch device data
                const deviceData = await api.getEquipmentById(id);
                const foundDevice = deviceData.data;

                if (foundDevice) {
                    setDevice(foundDevice);
                    setTelemetry(foundDevice.telemetry || []);
                    await loadRules(id);
                    setError(null);
                } else {
                    setError('Device not found');
                }
            } catch (err) {
                console.error('Error fetching device:', err);
                setError('Failed to load device data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDevice();
        }
    }, [id]);

    // Live telemetry polling
    useEffect(() => {
        if (!device || loading) return;

        const fetchTelemetry = async () => {
            try {
                // Calculate start time based on range
                const now = new Date();
                let startTime = new Date();
                let limit = 100;

                switch (timeRange) {
                    case '1h':
                        startTime.setHours(now.getHours() - 1);
                        limit = 120; // 2 points per minute
                        break;
                    case '6h':
                        startTime.setHours(now.getHours() - 6);
                        limit = 360;
                        break;
                    case '24h':
                        startTime.setHours(now.getHours() - 24);
                        limit = 500;
                        break;
                    case '7d':
                        startTime.setDate(now.getDate() - 7);
                        limit = 1000;
                        break;
                    case '30d':
                        startTime.setDate(now.getDate() - 30);
                        limit = 2000;
                        break;
                }

                const telemetryData = await api.getTelemetry(id, {
                    startTime: startTime.toISOString(),
                    limit: limit
                });

                if (telemetryData.data && telemetryData.data.length > 0) {
                    const formatted = telemetryData.data.map(t => ({
                        timestamp: new Date(t.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            ...(timeRange === '1h' || timeRange === '6h' ? { second: '2-digit' } : {}),
                            ...(timeRange === '7d' || timeRange === '30d' ? { month: 'short', day: 'numeric' } : {})
                        }),
                        temperature: t.temperature || 0,
                        pressure: t.pressure || 0,
                        power: t.power || 0,
                        voltage: t.voltage || 0,
                        current: t.current || 0,
                        vibration: t.vibration || 0,
                        efficiency: t.efficiency_pct || 0
                    }));
                    setTelemetry(formatted.reverse());
                }
            } catch (err) {
                console.warn('Telemetry fetch failed:', err);
            }
        };

        const fetchConfigs = async () => {
            if (!id) return;
            try {
                const [shiftsData, healthData] = await Promise.all([
                    api.getShifts(id),
                    api.getHealthConfigs(id)
                ]);
                setShifts(shiftsData.data || []);
                setHealthConfigs(healthData.data || []);
            } catch (err) {
                console.warn('Config fetch failed:', err);
            }
        };

        fetchTelemetry();
        fetchConfigs();
        const interval = setInterval(() => {
            fetchTelemetry();
            fetchConfigs();
        }, 5000);
        return () => clearInterval(interval);
    }, [device?.id, loading, id, timeRange]);

    // Periodic rule refresh - sync with changes from Rules page
    useEffect(() => {
        if (!device || loading) return;

        const refreshRules = async () => {
            try {
                await loadRules(id);
            } catch (err) {
                console.warn('Rule refresh failed:', err);
            }
        };

        // Check for rule updates every 10 seconds
        const interval = setInterval(refreshRules, 10000);
        return () => clearInterval(interval);
    }, [device?.id, loading, id]);

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleAddRule = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const handleToggleRuleStatus = async (ruleId) => {
        const rule = appliedRules.find(r => r.id === ruleId);
        if (!rule) return;

        try {
            const newStatus = rule.status === 'active' ? 'Inactive' : 'Active';
            console.log(`Toggling rule ${ruleId} status from ${rule.status} to ${newStatus}`);

            // Use the dedicated status update endpoint
            await api.updateRuleStatus(ruleId, newStatus);

            // Update UI after successful API call - convert to lowercase
            const statusToStore = newStatus === 'Active' ? 'active' : 'paused';
            setAppliedRules(appliedRules.map(r =>
                r.id === ruleId ? { ...r, status: statusToStore } : r
            ));
            showToast(`Rule ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
        } catch (error) {
            console.error('Failed to toggle rule:', error);
            showToast('Failed to update rule status', 'error');
            // Refetch rules to sync state with server
            await loadRules(id);
        }
    };

    const handleSaveRule = async (updatedRuleData) => {
        try {
            if (editingRule) {
                await api.updateRule(editingRule.id, updatedRuleData);
            } else {
                await api.createRule({
                    ...updatedRuleData,
                    device_id: id
                });
            }
            await loadRules(id);
            showToast('Rule saved successfully', 'success');
        } catch (err) {
            console.error('Error saving rule:', err);
            showToast('Failed to save rule', 'error');
        }
        setIsModalOpen(false);
    };

    const handleAddShift = async (shiftData) => {
        try {
            const response = await api.createShift(id, shiftData);
            setShifts([...shifts, response.data]);
            showToast('Shift added successfully', 'success');
        } catch (err) {
            showToast('Failed to add shift', 'error');
        }
    };

    const handleAddHealthConfig = async (configData) => {
        try {
            const response = await api.createHealthConfig(id, configData);
            setHealthConfigs([...healthConfigs, response.data]);
            showToast('Parameter added successfully', 'success');
        } catch (err) {
            showToast('Failed to add parameter', 'error');
        }
    };

    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm('Delete this shift configuration?')) return;
        try {
            await api.deleteShift(id, shiftId);
            setShifts(shifts.filter(s => s.id !== shiftId));
            showToast('Shift deleted successfully', 'success');
        } catch (err) {
            showToast('Failed to delete shift', 'error');
        }
    };

    const handleDeleteHealthConfig = async (configId) => {
        if (!window.confirm('Delete this health parameter config?')) return;
        try {
            await api.deleteHealthConfig(id, configId);
            setHealthConfigs(healthConfigs.filter(c => c.id !== configId));
            showToast('Parameter deleted successfully', 'success');
        } catch (err) {
            showToast('Failed to delete parameter', 'error');
        }
    };

    const totalWeight = healthConfigs.reduce((sum, c) => sum + (c.weight || 0), 0);
    const weightRemaining = 100 - totalWeight;

    // Format telemetry for chart
    const chartData = telemetry.length > 0
        ? telemetry.map((t) => ({
            name: t.timestamp,
            temperature: t.temperature || 0,
            pressure: t.pressure || 0,
            power: t.power || 0,
            voltage: t.voltage || 0,
            current: t.current || 0,
            vibration: t.vibration || 0,
            efficiency: t.efficiency || 0
        }))
        : [
            { name: 'Waiting...', temperature: 0, pressure: 0, power: 0, voltage: 0, current: 0, vibration: 0, efficiency: 0 },
        ];

    // Get latest telemetry values
    const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : {};

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
                {/* ═══ MOBILE HERO CARD (hidden on desktop) ═══ */}
                <section className="mobile-device-hero glass-card mobile-only">
                    <div className="mobile-hero-top">
                        <div className="mobile-hero-name-block">
                            <span className="mobile-device-id-tag">{device.id}</span>
                            <h2 className="mobile-device-name">{device.name}</h2>
                        </div>
                        <div className="mobile-hero-health-block">
                            <span className="mobile-health-label">HEALTH</span>
                            <span className={`mobile-health-value ${device.health < 50 ? 'critical' : device.health < 80 ? 'warning' : 'healthy'}`}>
                                {device.health || 85}%
                            </span>
                        </div>
                    </div>
                    <div className="mobile-hero-status-row">
                        <span className={`mobile-status-badge ${(device.status || device.runtime_status || 'running').toLowerCase()}`}>
                            <span className="mobile-status-dot"></span>
                            {device.status || device.runtime_status || 'Unknown'}
                        </span>
                        <span className="mobile-info-chip">{device.type}</span>
                        <span className="mobile-info-chip">{device.location}</span>
                    </div>
                </section>

                {/* Device Information Header — desktop only */}
                <section className="device-info-panel glass-card desktop-only">
                    <div className="info-grid-header">
                        <span className="info-title">DEVICE INFORMATION</span>
                        <div className="health-score-container">
                            <span className="health-score-label">HEALTH SCORE</span>
                            <span className={`health-score-value ${device.health < 50 ? 'critical' : device.health < 80 ? 'warning' : ''}`}>
                                {device.health || 85}%
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
                            <span className={`i-value status-${(device.status || device.runtime_status || 'running').toLowerCase()}`}>
                                <span className="status-dot"></span>
                                {device.status || device.runtime_status || 'Unknown'}
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
                            <span className="i-value">{device.manufacturer || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">MODEL</span>
                            <span className="i-value">{device.model || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">LAST SEEN</span>
                            <span className="i-value">{device.last_seen_timestamp ? new Date(device.last_seen_timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="i-label">LOCATION</span>
                            <span className="i-value">{device.location || 'N/A'}</span>
                        </div>
                    </div>
                </section>

                {/* Metrics Grid */}
                <section className="metrics-summary-grid">
                    <MetricCard
                        title="Equipment Health Score"
                        value={device.health || 85}
                        unit="%"
                        icon={Shield}
                        min={0} max={100} optimal="90+"
                        percent={device.health || 85}
                        onClick={() => setSelectedMetricView({ title: 'Equipment Health Score', value: device.health || 85, unit: '%', min: 0, max: 100, optimal: '90+', percent: device.health || 85 })}
                    />
                    <MetricCard
                        title="Temperature"
                        value={latestTelemetry.temperature?.toFixed(1) || '--'}
                        unit="°C"
                        icon={Thermometer}
                        min={0} max={100} optimal="80-90"
                        percent={latestTelemetry.temperature || 0}
                        onClick={() => setSelectedMetricView({ title: 'Temperature', value: latestTelemetry.temperature, unit: '°C', min: 0, max: 100, optimal: '80-90', percent: latestTelemetry.temperature })}
                    />
                    <MetricCard
                        title="Pressure"
                        value={latestTelemetry.pressure?.toFixed(1) || '--'}
                        unit="PSI"
                        icon={Gauge}
                        min={0} max={150} optimal="110-130"
                        percent={(latestTelemetry.pressure / 150) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Pressure', value: latestTelemetry.pressure, unit: 'PSI', min: 0, max: 150, optimal: '110-130', percent: (latestTelemetry.pressure / 150) * 100 })}
                    />
                    <MetricCard
                        title="Power"
                        value={latestTelemetry.power?.toFixed(1) || '--'}
                        unit="kW"
                        icon={Zap}
                        min={0} max={500} optimal="200-300"
                        percent={(latestTelemetry.power / 500) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Power', value: latestTelemetry.power, unit: 'kW', min: 0, max: 500, optimal: '200-300', percent: (latestTelemetry.power / 500) * 100 })}
                    />
                    <MetricCard
                        title="Voltage"
                        value={latestTelemetry.voltage?.toFixed(1) || '--'}
                        unit="V"
                        icon={Zap}
                        min={0} max={250} optimal="220-240"
                        percent={(latestTelemetry.voltage / 250) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Voltage', value: latestTelemetry.voltage, unit: 'V', min: 0, max: 250, optimal: '220-240', percent: (latestTelemetry.voltage / 250) * 100 })}
                    />
                    <MetricCard
                        title="Current"
                        value={latestTelemetry.current?.toFixed(2) || '--'}
                        unit="A"
                        icon={Activity}
                        min={0} max={10} optimal="1-5"
                        percent={(latestTelemetry.current / 10) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Current', value: latestTelemetry.current, unit: 'A', min: 0, max: 10, optimal: '1-5', percent: (latestTelemetry.current / 10) * 100 })}
                    />
                    <MetricCard
                        title="Vibration"
                        value={latestTelemetry.vibration?.toFixed(2) || '--'}
                        unit="MM/S"
                        icon={Activity}
                        min={0} max={10} optimal="<4"
                        percent={(latestTelemetry.vibration / 10) * 100 || 0}
                        onClick={() => setSelectedMetricView({ title: 'Vibration', value: latestTelemetry.vibration, unit: 'MM/S', min: 0, max: 10, optimal: '<4', percent: (latestTelemetry.vibration / 10) * 100 })}
                    />
                    <MetricCard
                        title="Efficiency"
                        value={latestTelemetry.efficiency?.toFixed(0) || '--'}
                        unit="%"
                        icon={Heart}
                        min={0} max={100} optimal="90+"
                        percent={latestTelemetry.efficiency || 0}
                        onClick={() => setSelectedMetricView({ title: 'Efficiency', value: latestTelemetry.efficiency, unit: '%', min: 0, max: 100, optimal: '90+', percent: latestTelemetry.efficiency })}
                    />
                </section>

                <section className="performance-analytics-section glass-card">
                    <div className="chart-controls-row">
                        <div className="chart-title-stack">
                            <h3>Performance Trends</h3>
                            <span className="subtext">(Real-time Telemetry)</span>
                        </div>

                        <div className="time-range-group">
                            {['1h', '6h', '24h', '7d', '30d'].map(range => (
                                <button
                                    key={range}
                                    className={`range-btn ${timeRange === range ? 'active' : ''}`}
                                    onClick={() => setTimeRange(range)}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <div className="metric-toggle-group scrollable">
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
                                className={`toggle-tab ${activeMetric === 'power' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('power')}
                            >
                                Power
                            </button>
                            <button
                                className={`toggle-tab ${activeMetric === 'voltage' ? 'active' : ''}`}
                                onClick={() => setActiveMetric('voltage')}
                            >
                                Voltage
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
                                activeMetric === 'temperature' ? "#f59e0b" :
                                    activeMetric === 'pressure' ? "#6366f1" :
                                        activeMetric === 'power' ? "#10b981" :
                                            activeMetric === 'voltage' ? "#a855f7" :
                                                "#f43f5e"
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
                        <span>Automation Rules</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'shifts' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'shifts' ? null : 'shifts')}
                    >
                        <div className="hub-icon-box"><Clock size={20} /></div>
                        <span>Shift Config</span>
                    </button>
                    <button
                        className={`hub-btn ${activeHubTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveHubTab(activeHubTab === 'health' ? null : 'health')}
                    >
                        <div className="hub-icon-box"><Activity size={20} /></div>
                        <span>Health Config</span>
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
                                                <h4>Automation Rules</h4>
                                                <p>Rules configured for this device</p>
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
                                                        <code className="rule-logic-preview">{rule.condition} {rule.threshold_value}</code>
                                                    </div>
                                                    <div className="rule-actions-hub">
                                                        <button
                                                            className="edit-rule-btn-mini"
                                                            onClick={() => handleEditRule(rule)}
                                                            title="Edit Rule"
                                                        >
                                                            <Settings size={14} />
                                                        </button>
                                                        <button
                                                            className={`rule-status-tag ${rule.status?.toLowerCase() || 'active'}`}
                                                            onClick={() => handleToggleRuleStatus(rule.id)}
                                                            title="Toggle Rule Status"
                                                            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                                                        >
                                                            <div className="pulse-dot"></div>
                                                            {rule.status?.toUpperCase() || 'ACTIVE'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state-simple">
                                                <div className="empty-icon-circle">
                                                    <AlertCircle size={32} />
                                                </div>
                                                <p>No automation rules found</p>
                                                <span className="empty-subtext">Add a rule to automatically handle device events and alerts</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeHubTab === 'shifts' && (
                                <div className="device-configurations-grid">
                                    <section className="config-box">
                                        <div className="config-header">
                                            <div className="header-icon-box">
                                                <Clock size={20} className="text-accent" />
                                            </div>
                                            <div className="p-title-stack">
                                                <h4>Shift Configuration</h4>
                                                <p>Manage device operating shifts and maintenance windows</p>
                                            </div>
                                        </div>
                                        <div className="config-body">
                                            <div className="config-list">
                                                {shifts.length > 0 ? shifts.map(shift => (
                                                    <motion.div
                                                        key={shift.id}
                                                        className="config-item-card glass-panel"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                    >
                                                        <div className="c-item-header">
                                                            <div className="c-item-title-group">
                                                                <Clock size={16} className="text-accent" />
                                                                <span className="c-item-name">{shift.shift_name}</span>
                                                            </div>
                                                            <div className="c-item-actions">
                                                                <div className={`status-badge-mini ${shift.is_active ? 'active' : 'inactive'}`}>
                                                                    {shift.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                                </div>
                                                                <button className="delete-btn-tiny" onClick={() => handleDeleteShift(shift.id)}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="c-item-details">
                                                            <div className="c-detail-row">
                                                                <span className="c-detail-label">TIME</span>
                                                                <span className="c-detail-value">{shift.shift_start} — {shift.shift_end}</span>
                                                            </div>
                                                            <div className="c-detail-row">
                                                                <span className="c-detail-label">SCHEDULE</span>
                                                                <span className="c-detail-value">{shift.day_of_week === null ? 'All Days' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][shift.day_of_week]}</span>
                                                            </div>
                                                            <div className="c-detail-row">
                                                                <span className="c-detail-label">BREAK</span>
                                                                <span className="c-detail-value">{shift.maintenance_break_minutes} mins</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="empty-state-simple">
                                                        <div className="empty-icon-circle">
                                                            <Clock size={32} />
                                                        </div>
                                                        <p>Ready to define operational windows?</p>
                                                        <span className="empty-subtext">Add a shift to start tracking performance against schedule</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="add-config-btn-neon" onClick={() => setShowShiftModal(true)}>
                                                <Plus size={16} />
                                                <span>Add operating shift</span>
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeHubTab === 'health' && (
                                <div className="device-configurations-grid">
                                    <section className="config-box">
                                        <div className="config-header">
                                            <div className="header-icon-box">
                                                <Activity size={20} className="text-accent" />
                                            </div>
                                            <div className="p-title-stack">
                                                <h4>Health Parameter Configuration</h4>
                                                <p>Configure weights and thresholds for health scoring</p>
                                            </div>
                                            <div className="h-right">
                                                <span className="weight-summary">
                                                    Total weight: <span className={totalWeight > 100 ? 'text-danger' : 'text-success'}>{totalWeight.toFixed(1)}%</span>
                                                    ({weightRemaining.toFixed(1)}% remaining)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="config-body">
                                            <div className="config-list">
                                                {healthConfigs.length > 0 ? healthConfigs.map(config => (
                                                    <motion.div
                                                        key={config.id}
                                                        className="config-item-card glass-panel"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                    >
                                                        <div className="c-item-header">
                                                            <div className="c-item-title-group">
                                                                <Activity size={16} className="text-accent" />
                                                                <span className="c-item-name">{config.parameter_name}</span>
                                                            </div>
                                                            <div className="c-item-actions">
                                                                <div className="weight-badge">
                                                                    {config.weight}% weight
                                                                </div>
                                                                <button className="delete-btn-tiny" onClick={() => handleDeleteHealthConfig(config.id)}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="c-item-details-grid">
                                                            <div className="c-detail-block">
                                                                <span className="c-detail-label">NORMAL RANGE</span>
                                                                <span className="c-detail-value status-success">{config.normal_min} — {config.normal_max}</span>
                                                            </div>
                                                            <div className="c-detail-block">
                                                                <span className="c-detail-label">CRITICAL RANGE</span>
                                                                <span className="c-detail-value status-error">{config.max_min} — {config.max_max}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="empty-state-simple">
                                                        <div className="empty-icon-circle">
                                                            <Activity size={32} />
                                                        </div>
                                                        <p>No active health parameters</p>
                                                        <span className="empty-subtext">Configure parameters to enable real-time health scoring</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="add-config-btn-neon" onClick={() => setShowHealthModal(true)}>
                                                <Plus size={16} />
                                                <span>Add parameter config</span>
                                            </button>
                                        </div>
                                    </section>
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

                <ShiftModal
                    isOpen={showShiftModal}
                    onClose={() => setShowShiftModal(false)}
                    onSave={handleAddShift}
                    deviceId={id}
                />

                <HealthConfigModal
                    isOpen={showHealthModal}
                    onClose={() => setShowHealthModal(false)}
                    onSave={handleAddHealthConfig}
                    deviceId={id}
                    weightRemaining={weightRemaining}
                />

                <ToastContainer />
            </main>
        </div>
    );
};

export default DeviceDetails;
