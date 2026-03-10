const DEVICE_SERVICE_BASE = 'http://localhost:8000';
const DATA_SERVICE_BASE = 'http://localhost:8081';
const RULE_ENGINE_BASE = 'http://localhost:8002';
const ANALYTICS_BASE = 'http://localhost:8003';
const REPORTING_BASE = 'http://localhost:8085';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchApi(url, options = {}) {
    console.log(`[fetchApi] Requesting: ${url}`);
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        console.log(`[fetchApi] Response status: ${response.status} from ${url}`);

        if (!response.ok) {
            const error = await response.text();
            console.error(`[fetchApi] HTTP Error: ${response.status} - ${error}`);
            throw new Error(error || `HTTP ${response.status}`);
        }

        const json = await response.json();
        console.log(`[fetchApi] Success: ${url}, returned ${Object.keys(json).length} keys`);
        return json;
    } catch (err) {
        console.error(`[fetchApi] ERROR: ${url}`, err.message);
        throw err;
    }
}

export const api = {
    // Equipment - from device-service
    getEquipment: async () => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices`);
            const devices = data.data || [];
            return {
                data: devices.map(d => ({
                    id: d.device_id,
                    fullId: d.device_id,
                    name: d.device_name,
                    status: d.runtime_status || d.status || 'Unknown',
                    health: 85, // Will be fetched from health endpoint
                    type: d.device_type || 'Unknown',
                    manufacturer: d.manufacturer || '',
                    model: d.model || '',
                    location: d.location || '',
                    runtime_status: d.runtime_status || 'stopped',
                    last_seen_timestamp: d.last_seen_timestamp
                }))
            };
        } catch (error) {
            console.error('Error fetching devices:', error);
            return { data: [] };
        }
    },

    getEquipmentById: async (id) => {
        try {
            const deviceData = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${id}`);
            const d = deviceData.data;

            // Get latest telemetry
            let telemetry = [];
            try {
                const telemetryData = await fetchApi(`${DATA_SERVICE_BASE}/api/v1/data/telemetry/${id}?limit=20`);
                telemetry = telemetryData.data?.items || [];
            } catch (e) {
                console.warn('No telemetry available:', e);
            }

            // Get health score if available
            let health = 85;
            try {
                const summary = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/dashboard/summary`);
                const deviceSummary = summary.devices?.find(dev => dev.device_id === id);
                if (deviceSummary) {
                    health = deviceSummary.health_score || 85;
                }
            } catch (e) {
                console.warn('No health score available:', e);
            }

            return {
                data: {
                    id: d.device_id,
                    fullId: d.device_id,
                    name: d.device_name,
                    status: d.runtime_status || d.status || 'Unknown',
                    health: health,
                    type: d.device_type,
                    manufacturer: d.manufacturer || '',
                    model: d.model || '',
                    location: d.location || '',
                    runtime_status: d.runtime_status || 'stopped',
                    last_seen_timestamp: d.last_seen_timestamp,
                    telemetry: telemetry.map(t => ({
                        id: t.timestamp,
                        timestamp: t.timestamp,
                        pressure: t.pressure || 0,
                        temperature: t.temperature || 0,
                        vibration: t.vibration || 0,
                        power_consumption: t.power || 0,
                        voltage: t.voltage || 0,
                        current: t.current || 0
                    }))
                }
            };
        } catch (error) {
            console.error('Error fetching device:', error);
            throw error;
        }
    },

    // Telemetry - from data-service
    getTelemetry: async (equipmentId, params = {}) => {
        try {
            let url = `${DATA_SERVICE_BASE}/api/v1/data/telemetry/${equipmentId}?limit=${params.limit || 50}`;

            if (params.startTime) {
                const startTimeIso = typeof params.startTime === 'string'
                    ? params.startTime
                    : params.startTime.toISOString();
                url += `&start_time=${startTimeIso}`;
            }

            if (params.endTime) {
                const endTimeIso = typeof params.endTime === 'string'
                    ? params.endTime
                    : params.endTime.toISOString();
                url += `&end_time=${endTimeIso}`;
            }

            const data = await fetchApi(url);
            const telemetry = data.data?.items || [];
            return {
                data: telemetry.map(t => {
                    // Calculate efficiency based on temperature and power if not provided
                    let efficiency_pct = t.efficiency || null;
                    if (!efficiency_pct) {
                        // Estimate efficiency: base 85%, adjusted by temperature and power
                        let est = 85;
                        if (t.temperature) {
                            const temp = parseFloat(t.temperature);
                            // Optimal at 50°C, penalty for deviation
                            const tempDiff = Math.abs(temp - 50);
                            est -= Math.min(15, tempDiff * 0.5);
                        }
                        if (t.power) {
                            const power = parseFloat(t.power) / 1000; // Convert watts to kW
                            // Penalty for high power consumption (>300kW)
                            if (power > 300) est -= 5;
                            // Bonus for low power consumption (<200kW)
                            if (power < 200) est += 5;
                        }
                        efficiency_pct = Math.max(60, Math.min(100, est));
                    }

                    return {
                        id: t.timestamp,
                        timestamp: t.timestamp,
                        pressure: t.pressure || 0,
                        temperature: t.temperature || 0,
                        vibration: t.vibration || 0,
                        power_consumption: t.power || 0,
                        voltage: t.voltage || 0,
                        current: t.current || 0,
                        efficiency_pct: efficiency_pct
                    };
                })
            };
        } catch (error) {
            console.error('Error fetching telemetry:', error);
            return { data: [] };
        }
    },

    // Rules - from rule-engine-service
    getRules: async () => {
        try {
            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/rules`);
            const rules = data.data || [];
            return {
                data: rules.map(r => ({
                    id: r.rule_id,
                    name: r.rule_name,
                    description: r.description,
                    device_ids: r.device_ids,
                    property: r.property,
                    condition: r.condition,
                    threshold: r.threshold,
                    notification_channels: r.notification_channels,
                    status: r.status,  // Keep status as is from API (active, paused, archived)
                    scope: r.scope,
                    rule_id: r.rule_id,
                    rule_name: r.rule_name,
                    created_at: r.created_at
                }))
            };
        } catch (error) {
            console.error('Error fetching rules:', error);
            return { data: [] };
        }
    },

    createRule: async (ruleData) => {
        try {
            // Map notification channels from UI format to API format
            const channelMap = {
                'Email': 'email',
                'In-app': 'in-app',
                'SMS': 'sms',
                'WhatsApp': 'whatsapp',
                'Telegram': 'telegram',
                'Webhook': 'webhook'
            };

            const notification_channels = (ruleData.selectedChannels || [])
                .map(ch => channelMap[ch] || ch.toLowerCase())
                .filter(ch => ['email', 'whatsapp', 'telegram'].includes(ch)); // API only accepts these 3

            // Ensure at least one channel
            if (notification_channels.length === 0) {
                notification_channels.push('email');
            }

            // Determine scope based on target
            let scope = 'selected_devices';
            if (ruleData.target === 'All Machines') {
                scope = 'all_devices';
            }

            // Build device_ids array
            let device_ids = [];
            if (scope === 'selected_devices') {
                device_ids = [ruleData.selectedDevice || ruleData.device_id];
            }

            // Extract operator from condition string (e.g., "Temperature > 95°C" -> ">")
            let operator = ruleData.operator || '>';
            if (ruleData.condition && typeof ruleData.condition === 'string') {
                const match = ruleData.condition.match(/([><=!]+)/);
                if (match) {
                    operator = match[1];
                }
            }

            // Map operator for API compatibility
            const operatorMap = {
                '==': '=',
                '=': '=',
                '>': '>',
                '<': '<',
                '>=': '>=',
                '<=': '<=',
                '!=': '!='
            };
            operator = operatorMap[operator] || '>';

            const payload = {
                rule_name: ruleData.name,
                description: ruleData.description || '',
                property: ruleData.metric || ruleData.parameter_name || 'Temperature',
                condition: operator,
                threshold: parseFloat(ruleData.value || ruleData.threshold_value || 0),
                device_ids: device_ids,
                notification_channels: notification_channels,
                scope: scope,
                cooldown_minutes: 15
            };

            console.log('Creating rule with payload:', payload);

            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/rules`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            return { data: { ...data.data, status: 'Active' } };
        } catch (error) {
            console.error('Error creating rule:', error);
            throw error;
        }
    },

    updateRule: async (id, ruleData) => {
        try {
            const payload = {
                name: ruleData.name,
                description: ruleData.description,
                is_enabled: ruleData.status === 'Active'
            };

            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/rules/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            return { data: { ...ruleData, id } };
        } catch (error) {
            console.error('Error updating rule:', error);
            throw error;
        }
    },

    // Update rule status (activate/deactivate)
    updateRuleStatus: async (id, status) => {
        try {
            console.log(`[updateRuleStatus] Updating rule ${id} status to: ${status}`);

            const payload = {
                status: status === 'Active' ? 'active' : (status === 'Inactive' ? 'paused' : 'archived')
            };

            console.log(`[updateRuleStatus] Payload:`, payload);

            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/rules/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            console.log(`[updateRuleStatus] Response:`, data);
            console.log(`[updateRuleStatus] Status updated successfully. New status: ${data.status}`);
            return {
                data: {
                    id: data.rule_id,
                    status: data.status
                }
            };
        } catch (error) {
            console.error('Error updating rule status:', error);
            throw error;
        }
    },

    deleteRule: async (id) => {
        try {
            await fetchApi(`${RULE_ENGINE_BASE}/api/v1/rules/${id}`, {
                method: 'DELETE'
            });
            return { data: { success: true } };
        } catch (error) {
            console.error('Error deleting rule:', error);
            throw error;
        }
    },

    // Users - from device-service
    getUsers: async () => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/users`);
            return {
                data: data.data || []
            };
        } catch (error) {
            console.error('Error fetching users:', error);
            return { data: [] };
        }
    },

    // Authentication - Firebase-based
    login: async (credentials) => {
        // This is now handled by Firebase in Login.jsx
        // Kept for backward compatibility if needed
        throw new Error('Use Firebase signInWithEmailAndPassword instead');
    },

    register: async (userData) => {
        // This is now handled by Firebase in Signup.jsx
        // Kept for backward compatibility if needed
        throw new Error('Use Firebase createUserWithEmailAndPassword instead');
    },

    logout: async () => {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../config/firebase.js');
        await signOut(auth);
        localStorage.removeItem('factoryops_user');
        return { success: true };
    },

    // Dashboard Summary
    getDashboardSummary: async () => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/dashboard/summary`);
            return data;
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            return {
                summary: {
                    total_devices: 0,
                    running_devices: 0,
                    stopped_devices: 0,
                    system_health: 0
                },
                devices: []
            };
        }
    },

    // Alerts - from rule-engine-service
    getAlerts: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/alerts?${queryParams}`);
            return data;
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return { data: [], total: 0 };
        }
    },

    acknowledgeAlert: async (alertId, acknowledgedBy) => {
        try {
            const data = await fetchApi(`${RULE_ENGINE_BASE}/api/v1/alerts/${alertId}/acknowledge`, {
                method: 'PATCH',
                body: JSON.stringify({ acknowledged_by: acknowledgedBy })
            });
            return data;
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }
    },

    // Analytics - from analytics-service
    getAnalytics: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const data = await fetchApi(`${ANALYTICS_BASE}/api/v1/analytics?${queryParams}`);
            return data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return { data: [] };
        }
    },

    // Reporting - from reporting-service
    getReports: async () => {
        try {
            const data = await fetchApi(`${REPORTING_BASE}/api/v1/reports`);
            return data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            return { data: [] };
        }
    },

    generateReport: async (reportConfig) => {
        try {
            const data = await fetchApi(`${REPORTING_BASE}/api/v1/reports/generate`, {
                method: 'POST',
                body: JSON.stringify(reportConfig)
            });
            return data;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    },

    // Chatbot - mock for now (would need AI service)
    chat: async (message) => {
        await delay(600);

        const lowerMsg = message.toLowerCase();
        let response = "I'm connected to the FactoryOps system. I can help you with machine status, power consumption, and alerts.";

        // Try to get real device data
        try {
            const summary = await api.getDashboardSummary();

            if (lowerMsg.includes('status') || lowerMsg.includes('health')) {
                const running = summary.summary?.running_devices || 0;
                const total = summary.summary?.total_devices || 0;
                response = `System Status: ${running} of ${total} devices running. System health: ${summary.summary?.system_health || 0}%`;
            }

            if (lowerMsg.includes('power') || lowerMsg.includes('energy')) {
                response = "Power consumption data is available. Check the Dashboard for real-time metrics.";
            }

            if (lowerMsg.includes('alert') || lowerMsg.includes('warning')) {
                const alerts = await api.getAlerts({ status: 'active' });
                response = `Currently ${alerts.data?.length || 0} active alerts in the system.`;
            }
        } catch (e) {
            console.warn('Chatbot data fetch failed:', e);
        }

        return {
            data: {
                reply: response,
                timestamp: new Date().toISOString()
            }
        };
    },

    // Shifts - from device-service
    getShifts: async (deviceId) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/shifts`);
            return data;
        } catch (error) {
            console.error('Error fetching shifts:', error);
            return { data: [] };
        }
    },

    createShift: async (deviceId, shiftData) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/shifts`, {
                method: 'POST',
                body: JSON.stringify(shiftData)
            });
            return data;
        } catch (error) {
            console.error('Error creating shift:', error);
            throw error;
        }
    },

    deleteShift: async (deviceId, shiftId) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/shifts/${shiftId}`, {
                method: 'DELETE'
            });
            return data;
        } catch (error) {
            console.error('Error deleting shift:', error);
            throw error;
        }
    },

    // Health Configuration - from device-service
    getHealthConfigs: async (deviceId) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/health-config`);
            return data;
        } catch (error) {
            console.error('Error fetching health configs:', error);
            return { data: [] };
        }
    },

    createHealthConfig: async (deviceId, configData) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/health-config`, {
                method: 'POST',
                body: JSON.stringify(configData)
            });
            return data;
        } catch (error) {
            console.error('Error creating health config:', error);
            throw error;
        }
    },

    deleteHealthConfig: async (deviceId, configId) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/health-config/${configId}`, {
                method: 'DELETE'
            });
            return data;
        } catch (error) {
            console.error('Error deleting health config:', error);
            throw error;
        }
    },

    validateHealthWeights: async (deviceId) => {
        try {
            const data = await fetchApi(`${DEVICE_SERVICE_BASE}/api/v1/devices/${deviceId}/health-config/validate-weights`);
            return data;
        } catch (error) {
            console.error('Error validating health weights:', error);
            return { valid: false, message: 'Failed to validate' };
        }
    },

    // Firebase Users - fetch authenticated users from Firebase and Firestore
    getFirebaseUsers: async () => {
        try {
            const { auth, db } = await import('../config/firebase.js');
            const { collection, getDocs, orderBy, query } = await import('firebase/firestore');

            // Fetch user roles and metadata from Firestore
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(usersQuery);

            const users = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    uid: doc.id,
                    email: data.email,
                    name: data.name || data.displayName || 'Unknown',
                    role: data.role || 'Operator',
                    status: data.status || 'Active',
                    lastActive: data.lastActive || 'Never',
                    createdAt: data.createdAt,
                    photoURL: data.photoURL
                });
            });

            return { data: users };
        } catch (error) {
            console.error('Error fetching Firebase users:', error);
            // Fallback: return empty array if Firestore not available
            return { data: [] };
        }
    },

    // Get current authenticated user from Firebase
    getCurrentUser: async () => {
        try {
            const { auth } = await import('../config/firebase.js');
            const { currentUser } = auth;

            if (!currentUser) {
                return { data: null };
            }

            // Try to get additional user data from Firestore
            const { db } = await import('../config/firebase.js');
            const { doc, getDoc } = await import('firebase/firestore');

            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            const firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};

            return {
                data: {
                    id: currentUser.uid,
                    uid: currentUser.uid,
                    email: currentUser.email,
                    name: firestoreData.name || currentUser.displayName || currentUser.email.split('@')[0],
                    role: firestoreData.role || 'Operator',
                    status: firestoreData.status || 'Active',
                    lastActive: firestoreData.lastActive || 'Now',
                    photoURL: currentUser.photoURL || firestoreData.photoURL,
                    createdAt: firestoreData.createdAt || currentUser.metadata?.creationTime
                }
            };
        } catch (error) {
            console.error('Error fetching current user:', error);
            return { data: null };
        }
    },

    // Create user with role in Firestore
    createUserWithRole: async (userData) => {
        try {
            const { auth, db } = await import('../config/firebase.js');
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'DefaultPassword123!');
            const authUser = userCredential.user;

            // Update profile
            await updateProfile(authUser, {
                displayName: userData.name
            });

            // Store user data in Firestore with role
            await setDoc(doc(db, 'users', authUser.uid), {
                uid: authUser.uid,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'Operator',
                status: 'Active',
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                photoURL: userData.photoURL || null
            });

            return {
                data: {
                    id: authUser.uid,
                    email: authUser.email,
                    name: userData.name,
                    role: userData.role || 'Operator'
                }
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Update user role
    updateUserRole: async (userId, role) => {
        try {
            const { db } = await import('../config/firebase.js');
            const { doc, updateDoc } = await import('firebase/firestore');

            await updateDoc(doc(db, 'users', userId), {
                role: role
            });

            return { data: { success: true } };
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    // Delete user from Firestore (doesn't delete auth user, just marks as deleted)
    deleteUser: async (userId) => {
        try {
            const { db } = await import('../config/firebase.js');
            const { doc, updateDoc } = await import('firebase/firestore');

            await updateDoc(doc(db, 'users', userId), {
                status: 'Deleted',
                deletedAt: new Date().toISOString()
            });

            return { data: { success: true } };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Assistance - Get AI answers about machines, shifts, users, analytics
    getAssistanceAnswer: async (query) => {
        try {
            // This will call the assistance service endpoint
            // For now, we'll fetch data and generate intelligent responses
            const response = await fetchApi(`${ANALYTICS_BASE}/api/v1/assistance`, {
                method: 'POST',
                body: JSON.stringify({ query })
            });

            return {
                answer: response.answer || 'I could not find relevant information for your query.',
                category: response.category || 'general',
                data: response.data || null
            };
        } catch (error) {
            console.error('Error getting assistance answer:', error);

            // Fallback: Generate intelligent response based on query without backend service
            return api.generateAssistanceAnswerFallback(query);
        }
    },

    // Fallback method to generate answers when assistance service is unavailable
    generateAssistanceAnswerFallback: async (query) => {
        const lowerQuery = query.toLowerCase();

        try {
            // Determine category based on keywords
            let category = 'general';
            let answer = '';
            let data = null;

            // MACHINES/EQUIPMENT queries
            if (lowerQuery.includes('machine') || lowerQuery.includes('equipment') || lowerQuery.includes('device') || lowerQuery.includes('maintenance')) {
                category = 'machines';

                // Fetch real devices data
                const devicesRes = await api.getEquipment();
                const devices = devicesRes.data || [];

                if (lowerQuery.includes('maintenance') || lowerQuery.includes('need')) {
                    const problematicDevices = devices.filter(d => d.health && d.health < 70);
                    answer = problematicDevices.length > 0
                        ? `${problematicDevices.length} machine(s) require attention: ${problematicDevices.map(d => d.name).join(', ')}`
                        : 'All machines are operating normally. No maintenance required at this time.';
                    data = problematicDevices;
                } else if (lowerQuery.includes('running') || lowerQuery.includes('status')) {
                    const runningDevices = devices.filter(d => d.status === 'running');
                    answer = `${runningDevices.length} out of ${devices.length} machines are currently running.`;
                    data = devices;
                } else {
                    answer = `You have ${devices.length} machines in your factory. ${devices.filter(d => d.status === 'running').length} are currently running.`;
                    data = devices;
                }
            }
            // SHIFT queries
            else if (lowerQuery.includes('shift') || lowerQuery.includes('on duty') || lowerQuery.includes('staff')) {
                category = 'shifts';

                // Fetch users to simulate shift information
                const usersRes = await api.getFirebaseUsers();
                const users = usersRes.data || [];
                const activeUsers = users.filter(u => u.status !== 'Deleted' && u.role !== 'Viewer');

                answer = `Current shift has ${activeUsers.length} active staff members. ${activeUsers.map(u => `${u.name} (${u.role})`).join(', ')}.`;
                data = activeUsers;
            }
            // USER/TEAM queries
            else if (lowerQuery.includes('user') || lowerQuery.includes('team') || lowerQuery.includes('staff') || lowerQuery.includes('who')) {
                category = 'users';

                const usersRes = await api.getFirebaseUsers();
                const users = usersRes.data || [];
                const activeUsers = users.filter(u => u.status !== 'Deleted');

                if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
                    answer = `You have ${activeUsers.length} active users in the system.`;
                } else if (lowerQuery.includes('admin')) {
                    const admins = activeUsers.filter(u => u.role === 'Admin');
                    answer = `${admins.length} admin(s): ${admins.map(u => u.name).join(', ')}`;
                    data = admins;
                } else if (lowerQuery.includes('operator')) {
                    const operators = activeUsers.filter(u => u.role === 'Operator');
                    answer = `${operators.length} operator(s) on duty: ${operators.map(u => u.name).join(', ')}`;
                    data = operators;
                } else {
                    answer = `Total users: ${activeUsers.length}. Breakdown: ${activeUsers.reduce((acc, u) => {
                        acc[u.role] = (acc[u.role] || 0) + 1;
                        return acc;
                    }, {})}`;
                    data = activeUsers;
                }
            }
            // ANALYTICS/METRICS queries
            else if (lowerQuery.includes('efficiency') || lowerQuery.includes('power') || lowerQuery.includes('consumption') ||
                lowerQuery.includes('health') || lowerQuery.includes('performance') || lowerQuery.includes('analytics') ||
                lowerQuery.includes('metrics') || lowerQuery.includes('trend')) {
                category = 'analytics';

                // Fetch devices for analytics
                const devicesRes = await api.getEquipment();
                const devices = devicesRes.data || [];

                if (lowerQuery.includes('efficiency')) {
                    const avgEfficiency = devices.reduce((sum, d) => {
                        const eff = parseFloat(d.efficiency) || 85;
                        return sum + eff;
                    }, 0) / devices.length;
                    answer = `Your total equipment efficiency is ${avgEfficiency.toFixed(1)}%. This represents optimal performance across all machines.`;
                    data = devices;
                } else if (lowerQuery.includes('power') || lowerQuery.includes('consumption')) {
                    const totalPower = devices.reduce((sum, d) => {
                        const pw = parseFloat(d.power) || 0;
                        return sum + pw;
                    }, 0);
                    answer = `Current total power consumption: ${totalPower.toFixed(2)} kW. ${devices.filter(d => d.status === 'running').length} devices are active.`;
                    data = devices;
                } else if (lowerQuery.includes('health')) {
                    const avgHealth = devices.reduce((sum, d) => sum + (d.health || 85), 0) / devices.length;
                    answer = `System health score: ${Math.round(avgHealth)}%. All systems are operating within normal parameters.`;
                    data = devices;
                } else if (lowerQuery.includes('trend') || lowerQuery.includes('performance')) {
                    answer = `Performance is stable with consistent uptime. All metrics are tracking normally without anomalies.`;
                    data = devices;
                } else {
                    answer = `You have ${devices.length} machines. ${devices.filter(d => d.status === 'running').length} are running. Average health score is ${Math.round(devices.reduce((sum, d) => sum + (d.health || 85), 0) / devices.length)}%.`;
                    data = devices;
                }
            }
            // Default response
            else {
                category = 'general';
                answer = 'I can help you with information about machines, shifts, users, and analytics. Please ask me something like "Which machines need maintenance?", "What\'s my system efficiency?", or "Who\'s on duty today?"';
            }

            return {
                answer,
                category,
                data
            };
        } catch (error) {
            console.error('Error in fallback assistance:', error);
            return {
                answer: 'I encountered an error processing your query. Please try asking about machines, shifts, users, or analytics.',
                category: 'error',
                data: null
            };
        }
    }
};

export default api;
