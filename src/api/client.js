import { mockDevices } from '../data/mockDevices';

// Mock Client Implementation
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get from storage or default
const getStorage = (key, defaultVal) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
};

// Helper to set storage
const setStorage = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
};

export const api = {
    // Equipment
    getEquipment: async () => {
        await delay(500);
        return { data: mockDevices };
    },
    getEquipmentById: async (id) => {
        await delay(300);
        const device = mockDevices.find(d => d.id === id || d.fullId === id);
        if (!device) throw new Error("Device not found");
        // Add dummy telemetry to device for details page
        return {
            data: {
                ...device,
                telemetry: Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
                    pressure: device.metrics?.pressure?.value || 100,
                    temperature: device.metrics?.temperature?.value || 80,
                    vibration: device.metrics?.vibration?.value || 2,
                    power_consumption: device.metrics?.power?.value || 5,
                    efficiency_pct: device.efficiency || 85
                }))
            }
        };
    },

    // Telemetry (Mock data)
    getTelemetry: async (equipmentId) => {
        await delay(300);
        return {
            data: Array.from({ length: 50 }, (_, i) => ({
                id: i,
                timestamp: new Date(Date.now() - i * 60000).toISOString(),
                pressure: 120 + Math.random() * 10,
                temperature: 85 + Math.random() * 5,
                vibration: 2 + Math.random(),
                power_consumption: 10 + Math.random() * 2,
                efficiency_pct: 90 + Math.random() * 5
            }))
        };
    },

    // Rules
    getRules: async () => {
        await delay(400);
        const rules = getStorage('factoryops_rules', []);
        return { data: rules };
    },

    createRule: async (ruleData) => {
        await delay(600);
        const rules = getStorage('factoryops_rules', []);
        const newRule = { ...ruleData, id: Date.now(), status: 'Active' };
        rules.push(newRule);
        setStorage('factoryops_rules', rules);
        return { data: newRule };
    },

    updateRule: async (id, ruleData) => {
        await delay(400);
        let rules = getStorage('factoryops_rules', []);
        rules = rules.map(r => r.id === id ? { ...r, ...ruleData } : r);
        setStorage('factoryops_rules', rules);
        return { data: { ...ruleData, id } };
    },

    deleteRule: async (id) => {
        await delay(300);
        let rules = getStorage('factoryops_rules', []);
        rules = rules.filter(r => r.id !== id);
        setStorage('factoryops_rules', rules);
        return { data: { success: true } };
    },

    // Users
    getUsers: async () => {
        await delay(400);
        return {
            data: [
                { id: 1, name: 'Manash Ray', email: 'manash.ray@cittagent.com', role: 'Admin', status: 'Active', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                { id: 2, name: 'Marcus Wong', email: 'marcus@factoryx.com', role: 'Operator', status: 'Active', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' }
            ]
        };
    },

    // Authentication
    login: async (credentials) => {
        await delay(800);
        if (credentials.email === 'fail@test.com') {
            throw { response: { data: { detail: 'Invalid credentials' } } };
        }


        // Generate name from email
        const namePart = credentials.email.split('@')[0];
        const formattedName = namePart
            .split(/[._]/) // Split by . or _
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        return {
            data: {
                id: 1,
                name: formattedName,
                email: credentials.email,
                role: 'Administrator',
                token: 'mock-jwt-token-123',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`
            }
        };
    },

    // Chatbot
    chat: async (message) => {
        await delay(600 + Math.random() * 600); // Simulate thinking

        const lowerMsg = message.toLowerCase();
        let response = "I'm not sure about that specific detail. Try asking about **machine status**, **power**, **production**, or **safety**.";

        // Keywords
        const isStatus = lowerMsg.includes('status') || lowerMsg.includes('health') || lowerMsg.includes('condition');
        const isPower = lowerMsg.includes('power') || lowerMsg.includes('energy') || lowerMsg.includes('consumption');
        const isProd = lowerMsg.includes('production') || lowerMsg.includes('output') || lowerMsg.includes('yield');

        // Machine Detection
        const isD1 = lowerMsg.includes('d1') || lowerMsg.includes('compressor-01') || lowerMsg.includes('compressor 1');
        const isD2 = lowerMsg.includes('d2') || lowerMsg.includes('compressor-02') || lowerMsg.includes('compressor 2');
        const isD3 = lowerMsg.includes('d3') || lowerMsg.includes('boiler') || lowerMsg.includes('boiler-03');

        // Logic Router
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
            response = "Hello! I'm your FactoryOps assistant. I can help with machine status, production stats, and safety alerts.";
        }

        // Machine Specific Queries
        else if (isD1) {
            if (isStatus) response = "**Compressor-01** (D1) is **Running** normally with 92% health.";
            else if (isPower) response = "**Compressor-01** is consuming **4.2 kW** (Optimal).";
            else if (isProd || lowerMsg.includes('efficiency')) response = "**Compressor-01** is running at **87% efficiency**.";
            else response = "**Compressor-01** is online and operating within normal parameters.";
        }
        else if (isD2) {
            if (isStatus) response = "⚠️ **Compressor-02** (D2) exceeds vibration limits (5.1 MM/S). User attention required.";
            else if (isPower) response = "**Compressor-02** is consuming **3.8 kW**.";
            else if (isProd || lowerMsg.includes('efficiency')) response = "**Compressor-02** efficiency has dropped to **62%** due to vibration issues.";
            else response = "⚠️ **Compressor-02** is in a **Warning** state. Please check vibration levels.";
        }
        else if (isD3) {
            if (isStatus) response = "**Boiler-03** (D3) is **Running** at 78% health. Pressure is stable at 95 PSI.";
            else if (isPower) response = "**Boiler-03** is consuming **12.5 kW**.";
            else response = "**Boiler-03** is operating normally. Scheduled maintenance is due on Friday.";
        }

        // General Queries
        else if (lowerMsg.includes('offline') || lowerMsg.includes('down') || lowerMsg.includes('warning')) {
            response = "Currently, **Compressor-02** is in **Warning** state. All other systems are nominal.";
        }
        else if (isPower) {
            response = "Total plant power consumption is **20.5 kW**.\n• Compressor-01: 4.2 kW\n• Compressor-02: 3.8 kW\n• Boiler-03: 12.5 kW";
        }
        else if (lowerMsg.includes('supervisor') || lowerMsg.includes('contact')) {
            response = "The current shift supervisor is **Sarah Chen** (Ext. 4022).";
        }
        else if (isProd) {
            response = "Current output is **1,240 units/hour** (98% of target). Daily quota: 10,000 units.";
        }
        else if (lowerMsg.includes('safety') || lowerMsg.includes('accident') || lowerMsg.includes('incident')) {
            response = "⚠️ **Safety Alert**: High vibration detected in **Compressor-02**. Maintenance team notified.";
        }
        else if (lowerMsg.includes('maintenance') || lowerMsg.includes('ticket')) {
            response = "Active Tickets:\n1. Compressor-02 (Vibration) - Urgent\n2. Boiler-03 (Inspection) - Friday";
        }
        else if (lowerMsg.includes('efficiency')) {
            response = "Average Plant Efficiency: **89%**.\nTop: Compressor-01 (87%)\nLow: Compressor-02 (62%)";
        }
        else if (isStatus) {
            response = "System Status:\n✅ Compressor-01: Online\n⚠️ Compressor-02: Warning\n✅ Boiler-03: Online";
        }

        return {
            data: {
                reply: response,
                timestamp: new Date().toISOString()
            }
        };
    }
};

export default api;
