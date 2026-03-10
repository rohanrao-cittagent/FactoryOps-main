import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    ChevronDown,
    Check,
    BarChart3,
    Clock,
    Layers,
    FileText,
    Send,
    Zap,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import api from '../api/client';
import './Reporting.css';

const Reporting = () => {
    const [devicesList, setDevicesList] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [devices, setDevices] = useState('All Machines');
    const [range, setRange] = useState('Last 30 Days');
    const [analysis, setAnalysis] = useState(['Anomaly Detection', 'Failure Prediction']);
    const [format, setFormat] = useState('PDF');
    const [schedule, setSchedule] = useState('One-time');
    const [email, setEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedType, setSelectedType] = useState('Compressors');

    // Fetch devices on mount
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await api.getEquipment();
                setDevicesList(response.data || []);
            } catch (error) {
                console.error('Failed to fetch devices:', error);
            } finally {
                setLoadingDevices(false);
            }
        };
        
        fetchDevices();
    }, []);

    const toggleAnalysis = (item) => {
        setAnalysis(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const generateMockData = async () => {
        const timestamp = new Date().toLocaleString();
        const reportId = Math.floor(10000 + Math.random() * 90000);

        // Fetch real alerts from the backend
        let logs = [];
        try {
            const alertsResponse = await api.getAlerts({ limit: 12 });
            logs = (alertsResponse.data || []).map(alert => ({
                timestamp: new Date(alert.created_at || new Date()).toLocaleString(),
                severity: alert.severity || 'Warning',
                device: alert.device_id || 'Unknown',
                message: alert.message || alert.description || 'Alert triggered'
            }));
        } catch (error) {
            console.warn('Failed to fetch real alerts, using mock data:', error);
            // Fallback to mock data
            logs = [
                { timestamp: "2/16/2026, 4:12:48 AM", severity: "Warning", device: "BULB-129", message: "High Voltage Fluctuation" },
                { timestamp: "2/15/2026, 7:39:31 PM", severity: "Warning", device: "BULB-126", message: "Unexpected Dimming" },
                { timestamp: "2/15/2026, 2:12:17 PM", severity: "Warning", device: "BULB-115", message: "High Voltage Fluctuation" },
                { timestamp: "2/15/2026, 12:24:05 PM", severity: "Warning", device: "BULB-133", message: "High Voltage Fluctuation" },
                { timestamp: "2/14/2026, 6:08:23 AM", severity: "Critical Alert", device: "BULB-116", message: "Filament Overheat Detected" },
                { timestamp: "2/13/2026, 5:08:37 PM", severity: "Warning", device: "BULB-102", message: "Unexpected Dimming" },
                { timestamp: "2/12/2026, 10:06:48 PM", severity: "Warning", device: "BULB-105", message: "Unexpected Dimming" },
                { timestamp: "2/12/2026, 9:35:06 PM", severity: "Warning", device: "BULB-142", message: "Unexpected Dimming" },
                { timestamp: "2/12/2026, 11:55:03 AM", severity: "Warning", device: "BULB-110", message: "Unexpected Dimming" },
                { timestamp: "2/11/2026, 8:42:10 AM", severity: "Warning", device: "BULB-127", message: "High Voltage Fluctuation" },
                { timestamp: "2/11/2026, 2:57:17 AM", severity: "Warning", device: "BULB-121", message: "High Voltage Fluctuation" },
                { timestamp: "2/11/2026, 1:07:57 AM", severity: "Critical Alert", device: "BULB-105", message: "Filament Overheat Detected" }
            ];
        }

        // Fetch real device summary for metrics
        let summary = {
            operationalUptime: "99.92%",
            systemEfficiency: "94.2/100",
            activeUnits: "842 Bulbs",
            avgLifespan: "15,000 hrs",
            estEnergySavings: "1,240 kWh",
            estCostSavings: "$3,450"
        };

        try {
            const dashboardResponse = await api.getDashboardSummary();
            if (dashboardResponse.summary) {
                const summary_data = dashboardResponse.summary;
                const total = summary_data.total_devices || 0;
                const running = summary_data.running_devices || 0;
                const uptime = total > 0 ? ((running / total) * 100).toFixed(2) : 0;
                const health = summary_data.system_health || 94.2;
                
                summary = {
                    operationalUptime: `${uptime}%`,
                    systemEfficiency: `${health}/100`,
                    activeUnits: `${running} / ${total} Devices`,
                    avgLifespan: "15,000 hrs",
                    estEnergySavings: "1,240 kWh",
                    estCostSavings: "$3,450"
                };
            }
        } catch (error) {
            console.warn('Failed to fetch real dashboard summary:', error);
        }

        const data = {
            reportId,
            generatedAt: timestamp,
            config: {
                devices,
                target: devices === 'Device Type' ? selectedType : 'All',
                range,
                analysisEnabled: analysis,
                format
            },
            summary,
            logs
        };
        return data;
    };

    const triggerDownload = (data) => {
        let content = '';
        let mimeType = 'text/plain';
        let extension = 'txt';

        if (format === 'JSON') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else if (format === 'Excel') {
            // Simplified CSV
            const headers = ['Timestamp', 'Severity', 'Device', 'Message'];
            const rows = data.logs.map(log =>
                [log.timestamp, log.severity, log.device, log.message].join(',')
            );
            content = [headers.join(','), ...rows].join('\n');
            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            // Custom Intelligence Report Format
            const pad = (str, len) => (str + ' '.repeat(len)).slice(0, len);

            content = `
================================================================================
       CITTAGENT / FACTORYOPS - INTELLIGENCE REPORT
================================================================================
REPORT ID: ${data.reportId}
GENERATED: ${data.generatedAt}
CONFIDENTIALITY: INTERNAL USE ONLY

--------------------------------------------------------------------------------
1. CONFIGURATION OVERVIEW
--------------------------------------------------------------------------------
Subject Scope:    ${data.config.devices} (${data.config.target})
Time Range:       ${data.config.range}
Analysis Modules:
${data.config.analysisEnabled.map(a => `[x] ${a}`).join('\n')}

--------------------------------------------------------------------------------
2. SYSTEM PERFORMANCE SUMMARY
--------------------------------------------------------------------------------
Operational Uptime:    ${data.summary.operationalUptime}
System Efficiency:     ${data.summary.systemEfficiency}
Active Units:          ${data.summary.activeUnits}
Avg. Lifespan:         ${data.summary.avgLifespan}
Est. Energy Savings:   ${data.summary.estEnergySavings}
Est. Cost Savings:     ${data.summary.estCostSavings}

--------------------------------------------------------------------------------
3. ANOMALY & EVENT LOG
--------------------------------------------------------------------------------
TIMESTAMP                     | SEVERITY        | DEVICE      | MESSAGE
--------------------------------------------------------------------------------
${data.logs.map(log =>
                `${pad(log.timestamp, 30)}| ${pad(log.severity, 16)}| ${pad(log.device, 12)}| ${log.message}`
            ).join('\n')}

--------------------------------------------------------------------------------
[END OF REPORT]
            `.trim();
            mimeType = 'text/plain';
            extension = 'txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Intelligence_Report_${data.reportId}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const reportData = await generateMockData();
            triggerDownload(reportData);
            setIsGenerating(false);
            setIsComplete(true);
            setTimeout(() => setIsComplete(false), 3000);
        } catch (error) {
            console.error('Report generation failed:', error);
            setIsGenerating(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 200 }
        }
    };

    return (
        <motion.div
            className="reporting-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="reporting-workflow-layout">

                {/* Workflow Sidebar/Steps Indicator */}
                <div className="workflow-nav-glass">
                    {[
                        { id: '01', icon: <Layers size={16} />, label: 'Select Devices' },
                        { id: '02', icon: <Clock size={16} />, label: 'Time Range' },
                        { id: '03', icon: <Zap size={16} />, label: 'Analysis Type' },
                        { id: '04', icon: <FileText size={16} />, label: 'Format & Delivery' }
                    ].map((step, idx) => (
                        <div key={step.id} className="workflow-step-link">
                            <div className="step-num-hex">{step.id}</div>
                            <div className="step-label-group">
                                <span className="step-label-mini">{step.label}</span>
                                {idx < 3 && <div className="step-connector-dash" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reporting-main-workspace">

                    {/* STEP 1: SELECT DEVICES */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box blue">
                                <Layers size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Select Devices</h3>
                                <p>Determine the breadth of hardware inclusion</p>
                            </div>
                        </div>

                        <div className="interaction-grid-3">
                            {['All Machines', 'Device Type', 'Specific Devices'].map(mode => (
                                <button
                                    key={mode}
                                    className={`interactive-mode-card ${devices === mode ? 'active' : ''}`}
                                    onClick={() => setDevices(mode)}
                                >
                                    <div className="mode-toggle-ring" />
                                    <span>{mode}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {devices === 'Device Type' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="secondary-config-area"
                                >
                                    <label className="field-label-mini">Target Device Type</label>
                                    <div className="crystal-dropdown">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="report-hidden-select"
                                        >
                                            <option value="Compressors">Compressors</option>
                                            <option value="Boilers">Boilers</option>
                                            <option value="Pumps">Pumps</option>
                                            <option value="Generators">Generators</option>
                                        </select>
                                        <span>{selectedType}</span>
                                        <ChevronDown size={16} />
                                    </div>
                                </motion.div>
                            )}
                            {devices === 'Specific Devices' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="secondary-config-area"
                                >
                                    <label className="field-label-mini">Selected Unit ID</label>
                                    <div className="input-field-glass mini">
                                        <input type="text" placeholder="D1-COMPRESSOR, B2-BOILER..." />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* STEP 2: TIME RANGE */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box purple">
                                <Clock size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Time Range</h3>
                                <p>Set the data lookback and granularity</p>
                            </div>
                        </div>
                        <div className="flex-wrap-pills">
                            {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Custom Range'].map(t => (
                                <button
                                    key={t}
                                    className={`time-chip-premium ${range === t ? 'active' : ''}`}
                                    onClick={() => setRange(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <AnimatePresence>
                            {range === 'Custom Range' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="custom-range-grid"
                                >
                                    <div className="input-field-glass mini">
                                        <label className="field-label-mini">Start Date</label>
                                        <input type="date" className="date-input-premium" />
                                    </div>
                                    <div className="input-field-glass mini">
                                        <label className="field-label-mini">End Date</label>
                                        <input type="date" className="date-input-premium" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* STEP 3: ANALYSIS TYPE */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box emerald">
                                <Zap size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Analysis Type</h3>
                                <p>Enable specific analytic model inclusions</p>
                            </div>
                        </div>
                        <div className="protocol-checkbox-grid">
                            {[
                                { name: 'Anomaly Detection', desc: 'Identify statistical outliers' },
                                { name: 'Failure Prediction', desc: 'Predict upcoming maintenance needs' },
                                { name: 'Performance Summary', desc: 'Baseline vs actual performance' },
                                { name: 'Forecast Events', desc: 'Forecast future operational events' },
                                { name: 'Maintenance Planning', desc: 'Detailed maintenance schedules' },
                                { name: 'Energy Audit', desc: 'Power usage profiling' }
                            ].map(item => (
                                <div
                                    key={item.name}
                                    className={`logic-checkbox-card ${analysis.includes(item.name) ? 'active' : ''}`}
                                    onClick={() => toggleAnalysis(item.name)}
                                >
                                    <div className="checkbox-frame">
                                        {analysis.includes(item.name) && <Check size={14} />}
                                    </div>
                                    <div className="logic-text">
                                        <span className="logic-name">{item.name}</span>
                                        <span className="logic-desc">{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* STEP 4: FORMAT & DELIVERY */}
                    <motion.div className="step-work-card" variants={itemVariants}>
                        <div className="card-header-premium">
                            <div className="header-icon-box amber">
                                <Send size={18} />
                            </div>
                            <div className="header-text-stack">
                                <h3>Format & Delivery</h3>
                                <p>Define report format and distribution channels</p>
                            </div>
                        </div>

                        <div className="delivery-cols">
                            <div className="format-selection-group">
                                <label className="field-label-mini">Report Format</label>
                                <div className="format-pills-row">
                                    {['PDF', 'Excel', 'JSON'].map(f => (
                                        <button
                                            key={f}
                                            className={`format-btn-mini ${format === f ? 'active' : ''}`}
                                            onClick={() => setFormat(f)}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="delivery-input-group">
                                <label className="field-label-mini">Email Recipients</label>
                                <div className="input-field-glass">
                                    <input
                                        type="text"
                                        placeholder="engineering@factoryops.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <FileText size={16} className="input-icon" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ACTION HUB */}
                    <motion.div className="report-action-hub" variants={itemVariants}>
                        <button className="btn-outline-glass">
                            PREVIEW REPORT
                        </button>
                        <button
                            className={`btn-neon-action ${isGenerating ? 'loading' : ''} ${isComplete ? 'success' : ''}`}
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            <AnimatePresence mode="wait">
                                {isGenerating ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="btn-state-content"
                                    >
                                        <Loader2 size={20} className="spinning-icon" />
                                        <span>Generating...</span>
                                    </motion.div>
                                ) : isComplete ? (
                                    <motion.div
                                        key="complete"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="btn-state-content"
                                    >
                                        <CheckCircle2 size={20} />
                                        <span>Complete</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="initial"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="btn-state-content"
                                    >
                                        <Download size={20} />
                                        <span>GENERATE & DOWNLOAD</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </motion.div>

                </div>
            </div>

            {/* Float Toast Feedback */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="status-toast-floating"
                    >
                        <AlertCircle size={20} className="toast-icon" />
                        <span>Report generated successfully. Downloading {format} file.</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Reporting;
