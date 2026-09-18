// Simple Dashboard - OAuth Login Support
// Uses Discord OAuth or legacy prompt for backward compatibility

const API_BASE = window.location.origin + '/api';

let tournaments = [];
let currentUser = null;
let autoRefreshInterval = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in via OAuth
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        // OAuth login
        try {
            currentUser = JSON.parse(userData);
            
            // Check if userId is missing (old login)
            if (!currentUser.userId || currentUser.userId === 0) {
                console.log('⚠️ User ID missing, fetching from server...');
                await refreshUserInfo(); // This will get userId from server
            }
            
            updateUserInfo();
            updateHeaderUserInfo(); // تحديث الهيدر
        } catch (e) {
            console.error('Error parsing user data:', e);
            // Redirect to login if data is corrupted
            window.location.href = '/login.html';
            return;
        }
    } else {
        // No login - redirect to login page
        window.location.href = '/login.html';
        return;
    }
    
    initializeDashboard();
    setupEventListeners();
    setupAutoRefresh();
});

// NEW: Update header user info (avatar and name)
function updateHeaderUserInfo() {
    if (!currentUser) {
        console.error('❌ updateHeaderUserInfo: currentUser is null');
        return;
    }
    
    console.log('✅ updateHeaderUserInfo called with:', currentUser);
    
    // Update User ID in header (Prominent Badge)
    const headerUserIdValue = document.getElementById('headerUserIdValue');
    if (headerUserIdValue) {
        if (currentUser.userId) {
            console.log('✅ Setting User ID to:', currentUser.userId);
            headerUserIdValue.textContent = currentUser.userId;
            
            // Add click event to copy User ID
            const headerUserIdDisplay = document.getElementById('headerUserIdDisplay');
            if (headerUserIdDisplay) {
                headerUserIdDisplay.onclick = () => {
                    navigator.clipboard.writeText(currentUser.userId.toString()).then(() => {
                        showToast(`✅ User ID ${currentUser.userId} copied to clipboard!`, 'success');
                    }).catch(err => {
                        showToast('Failed to copy User ID', 'error');
                    });
                };
            }
        } else {
            console.error('❌ currentUser.userId is missing:', currentUser);
            headerUserIdValue.textContent = 'N/A';
        }
    } else {
        console.error('❌ headerUserIdValue element not found');
    }
    
    // Update avatar in header
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    if (headerUserAvatar) {
        console.log('📸 Avatar URL:', currentUser.avatar);
        
        if (currentUser.avatar) {
            // Show Discord avatar
            headerUserAvatar.style.background = 'none';
            headerUserAvatar.innerHTML = `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${currentUser.username}" onerror="console.error('Failed to load avatar:', this.src)">`;
        } else {
            console.warn('⚠️ No avatar URL, showing initial');
            // Show first letter
            headerUserAvatar.textContent = currentUser.username[0].toUpperCase();
        }
        headerUserAvatar.title = currentUser.username;
        
        // Add click event to show user menu
        headerUserAvatar.onclick = showUserMenu;
    } else {
        console.error('❌ headerUserAvatar element not found');
    }
    
    // Update credits in header
    const headerCreditsValue = document.getElementById('headerCreditsValue');
    if (headerCreditsValue) {
        headerCreditsValue.textContent = `${currentUser.credits.toLocaleString()} Credits`;
    }
}

