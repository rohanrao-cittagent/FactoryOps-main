import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Play, Pause, Settings, Shield, Zap, Flame, Droplet, Activity, Check, Trash2 } from 'lucide-react';
import DataTable from '../components/Shared/DataTable';
import RuleModal from '../components/Rules/RuleModal';
import { useToast } from '../components/Shared/Toast';
import { api } from '../api/client';
import './Rules.css';

const ICON_MAP = {
    Flame: <Flame size={16} />,
    Zap: <Zap size={16} />,
    Activity: <Activity size={16} />,
    Droplet: <Droplet size={16} />,
    Shield: <Shield size={16} />
};

const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'danger':
            return 'Flame';
        case 'warning':
            return 'Zap';
        case 'info':
            return 'Droplet';
        default:
            return 'Activity';
    }
};

const getSeverityType = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
        case 'danger':
            return 'danger';
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        default:
            return 'neutral';
    }
};

const Rules = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast, ToastContainer } = useToast();

     useEffect(() => {
         const fetchRules = async () => {
             try {
                 setLoading(true);
                 const response = await api.getRules();
                 
                 // Transform API data to UI format
                 // client.js already maps: rule_id->id, rule_name->name, property, threshold, device_ids, status
                 const transformedRules = (response.data || []).map(rule => ({
                     id: rule.id,
                     name: rule.name,
                     devices: rule.device_ids?.[0] || 'All',
                     condition: `${rule.property || 'Metric'} ${rule.condition || '>'} ${rule.threshold || ''}`,
                     status: rule.status,
                     type: 'neutral',
                     icon: 'Activity',
                     metric: rule.property || '',
                     operator: rule.condition || '>',
                     value: rule.threshold || '',
                     device_ids: rule.device_ids || [],
                     property: rule.property,
                     threshold: rule.threshold,
                     description: rule.description,
                     selectedChannels: rule.notification_channels || ['email']
                 }));
                 
                 setRules(transformedRules);
             } catch (error) {
                 console.error('Failed to fetch rules:', error);
                 showToast('Failed to load rules', 'error');
             } finally {
                 setLoading(false);
             }
         };
         fetchRules();
         
         // Add visibility change listener to refetch when user comes back to this tab
         const handleVisibilityChange = () => {
             if (!document.hidden) {
                 console.log('[Rules] User returned to Rules page, refetching...');
                 fetchRules();
             }
         };
         
         document.addEventListener('visibilitychange', handleVisibilityChange);
         return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
     }, []);

     const handleToggleStatus = async (id) => {
         const rule = rules.find(r => r.id === id);
         if (!rule) return;

         try {
             const newStatus = rule.status === 'active' ? 'Inactive' : 'Active';
             console.log(`Toggling rule ${id} status from ${rule.status} to ${newStatus}`);
             
             // Use the dedicated status update endpoint
             await api.updateRuleStatus(id, newStatus);
             
             // Update UI after successful API call - convert back to lowercase
             const statusToStore = newStatus === 'Active' ? 'active' : 'paused';
             setRules(rules.map(r => 
                 r.id === id ? { ...r, status: statusToStore } : r
             ));
             showToast(`Rule ${newStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
          } catch (error) {
              console.error('Failed to toggle rule:', error);
              showToast('Failed to update rule status', 'error');
              // Refetch rules to sync state with server
              try {
                  const rulesData = await api.getRules();
                  const fetchedRules = rulesData.data || [];
                  const transformedRules = (fetchedRules).map(rule => ({
                      id: rule.id,
                      name: rule.name,
                      devices: rule.device_ids?.[0] || 'All',
                      condition: `${rule.property || 'Metric'} ${rule.condition || '>'} ${rule.threshold || ''}`,
                      status: rule.status,
                      type: 'neutral',
                      icon: 'Activity',
                      metric: rule.property || '',
                      operator: rule.condition || '>',
                      value: rule.threshold || '',
                      device_ids: rule.device_ids || [],
                      property: rule.property,
                      threshold: rule.threshold,
                      description: rule.description,
                      selectedChannels: rule.notification_channels || ['email']
                  }));
                  setRules(transformedRules);
              } catch (refetchError) {
                  console.error('Failed to refetch rules:', refetchError);
              }
          }
    };

    const handleDeleteRule = async (id) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            try {
                await api.deleteRule(id);
                setRules(rules.filter(r => r.id !== id));
                showToast('Rule deleted', 'success');
            } catch (error) {
                console.error('Failed to delete rule:', error);
                showToast('Failed to delete rule', 'error');
            }
        }
    };

    const handleAddOrUpdateRule = async (ruleData) => {
        try {
            // Pass ruleData directly to api.createRule and api.updateRule
            // These functions handle the proper field mapping to API schema

            if (editingRule) {
                await api.updateRule(editingRule.id, ruleData);
                setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...ruleData, id: r.id } : r));
                showToast('Rule updated successfully', 'success');
            } else {
                // createRule now handles proper API field mapping
                await api.createRule(ruleData);
                // Refresh rules list
                const response = await api.getRules();
                const transformedRules = (response.data || []).map(rule => ({
                    id: rule.rule_id,  // API returns rule_id
                    name: rule.rule_name,  // API returns rule_name
                    devices: rule.device_ids?.[0] || 'All',  // device_ids is now an array
                    condition: `${rule.property} ${rule.condition} ${rule.threshold}`,  // API field names
                    status: rule.status === 'active' ? 'Active' : 'Inactive',  // API returns lowercase
                    type: getSeverityType(rule.severity),
                    icon: getSeverityIcon(rule.severity),
                    description: rule.description
                }));
                setRules(transformedRules);
                showToast('Rule created successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
            showToast('Failed to save rule', 'error');
        }
        setIsModalOpen(false);
        setEditingRule(null);
    };

    const handleEditClick = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };

    const filteredRules = rules.filter(rule =>
        rule.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.devices?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: 'Rule Name',
            accessor: 'name',
            render: (name, row) => (
                <div className={`rule-name-cell ${row.type || 'neutral'}`}>
                    <div className="rule-icon-box">
                        {ICON_MAP[row.icon] || <Shield size={16} />}
                    </div>
                    <span>{name}</span>
                </div>
            )
        },
        {
            header: 'Affected Assets',
            accessor: 'devices',
            render: (devices) => <span className="asset-badge-premium">{devices}</span>
        },
        {
            header: 'Logic Protocol',
            accessor: 'condition',
            render: (cond, row) => <code className={`rule-code-premium ${row.type || 'neutral'}`}>{cond}</code>
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (status) => (
                <span className={`status-pill-minimal ${status?.toLowerCase() || 'inactive'}`}>
                    {status?.toLowerCase() === 'active' ? (
                        <Check size={12} className="status-icon-svg" />
                    ) : (
                        <span className="dot" />
                    )}
                    {status}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: 'id',
            render: (id, row) => (
                <div className="table-actions-premium">
                     <button
                         className={`control-icon-btn small ${row.status === 'active' ? 'active' : ''}`}
                         title={row.status === 'active' ? 'Pause Protocol' : 'Activate Protocol'}
                         onClick={() => handleToggleStatus(row.id)}
                     >
                         {row.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                     </button>
                    <button
                        className="control-icon-btn small"
                        title="Configure Logic"
                        onClick={() => handleEditClick(row)}
                    >
                        <Settings size={16} />
                    </button>
                    <button
                        className="control-icon-btn small danger"
                        title="Delete Rule"
                        onClick={() => handleDeleteRule(row.id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
    ];

    if (loading) {
        return (
            <div className="rules-container">
                <div className="rules-loading">
                    <p>Loading rules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rules-container">
            <div className="rules-toolbar-premium">
                <div className="rules-actions-row">
                    <div className="search-box-premium">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Filter protocols..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-hub-btns">
                        <button
                            className="btn-neon"
                            onClick={handleCreateClick}
                        >
                            <Plus size={20} />
                            Create Rule
                        </button>
                    </div>
                </div>
            </div>

            <div className="rules-content-hub">
                <DataTable
                    title="Active Automation Protocols"
                    columns={columns}
                    data={filteredRules}
                />
            </div>

            <RuleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRule(null);
                }}
                onSave={handleAddOrUpdateRule}
                editingRule={editingRule}
            />

            <ToastContainer />
        </div>
    );
};

export default Rules;
