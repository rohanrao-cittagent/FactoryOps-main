import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import MetricCard from '../components/Dashboard/MetricCard';
import DeviceCard from '../components/Dashboard/DeviceCard';
import DeviceCardSkeleton from '../components/Dashboard/DeviceCardSkeleton';
import api from '../api/client';
import './Dashboard.css';

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [telemetryLoading, setTelemetryLoading] = useState({});

     useEffect(() => {
         const fetchData = async () => {
             try {
                 setLoading(true);
                 
                 // Fetch dashboard summary
                 const summaryData = await api.getDashboardSummary();
                 setSummary(summaryData.summary);
                 
                 // Fetch devices - show them immediately without waiting for telemetry
                 const devicesData = await api.getEquipment();
                 const baseDevices = devicesData.data || [];
                 
                 console.log('=== DASHBOARD DEBUG ===');
                 console.log('Fetched devices count:', baseDevices.length);
                 if (baseDevices.length > 0) {
                     console.log('First device:', JSON.stringify(baseDevices[0], null, 2));
                 }
                 
                 // Set devices immediately with placeholder telemetry values
                 setDevices(baseDevices);
                 setError(null);
                 setLoading(false);
                 
                 // Fetch telemetry for each device AFTER showing devices
                 // This allows incremental loading instead of waiting for all requests
                 console.log('Starting incremental telemetry fetch...');
                 
                 baseDevices.forEach(async (device) => {
                     const deviceId = device.id || device.fullId;
                     setTelemetryLoading(prev => ({ ...prev, [deviceId]: true }));
                     
                     try {
                         console.log(`\nFetching telemetry for: ${deviceId}`);
                         const startTime = performance.now();
                         
                         // Add timeout: if fetch takes more than 5 seconds, skip it
                         const telemetryPromise = api.getTelemetry(deviceId);
                         const timeoutPromise = new Promise((_, reject) =>
                             setTimeout(() => reject(new Error('Telemetry request timeout')), 5000)
                         );
                         
                         const telemetryData = await Promise.race([telemetryPromise, timeoutPromise]);
                         const endTime = performance.now();
                         console.log(`  Request took ${(endTime - startTime).toFixed(0)}ms`);
                         console.log(`  Response:`, telemetryData);
                         
                         const latestTelemetry = telemetryData.data?.[0];
                         console.log(`  Latest telemetry:`, latestTelemetry);
                         
                         if (!latestTelemetry) {
                             console.warn(`  ⚠️  No telemetry data available for ${deviceId}`);
                             if (device.runtime_status === 'running') {
                                 console.warn(`    Device is RUNNING but no telemetry data!`);
                             }
                         } else {
                             // Update the device with telemetry data
                             setDevices(prevDevices =>
                                 prevDevices.map(d => {
                                     if ((d.id || d.fullId) === deviceId) {
                                         const enrichedDevice = {
                                             ...d,
                                             efficiency: latestTelemetry?.efficiency_pct 
                                                 ? parseFloat(latestTelemetry.efficiency_pct).toFixed(1)
                                                 : '--',
                                             power: latestTelemetry?.power_consumption 
                                                 ? parseFloat(latestTelemetry.power_consumption / 1000).toFixed(2)
                                                 : '--',
                                             temp: latestTelemetry?.temperature
                                                 ? parseFloat(latestTelemetry.temperature).toFixed(1)
                                                 : null,
                                             voltage: latestTelemetry?.voltage
                                                 ? parseFloat(latestTelemetry.voltage).toFixed(2)
                                                 : null
                                         };
                                         console.log(`  ✓ Enriched:`, enrichedDevice);
                                         return enrichedDevice;
                                     }
                                     return d;
                                 })
                             );
                         }
                     } catch (err) {
                         console.error(`❌ ERROR fetching telemetry for ${deviceId}:`, err.message);
                         console.error(`  Code: ${err.code}`);
                         console.error(`  Stack:`, err.stack);
                         // Device will keep placeholder values
                     } finally {
                         setTelemetryLoading(prev => ({ ...prev, [deviceId]: false }));
                     }
                 });
                 
             } catch (err) {
                 console.error('ERROR: Error fetching dashboard data:', err);
                 setError('Failed to connect to backend services');
                 setLoading(false);
             }
         };

         fetchData();
         
         // Refresh every 30 seconds
         const interval = setInterval(fetchData, 30000);
         return () => clearInterval(interval);
     }, []);

    const metrics = [
        { 
            title: 'Total Devices', 
            value: devices.length.toString(), 
            trend: 'Active' 
        },
        { 
            title: 'Running', 
            value: devices.filter(d => d.runtime_status === 'running').length.toString(), 
            trend: 'Online' 
        },
        { 
            title: 'System Health', 
            value: `${calculateSystemHealth()}%`, 
            trend: calculateSystemHealth() > 70 ? 'Healthy' : 'Needs Attention' 
        },
        { 
            title: 'Avg Efficiency', 
            value: `${calculateAvgEfficiency()}%`, 
            trend: 'Real-time' 
        },
    ];

    // Calculate System Health based on device metrics
    // Formula: (avg temperature health + power stability + device uptime) / 3
    function calculateSystemHealth() {
        if (devices.length === 0) return 0;

        const healthScores = devices.map(device => {
            let score = 85; // Base score
            
            // Temperature health (lower is better, normal range 40-60°C)
            if (device.temp) {
                const temp = parseFloat(device.temp);
                if (temp < 40 || temp > 70) score -= 15;
                else if (temp > 60) score -= 5;
            }
            
            // Power consumption stability (no spikes)
            if (device.power && device.power !== '--') {
                const power = parseFloat(device.power);
                // Normal range: 200-300kW, penalize if outside
                if (power < 200 || power > 350) score -= 10;
            }
            
            // Device status (running = 100, stopped = 50)
            if (device.runtime_status === 'running') score += 10;
            else if (device.runtime_status === 'stopped') score -= 20;
            
            return Math.max(0, Math.min(100, score));
        });

        const avgHealth = healthScores.reduce((a, b) => a + b, 0) / devices.length;
        return Math.round(avgHealth);
    }

    // Calculate Average Efficiency based on device efficiency metrics
    // Formula: average of all device efficiency percentages
    function calculateAvgEfficiency() {
        if (devices.length === 0) return 0;

        const efficiencies = devices
            .map(device => {
                if (device.efficiency && device.efficiency !== '--') {
                    return parseFloat(device.efficiency);
                }
                return null;
            })
            .filter(e => e !== null);

        if (efficiencies.length === 0) {
            // If no efficiency data, calculate from power and temperature
            const estimatedEfficiencies = devices.map(device => {
                let efficiency = 85; // Base efficiency
                
                if (device.temp) {
                    const temp = parseFloat(device.temp);
                    // Temperature impact: optimal at 50°C
                    const tempDiff = Math.abs(temp - 50);
                    efficiency -= Math.min(15, tempDiff * 0.5);
                }
                
                if (device.power && device.power !== '--') {
                    const power = parseFloat(device.power);
                    // Power consumption impact
                    if (power > 300) efficiency -= 5;
                    if (power < 200) efficiency += 5;
                }
                
                return Math.max(60, Math.min(100, efficiency));
            });
            
            const avgEff = estimatedEfficiencies.reduce((a, b) => a + b, 0) / estimatedEfficiencies.length;
            return Math.round(avgEff * 100) / 100;
        }

        const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
        return Math.round(avgEfficiency * 100) / 100;
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Loader2 className="animate-spin text-secondary" size={48} />
                <p>Connecting to factory systems...</p>
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
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Equipment Status</h2>
                        <button className="view-all-link">View All Equipment <ChevronRight size={16} /></button>
                    </div>
                     <div className="dashboard-devices-grid">
                         {devices.length > 0 ? (
                             devices.map((d, i) => {
                                 const deviceId = d.id || d.fullId;
                                 const isLoading = telemetryLoading[deviceId];
                                 return isLoading ? (
                                     <DeviceCardSkeleton key={`skeleton-${deviceId}`} delay={0.5 + i * 0.1} />
                                 ) : (
                                     <DeviceCard key={d.id} {...d} delay={0.5 + i * 0.1} />
                                 );
                             })
                         ) : (
                             <div className="no-devices-message">
                                <p>No devices found. Onboard a device to see it here.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="insights-column-enterprise">
                    <div className="section-header-enterprise">
                        <ShieldCheck size={20} style={{ color: 'var(--accent-success)' }} />
                        <h2>System Insights</h2>
                    </div>
                    {summary?.devices_with_uptime_configured > 0 ? (
                        <div className="insight-card-enterprise">
                            <Activity size={20} className="text-success" />
                            <div className="insight-text">
                                <h4>System Online</h4>
                                <p>{summary.devices_with_uptime_configured} devices configured with uptime tracking.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="insight-card-enterprise">
                            <AlertCircle size={20} className="text-warning" />
                            <div className="insight-text">
                                <h4>Setup Required</h4>
                                <p>Configure devices with health and uptime settings for monitoring.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
