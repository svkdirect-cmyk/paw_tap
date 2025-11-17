class DarkPawsClicker {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.gameState = {
            score: 0,
            level: 1,
            upgrades: {
                clickPower: { level: 1, baseCost: 10, costMultiplier: 1.8, name: "Сила лапы", icon: "💪" },
                autoClick: { level: 0, baseCost: 50, costMultiplier: 1.9, name: "Авто-клик", icon: "⚡" },
                criticalChance: { level: 1, baseCost: 25, costMultiplier: 1.7, name: "Точность", icon: "🎯" }
            },
            levels: [
                { number: 1, requiredScore: 0, reward: "Начальный набор", rewardDesc: "+10 к силе клика", icon: "🎁", completed: true },
                { number: 2, requiredScore: 1000, reward: "Авто-кликер", rewardDesc: "+1 авто-клик/сек", icon: "⚡", completed: false },
                { number: 3, requiredScore: 5000, reward: "Критический удар", rewardDesc: "+10% шанс крита", icon: "🎯", completed: false },
                { number: 4, requiredScore: 15000, reward: "Премиум буст", rewardDesc: "x2 все бонусы", icon: "💎", completed: false }
            ],
            achievements: [
                { id: "firstSteps", name: "Первые шаги", desc: "Сделать 100 кликов", icon: "🎮", unlocked: false, requirement: 100 },
                { id: "hardWorker", name: "Усердный работник", desc: "Сделать 1000 кликов", icon: "💪", unlocked: false, requirement: 1000 },
                { id: "clickMaster", name: "Клик-мастер", desc: "Сделать 10000 кликов", icon: "🚀", unlocked: false, requirement: 10000 }
            ],
            comboCards: [
                { id: 1, name: "Лапа новичка", rarity: "common", icon: "🐾", stats: "+5% к клику", unlocked: false },
                { id: 2, name: "Энергия", rarity: "rare", icon: "⚡", stats: "+3 авто-клика", unlocked: false },
                { id: 3, name: "Точность", rarity: "epic", icon: "🎯", stats: "+15% шанс крита", unlocked: false },
                { id: 4, name: "Алмазная лапа", rarity: "legendary", icon: "💎", stats: "x2 все бонусы", unlocked: false }
            ],
            stats: {
                totalClicks: 0,
                totalScore: 0,
                playTime: 0,
                joinDate: new Date().toISOString(),
                criticalHits: 0
            },
            friends: [],
            lastSave: Date.now()
        };
        
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.adminEnabled = false;
        this.adminCode = '1337';
        this.adminPressTimer = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Dark Paws Clicker...');
        
        // Инициализируем Telegram Web App
        if (this.tg && this.tg.initDataUnsafe) {
            console.log('📱 Telegram WebApp initialized');
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        this.loadGameState();
        this.setupTabs();
        this.updateUI();
        this.startAutoClicker();
        this.startPlayTimeCounter();
        this.setupAdminPanel();
        
        console.log('✅ Game initialized successfully');
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Клик по лапке
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            console.log('🐾 Paw button found, adding listeners');
            
            pawButton.addEventListener('click', (e) => {
                console.log('👆 Paw button clicked');
                this.handleClick(e);
            });
            
            pawButton.addEventListener('mousedown', () => {
                console.log('🖱️ Paw button mouse down');
                pawButton.classList.add('click-animation');
            });
            
            pawButton.addEventListener('mouseup', () => {
                console.log('🖱️ Paw button mouse up');
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
            });

            // Touch события для мобильных устройств
            pawButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('📱 Paw button touch start');
                pawButton.classList.add('click-animation');
            });

            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                console.log('📱 Paw button touch end');
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
            });
        } else {
            console.error('❌ Paw button not found!');
        }

        // Открытие профиля
        const profileOpener = document.getElementById('profile-opener');
        if (profileOpener) {
            console.log('👤 Profile opener found');
            profileOpener.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📱 Opening profile');
                this.openProfile();
            });
        } else {
            console.error('❌ Profile opener not found!');
        }

        // Закрытие профиля
        const closeProfile = document.getElementById('close-profile');
        if (closeProfile) {
            closeProfile.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('❌ Closing profile');
                this.closeProfile();
            });
        }

        // Клик по фону для закрытия модального окна
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.closeProfile();
                }
            });
        }

        // Кнопка приглашения друзей
        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.inviteFriends();
            });
        }

        console.log('✅ Event listeners setup completed');
    }

    setupTabs() {
        console.log('📑 Setting up tabs...');
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;
                console.log('🔄 Switching to tab:', tabId);
                this.switchTab(tabId);
            });
        });

        console.log('✅ Tabs setup completed');
    }

    switchTab(tabId) {
        console.log('🔄 Switching to tab:', tabId);
        
        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Показываем выбранную вкладку
        const targetTab = document.getElementById(tabId);
        const targetTabButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetTabButton) {
            targetTab.classList.add('active');
            targetTabButton.classList.add('active');
            this.currentTab = tabId;
            
            // Обновляем контент вкладки
            this.updateTabContent(tabId);
        } else {
            console.error('❌ Tab not found:', tabId);
        }
    }

    updateTabContent(tabId) {
        console.log('🔄 Updating tab content:', tabId);
        switch(tabId) {
            case 'game-tab':
                this.updateUpgrades();
                break;
            case 'friends-tab':
                this.updateFriendsTab();
                break;
            case 'levels-tab':
                this.updateLevelsTab();
                break;
            case 'combo-tab':
                this.updateComboTab();
                break;
        }
    }

    initTelegramAuth() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            console.log('✅ User authenticated:', this.user);
        } else {
            console.log('👤 No Telegram user data available, using demo user');
            // Для демо создаем тестового пользователя
            this.user = {
                id: Math.floor(Math.random() * 10000),
                first_name: 'Telegram Игрок',
                username: 'telegram_player',
                photo_url: ''
            };
        }
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.user) {
            const username = document.getElementById('user-name');
            const profileName = document.getElementById('profile-name');
            const levelText = document.querySelector('.level-text');
            const userAvatar = document.getElementById('user-avatar');
            const profileAvatar = document.getElementById('profile-avatar');
            
            if (username) {
                username.textContent = this.user.first_name || 'Player';
                console.log('👤 Username updated:', this.user.first_name);
            }
            if (profileName) profileName.textContent = this.user.first_name || 'Player';
            if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;

            // Загружаем аватарку из Telegram
            if (this.user.photo_url) {
                console.log('🖼️ Loading avatar from Telegram:', this.user.photo_url);
                if (userAvatar) {
                    userAvatar.src = this.user.photo_url;
                    userAvatar.style.display = 'block';
                    userAvatar.onerror = () => {
                        console.error('❌ Failed to load user avatar');
                        userAvatar.style.display = 'none';
                    };
                }
                if (profileAvatar) {
                    profileAvatar.src = this.user.photo_url;
                    profileAvatar.style.display = 'block';
                    profileAvatar.onerror = () => {
                        console.error('❌ Failed to load profile avatar');
                        profileAvatar.style.display = 'none';
                    };
                }
            } else {
                console.log('🖼️ No avatar URL available');
                // Скрываем аватарки если нет фото
                if (userAvatar) userAvatar.style.display = 'none';
                if (profileAvatar) profileAvatar.style.display = 'none';
            }
        }
    }

    updateUI() {
        console.log('🎨 Updating UI...');
        
        // Обновляем счет и уровень
        const scoreElement = document.getElementById('score');
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        
        if (scoreElement) {
            scoreElement.textContent = Math.floor(this.gameState.score).toLocaleString();
            console.log('💰 Score updated:', this.gameState.score);
        }
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            console.log('📊 Level badge updated:', this.gameState.level);
        }
        if (levelText) {
            levelText.textContent = `Уровень ${this.gameState.level}`;
        }
        
        // Обновляем прогресс бар
        this.updateHeaderProgressBar();
        
        // Обновляем улучшения
        this.updateUpgrades();
        
        console.log('✅ UI update completed');
    }

    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        let progress = Math.max(0, this.gameState.score - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        let percentage = 0;
        if (totalNeeded > 0) {
            percentage = (progress / totalNeeded) * 100;
        } else {
            percentage = 100;
        }
        
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        if (progressFillHeader) {
            progressFillHeader.style.width = `${percentage}%`;
            console.log('📈 Progress bar updated:', percentage + '%');
        }
    }

    updateUpgrades() {
        const container = document.getElementById('upgrades-grid');
        if (!container) {
            console.error('❌ Upgrades grid container not found!');
            return;
        }

        console.log('⚡ Updating upgrades...', Object.keys(this.gameState.upgrades));

        let html = '';
        Object.keys(this.gameState.upgrades).forEach(upgradeKey => {
            const upgrade = this.gameState.upgrades[upgradeKey];
            const cost = this.calculateUpgradeCost(upgradeKey);
            const affordable = this.gameState.score >= cost;
            
            html += `
                <div class="upgrade-card" data-upgrade="${upgradeKey}">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-info">
                        <div class="upgrade-name">${upgrade.name}</div>
                        <div class="upgrade-level">Уровень <span>${upgrade.level}</span></div>
                    </div>
                    <button class="upgrade-btn ${affordable ? 'affordable' : ''}" 
                            data-cost="${cost}" 
                            ${!affordable ? 'disabled' : ''}>
                        ${cost}
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Upgrades HTML generated');

        // Добавляем обработчики событий для кнопок улучшений
        const upgradeButtons = document.querySelectorAll('.upgrade-btn');
        console.log(`🔘 Found ${upgradeButtons.length} upgrade buttons`);
        
        upgradeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    const upgradeType = upgradeCard.dataset.upgrade;
                    console.log('🛒 Buying upgrade:', upgradeType);
                    this.buyUpgrade(upgradeType);
                }
            });
        });

        console.log('✅ Upgrades update completed');
    }

    calculateUpgradeCost(upgradeKey) {
        const upgrade = this.gameState.upgrades[upgradeKey];
        if (upgrade.level === 0) return upgrade.baseCost;
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
    }

    buyUpgrade(upgradeKey) {
        const cost = this.calculateUpgradeCost(upgradeKey);
        
        if (this.gameState.score >= cost) {
            this.gameState.score -= cost;
            this.gameState.upgrades[upgradeKey].level++;
            
            this.updateUI();
            this.saveGameState();
            this.showUpgradeNotification(upgradeKey);
        } else {
            this.showInsufficientFundsNotification(cost);
        }
    }

    handleClick(event) {
        console.log('👆 Handle click called');
        this.gameState.stats.totalClicks++;
        
        // Вычисляем очки
        let points = this.gameState.upgrades.clickPower.level;
        let isCritical = false;
        
        // Шанс критического удара
        const critChance = this.gameState.upgrades.criticalChance.level * 0.03;
        if (Math.random() < critChance) {
            points *= 3;
            isCritical = true;
            this.gameState.stats.criticalHits++;
            console.log('🎯 Critical hit!');
        }
        
        this.addScore(points, isCritical);
        this.checkAchievements();
        
        // Создаем эффекты частиц
        this.createParticles(event);
        
        console.log(`💰 Added ${points} points, total: ${this.gameState.score}`);
    }

    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        this.gameState.stats.totalScore += points;
        
        // Проверка уровня
        let leveledUp = false;
        while (this.gameState.score >= this.getRequiredScoreForLevel(this.gameState.level + 1) && this.gameState.level < this.getMaxLevel()) {
            this.gameState.level++;
            leveledUp = true;
            console.log('🎉 Level up! New level:', this.gameState.level);
        }
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
    }

    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        const levelData = this.gameState.levels.find(l => l.number === level);
        return levelData ? levelData.requiredScore : Math.floor(100 * level * (level + 1) / 2);
    }

    getMaxLevel() {
        return 100;
    }

    showLevelUp() {
        const levelBadge = document.querySelector('.level-badge');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
        
        this.saveGameState();
    }

    checkAchievements() {
        const clicks = this.gameState.stats.totalClicks;
        
        this.gameState.achievements.forEach(achievement => {
            if (!achievement.unlocked && clicks >= achievement.requirement) {
                achievement.unlocked = true;
                this.showAchievementNotification(achievement.name);
            }
        });
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        // Создаем 5-8 частиц
        const particleCount = 5 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Случайное направление и расстояние
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                --tx: ${tx}px;
                --ty: ${ty}px;
                left: 50%;
                top: 50%;
                width: ${2 + Math.random() * 4}px;
                height: ${2 + Math.random() * 4}px;
                opacity: ${0.3 + Math.random() * 0.7};
                animation: particle-float ${0.8 + Math.random() * 0.4}s ease-out forwards;
            `;
            
            container.appendChild(particle);
            
            // Удаляем частицу после анимации
            setTimeout(() => {
                if (particle.parentNode === container) {
                    container.removeChild(particle);
                }
            }, 1200);
        }
    }

    startAutoClicker() {
        console.log('🤖 Starting auto-clicker');
        setInterval(() => {
            if (this.gameState.upgrades.autoClick.level > 0) {
                const autoPoints = this.gameState.upgrades.autoClick.level;
                this.addScore(autoPoints);
            }
        }, 1000);
    }

    startPlayTimeCounter() {
        setInterval(() => {
            this.gameState.stats.playTime += 1000;
        }, 1000);
    }

    // Админ-панель
    setupAdminPanel() {
        console.log('🔧 Setting up admin panel...');
        const pawButton = document.getElementById('paw-button');
        if (!pawButton) {
            console.error('❌ Paw button not found for admin panel');
            return;
        }

        let pressStartTime = 0;
        let pressTimer = null;
        
        pawButton.addEventListener('mousedown', (e) => {
            console.log('🖱️ Admin panel: mouse down');
            pressStartTime = Date.now();
            pressTimer = setTimeout(() => {
                this.showAdminActivation();
            }, 3000);
        });

        pawButton.addEventListener('mouseup', (e) => {
            console.log('🖱️ Admin panel: mouse up');
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        });

        pawButton.addEventListener('mouseleave', (e) => {
            console.log('🖱️ Admin panel: mouse leave');
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        });

        // Touch события
        pawButton.addEventListener('touchstart', (e) => {
            console.log('📱 Admin panel: touch start');
            pressStartTime = Date.now();
            pressTimer = setTimeout(() => {
                this.showAdminActivation();
            }, 3000);
        });

        pawButton.addEventListener('touchend', (e) => {
            console.log('📱 Admin panel: touch end');
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        });

        this.setupAdminEventListeners();
        this.setupAdminNavigation();
        
        console.log('✅ Admin panel setup completed');
    }

    setupAdminNavigation() {
        const navButtons = document.querySelectorAll('.admin-nav-btn');
        console.log(`🔘 Found ${navButtons.length} admin nav buttons`);
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                console.log('📱 Admin nav clicked:', section);
                this.switchAdminSection(section);
            });
        });
    }

    switchAdminSection(sectionId) {
        console.log('🔄 Switching admin section:', sectionId);
        
        // Скрываем все секции
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Показываем выбранную секцию
        const targetSection = document.getElementById(`admin-${sectionId}-section`);
        const targetButton = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (targetSection && targetButton) {
            targetSection.classList.add('active');
            targetButton.classList.add('active');
            this.updateAdminSection(sectionId);
        } else {
            console.error('❌ Admin section not found:', sectionId);
        }
    }

    updateAdminSection(sectionId) {
        console.log('🔄 Updating admin section:', sectionId);
        switch(sectionId) {
            case 'upgrades':
                this.updateAdminUpgrades();
                break;
            case 'levels':
                this.updateAdminLevels();
                break;
            case 'achievements':
                this.updateAdminAchievements();
                break;
            case 'combo':
                this.updateAdminComboCards();
                break;
        }
    }

    setupAdminEventListeners() {
        console.log('🔧 Setting up admin event listeners...');
        
        // Закрытие админ-панели
        const closeAdmin = document.getElementById('close-admin');
        if (closeAdmin) {
            closeAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('❌ Closing admin panel');
                this.closeAdminPanel();
            });
        } else {
            console.error('❌ Close admin button not found!');
        }

        // Клик по фону для закрытия
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.addEventListener('click', (e) => {
                if (e.target === adminPanel) {
                    this.closeAdminPanel();
                }
            });
        } else {
            console.error('❌ Admin panel element not found!');
        }

        // Быстрые действия
        this.setupAdminButton('admin-add-1000', () => this.adminAddScore(1000));
        this.setupAdminButton('admin-add-10000', () => this.adminAddScore(10000));
        this.setupAdminButton('admin-level-up', () => this.adminLevelUp());
        this.setupAdminButton('admin-max-all', () => this.adminMaxAll());
        this.setupAdminButton('admin-reset-game', () => this.adminResetGame());

        // Управление улучшениями
        this.setupAdminButton('admin-max-upgrades', () => this.adminMaxUpgrades());

        // Управление уровнями
        this.setupAdminButton('admin-unlock-all-levels', () => this.adminUnlockAllLevels());

        // Управление достижениями
        this.setupAdminButton('admin-unlock-all-achievements', () => this.adminUnlockAllAchievements());

        // Управление картами
        this.setupAdminButton('admin-unlock-all-cards', () => this.adminUnlockAllCards());

        // Основные кнопки
        this.setupAdminButton('admin-apply', () => this.adminApplyChanges());
        this.setupAdminButton('admin-save-close', () => this.adminSaveAndClose());

        console.log('✅ Admin event listeners setup completed');
    }

    setupAdminButton(buttonId, callback) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🔘 Admin button clicked: ${buttonId}`);
                callback();
            });
        } else {
            console.error(`❌ Admin button not found: ${buttonId}`);
        }
    }

    showAdminActivation() {
        console.log('🔓 Showing admin activation');
        if (this.adminEnabled) {
            console.log('✅ Admin already enabled, opening panel');
            this.openAdminPanel();
            return;
        }

        console.log('🔐 Requesting admin code');
        const code = prompt('Введите код доступа к админ-панели:');
        if (code === this.adminCode) {
            this.adminEnabled = true;
            console.log('✅ Admin panel activated successfully');
            this.openAdminPanel();
        } else if (code) {
            alert('Неверный код доступа!');
            console.log('❌ Invalid admin code entered');
        }
    }

    openAdminPanel() {
        if (!this.adminEnabled) {
            console.log('❌ Admin panel not enabled');
            return;
        }
        
        console.log('🚪 Opening admin panel');
        this.updateAdminPanel();
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.add('active');
            console.log('✅ Admin panel opened successfully');
        } else {
            console.error('❌ Admin panel element not found!');
        }
    }

    closeAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('active');
            console.log('✅ Admin panel closed');
        }
    }

    updateAdminPanel() {
        console.log('🔄 Updating admin panel data');
        
        // Заполняем поля текущими значениями
        this.setAdminInputValue('admin-score', this.gameState.score);
        this.setAdminInputValue('admin-level', this.gameState.level);
        this.setAdminInputValue('admin-total-clicks', this.gameState.stats.totalClicks);
        
        this.updateAdminUpgrades();
        this.updateAdminLevels();
        this.updateAdminAchievements();
        this.updateAdminComboCards();
    }

    setAdminInputValue(inputId, value) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = value;
        } else {
            console.error(`❌ Admin input not found: ${inputId}`);
        }
    }

    updateAdminUpgrades() {
        const container = document.getElementById('admin-upgrades-list');
        if (!container) {
            console.error('❌ Admin upgrades list container not found!');
            return;
        }

        let html = '';
        Object.keys(this.gameState.upgrades).forEach(upgradeKey => {
            const upgrade = this.gameState.upgrades[upgradeKey];
            const cost = this.calculateUpgradeCost(upgradeKey);
            
            html += `
                <div class="upgrade-control">
                    <div class="upgrade-control-info">
                        <div class="upgrade-control-icon">${upgrade.icon}</div>
                        <div class="upgrade-control-details">
                            <div class="upgrade-control-name">${upgrade.name}</div>
                            <div class="upgrade-control-stats">
                                Уровень: ${upgrade.level} | Стоимость: ${cost}
                            </div>
                        </div>
                    </div>
                    <div class="upgrade-control-actions">
                        <input type="number" id="admin-${upgradeKey}-level" value="${upgrade.level}" min="0" max="1000">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Admin upgrades updated');
    }

    updateAdminLevels() {
        const container = document.getElementById('admin-levels-list');
        if (!container) {
            console.error('❌ Admin levels list container not found!');
            return;
        }

        let html = '';
        this.gameState.levels.forEach(level => {
            html += `
                <div class="level-control">
                    <div class="level-control-info">
                        <div class="level-control-number">${level.number}</div>
                        <div class="level-control-details">
                            <div class="level-control-name">Уровень ${level.number}</div>
                            <div class="level-control-requirements">
                                Нужно очков: ${level.requiredScore} | Награда: ${level.reward}
                            </div>
                        </div>
                    </div>
                    <div class="level-control-actions">
                        <input type="number" id="admin-level-${level.number}-score" value="${level.requiredScore}" min="0">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Admin levels updated');
    }

    updateAdminAchievements() {
        const container = document.getElementById('admin-achievements-list');
        if (!container) {
            console.error('❌ Admin achievements list container not found!');
            return;
        }

        let html = '';
        this.gameState.achievements.forEach(achievement => {
            html += `
                <div class="achievement-control">
                    <div class="achievement-control-info">
                        <div class="achievement-control-icon">${achievement.icon}</div>
                        <div class="achievement-control-details">
                            <div class="achievement-control-name">${achievement.name}</div>
                            <div class="achievement-control-desc">
                                ${achievement.desc} | Требование: ${achievement.requirement}
                            </div>
                        </div>
                    </div>
                    <div class="achievement-control-actions">
                        <input type="number" id="admin-achievement-${achievement.id}" value="${achievement.requirement}" min="0">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Admin achievements updated');
    }

    updateAdminComboCards() {
        const container = document.getElementById('admin-cards-list');
        if (!container) {
            console.error('❌ Admin cards list container not found!');
            return;
        }

        let html = '';
        this.gameState.comboCards.forEach(card => {
            html += `
                <div class="card-control">
                    <div class="card-control-icon">${card.icon}</div>
                    <div class="card-control-name">${card.name}</div>
                    <div class="card-control-rarity ${card.rarity}">${this.getRarityText(card.rarity)}</div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Admin combo cards updated');
    }

    // Методы админ-панели
    adminAddScore(amount) {
        this.gameState.score += amount;
        this.updateUI();
        this.updateAdminPanel();
        console.log(`💰 Admin added ${amount} points`);
    }

    adminLevelUp() {
        this.gameState.level++;
        this.showLevelUp();
        this.updateUI();
        this.updateAdminPanel();
        console.log(`📈 Admin level up to ${this.gameState.level}`);
    }

    adminMaxUpgrades() {
        Object.keys(this.gameState.upgrades).forEach(upgradeKey => {
            this.gameState.upgrades[upgradeKey].level = 100;
        });
        this.updateUI();
        this.updateAdminPanel();
        console.log('⚡ Admin maxed all upgrades');
    }

    adminUnlockAllLevels() {
        this.gameState.levels.forEach(level => {
            level.completed = true;
        });
        this.gameState.level = this.gameState.levels.length;
        this.updateUI();
        this.updateAdminPanel();
        console.log('🔓 Admin unlocked all levels');
    }

    adminUnlockAllAchievements() {
        this.gameState.achievements.forEach(achievement => {
            achievement.unlocked = true;
        });
        this.updateUI();
        this.updateAdminPanel();
        console.log('🏆 Admin unlocked all achievements');
    }

    adminUnlockAllCards() {
        this.gameState.comboCards.forEach(card => {
            card.unlocked = true;
        });
        this.updateUI();
        this.updateAdminPanel();
        console.log('🃏 Admin unlocked all cards');
    }

    adminMaxAll() {
        this.adminMaxUpgrades();
        this.adminUnlockAllLevels();
        this.adminUnlockAllAchievements();
        this.adminUnlockAllCards();
        this.gameState.score = 999999;
        this.gameState.level = this.gameState.levels.length;
        this.updateUI();
        this.updateAdminPanel();
        console.log('🎯 Admin maxed everything');
    }

    adminResetGame() {
        if (confirm('⚠️ ВЫ УВЕРЕНЫ? Это полностью сбросит всю игру!')) {
            const originalUser = { ...this.user };
            this.gameState = {
                score: 0,
                level: 1,
                upgrades: {
                    clickPower: { level: 1, baseCost: 10, costMultiplier: 1.8, name: "Сила лапы", icon: "💪" },
                    autoClick: { level: 0, baseCost: 50, costMultiplier: 1.9, name: "Авто-клик", icon: "⚡" },
                    criticalChance: { level: 1, baseCost: 25, costMultiplier: 1.7, name: "Точность", icon: "🎯" }
                },
                levels: [
                    { number: 1, requiredScore: 0, reward: "Начальный набор", rewardDesc: "+10 к силе клика", icon: "🎁", completed: true },
                    { number: 2, requiredScore: 1000, reward: "Авто-кликер", rewardDesc: "+1 авто-клик/сек", icon: "⚡", completed: false },
                    { number: 3, requiredScore: 5000, reward: "Критический удар", rewardDesc: "+10% шанс крита", icon: "🎯", completed: false },
                    { number: 4, requiredScore: 15000, reward: "Премиум буст", rewardDesc: "x2 все бонусы", icon: "💎", completed: false }
                ],
                achievements: [
                    { id: "firstSteps", name: "Первые шаги", desc: "Сделать 100 кликов", icon: "🎮", unlocked: false, requirement: 100 },
                    { id: "hardWorker", name: "Усердный работник", desc: "Сделать 1000 кликов", icon: "💪", unlocked: false, requirement: 1000 },
                    { id: "clickMaster", name: "Клик-мастер", desc: "Сделать 10000 кликов", icon: "🚀", unlocked: false, requirement: 10000 }
                ],
                comboCards: [
                    { id: 1, name: "Лапа новичка", rarity: "common", icon: "🐾", stats: "+5% к клику", unlocked: false },
                    { id: 2, name: "Энергия", rarity: "rare", icon: "⚡", stats: "+3 авто-клика", unlocked: false },
                    { id: 3, name: "Точность", rarity: "epic", icon: "🎯", stats: "+15% шанс крита", unlocked: false },
                    { id: 4, name: "Алмазная лапа", rarity: "legendary", icon: "💎", stats: "x2 все бонусы", unlocked: false }
                ],
                stats: {
                    totalClicks: 0,
                    totalScore: 0,
                    playTime: 0,
                    joinDate: new Date().toISOString(),
                    criticalHits: 0
                },
                friends: [],
                lastSave: Date.now()
            };
            this.user = originalUser;
            this.updateUI();
            this.updateAdminPanel();
            this.saveGameState();
            console.log('🔄 Game reset by admin');
        }
    }

    adminApplyChanges() {
        console.log('🔄 Applying admin changes');
        // Применяем изменения из полей ввода
        this.gameState.score = parseInt(document.getElementById('admin-score').value) || 0;
        this.gameState.level = parseInt(document.getElementById('admin-level').value) || 1;
        this.gameState.stats.totalClicks = parseInt(document.getElementById('admin-total-clicks').value) || 0;
        
        // Применяем изменения улучшений
        Object.keys(this.gameState.upgrades).forEach(upgradeKey => {
            const input = document.getElementById(`admin-${upgradeKey}-level`);
            if (input) {
                this.gameState.upgrades[upgradeKey].level = parseInt(input.value) || 0;
            }
        });
        
        // Применяем изменения уровней
        this.gameState.levels.forEach(level => {
            const input = document.getElementById(`admin-level-${level.number}-score`);
            if (input) {
                level.requiredScore = parseInt(input.value) || 0;
            }
        });
        
        // Применяем изменения достижений
        this.gameState.achievements.forEach(achievement => {
            const input = document.getElementById(`admin-achievement-${achievement.id}`);
            if (input) {
                achievement.requirement = parseInt(input.value) || 0;
            }
        });
        
        this.updateUI();
        console.log('✅ Admin changes applied');
    }

    adminSaveAndClose() {
        this.adminApplyChanges();
        this.saveGameState();
        this.closeAdminPanel();
        console.log('💾 Admin changes saved and panel closed');
    }

    // Вкладка друзей
    updateFriendsTab() {
        this.updateFriendsList();
        this.updateFriendsBonuses();
    }

    updateFriendsList() {
        const container = document.getElementById('friends-list-container');
        if (!container) return;
        
        if (this.gameState.friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>Друзей пока нет</h3>
                    <p>Пригласите друзей и получайте бонусы за их прогресс</p>
                </div>
            `;
        }
    }

    updateFriendsBonuses() {
        const container = document.getElementById('bonus-grid');
        if (!container) return;

        const bonuses = [
            { icon: '🔥', name: '+1 друг', desc: '+5% к силе клика', required: 1 },
            { icon: '🚀', name: '+3 друга', desc: '+10% к авто-клику', required: 3 },
            { icon: '💎', name: '+5 друзей', desc: '+15% к шансу крита', required: 5 }
        ];

        let html = '';
        bonuses.forEach(bonus => {
            const active = this.gameState.friends.length >= bonus.required;
            html += `
                <div class="bonus-card">
                    <div class="bonus-icon">${bonus.icon}</div>
                    <div class="bonus-info">
                        <div class="bonus-name">${bonus.name}</div>
                        <div class="bonus-desc">${bonus.desc}</div>
                    </div>
                    <div class="bonus-status ${active ? 'active' : ''}">
                        ${active ? 'Активно' : 'Не активно'}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Вкладка уровней
    updateLevelsTab() {
        this.updateLevelIndicator();
        this.updateLevelCards();
    }

    updateLevelIndicator() {
        const container = document.getElementById('level-indicator');
        if (!container) return;

        let html = '';
        const visibleLevels = this.gameState.levels.slice(0, 5);
        
        visibleLevels.forEach((level, index) => {
            const isActive = level.number <= this.gameState.level;
            html += `
                <div class="level-circle ${isActive ? 'active' : ''}">
                    <span>${level.number}</span>
                </div>
            `;
            if (index < visibleLevels.length - 1) {
                html += `<div class="level-line"></div>`;
            }
        });

        container.innerHTML = html;
    }

    updateLevelCards() {
        const container = document.getElementById('levels-grid');
        if (!container) return;

        let html = '';
        this.gameState.levels.forEach(level => {
            const isActive = level.number === this.gameState.level;
            const isCompleted = level.number < this.gameState.level;
            const isLocked = level.number > this.gameState.level;
            
            let statusText = '';
            let statusClass = '';
            
            if (isCompleted) {
                statusText = 'Пройден';
                statusClass = 'completed';
            } else if (isActive) {
                const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
                const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
                const progress = Math.max(0, this.gameState.score - currentLevelScore);
                const totalNeeded = nextLevelScore - currentLevelScore;
                
                if (totalNeeded > 0) {
                    const percentage = Math.min(100, (progress / totalNeeded) * 100);
                    statusText = `${Math.floor(percentage)}%`;
                } else {
                    statusText = 'Макс уровень';
                }
            } else {
                statusText = `${level.requiredScore} очков`;
            }
            
            html += `
                <div class="level-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}">
                    <div class="level-header">
                        <div class="level-number">Уровень ${level.number}</div>
                        <div class="level-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="level-reward">
                        <div class="reward-icon">${level.icon}</div>
                        <div class="reward-info">
                            <div class="reward-name">${level.reward}</div>
                            <div class="reward-desc">${level.rewardDesc}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Вкладка комбо
    updateComboTab() {
        this.updateComboCards();
    }

    updateComboCards() {
        const container = document.getElementById('cards-grid');
        if (!container) return;

        let html = '';
        this.gameState.comboCards.forEach(card => {
            const lockedClass = card.unlocked ? '' : 'locked';
            html += `
                <div class="combo-card ${lockedClass}" data-card-id="${card.id}">
                    <div class="card-frame">
                        <div class="card-rarity ${card.rarity}">
                            ${this.getRarityText(card.rarity)}
                        </div>
                        <div class="card-icon">${card.icon}</div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-stats">${card.stats}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getRarityText(rarity) {
        const rarityMap = {
            'common': 'Обычная',
            'rare': 'Редкая',
            'epic': 'Эпическая',
            'legendary': 'Легендарная'
        };
        return rarityMap[rarity] || rarity;
    }

    // Профиль
    openProfile() {
        console.log('📱 Opening profile modal');
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            console.log('✅ Profile modal opened');
        } else {
            console.error('❌ Profile modal not found!');
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            console.log('✅ Profile modal closed');
        }
    }

    updateProfileModal() {
        console.log('🔄 Updating profile modal');
        // Обновляем основную информацию
        const profileName = document.getElementById('profile-name');
        const profileLevel = document.getElementById('profile-level');
        const profileId = document.getElementById('profile-id');

        if (profileName) profileName.textContent = this.user ? this.user.first_name : 'Player';
        if (profileLevel) profileLevel.textContent = this.gameState.level;
        if (profileId) profileId.textContent = this.user ? this.user.id : '0000';

        // Обновляем статистику
        this.updateProfileStats();
        this.updateProfileAchievements();
        this.updateProfileUpgrades();
        console.log('✅ Profile modal updated');
    }

    updateProfileStats() {
        const totalClicks = document.getElementById('profile-total-clicks');
        const playTime = document.getElementById('profile-play-time');
        const totalScore = document.getElementById('profile-total-score');

        if (totalClicks) totalClicks.textContent = this.gameState.stats.totalClicks.toLocaleString();
        if (playTime) {
            const hours = Math.floor(this.gameState.stats.playTime / 3600000);
            playTime.textContent = `${hours}ч`;
        }
        if (totalScore) totalScore.textContent = this.gameState.stats.totalScore.toLocaleString();
    }

    updateProfileAchievements() {
        const container = document.getElementById('profile-achievements-grid');
        if (!container) return;

        let html = '';
        this.gameState.achievements.forEach(achievement => {
            html += `
                <div class="achievement ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.desc}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateProfileUpgrades() {
        const container = document.getElementById('profile-upgrades-list');
        if (!container) return;

        let html = '';
        Object.keys(this.gameState.upgrades).forEach(upgradeKey => {
            const upgrade = this.gameState.upgrades[upgradeKey];
            html += `
                <div class="profile-upgrade">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-level">Уровень <span>${upgrade.level}</span></div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Приглашение друзей
    inviteFriends() {
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'Пригласить друзей',
                message: 'Поделись ссылкой на игру с друзьями!',
                buttons: [{ type: 'default', text: 'OK' }]
            });
        } else {
            const shareText = `Присоединяйся к Dark Paws Clicker! 🎮\nИграй и прокачивай свою лапу!\n\nСсылка: ${window.location.href}`;
            alert(shareText);
        }
    }

    // Уведомления
    showUpgradeNotification(upgradeKey) {
        const upgrade = this.gameState.upgrades[upgradeKey];
        console.log(`🔼 Улучшение куплено: ${upgrade.name}`);
    }

    showInsufficientFundsNotification(requiredAmount) {
        console.log(`❌ Недостаточно очков. Нужно: ${requiredAmount}`);
    }

    showAchievementNotification(achievementName) {
        console.log(`🎉 Достижение разблокировано: ${achievementName}`);
    }

    // Сохранение и загрузка
    saveGameState() {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            console.log('💾 Game state saved');
        } catch (error) {
            console.error('❌ Local storage save error:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                this.gameState = { ...this.gameState, ...saveData };
                console.log('💾 Game state loaded from localStorage');
            } else {
                console.log('💾 No saved game state found');
            }
        } catch (error) {
            console.error('❌ Error loading game state from localStorage:', error);
        }
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing game...');
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

// Горячая клавиша для админки (Ctrl+Alt+A)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        console.log('🔑 Admin hotkey pressed');
        if (window.clickerGame) {
            window.clickerGame.showAdminActivation();
        }
    }
});
