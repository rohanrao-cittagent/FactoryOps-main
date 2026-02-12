import React from 'react';
import { motion } from 'framer-motion';
import './DataTable.css';

const DataTable = ({ columns, data, title, actions }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="data-table-container"
        >
            <div className="table-header">
                <div className="header-info">
                    <h3>{title}</h3>
                    <span className="count">{data.length} Total Items</span>
                </div>
                {actions && <div className="table-actions">{actions}</div>}
            </div>

            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} style={{ width: col.width }}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx}>
                                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default DataTable;
