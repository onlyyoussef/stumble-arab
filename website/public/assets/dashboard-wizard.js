// Dashboard Wizard System
const API_BASE = window.location.origin + '/api';

let currentUser = null;
let currentStep = 1;
let tournamentData = {
    name: '',
    region: '0',
    mode: '1',
    maxParticipants: 32,
    selectedMaps: [],
    scheduledFor: null
};

// Maps data with images
const MAPS_DATA = [
    { id: 'block_dash', name: 'BLOCK DASH', image: 'https://cdn.stumbleupon.com/maps/block_dash.jpg' },
    { id: 'rush_hour', name: 'RUSH HOUR', image: 'https://cdn.stumbleupon.com/maps/rush_hour.jpg' },
    { id: 'laser_dash', name: 'LASER DASH', image: 'https://cdn.stumbleupon.com/maps/laser_dash.jpg' },
    { id: 'space_droop', name: 'SPACE DROOP', image: 'https://cdn.stumbleupon.com/maps/space_droop.jpg' },
    { id: 'paint_splash', name: 'PAINT SPLASH', image: 'https://cdn.stumbleupon.com/maps/paint_splash.jpg' },
    { id: 'lava_rush', name: 'LAVA RUSH', image: 'https://cdn.stumbleupon.com/maps/lava_rush.jpg' },
    { id: 'pivot_push', name: 'PIVOT PUSH', image: 'https://cdn.stumbleupon.com/maps/pivot_push.jpg' },
    { id: 'cannonball_chaos', name: 'CANNONBALL CHAOS', image: 'https://cdn.stumbleupon.com/maps/cannonball_chaos.jpg' },
    { id: 'stumble_trouble', name: 'STUMBLE TROUBLE', image: 'https://cdn.stumbleupon.com/maps/stumble_trouble.jpg' },
    { id: 'bit_aggression', name: '8-BIT AGGRESSION', image: 'https://cdn.stumbleupon.com/maps/bit_aggression.jpg' },
    { id: 'block_dash_legendary', name: 'BLOCK DASH LEGENDARY', image: 'https://cdn.stumbleupon.com/maps/block_dash_legendary.jpg' },
    { id: 'sharkunda_triangle', name: 'SHARKUNDA TRIANGLE', image: 'https://cdn.stumbleupon.com/maps/sharkunda_triangle.jpg' }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await promptForDiscordId();
    initializeDashboard();
    setupEventListeners();
    renderMaps();
});

