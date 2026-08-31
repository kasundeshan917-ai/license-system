// ============================================================
//  LICENSE SYSTEM - FRONTEND
//  Netlify Deployment - Full Version with Fixes
// ============================================================

// API URL - Netlify Functions
const API_URL = window.location.origin + '/.netlify/functions/api';

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const loginForm = $('loginForm');
const registerForm = $('registerForm');
const dashboard = $('dashboardSection');
const usersSection = $('usersSection');
const appsSection = $('appsSection');
const authSection = $('authSection');

// ===== AUTH =====
function getToken() { 
    return localStorage.getItem('token'); 
}

function setToken(t) { 
    if (t) {
        localStorage.setItem('token', t);
        console.log('✅ Token saved');
    } else {
        localStorage.removeItem('token');
        console.log('✅ Token removed');
    }
}

function getUserRole() { 
    return localStorage.getItem('userRole') || 'user'; 
}

function setUserRole(r) { 
    localStorage.setItem('userRole', r); 
}

async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['x-auth-token'] = token;
    
    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        console.log(`📡 ${method} ${endpoint}:`, result);
        return { response, result };
    } catch (error) {
        console.error('❌ API Error:', error);
        return { response: { ok: false }, result: { message: 'Network error' } };
    }
}

// ===== NAVIGATION =====
function showSection(section) {
    console.log('📍 Showing section:', section);
    
    // Hide all sections
    if (authSection) authSection.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    if (usersSection) usersSection.style.display = 'none';
    if (appsSection) appsSection.style.display = 'none';
    
    // Show selected section
    if (section === 'auth') {
        if (authSection) authSection.style.display = 'block';
    } else if (section === 'dashboard') {
        if (dashboard) dashboard.style.display = 'block';
    } else if (section === 'users') {
        if (usersSection) { 
            usersSection.style.display = 'block';
            loadAllUsers();
        }
    } else if (section === 'apps') {
        if (appsSection) { 
            appsSection.style.display = 'block';
            loadAllApps();
        }
    }
}

