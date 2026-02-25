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
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            domain={
                                dataKey === 'efficiency' || dataKey === 'healthScore' ? [0, 100] :
                                    dataKey === 'uptime' ? [90, 100] :
                                        ['auto', 'auto']
                            }
                            tickFormatter={(value) => {
                                if (dataKey === 'revenueImpact') return `$${value}`;
                                if (dataKey === 'powerWastage') return `${value}kW`;
                                return value;
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(1, 4, 15, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                backdropFilter: 'blur(10px)'
                            }}
                            formatter={(value) => {
                                const labels = {
                                    efficiency: ['Efficiency', '%'],
                                    healthScore: ['Health Score', '%'],
                                    uptime: ['Uptime', '%'],
                                    powerWastage: ['Power Wastage', 'kW'],
                                    revenueImpact: ['Revenue Impact', '$/hr']
                                };
                                const config = labels[dataKey] || [dataKey, ''];
                                return [`${value}${config[1]}`, config[0]];
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
