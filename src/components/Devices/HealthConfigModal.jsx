import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, ShieldAlert, Target } from 'lucide-react';
import './DeviceModal.css';

const COMMON_METRICS = [
    'temperature',
    'pressure',
    'power',
    'voltage',
    'vibration',
    'current',
    'efficiency'
];

const HealthConfigModal = ({ isOpen, onClose, onSave, deviceId, weightRemaining }) => {
    const [parameterName, setParameterName] = useState('temperature');
    const [normalMin, setNormalMin] = useState('');
    const [normalMax, setNormalMax] = useState('');
    const [maxMin, setMaxMin] = useState('');
    const [maxMax, setMaxMax] = useState('');
    const [weight, setWeight] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (parseFloat(weight) > weightRemaining) {
            alert(`Weight exceeds remaining capacity (${weightRemaining}%).`);
            return;
        }

        onSave({
            device_id: deviceId,
            parameter_name: parameterName,
            normal_min: normalMin === '' ? null : parseFloat(normalMin),
            normal_max: normalMax === '' ? null : parseFloat(normalMax),
            max_min: maxMin === '' ? null : parseFloat(maxMin),
            max_max: maxMax === '' ? null : parseFloat(maxMax),
            weight: parseFloat(weight),
            is_active: isActive
        });

        onClose();
        // Reset form
        setNormalMin('');
        setNormalMax('');
        setMaxMin('');
        setMaxMax('');
        setWeight(0);
        setIsActive(true);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal-container glass-card"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <header className="modal-header">
                            <div className="header-title">
                                <div className="header-icon-box">
                                    <Activity size={20} className="text-accent" />
                                </div>
                                <div className="header-text-stack">
                                    <h2>Health Scoring Config</h2>
                                    <p className="header-subtitle">Define parameters for automated health analysis</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <section className="form-section">
                                <span className="section-title">Telemetry Parameter</span>
                                <div className="form-group">
                                    <div className="input-with-icon">
                                        <Target size={16} className="input-icon" />
                                        <select
                                            value={parameterName}
                                            onChange={(e) => setParameterName(e.target.value)}
                                            className="modal-input"
                                        >
                                            {COMMON_METRICS.map(m => (
                                                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <span className="section-title">Normal Range (Green Zone)</span>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Min</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={normalMin}
                                            onChange={(e) => setNormalMin(e.target.value)}
                                            placeholder="Min value"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={normalMax}
                                            onChange={(e) => setNormalMax(e.target.value)}
                                            placeholder="Max value"
                                            className="modal-input"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <span className="section-title">Critical Range (Outer Bounds)</span>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Min</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={maxMin}
                                            onChange={(e) => setMaxMin(e.target.value)}
                                            placeholder="Critical min"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={maxMax}
                                            onChange={(e) => setMaxMax(e.target.value)}
                                            placeholder="Critical max"
                                            className="modal-input"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <span className="section-title">Impact Scoring</span>
                                <div className="form-group">
                                    <label>Scoring Weight (%)</label>
                                    <div className="input-with-icon">
                                        <ShieldAlert size={16} className="input-icon" />
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder={`Max ${weightRemaining.toFixed(1)}%`}
                                            className="modal-input"
                                            max={weightRemaining}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="weight-summary">
                                    <span className="weight-info-label">Remaining available capacity</span>
                                    <span className="weight-info-value">{weightRemaining.toFixed(1)}%</span>
                                </div>
                            </section>

                            <div className="form-checkbox-custom">
                                <input
                                    type="checkbox"
                                    id="health-active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="health-active">
                                    <span className="checkbox-label">Include in Health Score</span>
                                    <span className="checkbox-sub">Telemetery will contribute to real-time status</span>
                                </label>
                            </div>

                            <footer className="modal-footer">
                                <button type="button" className="btn-secondary-glass" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary-neon">Deploy Parameter</button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default HealthConfigModal;
