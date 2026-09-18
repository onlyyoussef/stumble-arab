// API Configuration
const API_BASE = window.location.origin + '/api';

// State Management
let tournaments = [];
let autoRefreshInterval = null;
let currentUser = null;

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return false;
        }
        
        currentUser = data.user;
        updateUserInfo();
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
    }
}

// Update user info in sidebar
function updateUserInfo() {
    if (!currentUser) return;
    
    // Add user info section if not exists
    let userInfoSection = document.querySelector('.user-info-section');
    if (!userInfoSection) {
        const sidebar = document.querySelector('.sidebar');
        userInfoSection = document.createElement('div');
        userInfoSection.className = 'user-info-section';
        sidebar.insertBefore(userInfoSection, sidebar.querySelector('.sidebar-header').nextSibling);
    }
    
    userInfoSection.innerHTML = `
        <div class="user-info">
            <div class="user-header">
                <div class="user-avatar">${currentUser.username[0].toUpperCase()}</div>
                <div class="user-details">
                    <div class="user-name">${currentUser.username}</div>
                    <div class="user-role ${currentUser.role === 'admin' ? 'role-admin' : 'role-user'}">
                        ${currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </div>
                </div>
            </div>
            <div class="credits-display">
                <div class="credits-icon">💳</div>
                <div class="credits-info">
                    <div class="credits-label">Credits</div>
                    <div class="credits-value">${currentUser.credits}</div>
                </div>
            </div>
            <button class="logout-btn" onclick="logout()">
                <span>🚪</span> Logout
            </button>
        </div>
    `;
}

// Logout function
async function logout() {
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    initializeDashboard();
    setupEventListeners();
    setupAutoRefresh();
    
    // Show admin panel if user is admin
    if (currentUser && currentUser.role === 'admin') {
        addAdminPanel();
    }
});

// Initialize
async function initializeDashboard() {
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.opacity = '1';
    }, 2000);

    // Load initial data
    await loadDashboardData();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });

    // Buttons
    document.getElementById('createTournamentBtn').addEventListener('click', () => {
        navigateToPage('create');
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await loadDashboardData();
        showToast('Data refreshed successfully', 'success');
    });

    document.getElementById('cancelCreateBtn').addEventListener('click', () => {
        navigateToPage('overview');
    });

    // Form submission
    document.getElementById('createTournamentForm').addEventListener('submit', handleCreateTournament);

    // Settings
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    if (autoRefreshCheckbox) {
        autoRefreshCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                setupAutoRefresh();
            } else {
                clearInterval(autoRefreshInterval);
            }
        });
    }

    document.getElementById('refreshInterval')?.addEventListener('change', () => {
        if (document.getElementById('autoRefresh').checked) {
            setupAutoRefresh();
        }
    });
}

// Navigation
function navigateToPage(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => {
        p.style.display = 'none';
    });

    // Show selected page
    const pageMap = {
        overview: 'overviewPage',
        create: 'createPage',
        active: 'activePage',
        scheduled: 'scheduledPage',
        history: 'historyPage',
        settings: 'settingsPage'
    };

    const targetPage = document.getElementById(pageMap[page]);
    if (targetPage) {
        targetPage.style.display = 'block';
    }

    // Update title
    const titleMap = {
        overview: 'Dashboard Overview',
        create: 'Create Tournament',
        active: 'Active Tournaments',
        scheduled: 'Scheduled Tournaments',
        history: 'Tournament History',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titleMap[page] || 'Dashboard';

    // Load page-specific data
    if (page === 'active') loadActiveTournaments();
    if (page === 'scheduled') loadScheduledTournaments();
    if (page === 'history') loadHistoryTournaments();
}

