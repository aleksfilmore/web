// Comprehensive Netlify Environment Variables Test
// Tests all required environment variables for the admin dashboard

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const testResults = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        tests: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        }
    };

    // Helper function to test environment variable
    function testEnvVar(name, description, required = true, validator = null) {
        testResults.summary.total++;
        const value = process.env[name];
        const test = {
            description,
            required,
            exists: !!value,
            hasValue: !!(value && value.trim()),
            value: value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null,
            status: 'unknown'
        };

        if (!value) {
            test.status = required ? 'fail' : 'warning';
            test.message = required ? 'Missing required environment variable' : 'Optional variable not set';
            if (required) testResults.summary.failed++;
            else testResults.summary.warnings++;
        } else if (!value.trim()) {
            test.status = required ? 'fail' : 'warning';
            test.message = 'Environment variable is empty';
            if (required) testResults.summary.failed++;
            else testResults.summary.warnings++;
        } else {
            // Run custom validator if provided
            if (validator) {
                try {
                    const validationResult = validator(value);
                    if (validationResult === true) {
                        test.status = 'pass';
                        test.message = 'Valid';
                        testResults.summary.passed++;
                    } else {
                        test.status = 'fail';
                        test.message = validationResult || 'Validation failed';
                        testResults.summary.failed++;
                    }
                } catch (error) {
                    test.status = 'fail';
                    test.message = `Validation error: ${error.message}`;
                    testResults.summary.failed++;
                }
            } else {
                test.status = 'pass';
                test.message = 'Present and non-empty';
                testResults.summary.passed++;
            }
        }

        testResults.tests[name] = test;
    }

    console.log('Testing Netlify environment variables...');

    // Test Stripe variables
    testEnvVar('STRIPE_SECRET_KEY', 'Stripe Secret Key for payment processing', true, (value) => {
        if (!value.startsWith('sk_')) return 'Should start with "sk_"';
        if (value.includes('test') && !value.includes('live')) return 'Using test key (expected for development)';
        return true;
    });

    testEnvVar('STRIPE_PUBLISHABLE_KEY', 'Stripe Publishable Key for frontend', false, (value) => {
        if (!value.startsWith('pk_')) return 'Should start with "pk_"';
        return true;
    });

    // Test Google Analytics variables
    testEnvVar('GA_PROPERTY_ID', 'Google Analytics Property ID', false, (value) => {
        if (!/^\d+$/.test(value)) return 'Should be numeric';
        return true;
    });

    testEnvVar('GA_CLIENT_EMAIL', 'Google Analytics Service Account Email', false, (value) => {
        if (!value.includes('@') || !value.includes('.iam.gserviceaccount.com')) {
            return 'Should be a service account email';
        }
        return true;
    });

    testEnvVar('GA_PRIVATE_KEY', 'Google Analytics Service Account Private Key', false, (value) => {
        if (!value.includes('BEGIN PRIVATE KEY')) return 'Should contain private key data';
        return true;
    });

    // Test MailerLite variables
    testEnvVar('MAILERLITE_API_KEY', 'MailerLite API Key for newsletter management', false);

    // Test Resend variables
    testEnvVar('RESEND_API_KEY', 'Resend API Key for email sending', false, (value) => {
        if (!value.startsWith('re_')) return 'Should start with "re_"';
        return true;
    });

    // Test Admin Authentication variables
    testEnvVar('ADMIN_PASSWORD_HASH', 'Hashed admin password for authentication', true);
    testEnvVar('JWT_SECRET', 'JWT secret for token signing', true, (value) => {
        if (value.length < 32) return 'Should be at least 32 characters long for security';
        return true;
    });

    // Test database/storage variables (if used)
    testEnvVar('DATABASE_URL', 'Database connection string', false);
    testEnvVar('SUPABASE_URL', 'Supabase project URL', false);
    testEnvVar('SUPABASE_ANON_KEY', 'Supabase anonymous key', false);

    // Test any custom variables
    testEnvVar('NODE_ENV', 'Node environment', false, (value) => {
        const validEnvs = ['development', 'production', 'test', 'staging'];
        if (!validEnvs.includes(value)) return `Should be one of: ${validEnvs.join(', ')}`;
        return true;
    });

    // Calculate overall status
    const overallStatus = testResults.summary.failed === 0 ? 
        (testResults.summary.warnings === 0 ? 'pass' : 'warning') : 'fail';

    testResults.summary.status = overallStatus;
    testResults.summary.message = 
        `${testResults.summary.passed} passed, ${testResults.summary.failed} failed, ${testResults.summary.warnings} warnings`;

    // Add recommendations
    testResults.recommendations = [];

    if (testResults.tests.STRIPE_SECRET_KEY?.status === 'fail') {
        testResults.recommendations.push('Configure Stripe Secret Key to enable payment processing');
    }

    if (testResults.tests.GA_PROPERTY_ID?.status === 'fail') {
        testResults.recommendations.push('Configure Google Analytics to enable website analytics');
    }

    if (testResults.tests.MAILERLITE_API_KEY?.status === 'fail') {
        testResults.recommendations.push('Configure MailerLite API to enable newsletter management');
    }

    if (testResults.tests.ADMIN_PASSWORD_HASH?.status === 'fail') {
        testResults.recommendations.push('Configure admin password hash for authentication security');
    }

    if (testResults.tests.JWT_SECRET?.status === 'fail') {
        testResults.recommendations.push('Configure JWT secret for secure token authentication');
    }

    console.log('Environment variables test completed:', testResults.summary);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(testResults)
    };
};
