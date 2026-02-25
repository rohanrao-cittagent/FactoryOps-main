import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import './MetricDetailOverlay.css';

const MetricDetailOverlay = ({ isOpen, onClose, metric, deviceName, history }) => {
    if (!metric) return null;

    const isTemperature = (metric.title || '').toLowerCase().includes('temperature');

    // Preparation for Trend Data
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

    // Data for units and conversions
    const primaryValue = metric.value || 0;
    const isCelsius = (metric.unit || '°C').includes('°C');
    const convValue = isCelsius ? (primaryValue * 1.8 + 32).toFixed(1) : ((primaryValue - 32) / 1.8).toFixed(1);
    const convLabel = isCelsius ? '°F' : '°C';

    const getLabels = () => {
        const title = (metric.title || '').toLowerCase();
        if (title.includes('pressure')) return { primary: 'DISCHARGE', secondary: 'INTERSTAGE', unit: 'PSI', convLabel: 'bar', rangeMax: 150 };
        if (title.includes('temperature')) return { primary: 'STAGE 2 DISCHARGE (T3)', secondary: 'AMBIENT', unit: '°C', convLabel: '°F', rangeMax: 100 };
        if (title.includes('vibration')) return { primary: 'AXIAL', secondary: 'RADIAL', unit: 'mm/s', convLabel: 'in/s', rangeMax: 5 };
        return { primary: 'LOAD', secondary: 'BUFFER', unit: 'kW', convLabel: 'kVA', rangeMax: 200 };
    };

    const config = getLabels();

    // Render specialized Temperature Console
    const renderTemperatureConsole = () => {
        const t1 = 142;
        const t2 = 48;
        const deltaT = t1 - t2;

        return (
            <div className="temp-console-layout">
                {/* Header Section */}
                <div className="ind-header temp-header">
                    <div className="ind-status-group">
                        <span className="temp-therm-icon">🌡️</span>
                        <span className="ind-title-text">TEMPERATURE</span>
                        <span className="ind-dash">—</span>
                        <span className="ind-device-text">Anest Iwata HLT 200</span>
                    </div>
                    <div className="temp-unit-toggle">[ °C | °F ]</div>
                    <button className="ind-close-icon" onClick={onClose}>×</button>
                </div>

                {/* Main Readout Section */}
                <div className="temp-main-section">
                    <div className="temp-primary-row">
                        <span className="temp-label">PRIMARY — Stage 2 Discharge (T3)</span>
                    </div>

                    <div className="temp-readout-box">
                        <div className="temp-readout-value">
                            <div className="temp-dot-indicator active"></div>
                            <span className="temp-val-big">{primaryValue}°C</span>
                            <span className="temp-val-small">({convValue}°F)</span>
                        </div>

                        <div className="temp-multi-bar">
                            <div className="temp-bar-segments">
                                <div className="temp-segment normal"></div>
                                <div className="temp-segment warn"></div>
                                <div className="temp-segment critical"></div>
                                <motion.div
                                    className="temp-bar-cursor"
                                    initial={{ left: 0 }}
                                    animate={{ left: `${Math.min((primaryValue / 100) * 100, 100)}%` }}
                                    transition={{ duration: 1 }}
                                ></motion.div>
                            </div>
                            <div className="temp-bar-labels">
                                <span>0°C</span>
                                <span>40°C</span>
                                <span>75°C</span>
                                <span>90°C</span>
                            </div>
                            <div className="temp-state-labels">
                                <span className="state-normal">[Normal]</span>
                                <span className="state-warn">[Warn]</span>
                                <span className="state-critical">[Critical]</span>
                            </div>
                        </div>

                        <div className="temp-meta-strip">
                            <div className="meta-item">
                                <span className="meta-label">Rate of Rise:</span>
                                <span className="meta-val">+0.3°C/min</span>
                            </div>
                            <div className="meta-item">
                                <div className="status-indicator stable"></div>
                                <span className="meta-val">Stable</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Grid Section */}
                <div className="temp-grid-section">
                    <div className="temp-grid-col all-sensors">
                        <span className="temp-label">ALL SENSORS</span>
                        <div className="sensor-list">
                            <div className="sensor-item">
                                <span>T1 Stage 1:</span>
                                <div className="sensor-val-group">
                                    <span className="s-val">142°C</span>
                                    <div className="s-indicator active"></div>
                                </div>
                            </div>
                            <div className="sensor-item">
                                <span>T2 Interstage:</span>
                                <div className="sensor-val-group">
                                    <span className="s-val">48°C</span>
                                    <div className="s-indicator active"></div>
                                </div>
                            </div>
                            <div className="sensor-item">
                                <span>T3 Stage 2:</span>
                                <div className="sensor-val-group">
                                    <span className="s-val">{primaryValue}°C</span>
                                    <div className="s-indicator active"></div>
                                </div>
                            </div>
                            <div className="sensor-item">
                                <span>T4 Ambient:</span>
                                <div className="sensor-val-group">
                                    <span className="s-val">34°C</span>
                                    <div className="s-indicator active"></div>
                                </div>
                            </div>
                            <div className="sensor-item">
                                <span>T5 Oil Sump:</span>
                                <div className="sensor-val-group">
                                    <span className="s-val">74°C</span>
                                    <div className="s-indicator active"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="temp-grid-col intercooler">
                        <span className="temp-label">INTERCOOLER HEALTH</span>
                        <div className="intercooler-logic">
                            <div className="calc-line">ΔT = T1 - T2</div>
                            <div className="calc-values">142 - 48 = {deltaT}°C</div>
                            <div className="health-status">
                                <div className="s-indicator active"></div>
                                <span>Excellent — fins clean</span>
                            </div>
                        </div>
                        <div className="ambient-correction">
                            <div className="correction-line">Ambient Correction: +9°C</div>
                            <div className="corrected-value">
                                <span>Corrected T3: 49°C</span>
                                <div className="s-indicator active"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Section */}
                <div className="temp-trend-section">
                    <span className="temp-label">TREND — T3 Stage 2 Discharge (last 60 min)</span>
                    <div className="temp-graph-box">
                        <div className="graph-y-axis">
                            <span>90°</span>
                            <span>75°</span>
                            <span>60°</span>
                            <span>40°</span>
                        </div>
                        <div className="graph-main">
                            <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="stepAfter"
                                        dataKey="value"
                                        stroke="#fff"
                                        strokeWidth={1}
                                        fill="url(#tempGradient)"
                                        isAnimationActive={false}
                                    />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="temp-graph-footer">
                        <span>60 min ago</span>
                        <span>Now</span>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="temp-footer">
                    <div className="footer-top-line">
                        <span className="tool-icon">🔧</span>
                        <span>Next intercooler cleaning: In 12 days</span>
                    </div>
                    <div className="footer-bottom-line">
                        <div className="f-left">Last alert: None today</div>
                        <div className="divider">|</div>
                        <div className="f-right">
                            <span>All sensors: Online</span>
                            <div className="check-box-monochrome">✓</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="ind-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="ind-console-container"
                        id="ind-console-container"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isTemperature ? renderTemperatureConsole() : (
                            <>
                                {/* Default Console Header */}
                                <div className="ind-header">
                                    <div className="ind-status-group">
                                        <div className="ind-blue-dot"></div>
                                        <span className="ind-title-text">{metric.title.split(' ')[0].toUpperCase()}</span>
                                        <span className="ind-dash">/</span>
                                        <span className="ind-device-text">{deviceName}</span>
                                        <span className="ind-units-bracket">[ {config.unit} | {config.convLabel} ]</span>
                                    </div>
                                    <button className="ind-close-icon" onClick={onClose}>×</button>
                                </div>

                                {/* Top Data Section */}
                                <div className="ind-row ind-top-data">
                                    <div className="ind-col ind-col-left">
                                        <span className="ind-label">{config.primary}</span>
                                        <div className="ind-value-display">
                                            <span className="ind-main-val">{primaryValue}</span>
                                            <span className="ind-unit-label">{config.unit}</span>
                                        </div>
                                        <span className="ind-sub-val">({convValue} {config.convLabel})</span>

                                        <div className="ind-viz-bar">
                                            <div className="ind-bar-track">
                                                <motion.div
                                                    className="ind-bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((primaryValue / config.rangeMax) * 100, 100)}%` }}
                                                    transition={{ duration: 1, ease: "circOut" }}
                                                ></motion.div>
                                                <div className="ind-bar-hatch"></div>
                                            </div>
                                            <div className="ind-bar-scale">
                                                <span>0.00</span>
                                                <span>{(config.rangeMax / 2).toFixed(2)}</span>
                                                <span>{config.rangeMax}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ind-v-line"></div>

                                    <div className="ind-col ind-col-right">
                                        <div className="param-header-row">
                                            <span className="ind-label">{config.secondary}</span>
                                            <div className="ind-status-pill">
                                                <div className="ind-green-dot"></div>
                                                <span>Normal</span>
                                            </div>
                                        </div>

                                        <div className="ind-value-display small">
                                            <span className="ind-main-val secondary">{(primaryValue * 0.4).toFixed(1)}</span>
                                            <span className="ind-unit-label secondary">{config.unit}</span>
                                        </div>
                                        <span className="ind-sub-val secondary">({(convValue * 0.4).toFixed(1)} {config.convLabel})</span>

                                        <div className="ind-params-list">
                                            <div className="ind-param">
                                                <span className="ind-p-key">Cut-in Limit</span>
                                                <span className="ind-p-val">{(config.rangeMax * 0.7).toFixed(1)} {config.unit}</span>
                                            </div>
                                            <div className="ind-param">
                                                <span className="ind-p-key">Shut-down Limit</span>
                                                <span className="ind-p-val">{(config.rangeMax * 0.9).toFixed(1)} {config.unit}</span>
                                            </div>
                                            <div className="ind-param accent">
                                                <span className="ind-p-key">State</span>
                                                <span className="ind-p-val highlight">[ LOADED ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trend Section */}
                                <div className="ind-trend-box">
                                    <span className="ind-label">Historical Trend Analysis</span>
                                    <div className="ind-graph-container">
                                        <div className="ind-y-axis">
                                            <span>{config.rangeMax}</span>
                                            <span>{config.rangeMax / 2}</span>
                                            <span>0</span>
                                        </div>
                                        <div className="ind-chart-box">
                                            <ResponsiveContainer width="100%" height={100}>
                                                <AreaChart data={trendData}>
                                                    <defs>
                                                        <linearGradient id="indChartGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis hide domain={[0, config.rangeMax]} />
                                                    <Tooltip
                                                        contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fill="url(#indChartGradient)"
                                                        activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="ind-graph-footer">
                                        <span>L60_MIN_HISTORY</span>
                                        <span>REALTIME_ACQUISITION</span>
                                    </div>
                                </div>

                                {/* Footer Section */}
                                <div className="ind-footer">
                                    <div className="ind-footer-left">
                                        <span className="ind-delta-icon">Δ</span>
                                        <span className="ind-footer-item">vs last shift: <span className="white">↓ -0.4</span></span>
                                        <span className="ind-warning-icon">⚠️</span>
                                        <span className="ind-warning-text">Normal</span>
                                    </div>
                                    <div className="ind-footer-right">
                                        <span className="ind-footer-item">Last alert: <span className="white">None</span></span>
                                        <span className="ind-footer-item">Sensor: <span className="white">Online</span> <span className="ind-check-box">☑</span></span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MetricDetailOverlay;