// Prompt for Discord ID
async function promptForDiscordId() {
    let discordId = localStorage.getItem('discordId');
    let username = localStorage.getItem('username');
    
    if (!discordId || !username) {
        discordId = prompt('Enter your Discord ID:', '');
        if (!discordId) {
            alert('Discord ID is required!');
            return promptForDiscordId();
        }
        
        username = prompt('Enter your username:', '');
        if (!username) {
            alert('Username is required!');
            return promptForDiscordId();
        }
        
        localStorage.setItem('discordId', discordId);
        localStorage.setItem('username', username);
    }
    
    try {
        const response = await fetch(`${API_BASE}/dashboard/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId, username })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateUserInfo();
            
            if (currentUser.isAdmin) {
                addAdminFeatures();
            }
        }
    } catch (error) {
        console.error('Error registering user:', error);
    }
}

// Update user info
function updateUserInfo() {
    if (!currentUser) return;
    
    // Update header
    const headerCreditsValue = document.getElementById('headerCreditsValue');
    if (headerCreditsValue) {
        headerCreditsValue.textContent = `${currentUser.credits.toLocaleString()} Credits`;
    }
    
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    if (headerUserAvatar) {
        headerUserAvatar.textContent = currentUser.username[0].toUpperCase();
        headerUserAvatar.title = currentUser.username;
    }
    
    // Update sidebar
    const userInfoSection = document.getElementById('userInfoSection');
    if (userInfoSection) {
        const adminBadge = currentUser.isAdmin ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 600;">ADMIN</span>' : '';
        
        userInfoSection.innerHTML = `
            <div class="user-info">
                <div class="user-header">
                    <div class="user-avatar">${currentUser.username[0].toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name">${currentUser.username}</div>
                        ${adminBadge ? `<div style="margin-top: 6px;">${adminBadge}</div>` : ''}
                    </div>
                </div>
                <div class="tournaments-stat">
                    🏆 Tournaments: ${currentUser.tournamentsCreated || 0}
                </div>
                <button class="logout-btn" onclick="changeUser()">
                    <span>🔄</span> Change User
                </button>
            </div>
        `;
    }
}

// Change user
function changeUser() {
    localStorage.removeItem('discordId');
    localStorage.removeItem('username');
    location.reload();
}

// Add admin features
function addAdminFeatures() {
    const usersNavItem = document.getElementById('usersNavItem');
    if (usersNavItem) {
        usersNavItem.style.display = 'flex';
    }
    
    const adminQuickActions = document.getElementById('adminQuickActions');
    if (adminQuickActions) {
        adminQuickActions.style.display = 'flex';
        adminQuickActions.style.gap = '10px';
        adminQuickActions.innerHTML = `
            <button onclick="navigateToPage('users')" class="btn-primary" style="padding: 8px 16px; font-size: 13px;">
                👥 Manage Users
            </button>
        `;
    }
}

// Initialize Dashboard
function initializeDashboard() {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.opacity = '1';
    }, 1500);
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
    
    // New Tournament Button
    const newTournamentBtn = document.getElementById('newTournamentBtn');
    if (newTournamentBtn) {
        newTournamentBtn.addEventListener('click', () => {
            navigateToPage('create');
        });
    }
    
    // Wizard Navigation
    const wizardBackBtn = document.getElementById('wizardBackBtn');
    const wizardCancelBtn = document.getElementById('wizardCancelBtn');
    const wizardPrevBtn = document.getElementById('wizardPrevBtn');
    const wizardNextBtn = document.getElementById('wizardNextBtn');
    const wizardSubmitBtn = document.getElementById('wizardSubmitBtn');
    
    if (wizardBackBtn) wizardBackBtn.addEventListener('click', () => navigateToPage('schedule'));
    if (wizardCancelBtn) wizardCancelBtn.addEventListener('click', () => navigateToPage('schedule'));
    if (wizardPrevBtn) wizardPrevBtn.addEventListener('click', prevStep);
    if (wizardNextBtn) wizardNextBtn.addEventListener('click', nextStep);
    if (wizardSubmitBtn) wizardSubmitBtn.addEventListener('click', submitTournament);
    
    // Form inputs
    document.getElementById('tournamentName')?.addEventListener('input', (e) => {
        tournamentData.name = e.target.value;
    });
    
    document.getElementById('tournamentRegion')?.addEventListener('change', (e) => {
        tournamentData.region = e.target.value;
    });
    
    document.getElementById('tournamentMode')?.addEventListener('change', (e) => {
        tournamentData.mode = e.target.value;
    });
    
    document.getElementById('maxParticipants')?.addEventListener('change', (e) => {
        tournamentData.maxParticipants = parseInt(e.target.value);
    });
}

// Navigation
function navigateToPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    
    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.remove('active');
    });
    
    const pageMap = {
        analytics: 'analyticsPage',
        schedule: 'schedulePage',
        create: 'createPage',
        shop: 'shopPage',
        wagers: 'wagersPage',
        users: 'usersPage'
    };
    
    const targetPage = document.getElementById(pageMap[page]);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    const titleMap = {
        analytics: 'Analytics',
        schedule: 'Schedule',
        create: 'Create Tournament',
        shop: 'Shop',
        wagers: 'Wagers',
        users: 'User Management'
    };
    document.getElementById('pageTitle').textContent = titleMap[page] || 'Dashboard';
    
    if (page === 'create') {
        currentStep = 1;
        updateWizardStep();
    }
    
    if (page === 'users') loadAllUsers();
}

// Wizard Navigation
function nextStep() {
    if (currentStep < 5) {
        currentStep++;
        updateWizardStep();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardStep();
    }
}

function updateWizardStep() {
    // Update progress items
    document.querySelectorAll('.progress-item').forEach((item, index) => {
        const stepNum = index + 1;
        if (stepNum < currentStep) {
            item.classList.add('completed');
            item.classList.remove('active');
        } else if (stepNum === currentStep) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    });
    
    // Update wizard steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.wizard-step[data-step="${currentStep}"]`)?.classList.add('active');
    
    // Update buttons
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');
    const submitBtn = document.getElementById('wizardSubmitBtn');
    
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }
    
    if (currentStep === 5) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
        updateSummary();
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function updateSummary() {
    const regionNames = ['Europe', 'North America', 'South America', 'Asia', 'Oceania'];
    document.getElementById('summaryTitle').textContent = tournamentData.name || '✏️';
    document.getElementById('summaryRegion').textContent = regionNames[parseInt(tournamentData.region)] || 'Europe';
    document.getElementById('summaryMode').textContent = tournamentData.mode + 'v' + tournamentData.mode;
    document.getElementById('summaryPlayers').textContent = tournamentData.maxParticipants;
}

// Render Maps
function renderMaps() {
    const mapsGrid = document.getElementById('mapsGrid');
    if (!mapsGrid) return;
    
    mapsGrid.innerHTML = MAPS_DATA.map(map => `
        <div class="map-card" data-map-id="${map.id}" onclick="toggleMap('${map.id}')">
            <img src="${map.image}" alt="${map.name}" class="map-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'%3E%3Crect fill=\\'%231a1a1a\\' width=\\'300\\' height=\\'200\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23666\\' font-size=\\'16\\' font-weight=\\'bold\\'%3E${map.name}%3C/text%3E%3C/svg%3E'">
            <div class="map-name">${map.name}</div>
        </div>
    `).join('');
}

// Toggle Map Selection
function toggleMap(mapId) {
    const mapCard = document.querySelector(`[data-map-id="${mapId}"]`);
    if (!mapCard) return;
    
    const isSelected = tournamentData.selectedMaps.includes(mapId);
    
    if (isSelected) {
        tournamentData.selectedMaps = tournamentData.selectedMaps.filter(id => id !== mapId);
        mapCard.classList.remove('selected');
    } else {
        tournamentData.selectedMaps.push(mapId);
        mapCard.classList.add('selected');
    }
    
    updateMapCounter();
}

function updateMapCounter() {
    const counter = document.querySelector('.map-counter');
    if (counter) {
        counter.textContent = `${tournamentData.selectedMaps.length} / 1 PICKED`;
    }
}

// Submit Tournament
async function submitTournament() {
    if (!currentUser) {
        showToast('Please refresh the page', 'error');
        return;
    }
    
    if (currentUser.credits < 1) {
        showToast('⚠️ Insufficient credits! You need at least 1 credit.', 'error');
        return;
    }
    
    if (!tournamentData.name) {
        showToast('Please enter a tournament name', 'error');
        return;
    }
    
    const formData = {
        discordId: currentUser.discordId,
        username: currentUser.username,
        name: tournamentData.name,
        mode: parseInt(tournamentData.mode),
        region: parseInt(tournamentData.region),
        maxParticipants: tournamentData.maxParticipants,
        map: tournamentData.selectedMaps[0] || 'BlockDash',
        roundCount: 3
    };
    
    const scheduledDate = document.getElementById('scheduledDate')?.value;
    if (scheduledDate) {
        formData.scheduledFor = new Date(scheduledDate).toISOString();
    }
    
    try {
        const response = await fetch(`${API_BASE}/tournaments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create tournament');
        }
        
        showToast('🎉 Tournament created! 1 credit deducted.', 'success');
        
        currentUser.credits = result.remainingCredits;
        currentUser.tournamentsCreated = (currentUser.tournamentsCreated || 0) + 1;
        updateUserInfo();
        
        // Reset form
        tournamentData = {
            name: '',
            region: '0',
            mode: '1',
            maxParticipants: 32,
            selectedMaps: [],
            scheduledFor: null
        };
        
        setTimeout(() => {
            navigateToPage('schedule');
        }, 1000);
    } catch (error) {
        console.error('Error creating tournament:', error);
        showToast(error.message || 'Failed to create tournament', 'error');
    }
}

// Load All Users (Admin)
async function loadAllUsers() {
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
                <div style="margin-bottom: 30px;">
                    <h1 style="font-size: 31px; font-weight: 700; letter-spacing: -1px;">User Management</h1>
                    <p style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">Manage credits for all users</p>
                </div>
                <div id="usersListContainer"></div>
            `;
        }
        
        const usersList = document.getElementById('usersListContainer');
        
        if (data.users.length === 0) {
            usersList.innerHTML = '<p style="color: #8990a1; text-align: center; padding: 40px;">No users found</p>';
            return;
        }
        
        usersList.innerHTML = data.users.map(user => {
            const isCurrentUser = user.discordId === currentUser.discordId;
            const isAdminUser = ['1394118417275031672', '1548373280438886444'].includes(user.discordId);
            
            return `
            <div style="background: var(--bg-card); padding: 24px; border-radius: 12px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 600; color: white; display: flex; align-items: center; gap: 10px;">
                            ${user.username}
                            ${isAdminUser ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">👑 ADMIN</span>' : ''}
                            ${isCurrentUser ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">✓ YOU</span>' : ''}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 13px; margin-top: 4px;">Discord ID: ${user.discordId}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 28px; font-weight: 800; color: var(--accent-primary);">${user.credits.toLocaleString()}</div>
                        <div style="color: var(--text-secondary); font-size: 12px;">Credits</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button onclick="updateUserCredits('${user.discordId}', '${user.username}', ${user.credits}, 'add')" 
                            style="flex: 1; padding: 12px; background: #10b981; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ➕ Add Credits
                    </button>
                    <button onclick="updateUserCredits('${user.discordId}', '${user.username}', ${user.credits}, 'remove')" 
                            style="flex: 1; padding: 12px; background: #ef4444; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ➖ Remove Credits
                    </button>
                    <button onclick="updateUserCredits('${user.discordId}', '${user.username}', ${user.credits}, 'set')" 
                            style="flex: 1; padding: 12px; background: var(--accent-primary); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; font-size: 14px;">
                        ⚙️ Set Credits
                    </button>
                </div>
                <div style="padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 12px; color: #666;">
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

// Update User Credits
async function updateUserCredits(discordId, username, currentCredits, action) {
    let newCredits;
    
    if (action === 'add') {
        const amount = prompt(`Add credits to ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter amount to ADD:`, '100');
        if (!amount || isNaN(amount) || parseInt(amount) <= 0) return;
        newCredits = currentCredits + parseInt(amount);
    } else if (action === 'remove') {
        const amount = prompt(`Remove credits from ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter amount to REMOVE:`, '50');
        if (!amount || isNaN(amount) || parseInt(amount) <= 0) return;
        newCredits = Math.max(0, currentCredits - parseInt(amount));
    } else if (action === 'set') {
        const amount = prompt(`Set credits for ${username}\nCurrent: ${currentCredits.toLocaleString()}\n\nEnter NEW total:`, currentCredits.toString());
        if (!amount || isNaN(amount) || parseInt(amount) < 0) return;
        newCredits = parseInt(amount);
    }
    
    try {
        const response = await fetch(`${API_BASE}/dashboard/credits/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId, credits: newCredits })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        
        showToast(`✅ Credits updated for ${username}!`, 'success');
        await loadAllUsers();
        
        if (currentUser && discordId === currentUser.discordId) {
            currentUser.credits = newCredits;
            updateUserInfo();
        }
    } catch (error) {
        console.error('Error updating credits:', error);
        showToast(error.message || 'Failed to update credits', 'error');
    }
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
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