// Load Dashboard Data
async function loadDashboardData() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/tournaments`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tournaments');
        }
        
        tournaments = await response.json();
        updateDashboardStats();
        updateRecentTournaments();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data. Make sure the server is running.', 'error');
    }
}

// Update Dashboard Stats
function updateDashboardStats() {
    const total = tournaments.length;
    const active = tournaments.filter(t => t.Status === 1).length;
    const scheduled = tournaments.filter(t => t.Status === 0).length;
    
    // Calculate total participants
    let totalParticipants = 0;
    tournaments.forEach(t => {
        if (t.CurrentInvites) {
            totalParticipants += t.CurrentInvites;
        }
    });

    document.getElementById('totalTournaments').textContent = total;
    document.getElementById('activeTournaments').textContent = active;
    document.getElementById('scheduledTournaments').textContent = scheduled;
    document.getElementById('totalParticipants').textContent = totalParticipants;
}

// Update Recent Tournaments
function updateRecentTournaments() {
    const recentContainer = document.getElementById('recentTournaments');
    const recentTournaments = tournaments.slice(0, 5);

    if (recentTournaments.length === 0) {
        recentContainer.innerHTML = '<div class="empty-state"><p>No tournaments yet. Create your first tournament!</p></div>';
        return;
    }

    recentContainer.innerHTML = recentTournaments.map(t => createTournamentCard(t)).join('');
}

// Create Tournament Card HTML
function createTournamentCard(tournament) {
    const statusClass = getStatusClass(tournament.Status);
    const statusText = getStatusText(tournament.Status);

    return `
        <div class="tournament-card" onclick="viewTournament('${tournament.TournamentId}')">
            <div class="tournament-header">
                <h3 class="tournament-title">${escapeHtml(tournament.TournamentName || 'Untitled Tournament')}</h3>
                <span class="tournament-status ${statusClass}">${statusText}</span>
            </div>
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Mode</span>
                    <span class="info-value">${tournament.PartySize}v${tournament.PartySize}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Region</span>
                    <span class="info-value">${getRegionName(tournament.Region)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Participants</span>
                    <span class="info-value">${tournament.CurrentInvites || 0}/${tournament.MaxInvites || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Start Time</span>
                    <span class="info-value">${formatDateTime(tournament.StartTime)}</span>
                </div>
            </div>
        </div>
    `;
}

// Handle Create Tournament
async function handleCreateTournament(e) {
    e.preventDefault();

    // Check credits before creating
    if (currentUser && currentUser.credits < 1) {
        showToast('⚠️ Insufficient credits! You need at least 1 credit to create a tournament. Contact admin for credits.', 'error');
        return;
    }

    const mode = parseInt(document.getElementById('tournamentMode').value);
    const scheduledDate = document.getElementById('scheduledDate').value;
    
    const formData = {
        name: document.getElementById('tournamentName').value,
        mode: mode,
        region: parseInt(document.getElementById('tournamentRegion').value),
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        description: document.getElementById('tournamentDescription').value,
        map: document.getElementById('mapSelection').value,
        roundCount: parseInt(document.getElementById('roundCount').value) || 3,
    };

    if (scheduledDate) {
        formData.scheduledFor = new Date(scheduledDate).toISOString();
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE}/tournaments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create tournament');
        }

        showToast('🎉 Tournament created successfully! 1 credit deducted.', 'success');
        
        // Update user credits
        if (currentUser) {
            currentUser.credits = result.remainingCredits || (currentUser.credits - 1);
            updateUserInfo();
        }
        
        // Reset form
        document.getElementById('createTournamentForm').reset();
        
        // Reload data and navigate to overview
        await loadDashboardData();
        
        // Refresh user info
        await checkAuth();
        
        setTimeout(() => {
            navigateToPage('overview');
        }, 1000);
    } catch (error) {
        console.error('Error creating tournament:', error);
        showToast(error.message || 'Failed to create tournament', 'error');
    }
}

// Load Active Tournaments
async function loadActiveTournaments() {
    const container = document.getElementById('activeTournamentsList');
    const active = tournaments.filter(t => t.Status === 1);

    if (active.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No active tournaments</p></div>';
        return;
    }

    container.innerHTML = active.map(t => createTournamentCard(t)).join('');
}

// Load Scheduled Tournaments
async function loadScheduledTournaments() {
    const container = document.getElementById('scheduledTournamentsList');
    const scheduled = tournaments.filter(t => t.Status === 0);

    if (scheduled.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No scheduled tournaments</p></div>';
        return;
    }

    container.innerHTML = scheduled.map(t => createTournamentCard(t)).join('');
}

// Load History Tournaments
async function loadHistoryTournaments() {
    const container = document.getElementById('historyTournamentsList');
    const completed = tournaments.filter(t => t.Status === 2);

    if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No completed tournaments</p></div>';
        return;
    }

    container.innerHTML = completed.map(t => createTournamentCard(t)).join('');
}

// View Tournament Details
async function viewTournament(tournamentId) {
    try {
        const response = await fetch(`${API_BASE}/tournaments/${tournamentId}`);
        if (!response.ok) throw new Error('Failed to fetch tournament details');
        
        const tournament = await response.json();
        
        // TODO: Show tournament details modal
        console.log('Tournament details:', tournament);
        showToast('Tournament details loaded (feature coming soon)', 'warning');
    } catch (error) {
        console.error('Error viewing tournament:', error);
        showToast('Failed to load tournament details', 'error');
    }
}

// Setup Auto Refresh
function setupAutoRefresh() {
    const interval = parseInt(document.getElementById('refreshInterval')?.value || 30) * 1000;
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    autoRefreshInterval = setInterval(async () => {
        await loadDashboardData();
        console.log('Dashboard data refreshed');
    }, interval);
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 6px; font-size: 1.05em;">
            ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'} 
            ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div style="color: var(--text-secondary); font-size: 0.95em;">${message}</div>
    `;

    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Utility Functions
function getStatusClass(status) {
    if (status === 1) return 'status-active';
    if (status === 0) return 'status-scheduled';
    if (status === 2) return 'status-completed';
    return 'status-completed';
}

function getStatusText(status) {
    if (status === 1) return 'Active';
    if (status === 0) return 'Scheduled';
    if (status === 2) return 'Completed';
    return 'Unknown';
}

function getRegionName(region) {
    const regions = {
        '0': 'EU',
        '1': 'NA',
        '2': 'SA',
        '3': 'ASIA',
        '4': 'OCE'
    };
    return regions[region.toString()] || 'Unknown';
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > -24 && hours < 24) {
        if (hours > 0) {
            return `in ${hours}h`;
        } else {
            return `${Math.abs(hours)}h ago`;
        }
    }
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N: New tournament
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigateToPage('create');
    }
    
    // Ctrl/Cmd + R: Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadDashboardData();
        showToast('Data refreshed', 'success');
    }
});


