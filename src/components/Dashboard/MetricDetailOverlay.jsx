import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import './MetricDetailOverlay.css';

const MetricDetailOverlay = ({ isOpen, onClose, metric, deviceName, history }) => {
    if (!metric) return null;

    const isTemperature = (metric.title || '').toLowerCase().includes('temperature');

    const titleToKey = {
        'Pressure (PSI)': 'pressure',
        'Temperature (°C)': 'temperature',
        'Vibration (MM/S)': 'vibration',
        'Power & Motor Load': 'power',
        'Energy Consumption': 'energy'
    };
    const dataKey = titleToKey[metric.title] || 'efficiency';
    const trendData = (history || []).map(entry => ({
        time: entry.timestamp,
        value: entry[dataKey]
    }));

    const primaryValue = metric.value || 0;
    const isCelsius = (metric.unit || '°C').includes('°C');
    const convValue = isCelsius
        ? (primaryValue * 1.8 + 32).toFixed(1)
        : ((primaryValue - 32) / 1.8).toFixed(1);

    const getConfig = () => {
        const title = (metric.title || '').toLowerCase();
        if (title.includes('pressure')) return { primary: 'DISCHARGE PRESSURE', secondary: 'INTERSTAGE', unit: 'PSI', conv: 'bar', color: '#6366f1', rangeMax: 150 };
        if (title.includes('temperature')) return { primary: 'STAGE 2 DISCHARGE (T3)', secondary: 'AMBIENT', unit: '°C', conv: '°F', color: '#f97316', rangeMax: 100 };
        if (title.includes('vibration')) return { primary: 'AXIAL VIBRATION', secondary: 'RADIAL', unit: 'mm/s', conv: 'in/s', color: '#10b981', rangeMax: 5 };
        if (title.includes('power')) return { primary: 'MOTOR LOAD', secondary: 'BUFFER', unit: 'kW', conv: 'kVA', color: '#a855f7', rangeMax: 20 };
        if (title.includes('oil')) return { primary: 'OIL QUALITY INDEX', secondary: 'VISCOSITY', unit: 'LPI', conv: '', color: '#f59e0b', rangeMax: 2 };
        if (title.includes('energy')) return { primary: 'ENERGY DRAW', secondary: 'PEAK', unit: 'kWh', conv: '', color: '#06b6d4', rangeMax: 800 };
        if (title.includes('health')) return { primary: 'HEALTH SCORE', secondary: 'BASELINE', unit: '%', conv: '', color: '#4ade80', rangeMax: 100 };
        if (title.includes('uptime')) return { primary: 'SYSTEM UPTIME', secondary: 'TARGET', unit: '%', conv: '', color: '#38bdf8', rangeMax: 100 };
        return { primary: 'PRIMARY', secondary: 'SECONDARY', unit: metric.unit || '', conv: '', color: '#3b82f6', rangeMax: 200 };
    };
    const cfg = getConfig();

    /* ── Temperature Console ── */
    const renderTemperatureConsole = () => {
        const t1 = 142, t2 = 48, deltaT = t1 - t2;
        return (
            <div className="mo-temp">
                <div className="mo-hdr">
                    <div className="mo-hdr-left">
                        <div className="mo-live-dot" style={{ background: '#f97316', boxShadow: '0 0 10px rgba(249,115,22,0.7)' }} />
                        <span className="mo-hdr-title">TEMPERATURE</span>
                        <span className="mo-hdr-sep">—</span>
                        <span className="mo-hdr-sub">{deviceName}</span>
                    </div>
                    <div className="mo-hdr-right">
                        <span className="mo-unit-badge" style={{ color: 'rgba(251,146,60,0.9)', background: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.25)' }}>°C | °F</span>
                        <button className="mo-close" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="mo-hero" style={{ background: 'linear-gradient(180deg,rgba(249,115,22,0.07) 0%,transparent 100%)' }}>
                    <span className="mo-hero-label">PRIMARY — Stage 2 Discharge (T3)</span>
                    <div className="mo-hero-row">
                        <div className="mo-hero-dot" style={{ background: '#f97316', boxShadow: '0 0 0 3px rgba(249,115,22,0.2),0 0 16px rgba(249,115,22,0.5)' }} />
                        <span className="mo-hero-val" style={{ background: 'linear-gradient(135deg,#fff 30%,#fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {primaryValue}°C
                        </span>
                        <span className="mo-hero-conv">({convValue}°F)</span>
                    </div>

                    <div className="mo-zone-wrap">
                        <div className="mo-zone-bar">
                            <div className="mo-zone normal" />
                            <div className="mo-zone warn" />
                            <div className="mo-zone critical" />
                            <motion.div className="mo-zone-cursor"
                                initial={{ left: 0 }}
                                animate={{ left: `${Math.min((primaryValue / 100) * 100, 99)}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <div className="mo-zone-labels">
                            <span>0°C</span><span>40°C</span><span>75°C</span><span>90°C</span>
                        </div>
                        <div className="mo-zone-names">
                            <span className="zn-normal">Normal</span>
                            <span className="zn-warn">Warning</span>
                            <span className="zn-critical">Critical</span>
                        </div>
                    </div>

                    <div className="mo-meta">
                        <div className="mo-meta-item"><span className="mo-meta-lbl">Rate of Rise</span><span className="mo-meta-val">+0.3°C/min</span></div>
                        <div className="mo-meta-item"><div className="mo-stable-dot" /><span className="mo-meta-val">Stable</span></div>
                    </div>
                </div>

                <div className="mo-grid2">
                    <div className="mo-card">
                        <span className="mo-card-title">LIVE PARAMETERS</span>
                        <div className="mo-sensor-list">
                            {[
                                ['Discharge Temp', `${primaryValue}°C`],
                                ['Ambient Temp', '34°C'], // Simplified
                                ['System Status', 'Nominal']
                            ].map(([label, val]) => (
                                <div className="mo-sensor-row" key={label}>
                                    <span className="mo-sensor-lbl">{label}</span>
                                    <div className="mo-sensor-right"><span className="mo-sensor-val">{val}</span><div className="mo-dot-green" /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mo-card">
                        <span className="mo-card-title">INTERCOOLER HEALTH</span>
                        <div className="mo-intercooler">
                            <div className="mo-calc-box">
                                <span className="mo-calc-label">ΔT = T1 − T2</span>
                                <span className="mo-calc-val">142 − 48 = {deltaT}°C</span>
                                <div className="mo-health-row"><div className="mo-dot-green" /><span className="mo-health-txt">Excellent — fins clean</span></div>
                            </div>
                            <div className="mo-ambient">
                                <span className="mo-ambient-lbl">Ambient Correction: +9°C</span>
                                <div className="mo-corrected"><span>Corrected T3: 49°C</span><div className="mo-dot-green" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mo-trend">
                    <span className="mo-card-title">TREND — T3 Stage 2 Discharge (last 60 min)</span>
                    <div className="mo-chart-box">
                        <div className="mo-y-axis"><span>90°</span><span>75°</span><span>60°</span><span>40°</span></div>
                        <div className="mo-chart-area">
                            <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#tGrad)" dot={false} activeDot={{ r: 5, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', fontSize: '0.75rem' }} itemStyle={{ color: '#f97316' }} formatter={v => [`${v}°C`, 'Temp']} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mo-chart-footer"><span>60 min ago</span><span>Now</span></div>
                </div>

                <div className="mo-footer">
                    <div className="mo-footer-notice">🔧 Next intercooler cleaning: In 12 days</div>
                    <div className="mo-footer-status">
                        <span>Last alert: None today</span>
                        <span className="mo-sep">|</span>
                        <span>All sensors: Online <span className="mo-check">✓</span></span>
                    </div>
                </div>
            </div>
        );
    };

    /* ── Default Console — same layout as temp, metric-color accented ── */
    const renderDefaultConsole = () => {
        const pct = Math.min((primaryValue / cfg.rangeMax) * 100, 100);

        return (
            <div className="mo-default">
                {/* Header */}
                <div className="mo-hdr">
                    <div className="mo-hdr-left">
                        <div className="mo-live-dot" style={{ background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
                        <span className="mo-hdr-title">{metric.title.toUpperCase()}</span>
                        <span className="mo-hdr-sep">—</span>
                        <span className="mo-hdr-sub">{deviceName}</span>
                    </div>
                    <div className="mo-hdr-right">
                        <span className="mo-unit-badge" style={{ color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}40` }}>
                            {cfg.unit}{cfg.conv ? ` | ${cfg.conv}` : ''}
                        </span>
                        <button className="mo-close" onClick={onClose}>×</button>
                    </div>
                </div>

                {/* Hero value */}
                <div className="mo-hero" style={{ background: `linear-gradient(180deg,${cfg.color}09 0%,transparent 100%)` }}>
                    <span className="mo-hero-label">PRIMARY — {cfg.primary}</span>
                    <div className="mo-hero-row">
                        <div className="mo-hero-dot" style={{ background: cfg.color, boxShadow: `0 0 0 3px ${cfg.color}30,0 0 16px ${cfg.color}80` }} />
                        <span className="mo-hero-val" style={{ background: `linear-gradient(135deg,#fff 30%,${cfg.color} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {primaryValue}
                            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}> {cfg.unit}</span>
                        </span>
                        {cfg.conv && <span className="mo-hero-conv">({convValue} {cfg.conv})</span>}
                    </div>

                    {/* Zone bar */}
                    <div className="mo-zone-wrap">
                        <div className="mo-zone-bar">
                            <div className="mo-zone normal" style={{ width: '50%' }} />
                            <div className="mo-zone warn" style={{ width: '30%' }} />
                            <div className="mo-zone critical" style={{ width: '20%' }} />
                            <motion.div className="mo-zone-cursor"
                                initial={{ left: 0 }}
                                animate={{ left: `${Math.min(pct, 98)}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <div className="mo-zone-labels">
                            <span>0</span>
                            <span>{(cfg.rangeMax * 0.5).toFixed(0)}{cfg.unit}</span>
                            <span>{(cfg.rangeMax * 0.8).toFixed(0)}{cfg.unit}</span>
                            <span>{cfg.rangeMax}{cfg.unit}</span>
                        </div>
                        <div className="mo-zone-names">
                            <span className="zn-normal">Normal</span>
                            <span className="zn-warn">Warning</span>
                            <span className="zn-critical">Critical</span>
                        </div>
                    </div>

                    {/* Meta strip */}
                    <div className="mo-meta">
                        <div className="mo-meta-item">
                            <span className="mo-meta-lbl">Current</span>
                            <span className="mo-meta-val">{primaryValue} {cfg.unit}</span>
                        </div>
                        <div className="mo-meta-item">
                            <span className="mo-meta-lbl">Range</span>
                            <span className="mo-meta-val">{metric.min ?? 0} – {metric.max ?? cfg.rangeMax} {cfg.unit}</span>
                        </div>
                        <div className="mo-meta-item">
                            <div className="mo-stable-dot" />
                            <span className="mo-meta-val">Normal</span>
                        </div>
                    </div>
                </div>

                {/* Two glassmorphism cards */}
                <div className="mo-grid2">
                    <div className="mo-card">
                        <span className="mo-card-title">OPERATING PARAMETERS</span>
                        <div className="mo-sensor-list">
                            {[
                                ['Primary', `${primaryValue} ${cfg.unit}`],
                                ['Secondary', `${(primaryValue * 0.4).toFixed(1)} ${cfg.unit}`],
                                ['Cut-in Limit', `${(cfg.rangeMax * 0.7).toFixed(1)} ${cfg.unit}`],
                                ['Shut-down Limit', `${(cfg.rangeMax * 0.9).toFixed(1)} ${cfg.unit}`],
                                ['Optimal Range', String(metric.optimal ?? '—')],
                            ].map(([label, val]) => (
                                <div className="mo-sensor-row" key={label}>
                                    <span className="mo-sensor-lbl">{label}</span>
                                    <div className="mo-sensor-right">
                                        <span className="mo-sensor-val">{val}</span>
                                        <div className="mo-dot-green" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mo-card">
                        <span className="mo-card-title">STATUS &amp; DIAGNOSTICS</span>
                        <div className="mo-intercooler">
                            <div className="mo-calc-box">
                                <span className="mo-calc-label">CURRENT vs OPTIMAL</span>
                                <span className="mo-calc-val" style={{ color: cfg.color }}>{primaryValue} {cfg.unit}</span>
                                <div className="mo-health-row" style={{ color: '#4ade80' }}>
                                    <div className="mo-dot-green" />
                                    <span>Within normal operating range</span>
                                </div>
                            </div>
                            <div className="mo-ambient">
                                <span className="mo-ambient-lbl">Device: {deviceName}</span>
                                <div className="mo-corrected">
                                    <span>State: LOADED</span>
                                    <div className="mo-dot-green" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend chart */}
                <div className="mo-trend">
                    <span className="mo-card-title">HISTORICAL TREND — {cfg.primary} (last 60 min)</span>
                    <div className="mo-chart-box">
                        <div className="mo-y-axis">
                            <span>{cfg.rangeMax}</span>
                            <span>{(cfg.rangeMax * 0.66).toFixed(0)}</span>
                            <span>{(cfg.rangeMax * 0.33).toFixed(0)}</span>
                            <span>0</span>
                        </div>
                        <div className="mo-chart-area">
                            <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={cfg.color} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} fill="url(#dGrad)" dot={false} activeDot={{ r: 5, fill: '#fff', stroke: cfg.color, strokeWidth: 2 }} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={[0, cfg.rangeMax]} />
                                    <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: `1px solid ${cfg.color}44`, borderRadius: '8px', fontSize: '0.75rem' }} itemStyle={{ color: cfg.color }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mo-chart-footer"><span>60 min ago</span><span>Now</span></div>
                </div>

                {/* Footer */}
                <div className="mo-footer">
                    <div className="mo-footer-status">
                        <span>Δ vs last shift: <strong>↓ -0.4</strong></span>
                        <span className="mo-sep">|</span>
                        <span>Last alert: <strong>None</strong></span>
                        <span className="mo-sep">|</span>
                        <span>Sensor: <strong>Online</strong> <span className="mo-check">✓</span></span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="mo-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="mo-container"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {isTemperature ? renderTemperatureConsole() : renderDefaultConsole()}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MetricDetailOverlay;
