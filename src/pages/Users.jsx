import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Trash2, Shield, User, Check, X, Mail, MoreVertical } from 'lucide-react';
import DataTable from '../components/Shared/DataTable';
import MetricCard from '../components/Dashboard/MetricCard';
import UserModal from '../components/Users/UserModal';
import { useNotification } from '../context/NotificationContext';
import './Users.css';

const INITIAL_USERS = [
    { id: 1, name: 'Sarah Chen', email: 'sarah@cittagent.com', role: 'Admin', lastActive: '2 min ago', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 2, name: 'Marcus Wong', email: 'marcus@factoryx.com', role: 'Operator', lastActive: '1 hour ago', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
    { id: 3, name: 'Alex Rodriguez', email: 'alex@manufacture.com', role: 'Viewer', lastActive: '2 days ago', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 4, name: 'James Wilson', email: 'james@cittagent.com', role: 'Admin', lastActive: '1 week ago', status: 'Inactive', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
];

const Users = () => {
    const { addNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const savedUsers = localStorage.getItem('factoryops_users');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            setUsers(INITIAL_USERS);
            localStorage.setItem('factoryops_users', JSON.stringify(INITIAL_USERS));
        }
    }, []);

    const saveUsers = (newUsers) => {
        setUsers(newUsers);
        localStorage.setItem('factoryops_users', JSON.stringify(newUsers));
    };

    const handleAddUser = (userData) => {
        const newUser = {
            ...userData,
            id: Date.now(),
            lastActive: 'Just now',
            status: 'Active',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`
        };
        saveUsers([...users, newUser]);

        addNotification(
            'User Invited',
            `${userData.name} has been invited to join the ${userData.role} team.`,
            'success'
        );

        setIsModalOpen(false);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            const updatedUsers = users.filter(u => u.id !== id);
            saveUsers(updatedUsers);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const metrics = [
        { title: 'Total Users', value: users.length.toString(), trend: '+12', subtext: 'Growth this month', color: 'blue' },
        { title: 'Active Now', value: users.filter(u => u.status === 'Active').length.toString(), trend: 'Stable', subtext: '93% engagement', color: 'green' },
        { title: 'Pending', value: '12', trend: '-2', subtext: 'Awaiting invite', color: 'blue' },
        { title: 'Suspended', value: '4', trend: '0', subtext: 'Policy violations', color: 'red' },
    ];

    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (name, row) => (
                <div className="user-cell">
                    <img src={row.avatar} alt={name} className="user-avatar-img" />
                    <div className="user-info-text">
                        <span className="user-name-text">{name}</span>
                        <span className="user-email-text">{row.email}</span>
                    </div>
                </div>
            )
        },
        { header: 'Role', accessor: 'role' },
        { header: 'Status', accessor: 'status' },
        { header: 'Last Active', accessor: 'lastActive' },
        {
            header: 'Actions',
            accessor: 'id',
            render: (id) => (
                <div className="table-actions-premium">
                    <button
                        className="control-icon-btn small danger"
                        title="Delete User"
                        onClick={() => handleDeleteUser(id)}
                    >
                        <Trash2 size={16} />
                    </button>
                    <button className="control-icon-btn small" title="More Options">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="users-container"
        >
            <div className="users-metrics-row">
                {metrics.map((m, i) => (
                    <MetricCard key={i} {...m} delay={i * 0.1} />
                ))}
            </div>

            <div className="users-content-section">
                <div className="users-toolbar">
                    <div className="search-box-premium">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search team members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn-neon"
                        style={{ padding: '0.6rem 1.25rem' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <UserPlus size={18} />
                        Invite Member
                    </button>
                </div>

                <DataTable
                    title="System Users"
                    columns={columns}
                    data={filteredUsers}
                />
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddUser}
            />
        </motion.div>
    );
};

export default Users;