// NEW: Show user menu dropdown
function showUserMenu(e) {
    e.stopPropagation();
    
    // Remove existing menu if any
    const existingMenu = document.querySelector('.user-dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'user-dropdown-menu';
    menu.style.cssText = `
        position: absolute;
        top: 70px;
        right: 20px;
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        min-width: 220px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 1000;
    `;
    
    const adminBadge = currentUser.isAdmin 
        ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-left: 8px;">ADMIN</span>' 
        : '';
    
    menu.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 8px;">
            ${currentUser.avatar 
                ? `<img src="${currentUser.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
                : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: white;">${currentUser.username[0].toUpperCase()}</div>`
            }
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 600; color: white; display: flex; align-items: center;">
                    ${currentUser.username}
                    ${adminBadge}
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">User ID: ${currentUser.userId || 'N/A'}</div>
            </div>
        </div>
        <div style="padding: 8px 0;">
            ${currentUser.userId ? `
            <div style="padding: 8px 12px; font-size: 12px; color: #888; display: flex; justify-content: space-between; background: rgba(255, 255, 255, 0.03); border-radius: 6px; margin-bottom: 8px;">
                <span>🆔 Your ID:</span>
                <span style="color: #FFD700; font-weight: 700; font-size: 14px;">${currentUser.userId}</span>
            </div>` : ''}
            <div style="padding: 8px 12px; font-size: 12px; color: #888; display: flex; justify-content: space-between;">
                <span>💰 Credits:</span>
                <span style="color: white; font-weight: 600;">${currentUser.credits.toLocaleString()}</span>
            </div>
            <div style="padding: 8px 12px; font-size: 12px; color: #888; display: flex; justify-content: space-between;">
                <span>🏆 Tournaments:</span>
                <span style="color: white; font-weight: 600;">${currentUser.tournamentsCreated || 0}</span>
            </div>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 8px; padding-top: 8px;">
            <button onclick="logoutUser()" style="width: 100%; padding: 10px; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.2); border-radius: 8px; color: #ff4444; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                🚪 Logout
            </button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

// NEW: Logout user
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('discordId');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
}

// Update user info in sidebar
function updateUserInfo() {
    if (!currentUser) return;
    
    // Update header
    updateHeaderUserInfo();
    
    let userInfoSection = document.querySelector('.user-info-section');
    if (!userInfoSection) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        userInfoSection = document.createElement('div');
        userInfoSection.className = 'user-info-section';
        const header = sidebar.querySelector('.sidebar-header');
        if (header && header.nextSibling) {
            sidebar.insertBefore(userInfoSection, header.nextSibling);
        }
    }
    
    const adminBadge = currentUser.isAdmin 
        ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 600;">ADMIN</span>' 
        : '';
    
    const avatarHtml = currentUser.avatar
        ? `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${currentUser.username}">`
        : currentUser.username[0].toUpperCase();
    
    userInfoSection.innerHTML = `
        <div class="user-info">
            <div class="user-header">
                <div class="user-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: ${currentUser.avatar ? 'transparent' : 'linear-gradient(135deg, #667eea, #764ba2)'}; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white;">
                    ${avatarHtml}
                </div>
                <div class="user-details" style="flex: 1; margin-left: 12px;">
                    <div class="user-name" style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 4px;">${currentUser.username}</div>
                    ${adminBadge ? `<div style="margin-top: 6px;">${adminBadge}</div>` : ''}
                </div>
            </div>
            <div class="tournaments-stat" style="margin-top: 12px;">
                ${currentUser.userId ? `<div style="padding: 8px; background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1)); border-radius: 6px; border: 1px solid rgba(255, 215, 0, 0.2); margin-bottom: 8px; text-align: center;">
                    <span style="font-size: 11px; color: #FFD700; font-weight: 600;">🆔 Your ID: ${currentUser.userId}</span>
                </div>` : ''}
                <span style="font-size: 12px; color: #888;">🏆 Tournaments: ${currentUser.tournamentsCreated || 0}</span>
            </div>
            <button class="logout-btn" onclick="logoutUser()" style="width: 100%; margin-top: 12px; padding: 10px; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.2); border-radius: 8px; color: #ff4444; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                <span>�</span> Logout
            </button>
        </div>
    `;
}

// Initialize
function initializeDashboard() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.opacity = '1';
    }, 2000);
    
    loadDashboardData();
}

// Setup Event Listeners
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
    
    const createTournamentBtn = document.getElementById('createTournamentBtn');
    if (createTournamentBtn) {
        createTournamentBtn.addEventListener('click', () => {
            navigateToPage('create');
        });
    }
    
    const newTournamentBtn = document.getElementById('newTournamentBtn');
    if (newTournamentBtn) {
        newTournamentBtn.addEventListener('click', () => {
            window.location.href = '/create-tournament.html';
        });
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadDashboardData();
            await refreshUserInfo();
            showToast('Data refreshed successfully', 'success');
        });
    }
    
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            navigateToPage('scheduled');
        });
    }
    
    const createTournamentForm = document.getElementById('createTournamentForm');
    if (createTournamentForm) {
        createTournamentForm.addEventListener('submit', handleCreateTournament);
    }
    
    // Auto-calculate rounds based on player count and mode
    const maxParticipantsSelect = document.getElementById('maxParticipants');
    const tournamentModeSelect = document.getElementById('tournamentMode');
    
    if (maxParticipantsSelect) {
        maxParticipantsSelect.addEventListener('change', updateRoundsCalculation);
    }
    
    if (tournamentModeSelect) {
        tournamentModeSelect.addEventListener('change', updateRoundsCalculation);
    }
    
    // Initial calculation
    setTimeout(updateRoundsCalculation, 500);
}