// ============= ADMIN FUNCTIONS =============

function addAdminPanel() {
    // Add admin nav item
    const nav = document.querySelector('.sidebar-nav');
    const adminNavItem = document.createElement('a');
    adminNavItem.href = '#';
    adminNavItem.className = 'nav-item';
    adminNavItem.dataset.page = 'admin';
    adminNavItem.innerHTML = `
        <span class="nav-icon">👑</span>
        <span>Admin Panel</span>
    `;
    nav.appendChild(adminNavItem);
    
    // Add admin page
    const pagesContainer = document.querySelector('.pages-container');
    const adminPage = document.createElement('div');
    adminPage.id = 'adminPage';
    adminPage.className = 'page-content';
    adminPage.style.display = 'none';
    adminPage.innerHTML = `
        <div class="admin-panel">
            <h2 style="margin-bottom: 30px; color: #667eea;">👑 Admin Control Panel</h2>
            
            <div class="admin-section">
                <h3 style="margin-bottom: 20px;">User Management</h3>
                <button class="btn-primary" onclick="loadUsers()" style="margin-bottom: 20px;">
                    🔄 Load All Users
                </button>
                <div id="usersList"></div>
            </div>
        </div>
    `;
    pagesContainer.appendChild(adminPage);
    
    // Add event listener
    adminNavItem.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage('admin');
        loadUsers();
    });
}

async function loadUsers() {
    const token = localStorage.getItem('token');
    const usersList = document.getElementById('usersList');
    
    usersList.innerHTML = '<div style="text-align: center; padding: 20px; color: #a0a0a0;">Loading users...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        if (data.users.length === 0) {
            usersList.innerHTML = '<div style="text-align: center; padding: 20px; color: #a0a0a0;">No users found</div>';
            return;
        }
        
        usersList.innerHTML = data.users.map(user => `
            <div class="user-card" style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 5px;">
                            ${user.username}
                            ${user.role === 'admin' ? '<span style="color: #667eea; font-size: 14px;"> 👑 Admin</span>' : ''}
                        </div>
                        <div style="color: #a0a0a0; font-size: 14px;">${user.email || 'No email'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${user.credits}</div>
                        <div style="color: #a0a0a0; font-size: 12px;">Credits</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="promptAddCredits('${user._id}', '${user.username}')" 
                            style="flex: 1; min-width: 120px; padding: 10px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
                        ➕ Add Credits
                    </button>
                    <button onclick="promptRemoveCredits('${user._id}', '${user.username}')" 
                            style="flex: 1; min-width: 120px; padding: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
                        ➖ Remove Credits
                    </button>
                    <button onclick="promptSetCredits('${user._id}', '${user.username}', ${user.credits})" 
                            style="flex: 1; min-width: 120px; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
                        ⚙️ Set Credits
                    </button>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                    <span>Tournaments: ${user.tournamentsCreated || 0}</span>
                    <span>Joined: ${new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444;">Failed to load users: ${error.message}</div>`;
    }
}

async function promptAddCredits(userId, username) {
    const amount = prompt(`How many credits do you want to ADD to ${username}?`, '10');
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    await modifyCredits('add', userId, parseInt(amount), username);
}

async function promptRemoveCredits(userId, username) {
    const amount = prompt(`How many credits do you want to REMOVE from ${username}?`, '5');
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    await modifyCredits('remove', userId, parseInt(amount), username);
}

async function promptSetCredits(userId, username, currentCredits) {
    const amount = prompt(`Set credits for ${username} (current: ${currentCredits}):`, currentCredits.toString());
    if (amount === null || isNaN(amount) || parseInt(amount) < 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    await modifyCredits('set', userId, parseInt(amount), username);
}

async function modifyCredits(action, userId, amount, username) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE}/admin/credits/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, amount })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        showToast(data.message, 'success');
        loadUsers();
        
        // If modifying own credits, update UI
        if (currentUser && userId === currentUser.id) {
            await checkAuth();
        }
    } catch (error) {
        console.error('Error modifying credits:', error);
        showToast(error.message || 'Failed to modify credits', 'error');
    }
}
