import { mockDevices } from '../data/mockDevices';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, where, setDoc } from 'firebase/firestore';

// Helper to get from storage or default (Legacy for Rules until migrated)
const getStorage = (key, defaultVal) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultVal;
};

// Helper to set storage
const setStorage = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // Equipment (Mock for now)
    getEquipment: async () => {
        await delay(500);
        return { data: mockDevices };
    },
    getEquipmentById: async (id) => {
        await delay(300);
        const device = mockDevices.find(d => d.id === id || d.fullId === id);
        if (!device) throw new Error("Device not found");
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

    // Rules (LocalStorage for now)
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
