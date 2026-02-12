import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cpu, Activity, Gauge, Thermometer, ChevronRight, Binary } from 'lucide-react';
import './DeviceCard.css';

const DeviceCard = ({ id, id_label, name, health = 0, efficiency = '--', power = '--', vibration, temp, status, delay = 0 }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="enterprise-device-card"
        >
            <div className="ecard-header-clean">
                <div className="ecard-id-stack">
                    <span className="ecard-id-main">{id}</span>
                    <span className="ecard-id-sep">|</span>
                    <span className="ecard-name-sub">{name}</span>
                </div>
                <div className={`status-tag-minimal ${status.toLowerCase()}`}>
                    <span>{status.toUpperCase()}</span>
                </div>
            </div>

            <div className="ecard-body-minimal">
                <div className="ecard-health-section">
                    <div className="health-label-row">
                        <span className="label">HEALTH</span>
                        <span className={`val ${health >= 70 ? 'success' : health >= 40 ? 'warning' : 'critical'}`}>{health}%</span>
                    </div>
                    <div className="health-bar-bg">
                        <div className={`health-bar-fill ${health >= 70 ? 'success' : health >= 40 ? 'warning' : 'critical'}`} style={{ width: `${health}%` }}></div>
                    </div>
                </div>

                <div className="ecard-stats-grid-minimal">
                    <div className="stat-box">
                        <span className="s-label">EFFICIENCY</span>
                        <span className="s-val">{efficiency}%</span>
                    </div>
                    <div className="stat-box">
                        <span className="s-label">POWER</span>
                        <span className="s-val">{power}kW</span>
                    </div>
                </div>
                {temp && (
                    <div className="ecard-stats-grid-minimal" style={{ marginTop: '0.75rem' }}>
                        <div className="stat-box">
                            <span className="s-label">TEMP</span>
                            <span className="s-val">{temp}°C</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="ecard-action-footer">
                <button
                    className="btn-action-minimal"
                    onClick={() => navigate(`/devices/${id}`)}
                >
                    View Details
                    <ChevronRight size={16} />
                </button>
            </div>
        </motion.div>
    );
};


export default DeviceCard;
