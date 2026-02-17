import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Scatter,
    ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';

const AnomalyChart = ({ data, title }) => {
    // Filter data to get only anomalies for the scatter plot
    const anomalies = data.filter(d => d.isAnomaly);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: 'var(--bg-surface)',
                    backdropFilter: 'var(--glass-blur)',
                    border: 'var(--glass-border)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-depth)'
                }}>
                    <p className="label" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
                    <p className="value" style={{ color: 'var(--accent-primary, #3b82f6)', fontWeight: '600', fontSize: '14px' }}>
                        Value: {dataPoint.value.toFixed(4)}
                    </p>
                    <p className="score" style={{ color: 'var(--accent-error, #ef4444)', fontWeight: '600', fontSize: '14px' }}>
                        Score: {dataPoint.score.toFixed(4)}
                    </p>
                    {dataPoint.isAnomaly && (
                        <p className="anomaly-badge" style={{
                            color: 'var(--accent-error, #ef4444)',
                            marginTop: '8px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                        }}>
                            Anomaly Detected
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="chart-container glass-card"
            style={{ width: '100%', height: '100%', minHeight: '300px', padding: '1.5rem', background: 'var(--bg-glass)', borderRadius: '16px', border: 'var(--glass-border)' }}
        >
            <div className="chart-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-error, #ef4444)' }}></span>
                        Anomaly Score
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--accent-primary, #3b82f6)' }}></span>
                        Value
                    </span>
                </div>
            </div>
            <div className="chart-wrapper" style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-error, #ef4444)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--accent-error, #ef4444)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            domain={['auto', 'auto']}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            hide={true}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="var(--glass-border)" />

                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="score"
                            stroke="var(--accent-error, #ef4444)"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={false}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="value"
                            stroke="var(--accent-primary, #3b82f6)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        <Scatter
                            yAxisId="left"
                            data={anomalies}
                            fill="var(--accent-error, #ef4444)"
                            line={false}
                            shape={(props) => {
                                const { cx, cy } = props;
                                return (
                                    <circle cx={cx} cy={cy} r={4} fill="var(--accent-error, #ef4444)" stroke="none" />
                                );
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default AnomalyChart;