// Calculate rounds based on player count and mode
function updateRoundsCalculation() {
    const maxParticipantsSelect = document.getElementById('maxParticipants');
    const tournamentModeSelect = document.getElementById('tournamentMode');
    const roundsText = document.getElementById('roundsText');
    const roundCountInput = document.getElementById('roundCount');
    
    if (!maxParticipantsSelect || !tournamentModeSelect || !roundsText || !roundCountInput) {
        return;
    }
    
    const maxPlayers = parseInt(maxParticipantsSelect.value);
    const mode = parseInt(tournamentModeSelect.value);
    
    // Calculate teams based on mode
    // 1v1 = 1 player per team
    // 2v2 = 2 players per team
    // 3v3 = 3 players per team
    // 4v4 = 4 players per team
    const playersPerTeam = mode;
    const totalTeams = maxPlayers / playersPerTeam;
    
    // Calculate rounds needed for single elimination
    // Formula: log2(teams) = rounds
    const rounds = Math.ceil(Math.log2(totalTeams));
    
    // Update display
    roundCountInput.value = rounds;
    roundsText.textContent = `${rounds} Rounds (${totalTeams} teams)`;
    roundsText.style.color = 'white';
    
    console.log(`🎯 Auto-calculated: ${maxPlayers} players, ${mode}v${mode} mode = ${totalTeams} teams = ${rounds} rounds`);
}

// Refresh user info
async function refreshUserInfo() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/dashboard/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                discordId: currentUser.discordId,
                username: currentUser.username 
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            
            // Update localStorage with new data including userId
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('✅ User data refreshed:', currentUser);
            
            updateUserInfo();
            updateHeaderUserInfo();
        }
    } catch (error) {
        console.error('Error refreshing user info:', error);
    }
}

// Navigation
function navigateToPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    
    document.querySelectorAll('.page-content').forEach(p => {
        p.style.display = 'none';
    });
    
    const pageMap = {
        overview: 'overviewPage',
        create: 'createPage',
        active: 'activePage',
        scheduled: 'scheduledPage',
        history: 'historyPage',
        settings: 'settingsPage',
        users: 'usersPage'
    };
    
    const targetPage = document.getElementById(pageMap[page]);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    const titleMap = {
        overview: 'Dashboard Overview',
        create: 'Create Tournament',
        active: 'Active Tournaments',
        scheduled: 'Scheduled Tournaments',
        history: 'Tournament History',
        settings: 'Settings',
        users: 'User Management'
    };
    document.getElementById('pageTitle').textContent = titleMap[page] || 'Dashboard';
    
    if (page === 'active') loadActiveTournaments();
    if (page === 'scheduled') loadScheduledTournaments();
    if (page === 'history') loadHistoryTournaments();
    if (page === 'users') loadAllUsers();
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/tournaments`);
        if (!response.ok) {
            // If tournaments endpoint fails, just show empty state
            tournaments = [];
            updateDashboardStats();
            updateRecentTournaments();
            return;
        }
        
        tournaments = await response.json();
        updateDashboardStats();
        updateRecentTournaments();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Don't show error toast if it's just empty data
        tournaments = [];
        updateDashboardStats();
        updateRecentTournaments();
    }
}

// Update Dashboard Stats
function updateDashboardStats() {
    const total = tournaments.length || 0;
    const active = tournaments.filter(t => t.Status === 1).length || 0;
    const scheduled = tournaments.filter(t => t.Status === 0).length || 0;
    
    let totalParticipants = 0;
    tournaments.forEach(t => {
        if (t.CurrentInvites) totalParticipants += t.CurrentInvites;
    });
    
    const totalEl = document.getElementById('totalTournaments');
    const activeEl = document.getElementById('activeTournaments');
    const scheduledEl = document.getElementById('scheduledTournaments');
    const participantsEl = document.getElementById('totalParticipants');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (scheduledEl) scheduledEl.textContent = scheduled;
    if (participantsEl) participantsEl.textContent = totalParticipants;
}

// Update Recent Tournaments
function updateRecentTournaments() {
    const recentContainer = document.getElementById('recentTournaments');
    if (!recentContainer) return;
    
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
        <div class="tournament-card">
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
    
    if (!currentUser) {
        showToast('Please refresh the page', 'error');
        return;
    }
    
    if (currentUser.credits < 1) {
        showToast('⚠️ Insufficient credits! You need at least 1 credit. Contact admin for credits.', 'error');
        return;
    }
    
    const mode = parseInt(document.getElementById('tournamentMode').value);
    const scheduledDate = document.getElementById('scheduledDate').value;
    
    const formData = {
        discordId: currentUser.discordId,
        username: currentUser.username,
        name: document.getElementById('tournamentName').value,
        mode: parseInt(document.getElementById('tournamentMode').value),
        region: parseInt(document.getElementById('tournamentRegion').value),
        maxParticipants: parseInt(document.getElementById('maxParticipants').value) || 32,
        description: document.getElementById('tournamentDescription')?.value || '',
        map: document.getElementById('mapSelection').value,
        roundCount: parseInt(document.getElementById('roundCount').value) || 3,
    };
    
    console.log('Creating tournament with data:', formData);
    
    if (scheduledDate) {
        formData.scheduledFor = new Date(scheduledDate).toISOString();
    }
    
    try {
        const response = await fetch(`${API_BASE}/tournaments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create tournament');
        }
        
        showToast('🎉 Tournament created! 1 credit deducted.', 'success');
        
        currentUser.credits = result.remainingCredits;
        currentUser.tournamentsCreated = (currentUser.tournamentsCreated || 0) + 1;
        updateUserInfo();
        
        document.getElementById('createTournamentForm').reset();
        await loadDashboardData();
        
        setTimeout(() => {
            navigateToPage('overview');
        }, 1000);
    } catch (error) {
        console.error('Error creating tournament:', error);
        showToast(error.message || 'Failed to create tournament', 'error');
    }
}

