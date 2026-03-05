import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import MetricCard from '../components/Dashboard/MetricCard';
import DeviceCard from '../components/Dashboard/DeviceCard';
import { api } from '../api/client';
import './Dashboard.css';

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const avgHealth = devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + (Number(d.health) || 0), 0) / devices.length) : 0;
    const avgEfficiency = devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + (Number(d.efficiency) || 0), 0) / devices.length) : 0;

    const metrics = [
        { title: 'Total Devices', value: devices.length.toString(), trend: '+3 this month' },
        { title: 'Active Alerts', value: devices.filter(d => d.status === 'Warning' || d.status === 'critical').length.toString(), trend: 'Recent' },
        { title: 'System Health', value: `${avgHealth}%`, trend: avgHealth > 80 ? 'Healthy' : 'Needs Attention' },
        { title: 'Avg Efficiency', value: `${avgEfficiency}%`, trend: 'Real-time Updates' },
    ];

    useEffect(() => {
        let isMounted = true;
        const fetchDashboardData = async () => {
            try {
                const response = await api.getEquipment();
                if (isMounted) {
                    setDevices(response.data || []);
                    setError(null);
                }
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
                if (isMounted) setError("Partial connection failure. Syncing...");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Loader2 className="animate-spin text-secondary" size={48} />
                <p>Establishing factory connection...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="metrics-grid">
                {metrics.map((m, i) => (
                    <MetricCard key={i} {...m} delay={i * 0.1} />
                ))}
            </div>

            {error && (
                <div className="dashboard-error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="dashboard-main-row">
                <div className="devices-overview-column">
                    <div className="section-header-enterprise" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Critical Equipment Status</h2>
                        <button className="view-all-link">View All Equipment <ChevronRight size={16} /></button>
                    </div>
                    <div className="dashboard-devices-grid">
                        {devices.map((d, i) => (
                            <DeviceCard key={d.id} {...d} delay={0.5 + i * 0.1} />
                        ))}
                    </div>
                </div>

                <div className="insights-column-enterprise">
                    <div className="section-header-enterprise">
                        <ShieldCheck size={20} style={{ color: 'var(--accent-success)' }} />
                        <h2>Optimization Insights</h2>
                    </div>
                    <div className="insight-card-enterprise">
                        <AlertCircle size={20} className="text-warning" />
                        <div className="insight-text">
                            <h4>Scheduled Maintenance</h4>
                            <p>Boiler-03 reaches its 1000h service limit in 48h. Schedule downtime to avoid failure.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
