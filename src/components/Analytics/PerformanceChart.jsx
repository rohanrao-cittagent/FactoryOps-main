import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import './PerformanceChart.css';

const PerformanceChart = ({ data, title, dataKey, color = "#3b82f6" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="chart-container glass-card"
        >
            <div className="chart-header">
                <h3>{title}</h3>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default PerformanceChart;