function showDashboard(user) {
    console.log('📊 Showing dashboard for:', user);
    
    // Check if user data is valid
    if (!user || !user.role) {
        console.error('❌ Invalid user data:', user);
        alert('Login failed: Invalid user data. Please try again.');
        setToken(null);
        showAuth();
        return;
    }
    
    setUserRole(user.role);
    showSection('dashboard');
    
    const usernameEl = $('username');
    if (usernameEl) usernameEl.textContent = user.username || user.email;
    
    // Show/hide auth buttons
    const loginBtn = $('loginBtn');
    const registerBtn = $('registerBtn');
    const logoutBtn = $('logoutBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    // Admin buttons
    const navUsers = $('navUsers');
    const navApps = $('navApps');
    const isAdmin = user.role === 'admin';
    if (navUsers) navUsers.style.display = isAdmin ? 'inline-block' : 'none';
    if (navApps) navApps.style.display = isAdmin ? 'inline-block' : 'none';
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[data-section="dashboard"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    loadLicenses();
    loadStats();
}

function showAuth() {
    console.log('🔐 Showing auth section');
    showSection('auth');
    
    const loginBtn = $('loginBtn');
    const registerBtn = $('registerBtn');
    const logoutBtn = $('logoutBtn');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    const navUsers = $('navUsers');
    const navApps = $('navApps');
    if (navUsers) navUsers.style.display = 'none';
    if (navApps) navApps.style.display = 'none';
}

// ===== DASHBOARD =====
async function loadLicenses() {
    console.log('📋 Loading licenses...');
    const { response, result } = await apiRequest('/license/my-licenses');
    const container = $('licenseList');
    if (!container) return;
    
    if (!response.ok) {
        container.innerHTML = `<p class="text-muted">Error: ${result.message || 'Could not load licenses'}</p>`;
        return;
    }
    if (result.length === 0) {
        container.innerHTML = '<p class="text-muted">No licenses yet. Generate one above!</p>';
        return;
    }
    container.innerHTML = result.map(l => `
        <div class="license-item">
            <span class="key">${l.license_key}</span>
            <div class="info">
                <span class="status ${l.status}">${l.status}</span>
                <span class="expires">Expires: ${new Date(l.expires_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

async function loadStats() {
    console.log('📊 Loading stats...');
    try {
        const { response, result } = await apiRequest('/license/my-licenses');
        const totalEl = $('totalLicenses');
        const activeEl = $('activeLicenses');
        
        if (response.ok && result) {
            if (totalEl) totalEl.textContent = result.length;
            if (activeEl) activeEl.textContent = result.filter(l => l.status === 'active').length;
        }
        
        // Total users (admin only)
        const { response: uRes, result: uResult } = await apiRequest('/admin/users');
        const usersEl = $('totalUsers');
        if (uRes.ok && usersEl) {
            usersEl.textContent = uResult.length;
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ===== USERS (Admin) =====
async function loadAllUsers() {
    console.log('👥 Loading users...');
    const { response, result } = await apiRequest('/admin/users');
    const container = $('usersList');
    if (!container) return;
    
    if (!response.ok) {
        container.innerHTML = `<p class="text-muted">Error: ${result.message || 'Could not load users'}</p>`;
        return;
    }
    if (result.length === 0) {
        container.innerHTML = '<p class="text-muted">No users found.</p>';
        return;
    }
    container.innerHTML = result.map(u => `
        <div class="license-item">
            <span class="key">${u.username}</span>
            <div class="info">
                <span>${u.email}</span>
                <span class="status ${u.role === 'admin' ? 'active' : ''}">${u.role}</span>
            </div>
        </div>
    `).join('');
}

function loadAllApps() {
    const container = $('appsList');
    if (container) container.innerHTML = '<p class="text-muted">Applications coming soon...</p>';
}

// ===== EVENTS =====
// Login
const loginFormEl = $('loginFormElement');
if (loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('loginEmail').value;
        const password = $('loginPassword').value;
        console.log('🔑 Logging in:', email);
        
        const { response, result } = await apiRequest('/auth/login', 'POST', { email, password });
        console.log('📥 Login Response:', result);
        
        if (response.ok && result.user) {
            setToken(result.token);
            showDashboard(result.user);
        } else {
            alert(result.message || result.error || 'Login failed. Please check your credentials.');
        }
    });
}

// Register
const registerFormEl = $('registerFormElement');
if (registerFormEl) {
    registerFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('registerUsername').value;
        const email = $('registerEmail').value;
        const password = $('registerPassword').value;
        console.log('📝 Registering:', username, email);
        
        const { response, result } = await apiRequest('/auth/register', 'POST', { username, email, password });
        console.log('📥 Register Response:', result);
        
        if (response.ok && result.user) {
            setToken(result.token);
            showDashboard(result.user);
        } else {
            alert(result.message || result.error || 'Registration failed. Please try again.');
        }
    });
}

// Generate License
const generateBtn = $('generateLicense');
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        console.log('🔑 Generating license...');
        const { response, result } = await apiRequest('/license/generate', 'POST');
        const container = $('newLicenseKey');
        if (!container) return;
        
        if (response.ok && result.success) {
            container.innerHTML = `
                <div class="license-key-display">
                    <code>${result.license_key}</code>
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${result.license_key}')">Copy</button>
                </div>
            `;
            container.style.display = 'block';
            loadLicenses();
            loadStats();
        } else {
            alert(result.message || 'Failed to generate license');
        }
    });
}

// Create User (Admin)
const createUserForm = $('createUserForm');
if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('newUsername').value;
        const email = $('newUserEmail').value;
        const password = $('newUserPassword').value;
        const role = $('newUserRole').value;
        console.log('👤 Creating user:', username, role);
        
        const { response, result } = await apiRequest('/admin/users', 'POST', { username, email, password, role });
        const msg = $('createUserMessage');
        if (!msg) return;
        
        if (response.ok) {
            msg.innerHTML = `<p style="color:var(--accent);">✅ User created successfully!</p>`;
            createUserForm.reset();
            loadAllUsers();
            loadStats();
        } else {
            msg.innerHTML = `<p style="color:var(--danger);">❌ ${result.message || 'Failed'}</p>`;
        }
    });
}

// Navigation buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        console.log('🔘 Nav clicked:', section);
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (section === 'dashboard') { 
            showSection('dashboard'); 
            loadLicenses(); 
            loadStats(); 
        } else if (section === 'users') {
            showSection('users');
        } else if (section === 'apps') {
            showSection('apps');
        }
    });
});

// Logout
const logoutBtn = $('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        console.log('🚪 Logging out...');
        setToken(null);
        showAuth();
    });
}

// Toggle auth forms
const switchToRegister = $('switchToRegister');
const switchToLogin = $('switchToLogin');
const loginBtn = $('loginBtn');
const registerBtn = $('registerBtn');

if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    });
}
if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
    });
}
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        showSection('auth');
    });
}
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        showSection('auth');
    });
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let w, h;
    const particles = [];
    
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    
    function createParticles() {
        const count = Math.min(Math.floor((w * h) / 8000), 120);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2 + 0.5,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    
    function update() {
        for (const p of particles) {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > w) p.dx *= -1;
            if (p.y < 0 || p.y > h) p.dy *= -1;
        }
        requestAnimationFrame(update);
    }
    
    window.addEventListener('resize', resize);
    resize();
    createParticles();
    draw();
    update();
}

// ===== INIT =====
async function checkAuth() {
    console.log('🔍 Checking auth...');
    console.log('📡 API URL:', API_URL);
    
    const token = getToken();
    if (!token) {
        console.log('❌ No token found');
        showAuth();
        return;
    }
    
    console.log('✅ Token found, verifying...');
    const { response, result } = await apiRequest('/auth/me');
    if (response.ok && result.id) {
        console.log('✅ User verified:', result);
        showDashboard(result);
    } else {
        console.log('❌ Token invalid');
        setToken(null);
        showAuth();
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App starting...');
    console.log('🌐 API URL:', API_URL);
    initParticles();
    checkAuth();
});

// Also run immediately if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🚀 App starting (immediate)...');
    setTimeout(() => {
        initParticles();
        checkAuth();
    }, 100);
}