// Load All Users (for management)
async function loadAllUsers() {
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
        showToast('⚠️ Admin access required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/dashboard/users`);
        const data = await response.json();
        
        if (!data.success) throw new Error(data.message);
        
        const usersPage = document.getElementById('usersPage');
        if (usersPage) {
            usersPage.innerHTML = `
                <div class="page-header">
                    <h2 style="color: #667eea;">👑 Admin Panel - User Management</h2>
                    <p class="page-subtitle">Manage credits for all users</p>
                </div>
                <button onclick="loadAllUsers()" style="margin-bottom: 20px; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🔄 Refresh Users
                </button>
                <div id="usersListContainer"></div>
            `;
        }
        
        const usersList = document.getElementById('usersListContainer');
        
        if (data.users.length === 0) {
            usersList.innerHTML = '<p style="color: #a0a0a0; text-align: center; padding: 40px;">No users found</p>';
            return;
        }
        
        usersList.innerHTML = data.users.map(user => {
            const isCurrentUser = user.discordId === currentUser.discordId;
            const isAdminUser = ['1394118417275031672', '1548373280438886444'].includes(user.discordId);
            
            return `
            <div class="user-card" style="background: ${isCurrentUser ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' : '#1a1a1a'}; padding: 24px; border-radius: 12px; margin-bottom: 15px; border: ${isCurrentUser ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 600; color: white; display: flex; align-items: center; gap: 10px;">
                            ${user.username}
                            ${isAdminUser ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">👑 ADMIN</span>' : ''}
                            ${isCurrentUser ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ YOU</span>' : ''}
                        </div>
                        <div style="color: #a0a0a0; font-size: 13px; margin-top: 4px;">Discord ID: ${user.discordId}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 28px; font-weight: 800; color: #667eea;">${user.credits.toLocaleString()}</div>
                        <div style="color: #a0a0a0; font-size: 12px;">Credits</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button onclick="addCreditsToUser('${user.discordId}', '${user.username}', ${user.credits})" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ➕ Add Credits
                    </button>
                    <button onclick="removeCreditsFromUser('${user.discordId}', '${user.username}', ${user.credits})" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ➖ Remove Credits
                    </button>
                    <button onclick="setCreditsForUser('${user.discordId}', '${user.username}', ${user.credits})" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ⚙️ Set Credits
                    </button>
                </div>
                <div style="padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                    <span>🏆 Tournaments: ${user.tournamentsCreated || 0}</span>
                    <span>📅 Joined: ${new Date(user.createdAt).toLocaleDateString()}</span>
                    <span>⏰ Last Active: ${new Date(user.lastActivity).toLocaleDateString()}</span>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

// Add credits to user
async function addCreditsToUser(discordId, username, currentCredits) {
    const amount = prompt(`Add credits to ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter amount to ADD:`, '100');
    
    if (amount === null || isNaN(amount) || parseInt(amount) <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    const newCredits = currentCredits + parseInt(amount);
    await updateUserCreditsInternal(discordId, username, newCredits, `Added ${amount} credits`);
}

// Remove credits from user
async function removeCreditsFromUser(discordId, username, currentCredits) {
    const amount = prompt(`Remove credits from ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter amount to REMOVE:`, '50');
    
    if (amount === null || isNaN(amount) || parseInt(amount) <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    const newCredits = Math.max(0, currentCredits - parseInt(amount));
    await updateUserCreditsInternal(discordId, username, newCredits, `Removed ${amount} credits`);
}

// Set credits for user
async function setCreditsForUser(discordId, username, currentCredits) {
    const newCredits = prompt(`Set credits for ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter NEW total:`, currentCredits.toString());
    
    if (newCredits === null || isNaN(newCredits) || parseInt(newCredits) < 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    await updateUserCreditsInternal(discordId, username, parseInt(newCredits), `Set credits to ${newCredits}`);
}

// Internal function to update credits
async function updateUserCreditsInternal(discordId, username, newCredits, message) {
    try {
        const response = await fetch(`${API_BASE}/dashboard/credits/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId, credits: newCredits })
        });
        
        const data = await response.json();
        
        if (!data.success) throw new Error(data.message);
        
        showToast(`✅ ${message} for ${username}!`, 'success');
        await loadAllUsers();
        
        // If updating own credits, refresh user info
        if (currentUser && discordId === currentUser.discordId) {
            await refreshUserInfo();
        }
    } catch (error) {
        console.error('Error updating credits:', error);
        showToast(error.message || 'Failed to update credits', 'error');
    }
}

