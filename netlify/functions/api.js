exports.handler = async function(event, context) {
    const path = event.path;
    const method = event.httpMethod;
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-auth-token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle OPTIONS (CORS preflight)
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Health check
    if (path === '/.netlify/functions/api/health' || path === '/api/health') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'healthy',
                message: 'API is working!',
                timestamp: new Date().toISOString()
            })
        };
    }
    
    // Test route
    if (path === '/.netlify/functions/api/test' || path === '/api/test') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Test route is working!',
                method: method,
                path: path
            })
        };
    }
    
    // Register
    if (path === '/.netlify/functions/api/auth/register' || path === '/api/auth/register') {
        if (method === 'POST') {
            try {
                const body = JSON.parse(event.body);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Register endpoint working!',
                        data: body
                    })
                };
            } catch (err) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid JSON' })
                };
            }
        }
    }
    
    // Login
    if (path === '/.netlify/functions/api/auth/login' || path === '/api/auth/login') {
        if (method === 'POST') {
            try {
                const body = JSON.parse(event.body);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login endpoint working!',
                        data: body
                    })
                };
            } catch (err) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid JSON' })
                };
            }
        }
    }
    
    // 404
    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
            error: 'Not found',
            path: path,
            method: method
        })
    };
};