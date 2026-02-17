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
        return {
            data: {
                id: 1,
                name: 'Manash (Admin)',
                email: credentials.email,
                role: 'Administrator',
                token: 'mock-jwt-token-123'
            }
        };
    }
};

export default api;
