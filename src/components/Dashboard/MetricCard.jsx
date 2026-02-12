import React from 'react';
import { motion } from 'framer-motion';
import './MetricCard.css';

const MetricCard = ({ title, value, trend, subtext, color = 'blue', delay = 0 }) => {
    const isCritical = trend?.toLowerCase().includes('critical') || subtext?.toLowerCase().includes('critical');
    const isWarning = trend?.toLowerCase().includes('warning') || subtext?.toLowerCase().includes('warning');
    const isHealthy = trend?.toLowerCase().includes('healthy') || subtext?.toLowerCase().includes('healthy');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="enterprise-metric-card"
        >
            <div className="metric-header">
                <h3>{title}</h3>
            </div>
            <div className="metric-value-row">
                <h2>{value}</h2>
                {trend && (
                    <span className={`metric-trend-pill ${isCritical ? 'negative' : isHealthy ? 'positive' : 'neutral'}`}>
                        {trend}
                    </span>
                )}
            </div>
            {subtext && <p className={`metric-subtext ${isCritical ? 'critical' : isWarning ? 'warning' : isHealthy ? 'healthy' : 'default'}`}>{subtext}</p>}
        </motion.div>
    );
};

export default MetricCard;
