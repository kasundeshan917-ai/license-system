exports.handler = async function(event, context) {
    const path = event.path;
    const method = event.httpMethod;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-auth-token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // ===== HEALTH CHECK =====
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

    // ===== TEST ROUTE =====
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

    // ===== REGISTER =====
    if (path.includes('/auth/register')) {
        if (method === 'POST') {
            try {
                const body = JSON.parse(event.body);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        token: 'test-token-123',
                        user: {
                            id: 1,
                            username: body.username || 'testuser',
                            email: body.email || 'test@email.com',
                            role: 'user'
                        }
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

    // ===== LOGIN =====
    if (path.includes('/auth/login')) {
        if (method === 'POST') {
            try {
                const body = JSON.parse(event.body);
                // Check for admin login
                if (body.email === 'admin@license.com' && body.password === 'Admin@123') {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            token: 'admin-token-123',
                            user: {
                                id: 1,
                                username: 'admin',
                                email: 'admin@license.com',
                                role: 'admin'
                            }
                        })
                    };
                }
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        token: 'test-token-123',
                        user: {
                            id: 1,
                            username: 'testuser',
                            email: body.email || 'test@email.com',
                            role: 'user'
                        }
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

    // ===== GET USER =====
    if (path.includes('/auth/me')) {
        const token = event.headers['x-auth-token'];
        if (!token) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'No token' })
            };
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: 1,
                username: 'admin',
                email: 'admin@license.com',
                role: 'admin',
                created_at: new Date().toISOString()
            })
        };
    }

    // ===== GENERATE LICENSE =====
    if (path.includes('/license/generate')) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                license_key: 'ABCDE-FGHIJ-KLMNO-PQRST',
                expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString()
            })
        };
    }

    // ===== GET LICENSES =====
    if (path.includes('/license/my-licenses')) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify([
                {
                    id: 1,
                    license_key: 'ABCDE-FGHIJ-KLMNO-PQRST',
                    status: 'active',
                    expires_at: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
                    created_at: new Date().toISOString()
                }
            ])
        };
    }

    // ===== ADMIN - GET USERS =====
    if (path.includes('/admin/users')) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify([
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@license.com',
                    role: 'admin',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'testuser',
                    email: 'test@email.com',
                    role: 'user',
                    created_at: new Date().toISOString()
                }
            ])
        };
    }

    // ===== 404 =====
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