// Load Active/Scheduled/History
function loadActiveTournaments() {
    const container = document.getElementById('activeTournamentsList');
    const active = tournaments.filter(t => t.Status === 1);
    if (active.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No active tournaments</p></div>';
        return;
    }
    container.innerHTML = active.map(t => createTournamentCard(t)).join('');
}

function loadScheduledTournaments() {
    const container = document.getElementById('scheduledTournamentsList');
    const scheduled = tournaments.filter(t => t.Status === 0 || t.Status === 1);
    
    if (scheduled.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #666;"><p>No tournaments available</p></div>';
        return;
    }
    
    container.innerHTML = scheduled.map(t => {
        const statusBadge = t.Status === 2 ? '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 10px;">CANCELED</span>' : '';
        const participants = `${t.CurrentInvites || 0}/${t.MaxInvites || 0}`;
        const startTime = t.StartTime ? new Date(t.StartTime).toLocaleString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        }).replace(',', ' ') : 'TBD';
        const hasStarted = t.StartTime && new Date(t.StartTime) < new Date();
        
        return `
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 20px; transition: all 0.3s; cursor: pointer;" onmouseover="this.style.background='rgba(255, 255, 255, 0.04)'; this.style.borderColor='rgba(255, 255, 255, 0.12)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.02)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'">
                <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="font-size: 11px; color: #888; text-align: center;">No Img</span>
                </div>
                
                <div style="flex: 1;">
                    <h3 style="font-size: 16px; font-weight: 600; color: white; margin: 0 0 8px 0; display: flex; align-items: center;">
                        ${escapeHtml(t.TournamentName || 'Untitled Tournament')}
                        ${statusBadge}
                    </h3>
                    <div style="display: flex; gap: 20px; font-size: 13px; color: #888;">
                        <span>🌍 ${getRegionName(t.Region)}</span>
                        <span>📅 ${startTime}${hasStarted ? ' (Already started)' : ''}</span>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">👥</div>
                        <div style="font-size: 16px; font-weight: 600; color: white;">${participants}</div>
                    </div>
                    <button onclick="event.stopPropagation(); manageTournament('${t.TournamentId}')" style="padding: 8px 16px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255, 255, 255, 0.12)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'">
                        ⚙️ Manage
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Manage tournament
function manageTournament(tournamentId) {
    showToast('Tournament management coming soon', 'info');
    console.log('Managing tournament:', tournamentId);
}

function loadHistoryTournaments() {
    const container = document.getElementById('historyTournamentsList');
    const completed = tournaments.filter(t => t.Status === 2);
    if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No completed tournaments</p></div>';
        return;
    }
    container.innerHTML = completed.map(t => createTournamentCard(t)).join('');
}

// Setup Auto Refresh
function setupAutoRefresh() {
    const interval = 30 * 1000; // 30 seconds
    autoRefreshInterval = setInterval(async () => {
        await loadDashboardData();
        await refreshUserInfo();
    }, interval);
}

// Show Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 6px;">
            ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'} 
            ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div style="color: var(--text-secondary);">${message}</div>
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
        '0': 'EU', '1': 'NA', '2': 'SA', '3': 'ASIA', '4': 'OCE'
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
        if (hours > 0) return `in ${hours}h`;
        return `${Math.abs(hours)}h ago`;
    }
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add Users navigation
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.sidebar-nav');
    if (nav && !document.querySelector('[data-page="users"]')) {
        const usersNav = document.createElement('a');
        usersNav.href = '#';
        usersNav.className = 'nav-item';
        usersNav.dataset.page = 'users';
        usersNav.id = 'usersNavItem';
        usersNav.innerHTML = '<span class="nav-icon"><img src="https://cdn.discordapp.com/emojis/1506677645901955072.png" style="width: 20px; height: 20px;"></span><span>Users Management</span>';
        usersNav.style.display = 'none'; // Hidden by default
        nav.appendChild(usersNav);
        
        usersNav.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage('users');
        });
    }
    
    // Add users page if not exists
    const pagesContainer = document.querySelector('.content-body');
    if (pagesContainer && !document.getElementById('usersPage')) {
        const usersPage = document.createElement('div');
        usersPage.id = 'usersPage';
        usersPage.className = 'page-content';
        usersPage.style.display = 'none';
        pagesContainer.appendChild(usersPage);
    }
});

// Add admin features
function addAdminFeatures() {
    // Show Users nav item
    const usersNavItem = document.getElementById('usersNavItem');
    if (usersNavItem) {
        usersNavItem.style.display = 'flex';
    }
    
    // Add admin quick actions to header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('adminQuickActions')) {
        const adminActions = document.createElement('div');
        adminActions.id = 'adminQuickActions';
        adminActions.style.cssText = 'display: flex; gap: 10px; margin-right: 10px;';
        adminActions.innerHTML = `
            <button onclick="openAddCreditsModal()" style="padding: 8px 16px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                ➕ Add Credits
            </button>
            <button onclick="navigateToPage('users')" style="padding: 8px 16px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                👥 Manage Users
            </button>
        `;
        
        // Insert before credits display
        const creditsDisplay = document.getElementById('headerCreditsDisplay');
        if (creditsDisplay) {
            headerActions.insertBefore(adminActions, creditsDisplay);
        }
    }
    
    console.log('✅ Admin features enabled');
}

// Open add credits modal
function openAddCreditsModal() {
    const discordId = prompt('Enter Discord ID to add credits:');
    if (!discordId) return;
    
    const amount = prompt('How many credits to add?', '100');
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        showToast('Invalid amount', 'error');
        return;
    }
    
    addCreditsByDiscordId(discordId, parseInt(amount));
}

// Add credits by Discord ID
async function addCreditsByDiscordId(discordId, amount) {
    try {
        // First get user to check current credits
        const response = await fetch(`${API_BASE}/dashboard/users`);
        const data = await response.json();
        
        if (!data.success) throw new Error(data.message);
        
        const user = data.users.find(u => u.discordId === discordId);
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        const newCredits = user.credits + amount;
        
        const updateResponse = await fetch(`${API_BASE}/dashboard/credits/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId, credits: newCredits })
        });
        
        const updateData = await updateResponse.json();
        
        if (!updateData.success) throw new Error(updateData.message);
        
        showToast(`✅ Added ${amount} credits to ${user.username}!`, 'success');
        
        // Refresh if updating own credits
        if (currentUser && discordId === currentUser.discordId) {
            await refreshUserInfo();
        }
    } catch (error) {
        console.error('Error adding credits:', error);
        showToast(error.message || 'Failed to add credits', 'error');
    }
}


