import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Layers, Plus, CheckCircle2, AlertTriangle, Flame, ShieldAlert, Cpu, Loader2, AlertCircle } from 'lucide-react';
import DeviceCard from '../components/Dashboard/DeviceCard';
import { mockDevices } from '../data/mockDevices';
import './Devices.css';

const HealthMetric = ({ label, value, percent, color, icon: Icon }) => (
    <div className={`health-stat-card ${color || ''}`}>
        <div className="stat-icon-orb">
            <Icon size={20} />
        </div>
        <span className="h-stat-label">{label}</span>
        <span className="h-stat-value text-gradient">{value}</span>
        {percent !== undefined && (
            <div className="h-stat-footer">
                <div className="h-stat-percent-row">
                    <span className="h-stat-percent">{percent}%</span>
                </div>
                <div className="h-stat-progress">
                    <div className={`h-stat-bar ${color}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        )}
    </div>
);

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setDevices(mockDevices);
        setLoading(false);
    }, []);

    const stats = {
        total: devices.length,
        healthy: devices.filter(d => d.status === 'Running').length,
        warning: devices.filter(d => d.status === 'Warning').length,
        critical: devices.filter(d => d.status === 'Critical').length,
        offline: devices.filter(d => d.status === 'Offline').length
    };

    const healthStats = [
        { label: 'ALL DEVICES', value: stats.total, icon: Cpu, color: 'blue' },
        { label: 'HEALTHY', value: stats.healthy, percent: stats.total ? Math.round((stats.healthy / stats.total) * 100) : 0, color: 'success', icon: CheckCircle2 },
        { label: 'WARNING', value: stats.warning, percent: stats.total ? Math.round((stats.warning / stats.total) * 100) : 0, color: 'warning', icon: AlertTriangle },
        { label: 'CRITICAL', value: stats.critical, percent: stats.total ? Math.round((stats.critical / stats.total) * 100) : 0, color: 'error', icon: Flame },
        { label: 'OFFLINE', value: stats.offline, percent: stats.total ? Math.round((stats.offline / stats.total) * 100) : 0, color: 'neutral', icon: ShieldAlert },
    ];

    if (loading) {
        return (
            <div className="devices-loading">
                <Loader2 className="animate-spin text-secondary" size={48} />
                <p>Scanning factory fleet...</p>
            </div>
        );
    }

    return (
        <div className="devices-container">
            {error && (
                <div className="devices-error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Premium Header & Toolbar */}
            <div className="devices-toolbar-premium">
                <div className="devices-actions-row">
                    <div className="search-box-premium">
                        <Search size={18} />
                        <input type="text" placeholder="Filter equipment..." />
                    </div>
                    <div className="toolbar-hub-btns">
                        <button className="control-icon-btn" title="Filter List">
                            <Filter size={20} />
                        </button>
                        <button className="control-icon-btn" title="Bulk Operations">
                            <Layers size={20} />
                        </button>
                        <button className="btn-neon">
                            <Plus size={20} />
                            Add Device
                        </button>
                    </div>
                </div>
            </div>

            {/* Health Panel */}
            <div className="health-overview-panel">
                <div className="panel-sublabel">HEALTH STATUS OVERVIEW</div>
                <div className="health-stats-grid">
                    {healthStats.map((stat, i) => (
                        <HealthMetric key={i} {...stat} />
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="enterprise-devices-grid">
                {devices.map((d, i) => (
                    <DeviceCard key={d.id} {...d} delay={i * 0.1} />
                ))}
            </div>
        </div >
    );
};

export default Devices;
