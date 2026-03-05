import axios from 'axios';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, where, setDoc } from 'firebase/firestore';

const DEVICE_API = '/backend/device/api/v1';
const DATA_API = '/backend/data/api/v1/data';
const RULE_API = '/backend/rule-engine/api/v1';

// Helpers
const getStorage = (key, defaultVal) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
};

const setStorage = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
};

// Internal helper to calculate metrics based on raw telemetry
const calculateMetrics = (latest) => {
    if (!latest) return {};

    // Calculate realistic health based on metrics (matches backend logic)
    let calcHealth = 100;
    if (latest.temperature > 60) calcHealth -= (latest.temperature - 60) * 1.5;
    if (latest.vibration > 5) calcHealth -= (latest.vibration - 5) * 5;
    if (latest.pressure > 130) calcHealth -= (latest.pressure - 130);
    calcHealth = Math.max(0, Math.min(100, Math.round(calcHealth)));

    // Calculate realistic efficiency using Power Factor (Active / Apparent Power)
    // Formula: (Power in Watts) / (Voltage * Current)
    let calcEfficiency = 85;
    if (latest.voltage && latest.current && latest.current > 0) {
        const apparentPower = latest.voltage * latest.current;
        // Normal power factor for industrial motors is 0.7 to 0.9
        const powerFactor = latest.power / apparentPower;
        calcEfficiency = Math.round(powerFactor * 100);
        // Ensure it's in a realistic range (mostly between 70% and 98%)
        calcEfficiency = Math.max(0, Math.min(100, calcEfficiency));
    }

    return {
        power: latest.power,
        power_usage: latest.power,
        efficiency: latest.efficiency || calcEfficiency,
        health: latest.health || latest.health_score || calcHealth,
        healthScore: latest.health || latest.health_score || calcHealth,
        temp: latest.temperature,
        temperature: latest.temperature,
        vibration: latest.vibration,
        pressure: latest.pressure,
        voltage: latest.voltage,
        current: latest.current,
        timestamp: latest.timestamp,
        uptime: latest.uptime || 99.9,
        enrichment_status: latest.enrichment_status
    };
};

