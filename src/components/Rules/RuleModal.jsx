import { useNotification } from '../../context/NotificationContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';
import './RuleModal.css';

// ... (constants remain the same)
const METRICS = [
    'Temperature',
    'Pressure',
    'Efficiency',
    'Vibration',
    'Power',
    'Humidity',
    'Flow Rate',
    'Voltage',
    'Current',
    'Noise Level',
    'Cycle Time'
];
const OPERATORS = ['>', '<', '==', '>=', '<='];
const TARGETS = ['All Machines', 'Specific Devices', 'Device Type'];
const CHANNELS = ['Email', 'In-app', 'SMS', 'WhatsApp', 'Telegram', 'Webhook'];
const DEVICES = ['D1-Compressor', 'D2-Compressor', 'D3-Boiler', 'D4-Boiler', 'Pump-01', 'Chiller-05'];

const UNIT_MAP = {
    'Temperature': '°C',
    'Pressure': 'psi',
    'Efficiency': '%',
    'Vibration': 'mm/s',
    'Power': 'kW',
    'Humidity': '%',
    'Flow Rate': 'L/min',
    'Voltage': 'V',
    'Current': 'A',
    'Noise Level': 'dB',
    'Cycle Time': 's'
};

const RuleModal = ({ isOpen, onClose, onSave, editingRule }) => {
    const { addNotification } = useNotification();
    const [name, setName] = useState('');
    const [target, setTarget] = useState('Specific Devices');
    const [selectedDevice, setSelectedDevice] = useState('');
    const [selectedType, setSelectedType] = useState('Compressors');
    const [conditions, setConditions] = useState([
        { metric: 'Temperature', operator: '>', value: '95', logic: 'AND' }
    ]);
    const [selectedChannels, setSelectedChannels] = useState(['Email', 'In-app']);
    const [availableDevices, setAvailableDevices] = useState([]);

    useEffect(() => {
        // Fetch available devices when modal opens
        const fetchDevices = async () => {
            try {
                const response = await api.getEquipment();
                const devices = response.data || [];
                console.log('Fetched devices:', devices);
                const deviceIds = devices.map(d => d.fullId || d.id);
                console.log('Device IDs:', deviceIds);
                setAvailableDevices(deviceIds);
                if (deviceIds.length > 0 && !selectedDevice) {
                    setSelectedDevice(deviceIds[0]);
                }
            } catch (error) {
                console.error('Failed to fetch devices:', error);
                // Fallback to default devices
                const fallbackDevices = ['COMPRESSOR-001', 'COMPRESSOR-002', 'PUMP-001', 'GENERATOR-001', 'MOTOR-001', 'D6', 'DEVICE-001', 'VAL-001'];
                setAvailableDevices(fallbackDevices);
                setSelectedDevice(fallbackDevices[0]);
            }
        };
        
        if (isOpen) {
            fetchDevices();
        }
    }, [isOpen, selectedDevice]);

    useEffect(() => {
        if (editingRule) {
            setName(editingRule.name || '');
            setTarget(editingRule.target || (editingRule.devices === 'All Machines' ? 'All Machines' : 'Specific Devices'));
            setSelectedDevice(editingRule.selectedDevice || editingRule.device_id || editingRule.devices || (availableDevices[0] || ''));

            if (editingRule.conditions && editingRule.conditions.length > 0) {
                setConditions(editingRule.conditions);
            } else {
                // Fallback for legacy rules
                setConditions([{
                    metric: editingRule.metric || editingRule.parameter_name || 'Temperature',
                    operator: editingRule.operator || editingRule.condition || '>',
                    value: editingRule.value || editingRule.threshold_value || '95',
                    logic: 'AND'
                }]);
            }
            // Attempt to parse channels or use defaults
            setSelectedChannels(['Email', 'In-app']);
        } else {
            setName('');
            setTarget('Specific Devices');
            setSelectedDevice(availableDevices[0] || '');
            setConditions([{ metric: 'Temperature', operator: '>', value: '95', logic: 'AND' }]);
            setSelectedChannels(['Email', 'In-app']);
        }
    }, [editingRule, isOpen, availableDevices]);

    const handleChannelToggle = (channel) => {
        setSelectedChannels(prev =>
            prev.includes(channel)
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
        );
    };

    const addCondition = () => {
        setConditions([...conditions, { metric: 'Pressure', operator: '>', value: '100', logic: 'AND' }]);
    };

    const removeCondition = (index) => {
        if (conditions.length <= 1) return;
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index, updates) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        setConditions(newConditions);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('Please enter a rule name');
            return;
        }

        // Generate device_id based on target selection
        let device_id = null;
        if (target === 'Specific Devices') {
            device_id = selectedDevice;
        } else if (target === 'Device Type') {
            device_id = null; // Will be handled differently
        } else {
            device_id = null; // All Machines
        }

        // Generate a readable condition string
        const conditionString = conditions.map((c, i) =>
            `${i > 0 ? c.logic + ' ' : ''}${c.metric} ${c.operator} ${c.value}${UNIT_MAP[c.metric] || ''}`
        ).join(' ');

        const firstMetric = conditions[0].metric;
        const firstOperator = conditions[0].operator;
        const firstValue = conditions[0].value;

        const ruleData = {
            name,
            devices: target === 'Specific Devices'
                ? selectedDevice
                : (target === 'Device Type' ? selectedType : 'All Machines'),
            device_id: device_id, // Explicitly include device_id for API
            selectedDevice: selectedDevice,
            selectedType: selectedType,
            target, // Keep raw target for easier filtering logic
            condition: conditionString,
            metric: firstMetric,
            operator: firstOperator,
            value: firstValue,
            parameter_name: firstMetric,
            threshold_value: parseFloat(firstValue),
            status: editingRule ? editingRule.status : 'Active',
            type: firstMetric === 'Temperature' || firstMetric === 'Pressure' ? 'danger' : 'warning',
            icon: firstMetric === 'Temperature' ? 'Flame' : firstMetric === 'Pressure' ? 'Droplet' : 'Zap',
            conditions, // Store raw conditions for editing
            severity: firstMetric === 'Temperature' || firstMetric === 'Pressure' ? 'critical' : 'warning',
            selectedChannels: selectedChannels // Pass selected channels for API
        };

        try {
            // Always call onSave instead of directly calling api.createRule
            // This allows the parent component to handle the save logic
            onSave(ruleData);
            addNotification(
                editingRule ? 'Rule Updated' : 'Rule Created',
                `Automation rule "${name}" has been successfully ${editingRule ? 'updated' : 'created'}.`,
                'success'
            );
        } catch (error) {
            console.error('Error saving rule:', error);
            addNotification(
                'Error',
                `Failed to save rule: ${error.message}`,
                'error'
            );
        }
    };
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="rule-modal-overlay">
                    <motion.div
                        className="rule-modal-container"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <header className="rule-modal-header">
                            <h2>{editingRule ? 'Edit Rule' : 'Create New Rule'}</h2>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <div className="rule-modal-content">
                            {/* General Configuration */}
                            <section className="modal-section">
                                <span className="section-label">GENERAL CONFIGURATION</span>
                                <div className="form-group">
                                    <label>Rule Name</label>
                                    <input
                                        type="text"
                                        placeholder="High Temperature Alert"
                                        className="rule-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="target-selector">
                                    {TARGETS.map(t => (
                                        <motion.div
                                            key={t}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`target-option ${target === t ? 'active' : ''}`}
                                            onClick={() => setTarget(t)}
                                        >
                                            <div className="radio-circle">
                                                {target === t && <div className="radio-inner"></div>}
                                            </div>
                                            <span>{t}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {target === 'Specific Devices' && (
                                    <motion.div
                                        className="form-group device-selection-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{ marginTop: '1.5rem', overflow: 'hidden' }}
                                    >
                                        <label>Select Target Device</label>
                                        <div className="select-wrapper">
                                            <select
                                                className="rule-input-select"
                                                value={selectedDevice}
                                                onChange={(e) => setSelectedDevice(e.target.value)}
                                            >
                                                {availableDevices.length > 0 ? (
                                                    availableDevices.map(d => <option key={d} value={d}>{d}</option>)
                                                ) : (
                                                    <option value="">No devices available</option>
                                                )}
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                                {target === 'Device Type' && (
                                    <motion.div
                                        className="form-group device-selection-box"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{ marginTop: '1.5rem', overflow: 'hidden' }}
                                    >
                                        <label>Select Device Category</label>
                                        <div className="select-wrapper">
                                            <select
                                                className="rule-input-select"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                            >
                                                <option value="Compressors">Compressors</option>
                                                <option value="Boilers">Boilers</option>
                                                <option value="Pumps">Pumps</option>
                                                <option value="Generators">Generators</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                            </section>

                            {/* Logic Condition */}
                            <section className="modal-section">
                                <span className="section-label">LOGIC CONDITION PROTOCOLS</span>

                                {conditions.map((cond, idx) => (
                                    <div key={idx} className="condition-row-wrapper">
                                        {idx > 0 && (
                                            <div className="logic-connector-row">
                                                <div className="connector-line"></div>
                                                <div className="logic-toggle-btns">
                                                    <button
                                                        className={`logic-btn ${cond.logic === 'AND' ? 'active' : ''}`}
                                                        onClick={() => updateCondition(idx, { logic: 'AND' })}
                                                    >AND</button>
                                                    <button
                                                        className={`logic-btn ${cond.logic === 'OR' ? 'active' : ''}`}
                                                        onClick={() => updateCondition(idx, { logic: 'OR' })}
                                                    >OR</button>
                                                </div>
                                                <div className="connector-line"></div>
                                            </div>
                                        )}

                                        <div className="logic-row">
                                            <div className="select-wrapper">
                                                <select
                                                    className="rule-input-select"
                                                    value={cond.metric}
                                                    onChange={(e) => updateCondition(idx, { metric: e.target.value })}
                                                >
                                                    {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div className="select-wrapper operator">
                                                <select
                                                    className="rule-input-select"
                                                    value={cond.operator}
                                                    onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                                                >
                                                    {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div className="value-input-group">
                                                <input
                                                    type="text"
                                                    className="rule-input value-field"
                                                    value={cond.value}
                                                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                                />
                                                <span className="unit">
                                                    {UNIT_MAP[cond.metric] || ''}
                                                </span>
                                            </div>

                                            {conditions.length > 1 && (
                                                <button
                                                    className="remove-cond-btn"
                                                    onClick={() => removeCondition(idx)}
                                                    title="Remove Condition"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    className="add-condition-btn"
                                    onClick={addCondition}
                                >
                                    + Add Another Condition (AND/OR)
                                </button>
                            </section>

                            {/* Notification Channels */}
                            <section className="modal-section">
                                <span className="section-label">NOTIFICATION CHANNELS</span>
                                <div className="channels-grid">
                                    {CHANNELS.map((label) => (
                                        <motion.label
                                            key={label}
                                            className="checkbox-item"
                                            whileHover={{ x: 4 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedChannels.includes(label)}
                                                onChange={() => handleChannelToggle(label)}
                                            />
                                            <span className="checkmark"></span>
                                            <span className="label-text">{label}</span>
                                        </motion.label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <footer className="rule-modal-footer">
                            <button className="modal-btn outline" onClick={onClose}>CANCEL</button>
                            <div className="footer-actions">
                                <button className="modal-btn outline secondary">SAVE AS TEMPLATE</button>
                                <button
                                    className="modal-btn btn-neon"
                                    onClick={handleSubmit}
                                >
                                    {editingRule ? 'UPDATE RULE' : 'ACTIVATE RULE'}
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RuleModal;