// New Tournament button
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const newTournamentBtn = document.getElementById('newTournamentBtn');
        if (newTournamentBtn) {
            newTournamentBtn.addEventListener('click', () => {
                navigateToPage('create');
            });
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#888';
                });
                this.style.background = 'white';
                this.style.color = 'black';
                
                const filter = this.dataset.filter;
                if (filter === 'my') {
                    showToast('Showing your tournaments', 'info');
                } else {
                    showToast('Showing all tournaments', 'info');
                }
            });
        });
    }, 100);
});


// ════════════════════════════════════════════════════════════════════════════
//  ENHANCED FEATURES - Tournament Details, Players, Teams, Matches
// ════════════════════════════════════════════════════════════════════════════

// View Tournament Details
async function viewTournamentDetails(tournamentId) {
    try {
        const [tournamentRes, playersRes, teamsRes, matchesRes] = await Promise.all([
            fetch(`${API_BASE}/tournaments/${tournamentId}`),
            fetch(`${API_BASE}/tournaments/${tournamentId}/players/detailed`),
            fetch(`${API_BASE}/tournaments/${tournamentId}/teams`),
            fetch(`${API_BASE}/tournaments/${tournamentId}/matches`)
        ]);
        
        const tournament = await tournamentRes.json();
        const playersData = await playersRes.json();
        const teamsData = await teamsRes.json();
        const matchesData = await matchesRes.json();
        
        if (!tournament || !tournament.TournamentId) {
            throw new Error('Tournament not found');
        }
        
        showTournamentDetailsModal(tournament, playersData.players || [], teamsData.teams || [], matchesData.matches || []);
    } catch (error) {
        console.error('Error loading tournament details:', error);
        showToast('Failed to load tournament details', 'error');
    }
}

