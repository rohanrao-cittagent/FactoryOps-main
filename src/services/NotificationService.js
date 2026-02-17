import emailjs from '@emailjs/browser';

export const NotificationService = {
    sendEmail: async (to, subject, body) => {
        // Retrieve current recipient from localStorage if 'to' is not provided or is generic
        let recipient = to;
        const savedUser = localStorage.getItem('factoryops_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            recipient = user.email || to;
        }

        console.log(`%c[NOTIFICATION]%c Attempting to send email to: ${recipient}`,
            'color: #3b82f6; font-weight: bold;', 'color: inherit;');

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        // Check for missing or placeholder credentials to enable Simulation Mode
        const isPlaceholder = (val) => !val || val.includes('your_');

        if (isPlaceholder(serviceId) || isPlaceholder(templateId) || isPlaceholder(publicKey)) {
            console.warn('[SIMULATION MODE] EmailJS credentials are missing or placeholders. Falling back to console log.');
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log(`[SIMULATED EMAIL] To: ${recipient}, Subject: ${subject}`);
                    resolve({ success: true, message: 'Simulated email sent (Update .env for real delivery)' });
                }, 800);
            });
        }

        try {
            const result = await emailjs.send(
                serviceId,
                templateId,
                {
                    // Core fields
                    to_email: recipient,     // Standard variable
                    to_name: savedUser ? JSON.parse(savedUser).name : 'Operator',

                    // Fallback fields - one of these should match your template "To Email"
                    email: recipient,        // Common alternative
                    reply_to: recipient,     // Another common one

                    // Template Specific Mappings
                    name: savedUser ? JSON.parse(savedUser).name : 'Operator',
                    title: subject, // "We have received your request: [Subject]"

                    // Content
                    from_name: 'Cittagent',
                    company_name: 'Cittagent', // Common variable for "[Company Name]"
                    subject: subject,
                    // Content - Mapping to common default template variables
                    message: body,
                    content: body,
                    details: body,
                    feedback: body,
                    request: body,   // Likely what your template uses based on "received your request"
                    notes: body,

                    user_name: savedUser ? JSON.parse(savedUser).name : 'Operator'
                },
                publicKey
            );
            return { success: true, message: 'Real email delivered successfully', data: result };
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw new Error('Failed to deliver real email. Check your .env configuration.');
        }
    }
};
