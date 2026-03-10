import React from 'react';
import { motion } from 'framer-motion';
import './DeviceCard.css';

const DeviceCardSkeleton = ({ delay = 0 }) => {
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
                    <div className="skeleton-line" style={{ width: '80px', height: '18px' }}></div>
                    <span className="ecard-id-sep">|</span>
                    <div className="skeleton-line" style={{ width: '100px', height: '14px' }}></div>
                </div>
                <div className="skeleton-line" style={{ width: '60px', height: '20px', borderRadius: '4px' }}></div>
            </div>

            <div className="ecard-body-minimal">
                <div className="ecard-health-section">
                    <div className="health-label-row">
                        <span className="label">HEALTH</span>
                        <div className="skeleton-line" style={{ width: '40px', height: '18px' }}></div>
                    </div>
                    <div className="health-bar-bg">
                        <div className="skeleton-line" style={{ width: '60%', height: '8px' }}></div>
                    </div>
                </div>

                <div className="ecard-stats-grid-minimal">
                    <div className="stat-box">
                        <span className="s-label">EFFICIENCY</span>
                        <div className="skeleton-line" style={{ width: '70px', height: '18px' }}></div>
                    </div>
                    <div className="stat-box">
                        <span className="s-label">POWER</span>
                        <div className="skeleton-line" style={{ width: '70px', height: '18px' }}></div>
                    </div>
                </div>
                <div className="ecard-stats-grid-minimal" style={{ marginTop: '0.75rem' }}>
                    <div className="stat-box">
                        <span className="s-label">TEMP</span>
                        <div className="skeleton-line" style={{ width: '60px', height: '18px' }}></div>
                    </div>
                    <div className="stat-box">
                        <span className="s-label">VOLTAGE</span>
                        <div className="skeleton-line" style={{ width: '60px', height: '18px' }}></div>
                    </div>
                </div>
            </div>

            <div className="ecard-action-footer">
                <div className="skeleton-line" style={{ width: '120px', height: '36px', borderRadius: '4px' }}></div>
            </div>
        </motion.div>
    );
};

export default DeviceCardSkeleton;
