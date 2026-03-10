import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import './DeviceModal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ShiftModal = ({ isOpen, onClose, onSave, deviceId }) => {
    const [shiftName, setShiftName] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakMinutes, setBreakMinutes] = useState(0);
    const [dayOfWeek, setDayOfWeek] = useState(null); // null means "All Days"
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!shiftName) {
            alert('Please enter a shift name');
            return;
        }

        onSave({
            device_id: deviceId,
            shift_name: shiftName,
            shift_start: startTime,
            shift_end: endTime,
            maintenance_break_minutes: parseInt(breakMinutes),
            day_of_week: dayOfWeek === 'all' ? null : parseInt(dayOfWeek),
            is_active: isActive
        });

        onClose();
        // Reset form
        setShiftName('');
        setStartTime('09:00');
        setEndTime('17:00');
        setBreakMinutes(0);
        setDayOfWeek(null);
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
                                <Clock size={20} className="text-accent" />
                                <h2>Add Shift Configuration</h2>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Shift Name</label>
                                <input
                                    type="text"
                                    value={shiftName}
                                    onChange={(e) => setShiftName(e.target.value)}
                                    placeholder="e.g., Morning Shift"
                                    className="modal-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="modal-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="modal-input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Maintenance Break (min)</label>
                                    <input
                                        type="number"
                                        value={breakMinutes}
                                        onChange={(e) => setBreakMinutes(e.target.value)}
                                        className="modal-input"
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Day of Week</label>
                                    <select
                                        value={dayOfWeek === null ? 'all' : dayOfWeek}
                                        onChange={(e) => setDayOfWeek(e.target.value)}
                                        className="modal-input"
                                    >
                                        <option value="all">All Days</option>
                                        {DAYS.map((day, idx) => (
                                            <option key={idx} value={idx}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-checkbox">
                                <input
                                    type="checkbox"
                                    id="shift-active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="shift-active">Active</label>
                            </div>

                            <footer className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Shift</button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShiftModal;