// Show Tournament Details Modal
function showTournamentDetailsModal(tournament, players, teams, matches) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    const teamSize = tournament.PartySize || 1;
    const modeLabel = `${teamSize}v${teamSize}`;
    const startTime = tournament.StartTime ? new Date(tournament.StartTime).toLocaleString() : 'TBD';
    const signupTime = tournament.SignupStart ? new Date(tournament.SignupStart).toLocaleString() : 'TBD';
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; border-radius: 16px; max-width: 1200px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);">
            <!-- Header -->
            <div style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));">
                <div>
                    <h2 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">${escapeHtml(tournament.TournamentName)}</h2>
                    <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">Tournament ID: ${tournament.TournamentId}</p>
                </div>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(255,255,255,0.1); border: none; width: 40px; height: 40px; border-radius: 8px; color: white; cursor: pointer; font-size: 20px;">×</button>
            </div>
            
            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 32px;">
                <!-- Tournament Info -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">MODE</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${modeLabel}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">REGION</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${getRegionName(tournament.Region)}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">PLAYERS</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${tournament.CurrentInvites || 0}/${tournament.MaxInvites}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">TEAMS</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${teams.length}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">ROUNDS</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${tournament.RoundCount || 0}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="color: #888; font-size: 12px; margin-bottom: 8px;">MATCHES</div>
                        <div style="color: white; font-size: 24px; font-weight: 700;">${matches.length}</div>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="tournament-tabs" style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <button onclick="showTournamentTab('info-${tournament.TournamentId}')" class="tab-btn active-tab" style="padding: 12px 24px; background: rgba(102, 126, 234, 0.2); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Info</button>
                    <button onclick="showTournamentTab('teams-${tournament.TournamentId}')" class="tab-btn" style="padding: 12px 24px; background: transparent; border: none; border-radius: 8px; color: #888; cursor: pointer; font-weight: 600;">Teams (${teams.length})</button>
                    <button onclick="showTournamentTab('players-${tournament.TournamentId}')" class="tab-btn" style="padding: 12px 24px; background: transparent; border: none; border-radius: 8px; color: #888; cursor: pointer; font-weight: 600;">Players (${players.length})</button>
                    <button onclick="showTournamentTab('matches-${tournament.TournamentId}')" class="tab-btn" style="padding: 12px 24px; background: transparent; border: none; border-radius: 8px; color: #888; cursor: pointer; font-weight: 600;">Matches (${matches.length})</button>
                </div>
                
                <!-- Tab Content -->
                <div id="tab-info-${tournament.TournamentId}" class="tab-content">
                    <h3 style="color: white; margin-bottom: 16px;">Tournament Information</h3>
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: grid; gap: 16px;">
                            <div><span style="color: #888;">Start Time:</span> <span style="color: white; margin-left: 12px;">${startTime}</span></div>
                            <div><span style="color: #888;">Signup Opens:</span> <span style="color: white; margin-left: 12px;">${signupTime}</span></div>
                            <div><span style="color: #888;">Entry Fee:</span> <span style="color: white; margin-left: 12px;">${tournament.EntryFee || 0} credits</span></div>
                            <div><span style="color: #888;">Map:</span> <span style="color: white; margin-left: 12px;">${tournament.Phases?.[0]?.Maps?.[0] || 'Unknown'}</span></div>
                            <div><span style="color: #888;">Team Size:</span> <span style="color: white; margin-left: 12px;">${teamSize} players per team</span></div>
                            <div><span style="color: #888;">Players Per Match:</span> <span style="color: white; margin-left: 12px;">${tournament.MaxPlayersPerMatch || teamSize * 2}</span></div>
                        </div>
                    </div>
                </div>
                
                <div id="tab-teams-${tournament.TournamentId}" class="tab-content" style="display: none;">
                    <h3 style="color: white; margin-bottom: 16px;">Teams</h3>
                    ${teams.length > 0 ? teams.map(team => `
                        <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
                                <div>
                                    <h4 style="color: white; margin: 0;">Team ${team.teamId}</h4>
                                    <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;">Leader: ${team.leaderUsername}</p>
                                </div>
                                <span style="padding: 6px 12px; background: ${team.isFull ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${team.isFull ? '#10b981' : '#ef4444'}; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    ${team.teamSize}/${teamSize} ${team.isFull ? '✓' : '⚠'}
                                </span>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                ${team.members.map(member => `
                                    <span style="padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 13px; color: white;">
                                        ${member.isPartyLeader ? '👑 ' : ''}${member.username}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('') : '<p style="color: #888; text-align: center; padding: 40px;">No teams formed yet</p>'}
                </div>
                
                <div id="tab-players-${tournament.TournamentId}" class="tab-content" style="display: none;">
                    <h3 style="color: white; margin-bottom: 16px;">Players</h3>
                    <div style="display: grid; gap: 8px;">
                        ${players.length > 0 ? players.map(player => `
                            <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span style="color: white; font-weight: 600;">${player.isPartyLeader ? '👑 ' : ''}${player.username}</span>
                                    <span style="color: #666; font-size: 12px; margin-left: 12px;">ID: ${player.userId}</span>
                                </div>
                                <span style="padding: 4px 12px; background: rgba(102, 126, 234, 0.2); color: #667eea; border-radius: 6px; font-size: 12px;">
                                    ${player.signedUp ? '✓ Signed Up' : 'Not Signed'}
                                </span>
                            </div>
                        `).join('') : '<p style="color: #888; text-align: center; padding: 40px;">No players yet</p>'}
                    </div>
                </div>
                
                <div id="tab-matches-${tournament.TournamentId}" class="tab-content" style="display: none;">
                    <h3 style="color: white; margin-bottom: 16px;">Matches</h3>
                    ${matches.length > 0 ? matches.map(match => `
                        <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <div>
                                    <h4 style="color: white; margin: 0;">Round ${match.roundId} - Match ${match.matchId}</h4>
                                    <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;">Phase ${match.phaseId}</p>
                                </div>
                                <span style="padding: 6px 12px; background: rgba(102, 126, 234, 0.2); color: #667eea; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    ${match.statusLabel}
                                </span>
                            </div>
                            ${match.teams.length > 0 ? `
                                <div style="display: flex; gap: 16px; align-items: center;">
                                    ${match.teams.map((team, idx) => `
                                        <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; ${team.isWinner ? 'border: 2px solid #10b981;' : ''}">
                                            <div style="color: white; font-weight: 600; margin-bottom: 8px;">
                                                Team ${idx + 1} ${team.isWinner ? '🏆' : ''}
                                            </div>
                                            <div style="font-size: 12px; color: #888;">
                                                ${team.players.map(p => p.username).join(', ')}
                                            </div>
                                            <div style="color: white; font-size: 20px; font-weight: 700; margin-top: 8px;">
                                                Score: ${team.score}
                                            </div>
                                        </div>
                                        ${idx === 0 ? '<div style="color: #888; font-size: 20px;">VS</div>' : ''}
                                    `).join('')}
                                </div>
                            ` : '<p style="color: #888; text-align: center;">No teams assigned</p>'}
                        </div>
                    `).join('') : '<p style="color: #888; text-align: center; padding: 40px;">No matches yet</p>'}
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div style="padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 12px; background: rgba(0,0,0,0.3);">
                <button onclick="viewTournamentBracket('${tournament.TournamentId}')" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                    🏆 View Bracket
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" style="flex: 1; padding: 14px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show Tournament Tab
function showTournamentTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = '#888';
        btn.classList.remove('active-tab');
    });
    
    event.target.style.background = 'rgba(102, 126, 234, 0.2)';
    event.target.style.color = 'white';
    event.target.classList.add('active-tab');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.getElementById(`tab-${tabId}`).style.display = 'block';
}