// Helper to fetch health score from backend for a specific telemetry packet
const fetchHealthScore = async (deviceId, latest) => {
    if (!latest) return null;
    try {
        const response = await axios.post(`${DEVICE_API}/devices/${deviceId}/health-score`, {
            values: {
                temperature: latest.temperature,
                pressure: latest.pressure,
                vibration: latest.vibration,
                voltage: latest.voltage,
                current: latest.current,
                power: latest.power
            },
            machine_state: "RUNNING"
        });
        return response.data?.health_score;
    } catch (e) {
        console.warn(`Could not compute health score for ${deviceId} via API`);
        return null;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // Equipment
    getEquipment: async () => {
        try {
            const response = await axios.get(`${DEVICE_API}/devices`);
            const devices = response.data.data || [];

            // Enrich with latest telemetry to populate Dashboard/List metrics
            const enrichedData = await Promise.all(devices.map(async (device) => {
                let telemetryData = {};
                try {
                    // ALERT: Must use limit=1 AND sort logic if API supports it, 
                    // or just ensure we get the latest based on timestamp.
                    // The data-service returns latest first by default if implemented correctly.
                    const telRes = await axios.get(`${DATA_API}/telemetry/${device.device_id}?limit=1`);
                    const items = telRes.data?.data?.items || telRes.data?.data || [];
                    if (items.length > 0) {
                        const latest = items[0];
                        telemetryData = calculateMetrics(latest);

                        // Try to get real health score from API
                        const apiHealth = await fetchHealthScore(device.device_id, latest);
                        if (apiHealth !== null) {
                            telemetryData.health = apiHealth;
                            telemetryData.healthScore = apiHealth;
                        }
                    }
                } catch (e) {
                    console.warn(`Could not fetch latest telemetry for ${device.device_id}`);
                }

                return {
                    ...device,
                    ...telemetryData,
                    id: device.device_id,
                    name: device.device_name,
                    type: device.device_type,
                    status: device.runtime_status || device.legacy_status || 'Unknown'
                };
            }));

            return { ...response.data, data: enrichedData };
        } catch (error) {
            console.error("Error fetching equipment:", error);
            throw error;
        }
    },
    getEquipmentById: async (id) => {
        try {
            const response = await axios.get(`${DEVICE_API}/devices/${id}`);
            const device = response.data.data;

            // Enrich with latest telemetry
            let telemetryStats = {};
            try {
                const telRes = await axios.get(`${DATA_API}/telemetry/${id}?limit=1`);
                const items = telRes.data?.data?.items || telRes.data?.data || [];
                if (items.length > 0) {
                    const latest = items[0];
                    telemetryStats = calculateMetrics(latest);

                    // Try to get real health score from API
                    const apiHealth = await fetchHealthScore(id, latest);
                    if (apiHealth !== null) {
                        telemetryStats.health = apiHealth;
                        telemetryStats.healthScore = apiHealth;
                    }
                }
            } catch (e) {
                console.warn(`Could not fetch latest telemetry for ${id}`);
            }

            return {
                data: {
                    ...device,
                    ...telemetryStats,
                    id: device.device_id,
                    name: device.device_name,
                    type: device.device_type,
                    status: device.runtime_status || device.legacy_status || 'Unknown',
                    telemetry: []
                }
            };
        } catch (error) {
            console.error(`Error fetching device ${id}:`, error);
            throw error;
        }
    },

    // Telemetry
    getTelemetry: async (equipmentId) => {
        try {
            const response = await axios.get(`${DATA_API}/telemetry/${equipmentId}`);
            let items = [];
            if (response.data?.data?.items) items = response.data.data.items;
            else if (Array.isArray(response.data?.data)) items = response.data.data;
            else if (Array.isArray(response.data)) items = response.data;

            // Enrich historical points with calculated metrics
            // (We keep using calculateMetrics here for performance)
            const enrichedItems = items.map(item => calculateMetrics(item));

            return { data: enrichedItems };
        } catch (error) {
            console.error(`Error fetching telemetry for ${equipmentId}:`, error);
            return { data: [] };
        }
    },

    // Rules
    getRules: async () => {
        try {
            const response = await axios.get(`${RULE_API}/rules`);
            const items = response.data?.data || [];

            // Map backend rules to frontend schema
            const mappedRules = items.map(r => {
                const metricDisplay = r.property ? (r.property.charAt(0).toUpperCase() + r.property.slice(1)) : 'Temperature';
                let opDisplay = r.condition || '>';
                if (opDisplay === '=') opDisplay = '==';

                const conditionString = `${metricDisplay} ${opDisplay} ${r.threshold}`;
                let devicesDisplay = "All Machines";
                if (r.scope === 'selected_devices' && r.device_ids && r.device_ids.length > 0) {
                    devicesDisplay = r.device_ids.join(', ');
                }

                return {
                    id: r.rule_id,
                    name: r.rule_name,
                    devices: devicesDisplay,
                    condition: conditionString,
                    status: r.status === 'active' ? 'Active' : 'Paused',
                    type: ['temperature', 'pressure'].includes((r.property || '').toLowerCase()) ? 'danger' : 'warning',
                    icon: (r.property || '').toLowerCase() === 'temperature' ? 'Flame' : ((r.property || '').toLowerCase() === 'pressure' ? 'Droplet' : 'Zap'),
                    metric: metricDisplay,
                    operator: opDisplay,
                    value: r.threshold,
                    target: r.scope === 'all_devices' ? 'All Machines' : 'Specific Devices',
                    conditions: [{ metric: metricDisplay, operator: opDisplay, value: r.threshold, logic: 'AND' }]
                };
            });

            return { data: mappedRules };
        } catch (error) {
            console.error("Error fetching rules:", error);
            return { data: [] };
        }
    },

    createRule: async (ruleData) => {
        // Map frontend ruleData to backend RuleCreate schema
        const scope = ruleData.target === 'All Machines' ? 'all_devices' : 'selected_devices';
        let device_ids = [];
        if (scope === 'selected_devices' && ruleData.devices) {
            device_ids = [ruleData.devices.split('-')[0]];
        }

        let op = ruleData.operator;
        if (op === '==') op = '=';

        const backendPayload = {
            rule_name: ruleData.name,
            description: ruleData.condition || "Created via UI",
            scope: scope,
            property: ruleData.metric ? ruleData.metric.toLowerCase() : "temperature",
            condition: op || ">",
            threshold: parseFloat(ruleData.value) || 0.0,
            notification_channels: ["email"],
            cooldown_minutes: 15,
            device_ids: device_ids
        };

        const response = await axios.post(`${RULE_API}/rules`, backendPayload);
        const createdRule = response.data.data || response.data;

        return {
            data: {
                ...ruleData,
                id: createdRule.rule_id,
                status: 'Active'
            }
        };
    },

    updateRule: async (id, ruleData) => {
        const scope = ruleData.target === 'All Machines' ? 'all_devices' : 'selected_devices';
        let device_ids = [];
        if (scope === 'selected_devices' && ruleData.devices) {
            device_ids = [ruleData.devices.split('-')[0]];
        }

        let op = ruleData.operator;
        if (op === '==') op = '=';

        const backendPayload = {
            rule_name: ruleData.name,
            description: ruleData.condition,
            scope: scope,
            property: ruleData.metric ? ruleData.metric.toLowerCase() : "temperature",
            condition: op || ">",
            threshold: parseFloat(ruleData.value) || 0.0,
            notification_channels: ["email"],
            device_ids: device_ids
        };

        // Do PUT
        await axios.put(`${RULE_API}/rules/${id}`, backendPayload);

        // Do PATCH for status if status is provided in ruleData
        if (ruleData.status) {
            const statusVal = ruleData.status === 'Active' ? 'active' : 'paused';
            await axios.patch(`${RULE_API}/rules/${id}/status`, { status: statusVal });
        }

        return { data: ruleData };
    },

    deleteRule: async (id) => {
        const response = await axios.delete(`${RULE_API}/rules/${id}`);
        return response.data;
    },

    // Users (Firestore)
    getUsers: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return { data: users };
        } catch (error) {
            console.error("Error fetching users:", error);
            // Fallback for demo
            return {
                data: [
                    { id: 1, name: 'Manash Ray', email: 'manash.ray@cittagent.com', role: 'Admin', status: 'Active', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                    { id: 2, name: 'Marcus Wong', email: 'marcus@factoryx.com', role: 'Operator', status: 'Active', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' }
                ]
            };
        }
    },

    // Authentication (Firebase)
    login: async (credentials) => {
        try {
            let userData = null;

            // 1. Email/Password Login
            if (credentials.email && credentials.password) {
                const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
                const user = userCredential.user;

                // Fetch extra user details from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    userData = { id: user.uid, ...userDoc.data() };
                } else {
                    // Fallback if no firestore doc exists yet
                    userData = {
                        id: user.uid,
                        email: user.email,
                        name: user.displayName || user.email.split('@')[0],
                        role: 'User',
                        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=random`
                    };
                }
            }
            // 2. PIN Login (Mock implementation for now connecting to Firestore)
            // PRD Requirement: PIN based login by looking up employee ID
            // In a real app, this would be a cloud function to verify PIN securely.
            else if (credentials.employeeId && credentials.pin) {
                const q = query(collection(db, "users"), where("employeeId", "==", credentials.employeeId));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw { response: { data: { detail: 'Invalid Employee ID' } } };
                }

                let foundUser = null;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // START VERY INSECURE: Checking plain text PIN on client side for MVP demo
                    // TODO: Move to Cloud Function
                    if (String(data.pin) === String(credentials.pin)) {
                        foundUser = { id: doc.id, ...data };
                    }
                });

                if (!foundUser) {
                    throw { response: { data: { detail: 'Invalid PIN' } } };
                }
                userData = foundUser;
            } else {
                throw { response: { data: { detail: 'Missing credentials' } } };
            }

            return { data: userData };

        } catch (error) {
            console.error("Firebase Login Error:", error);
            // Map Firebase errors to user friendly messages
            let msg = 'Login failed';
            if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';
            if (error.code === 'auth/user-not-found') msg = 'User not found';
            if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
            if (error.response?.data?.detail) msg = error.response.data.detail;

            throw { response: { data: { detail: msg } } };
        }
    },

    // Register (Firebase)
    register: async (userData) => {
        console.log("Starting registration for:", userData.email);
        try {
            // 1. Create Auth User
            console.log("Calling createUserWithEmailAndPassword...");
            const { email, password, name, org, role = 'Worker' } = userData;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created in Auth:", userCredential.user.uid);
            const user = userCredential.user;

            // 2. Create User Profile in Firestore
            const newProfile = {
                name,
                email,
                org,
                role,
                status: 'Active',
                createdAt: new Date().toISOString(),
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            };

            console.log("Saving profile to Firestore...");
            await setDoc(doc(db, "users", user.uid), newProfile);
            console.log("Profile saved successfully.");

            // Force sign out so user has to log in manually
            await signOut(auth);

            return {
                data: {
                    id: user.uid,
                    ...newProfile,
                    token: await user.getIdToken()
                }
            };

        } catch (error) {
            console.error("Firebase Registration Error Details:", error);
            let msg = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') msg = 'Email already in use';
            if (error.code === 'auth/weak-password') msg = 'Password is too weak';
            if (error.code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
            throw { response: { data: { detail: msg + ` (${error.code})` } } };
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            return { success: true }
        } catch (error) {
            console.error("Logout failed", error);
            throw error;
        }
    },

    // Chatbot
    chat: async (message) => {
        try {
            const lowerMsg = message.toLowerCase();

            // 1. Fetch devices to have context
            const devicesRes = await axios.get(`${DEVICE_API}/devices`);
            const devices = devicesRes.data?.data || [];

            // 2. Try to identify a specific device mentioned
            const mentionedDevice = devices.find(d =>
                lowerMsg.includes(d.device_id.toLowerCase()) ||
                lowerMsg.includes(d.device_name.toLowerCase())
            );

            let response = "";

            // 3. Operational Logic Router
            if (lowerMsg.includes('shift')) {
                if (mentionedDevice) {
                    const shiftRes = await axios.get(`${DEVICE_API}/devices/${mentionedDevice.device_id}/shifts`);
                    const shifts = shiftRes.data?.data || [];
                    if (shifts.length > 0) {
                        const shiftDetails = shifts.map(s => `• **${s.shift_name}**: ${s.shift_start} - ${s.shift_end}`).join('\n');
                        response = `The shift schedule for **${mentionedDevice.device_name}** is:\n${shiftDetails}`;
                    } else {
                        response = `There are no specific shifts configured for **${mentionedDevice.device_name}** yet.`;
                    }
                } else {
                    response = "Which machine are you asking about? I can show shifts for Boiler-04, D6, etc.";
                }
            }
            else if (lowerMsg.includes('uptime')) {
                if (mentionedDevice) {
                    const uptimeRes = await axios.get(`${DEVICE_API}/devices/${mentionedDevice.device_id}/uptime`);
                    const u = uptimeRes.data;
                    if (u.uptime_percentage !== null) {
                        response = `The current uptime for **${mentionedDevice.device_name}** is **${u.uptime_percentage}%** based on ${u.shifts_configured} configured shifts.`;
                    } else {
                        response = `Uptime for **${mentionedDevice.device_name}** is not yet calculated (Requires shift configuration). ${u.message}`;
                    }
                } else {
                    response = "Please specify a machine ID or name to check Its uptime (e.g., 'Uptime for Boiler-04').";
                }
            }
            else if (lowerMsg.includes('status') || lowerMsg.includes('health') || lowerMsg.includes('how is')) {
                if (mentionedDevice) {
                    // Get latest telemetry for this device
                    const telRes = await axios.get(`${DATA_API}/telemetry/${mentionedDevice.device_id}?limit=1`);
                    const latest = (telRes.data?.data?.items || telRes.data?.data || [])[0];

                    if (latest) {
                        const metrics = calculateMetrics(latest);
                        response = `**${mentionedDevice.device_name}** is currently **${mentionedDevice.runtime_status || 'Online'}**.\n• Health: ${metrics.health}%\n• Efficiency: ${metrics.efficiency}%\n• Temp: ${metrics.temp}°C\n• Power: ${metrics.power}W`;
                    } else {
                        response = `**${mentionedDevice.device_name}** is registered but I haven't received any telemetry data recently.`;
                    }
                } else if (lowerMsg.includes('overall') || lowerMsg.includes('factory') || lowerMsg.includes('all')) {
                    const totals = await api.getEquipment();
                    const avgH = Math.round(totals.data.reduce((acc, d) => acc + (Number(d.health) || 0), 0) / totals.data.length);
                    const avgE = Math.round(totals.data.reduce((acc, d) => acc + (Number(d.efficiency) || 0), 0) / totals.data.length);
                    response = `Factory Overview:\n• Total Machines: ${totals.data.length}\n• System Health: ${avgH}%\n• Avg Efficiency: ${avgE}%`;
                } else {
                    response = "I can give you the status of specific machines or an overall factory summary. Try 'Status of Boiler-04' or 'Factory health'.";
                }
            }
            else if (lowerMsg.includes('maintenance')) {
                const warns = devices.filter(d => (d.health < 70 || d.runtime_status === 'Warning' || d.runtime_status === 'Critical'));
                if (warns.length > 0) {
                    const list = warns.map(d => `• **${d.device_name}** (Health: ${d.health || '??'}%)`).join('\n');
                    response = `The following machines need attention:\n${list}`;
                } else {
                    response = "All systems are currently operating within nominal parameters. No immediate maintenance required.";
                }
            }
            else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
                response = "Hello! I'm your FactoryOps assistant. Ask me about machine status, shifts, or uptime. For example: 'What are the shifts for D6?'";
            }
            else {
                response = "I can help with operational queries. Try asking about:\n• **Machine Status**: 'Status of Boiler-04'\n• **Shifts**: 'Are there any shifts for D6?'\n• **Uptime**: 'Uptime for Boiler-01'\n• **Maintenance**: 'Which machines need help?'";
            }

            return {
                data: {
                    reply: response,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error("Chatbot logic error:", error);
            return {
                data: {
                    reply: "I encountered an error while fetching live factory data. Please ensure all backend services are reachable.",
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
};

export default api;
