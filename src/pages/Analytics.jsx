import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Download,
    Play,
    Database,
    Cpu,
    Zap,
    ChevronDown,
    Search,
    FileText,
    Loader2
} from 'lucide-react';
import AnomalyChart from '../components/Analytics/AnomalyChart';
import api from '../api/client';
import './Analytics.css';

const Analytics = () => {
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);

    const [config, setConfig] = useState({
        machine: '',
        analysisType: 'Anomaly Detection',
        model: 'Isolation_forest',
        dataset: 'datasets/D1/20260215_202604'
    });

    const [jobStatus, setJobStatus] = useState({
        id: '---',
        status: 'idle' // idle, running, completed
    });

    const [results, setResults] = useState({
        totalPoints: 0,
        totalAnomalies: 0,
        anomalyPercentage: '0%'
    });

    const [chartData, setChartData] = useState([]);
    const [tableData, setTableData] = useState([]);

    // Fetch Devices on Mount
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await api.getEquipment();
                setDevices(response.data);
                if (response.data.length > 0) {
                    setConfig(prev => ({ ...prev, machine: response.data[0].name }));
                }
            } catch (error) {
                console.error("Failed to fetch devices:", error);
            } finally {
                setLoadingDevices(false);
            }
        };

        fetchDevices();
    }, []);

    // Mock Data Generator for Batch Process
    const generateBatchData = (count = 100) => {
        const data = [];
        const anomalies = [];
        const baseTimestamp = Date.now();

        let anomalyCount = 0;

        for (let i = 0; i < count; i++) {
            // base value + random noise
            const baseValue = Math.sin((baseTimestamp - i * 60000) / 10000) * 0.05;
            const isAnomaly = Math.random() > 0.92; // 8% chance of anomaly

            let value = baseValue + (Math.random() * 0.02 - 0.01);
            let score = (Math.random() * 0.05 - 0.025);

            if (isAnomaly) {
                // Anomalies deviate significantly
                value += (Math.random() > 0.5 ? 0.1 : -0.1);
                score = (Math.random() * 0.15 + 0.05); // Higher anomaly score
                anomalyCount++;
            }

            const point = {
                timestamp: new Date(baseTimestamp - (count - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: value,
                score: score,
                isAnomaly: score > 0.04
            };

            data.push(point);
            if (isAnomaly) anomalies.push(point);
        }

        return { data, anomalies, anomalyCount };
    };

    const handleRunAnalysis = async () => {
        if (jobStatus.status === 'running') return;

        // Reset
        setJobStatus({ id: '---', status: 'running' });
        setChartData([]);
        setTableData([]);
        setResults({ totalPoints: 0, totalAnomalies: 0, anomalyPercentage: '0%' });

        // Generate Job ID
        const jobId = crypto.randomUUID();
        setJobStatus(prev => ({ ...prev, id: jobId }));

        // Simulate Processing Delay
        setTimeout(() => {
            const { data, anomalies, anomalyCount } = generateBatchData(150);

            setChartData(data);

            // Format Table Data
            const tableRows = data.slice().reverse().map(point => ({
                timestamp: point.timestamp,
                status: point.isAnomaly ? 'Anomaly' : 'Normal',
                score: point.score.toFixed(4)
            }));
            setTableData(tableRows);

            // Update Results
            setResults({
                totalPoints: data.length,
                totalAnomalies: anomalyCount,
                anomalyPercentage: ((anomalyCount / data.length) * 100).toFixed(2) + '%'
            });

            setJobStatus(prev => ({ ...prev, status: 'completed' }));

        }, 2000); // 2 seconds processing time
    };

    return (
        <div className="analytics-page-root">
            <header className="analytics-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Run AI-powered analytics on your machine data</p>
                </div>
            </header>

            {/* Analysis Configuration */}
            <section className="analytics-section config-section">
                <div className="section-header">
                    <h2>Analysis Configuration</h2>
                    <button className="btn-secondary" disabled={jobStatus.status !== 'completed'}>Export Results</button>
                </div>

                <div className="config-grid">
                    <div className="form-group">
                        <label>Machine</label>
                        <div className="select-wrapper">
                            <select
                                value={config.machine}
                                onChange={(e) => setConfig({ ...config, machine: e.target.value })}
                                disabled={loadingDevices || jobStatus.status === 'running'}
                            >
                                {loadingDevices ? (
                                    <option>Loading devices...</option>
                                ) : (
                                    devices.map(device => (
                                        <option key={device.id} value={device.name}>
                                            {device.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Analysis Type</label>
                        <div className="select-wrapper">
                            <select
                                value={config.analysisType}
                                onChange={(e) => setConfig({ ...config, analysisType: e.target.value })}
                                disabled={jobStatus.status === 'running'}
                            >
                                <option>Anomaly Detection</option>
                                <option>Predictive Maintenance</option>
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Model</label>
                        <div className="select-wrapper">
                            <select
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                disabled={jobStatus.status === 'running'}
                            >
                                <option>Isolation_forest</option>
                                <option>Autoencoder</option>
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Dataset</label>
                        <div className="select-wrapper">
                            <select
                                value={config.dataset}
                                onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
                                disabled={jobStatus.status === 'running'}
                            >
                                <option>datasets/D1/20260215_202604</option>
                                <option>datasets/D1/20260214_180000</option>
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>
                </div>

                <div className="action-row">
                    <button
                        className="btn-primary"
                        onClick={handleRunAnalysis}
                        disabled={jobStatus.status === 'running'}
                    >
                        {jobStatus.status === 'running' ? (
                            <>
                                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                                Running Analysis...
                            </>
                        ) : 'Run Analysis'}
                    </button>
                </div>
            </section>

            {/* Job Status */}
            <section className="analytics-section job-status-section">
                <h2>Job Status</h2>
                <div className="job-details">
                    <div className="job-id">
                        <span className="label">Job ID:</span>
                        <span className="value">{jobStatus.id}</span>
                    </div>
                    <div className="job-state">
                        <span className="label">Status:</span>
                        <div className={`status-badge-container ${jobStatus.status}`}>
                            {jobStatus.status === 'running' && <Loader2 size={14} className="animate-spin" />}
                            <span className={`status-badge ${jobStatus.status}`}>
                                {jobStatus.status}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analysis Results */}
            <section className="analytics-section results-section">
                <h2>Analysis Results</h2>

                <div className="results-cards">
                    <div className="result-card">
                        <span className="card-label">Total points</span>
                        <span className="card-value">{results.totalPoints}</span>
                    </div>
                    <div className="result-card">
                        <span className="card-label">Total anomalies</span>
                        <span className="card-value">{results.totalAnomalies}</span>
                    </div>
                    <div className="result-card">
                        <span className="card-label">Anomaly percentage</span>
                        <span className="card-value">{results.anomalyPercentage}</span>
                    </div>
                </div>

                <div className="chart-wrapper-main">
                    <h3>Anomaly Detection Results</h3>
                    {chartData.length > 0 ? (
                        <div style={{ width: '100%', height: '400px' }}>
                            <AnomalyChart data={chartData} title="" />
                        </div>
                    ) : (
                        <div className="empty-chart-state">
                            {jobStatus.status === 'running' ? (
                                <div className="loading-state">
                                    <Loader2 size={32} className="animate-spin" />
                                    <p>Analyzing dataset...</p>
                                </div>
                            ) : (
                                <p>Select a configuration and run analysis to view results.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="data-table-wrapper">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Status</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length > 0 ? (
                                tableData.map((row, index) => (
                                    <tr key={index} className="fade-in">
                                        <td>{row.timestamp}</td>
                                        <td>
                                            <span className={`status-pill ${row.status.toLowerCase()}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>{row.score}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No analysis data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Analytics;