// View Tournament Bracket
async function viewTournamentBracket(tournamentId) {
    try {
        const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/bracket`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load bracket');
        }
        
        showBracketModal(data.bracket);
    } catch (error) {
        console.error('Error loading bracket:', error);
        showToast('Failed to load bracket', 'error');
    }
}

// Show Bracket Modal
function showBracketModal(bracket) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; border-radius: 16px; max-width: 1400px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">🏆 Tournament Bracket</h2>
                    <p style="margin: 8px 0 0 0; color: #888; font-size: 14px;">${bracket.tournament?.TournamentName || 'Unknown Tournament'}</p>
                </div>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(255,255,255,0.1); border: none; width: 40px; height: 40px; border-radius: 8px; color: white; cursor: pointer; font-size: 20px;">×</button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 32px;">
                ${bracket.phases.length > 0 ? bracket.phases.map(phase => `
                    <div style="margin-bottom: 32px;">
                        <h3 style="color: white; margin-bottom: 20px;">Phase ${phase.phaseId}</h3>
                        ${phase.rounds.map(round => `
                            <div style="margin-bottom: 24px;">
                                <h4 style="color: #888; margin-bottom: 12px; font-size: 14px;">Round ${round.roundId}</h4>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 12px;">
                                    ${round.matches.map(match => `
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px;">
                                            <div style="color: #888; font-size: 12px; margin-bottom: 12px;">Match ${match.matchId}</div>
                                            ${match.teams.map(team => `
                                                <div style="background: ${team.isWinner ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)'}; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${team.isWinner ? '#10b981' : 'transparent'};">
                                                    <div style="color: white; font-weight: 600; margin-bottom: 4px;">
                                                        ${team.isWinner ? '🏆 ' : ''}${team.players.map(p => p.username).join(', ')}
                                                    </div>
                                                    <div style="color: #888; font-size: 12px;">Score: ${team.score}</div>
                                                </div>
                                            `).join('')}
                                            <div style="text-align: center; padding: 8px; margin-top: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
                                                <span style="color: #667eea; font-size: 12px; font-weight: 600;">${match.statusLabel}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('') : '<p style="color: #888; text-align: center; padding: 40px;">No bracket data available</p>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Update manageTournament function to use new details view
window.manageTournament = function(tournamentId) {
    viewTournamentDetails(tournamentId);
};

console.log('✅ Enhanced Dashboard Features Loaded');
