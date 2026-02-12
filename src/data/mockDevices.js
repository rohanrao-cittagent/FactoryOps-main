export const mockDevices = [
    {
        id: 'D1',
        fullId: 'CTG-D1-2023-8872',
        name: 'Compressor-01',
        status: 'Running',
        health: 92,
        type: 'Rotary Screw Compressor',
        manufacturer: 'Atlas Copco',
        model: 'GA90+ VSD',
        uptime: '99.2% (30 days)',
        location: 'Building A, Section 3',
        metrics: {
            pressure: { value: 125, unit: 'PSI', min: 110, max: 130, optimal: '115-125', percent: 75 },
            temperature: { value: 87, unit: '°C', min: 75, max: 95, optimal: '80-90', percent: 65 },
            vibration: { value: 3.2, unit: 'MM/S', min: 1.8, max: 4.5, optimal: '4.0', percent: 45 },
            power: { value: 4.2, unit: 'kW', min: 2.1, max: 5.8, optimal: '3.9', percent: 70 }
        },
        efficiency: 87,
        power: 4.2
    },
    {
        id: 'D2',
        fullId: 'CTG-D2-2023-8873',
        name: 'Compressor-02',
        status: 'Warning',
        health: 45,
        type: 'Rotary Screw Compressor',
        manufacturer: 'Atlas Copco',
        model: 'GA90+ VSD',
        uptime: '85.4% (30 days)',
        location: 'Building A, Section 3',
        metrics: {
            pressure: { value: 132, unit: 'PSI', min: 110, max: 130, optimal: '115-125', percent: 95 },
            temperature: { value: 98, unit: '°C', min: 75, max: 95, optimal: '80-90', percent: 90 },
            vibration: { value: 5.1, unit: 'MM/S', min: 1.8, max: 4.5, optimal: '4.0', percent: 85 },
            power: { value: 3.8, unit: 'kW', min: 2.1, max: 5.8, optimal: '3.9', percent: 60 }
        },
        efficiency: 62,
        power: 3.8
    },
    {
        id: 'D3',
        fullId: 'BLR-D3-2023-9210',
        name: 'Boiler-03',
        status: 'Running',
        health: 78,
        type: 'Industrial Steam Boiler',
        manufacturer: 'Cleaver-Brooks',
        model: 'CBLE 700',
        uptime: '97.8% (30 days)',
        location: 'Building B, Section 1',
        metrics: {
            pressure: { value: 95, unit: 'PSI', min: 80, max: 120, optimal: '90-110', percent: 50 },
            temperature: { value: 142, unit: '°C', min: 120, max: 160, optimal: '135-155', percent: 75 },
            vibration: { value: 1.2, unit: 'MM/S', min: 0.5, max: 2.5, optimal: '2.0', percent: 35 },
            power: { value: 12.5, unit: 'kW', min: 8.5, max: 15.0, optimal: '12.0', percent: 65 }
        },
        efficiency: 91,
        power: 12.5,
        temp: 142
    }
];
