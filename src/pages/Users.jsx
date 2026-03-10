import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Trash2, Shield, User, Check, X, Mail, MoreVertical } from 'lucide-react';
import DataTable from '../components/Shared/DataTable';
import MetricCard from '../components/Dashboard/MetricCard';
import UserModal from '../components/Users/UserModal';
import { useNotification } from '../context/NotificationContext';
import api from '../api/client';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './Users.css';

const Users = () => {
    const { addNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            // Fetch Firebase users from Firestore
            const response = await api.getFirebaseUsers();
            // Filter out deleted users
            const activeUsers = response.data.filter(u => u.status !== 'Deleted');
            setUsers(activeUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
            addNotification('Error', 'Failed to load users', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Get current user ID
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (userData) => {
        try {
            // Create user in Firebase and Firestore
            const result = await api.createUserWithRole({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                password: userData.password || 'DefaultPassword123!'
            });

            addNotification(
                'User Created',
                `${userData.name} has been successfully added as ${userData.role}.`,
                'success'
            );

            setIsModalOpen(false);
            
            // Refresh user list
            await fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            let errorMsg = 'Failed to add user';
            if (error.message.includes('email-already-in-use')) {
                errorMsg = 'Email is already registered';
            } else if (error.message.includes('weak-password')) {
                errorMsg = 'Password is too weak';
            }
            addNotification('Error', errorMsg, 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.deleteUser(id);
                addNotification('Success', 'User has been deleted', 'success');
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                addNotification('Error', 'Failed to delete user', 'error');
            }
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
        { title: 'Admins', value: users.filter(u => u.role === 'Admin').length.toString(), trend: '-', subtext: 'System administrators', color: 'blue' },
        { title: 'Suspended', value: users.filter(u => u.status === 'Suspended').length.toString(), trend: '0', subtext: 'Inactive accounts', color: 'red' },
    ];

    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (name, row) => (
                <div className="user-cell">
                    <img
                        src={row.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`}
                        alt={name}
                        className="user-avatar-img"
                    />
                    <div className="user-info-text">
                        <span className="user-name-text">
                            {name}
                            {row.id === currentUserId && <span className="current-user-badge">(You)</span>}
                        </span>
                        <span className="user-email-text">{row.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: 'role',
            render: (role) => (
                <div className={`role-badge role-${role.toLowerCase()}`}>
                    <Shield size={14} />
                    {role}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (status) => (
                <div className={`status-badge status-${status.toLowerCase()}`}>
                    {status === 'Active' ? <Check size={14} /> : <X size={14} />}
                    {status}
                </div>
            )
        },
        { header: 'Last Active', accessor: 'lastActive' },
        {
            header: 'Actions',
            accessor: 'id',
            render: (id, row) => (
                <div className="table-actions-premium">
                    {currentUserId !== id && (
                        <>
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
                        </>
                    )}
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
