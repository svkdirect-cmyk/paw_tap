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
                { number: 4, requiredScore: 15000, reward: "Премиум буст", rewardDesc: "x2 все бонусы", icon: "💎", completed: false },
                { number: 5, requiredScore: 30000, reward: "Легендарная лапа", rewardDesc: "x3 сила клика", icon: "🐾", completed: false }
            ],
            achievements: [
                { id: "firstSteps", name: "Первые шаги", desc: "Сделать 100 кликов", icon: "🎮", unlocked: false, requirement: 100 },
                { id: "hardWorker", name: "Усердный работник", desc: "Сделать 1000 кликов", icon: "💪", unlocked: false, requirement: 1000 },
                { id: "clickMaster", name: "Клик-мастер", desc: "Сделать 10000 кликов", icon: "🚀", unlocked: false, requirement: 10000 },
                { id: "clickLegend", name: "Легенда кликов", desc: "Сделать 50000 кликов", icon: "🏆", unlocked: false, requirement: 50000 }
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
        
        this.particles = [];
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.lastTouch = null;
        
        // Настройки сервера
        this.apiUrl = 'https://your-server.com/api';
        this.botToken = 'YOUR_BOT_TOKEN_HERE';
        
        // Настройки админ-панели
        this.adminEnabled = false;
        this.adminCode = '1337';
        this.adminPressTimer = null;
        this.editingUpgrade = null;
        
        this.init();
    }

    init() {
        console.log('Initializing Dark Paws Clicker...');
        
        // Инициализируем Telegram Web App
        if (this.tg && this.tg.expand) {
            this.tg.expand();
            this.tg.enableClosingConfirmation();
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        this.loadGameState();
        this.updateUI();
        this.startAutoClicker();
        this.animateParticles();
        
        // Инициализируем вкладки
        this.setupTabs();
        
        // Запускаем отсчет времени игры
        this.startPlayTimeCounter();
        
        // Инициализируем серверные функции
        this.initServerFeatures();
        
        // Инициализируем админ-панель
        this.setupAdminPanel();
    }

    // ... (остальные методы остаются такими же, показываю только новые и измененные)

    setupAdminPanel() {
        const pawButton = document.getElementById('paw-button');
        if (!pawButton) return;

        // Обработчики для мыши
        pawButton.addEventListener('mousedown', (e) => {
            this.startAdminTimer();
        });

        pawButton.addEventListener('mouseup', (e) => {
            this.clearAdminTimer();
        });

        pawButton.addEventListener('mouseleave', (e) => {
            this.clearAdminTimer();
        });

        // Обработчики для тача
        pawButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startAdminTimer();
        });

        pawButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.clearAdminTimer();
        });

        pawButton.addEventListener('touchcancel', (e) => {
            this.clearAdminTimer();
        });

        // Обработчики для админ-панели
        this.setupAdminEventListeners();
        
        // Инициализируем навигацию админки
        this.setupAdminNavigation();
    }

    setupAdminNavigation() {
        const navButtons = document.querySelectorAll('.admin-nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.switchAdminSection(section);
            });
        });
    }

    switchAdminSection(sectionId) {
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
            
            // Обновляем контент секции если нужно
            this.updateAdminSection(sectionId);
        }
    }

    updateAdminSection(sectionId) {
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
            case 'players':
                this.updateAdminPlayers();
                break;
        }
    }

    setupAdminEventListeners() {
        // Закрытие админ-панели
        const closeAdmin = document.getElementById('close-admin');
        if (closeAdmin) {
            closeAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAdminPanel();
            });
        }

        // Клик по фону для закрытия
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.addEventListener('click', (e) => {
                if (e.target === adminPanel) {
                    this.closeAdminPanel();
                }
            });
        }

        // Быстрые действия
        document.getElementById('admin-add-1000')?.addEventListener('click', () => this.adminAddScore(1000));
        document.getElementById('admin-add-10000')?.addEventListener('click', () => this.adminAddScore(10000));
        document.getElementById('admin-level-up')?.addEventListener('click', () => this.adminLevelUp());
        document.getElementById('admin-max-all')?.addEventListener('click', () => this.adminMaxAll());
        document.getElementById('admin-reset-game')?.addEventListener('click', () => this.adminResetGame());

        // Управление улучшениями
        document.getElementById('admin-add-upgrade')?.addEventListener('click', () => this.adminAddUpgrade());
        document.getElementById('admin-max-upgrades')?.addEventListener('click', () => this.adminMaxUpgrades());

        // Управление уровнями
        document.getElementById('admin-add-level')?.addEventListener('click', () => this.adminAddLevel());
        document.getElementById('admin-unlock-all-levels')?.addEventListener('click', () => this.adminUnlockAllLevels());

        // Управление достижениями
        document.getElementById('admin-add-achievement')?.addEventListener('click', () => this.adminAddAchievement());
        document.getElementById('admin-unlock-all-achievements')?.addEventListener('click', () => this.adminUnlockAllAchievements());

        // Управление картами
        document.getElementById('admin-add-card')?.addEventListener('click', () => this.adminAddCard());
        document.getElementById('admin-unlock-all-cards')?.addEventListener('click', () => this.adminUnlockAllCards());

        // Управление игроками
        document.getElementById('admin-save-player')?.addEventListener('click', () => this.adminSavePlayer());
        document.getElementById('admin-load-players')?.addEventListener('click', () => this.adminLoadPlayers());
        document.getElementById('admin-clear-players')?.addEventListener('click', () => this.adminClearPlayers());

        // Серверные действия
        document.getElementById('admin-test-connection')?.addEventListener('click', () => this.adminTestConnection());
        document.getElementById('admin-force-save')?.addEventListener('click', () => this.adminForceSave());
        document.getElementById('admin-force-load')?.addEventListener('click', () => this.adminForceLoad());

        // Отладка
        document.getElementById('admin-export-save')?.addEventListener('click', () => this.adminExportSave());
        document.getElementById('admin-import-save')?.addEventListener('click', () => this.adminImportSave());
        document.getElementById('admin-show-logs')?.addEventListener('click', () => this.adminShowLogs());
        document.getElementById('admin-clear-data')?.addEventListener('click', () => this.adminClearData());

        // Основные кнопки
        document.getElementById('admin-apply')?.addEventListener('click', () => this.adminApplyChanges());
        document.getElementById('admin-save-close')?.addEventListener('click', () => this.adminSaveAndClose());

        // Модальное окно редактирования улучшения
        document.getElementById('close-edit-upgrade')?.addEventListener('click', () => this.closeEditUpgradeModal());
        document.getElementById('cancel-edit-upgrade')?.addEventListener('click', () => this.closeEditUpgradeModal());
        document.getElementById('save-edit-upgrade')?.addEventListener('click', () => this.saveEditUpgrade());
    }

    // Новые методы для расширенной админ-панели

    updateAdminUpgrades() {
        const container = document.getElementById('admin-upgrades-list');
        if (!container) return;

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
                        <button class="btn-admin" onclick="clickerGame.adminEditUpgrade('${upgradeKey}')">✏️</button>
                        <button class="btn-admin" onclick="clickerGame.adminRemoveUpgrade('${upgradeKey}')">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateAdminLevels() {
        const container = document.getElementById('admin-levels-list');
        if (!container) return;

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
                        <button class="btn-admin" onclick="clickerGame.adminEditLevel(${level.number})">✏️</button>
                        <button class="btn-admin" onclick="clickerGame.adminRemoveLevel(${level.number})">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateAdminAchievements() {
        const container = document.getElementById('admin-achievements-list');
        if (!container) return;

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
                        <button class="btn-admin" onclick="clickerGame.adminToggleAchievement('${achievement.id}')">
                            ${achievement.unlocked ? '🔒' : '🔓'}
                        </button>
                        <button class="btn-admin" onclick="clickerGame.adminRemoveAchievement('${achievement.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateAdminComboCards() {
        const container = document.getElementById('admin-cards-list');
        if (!container) return;

        let html = '';
        this.gameState.comboCards.forEach(card => {
            html += `
                <div class="card-control">
                    <div class="card-control-icon">${card.icon}</div>
                    <div class="card-control-name">${card.name}</div>
                    <div class="card-control-rarity ${card.rarity}">${this.getRarityText(card.rarity)}</div>
                    <div class="card-control-actions">
                        <button class="btn-admin" onclick="clickerGame.adminToggleCard(${card.id})">
                            ${card.unlocked ? '🔒' : '🔓'}
                        </button>
                        <button class="btn-admin" onclick="clickerGame.adminRemoveCard(${card.id})">🗑️</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateAdminPlayers() {
        const playerId = document.getElementById('admin-player-id');
        const playerName = document.getElementById('admin-player-name');
        
        if (playerId && this.user) {
            playerId.value = this.user.id;
        }
        if (playerName && this.user) {
            playerName.value = this.user.first_name || 'Player';
        }
    }

    // Методы для управления улучшениями
    adminAddUpgrade() {
        const newUpgrade = {
            level: 1,
            baseCost: 10,
            costMultiplier: 1.8,
            name: "Новое улучшение",
            icon: "⭐"
        };
        
        const upgradeKey = `upgrade_${Date.now()}`;
        this.gameState.upgrades[upgradeKey] = newUpgrade;
        this.updateAdminUpgrades();
        this.updateUI();
        this.adminLog(`Добавлено новое улучшение: ${newUpgrade.name}`);
    }

    adminEditUpgrade(upgradeKey) {
        const upgrade = this.gameState.upgrades[upgradeKey];
        this.editingUpgrade = upgradeKey;
        
        document.getElementById('edit-upgrade-name').value = upgrade.name;
        document.getElementById('edit-upgrade-icon').value = upgrade.icon;
        document.getElementById('edit-upgrade-level').value = upgrade.level;
        document.getElementById('edit-upgrade-base-cost').value = upgrade.baseCost;
        document.getElementById('edit-upgrade-cost-multiplier').value = upgrade.costMultiplier;
        
        document.getElementById('edit-upgrade-modal').classList.add('active');
    }

    saveEditUpgrade() {
        if (!this.editingUpgrade) return;
        
        const upgrade = this.gameState.upgrades[this.editingUpgrade];
        upgrade.name = document.getElementById('edit-upgrade-name').value;
        upgrade.icon = document.getElementById('edit-upgrade-icon').value;
        upgrade.level = parseInt(document.getElementById('edit-upgrade-level').value);
        upgrade.baseCost = parseInt(document.getElementById('edit-upgrade-base-cost').value);
        upgrade.costMultiplier = parseFloat(document.getElementById('edit-upgrade-cost-multiplier').value);
        
        this.closeEditUpgradeModal();
        this.updateAdminUpgrades();
        this.updateUI();
        this.forceSave();
        this.adminLog(`Улучшение обновлено: ${upgrade.name}`);
    }

    closeEditUpgradeModal() {
        document.getElementById('edit-upgrade-modal').classList.remove('active');
        this.editingUpgrade = null;
    }

    adminRemoveUpgrade(upgradeKey) {
        if (Object.keys(this.gameState.upgrades).length <= 1) {
            this.adminLog('Нельзя удалить последнее улучшение');
            return;
        }
        
        const upgradeName = this.gameState.upgrades[upgradeKey].name;
        delete this.gameState.upgrades[upgradeKey];
        this.updateAdminUpgrades();
        this.updateUI();
        this.forceSave();
        this.adminLog(`Удалено улучшение: ${upgradeName}`);
    }

    // Методы для управления уровнями
    adminAddLevel() {
        const newLevel = {
            number: this.gameState.levels.length + 1,
            requiredScore: this.gameState.levels[this.gameState.levels.length - 1].requiredScore * 2,
            reward: "Новая награда",
            rewardDesc: "Описание награды",
            icon: "🎁",
            completed: false
        };
        
        this.gameState.levels.push(newLevel);
        this.updateAdminLevels();
        this.updateUI();
        this.adminLog(`Добавлен новый уровень: ${newLevel.number}`);
    }

    adminEditLevel(levelNumber) {
        const level = this.gameState.levels.find(l => l.number === levelNumber);
        if (level) {
            const newScore = parseInt(document.getElementById(`admin-level-${levelNumber}-score`).value);
            level.requiredScore = newScore;
            this.updateAdminLevels();
            this.updateUI();
            this.forceSave();
            this.adminLog(`Обновлен уровень ${levelNumber}`);
        }
    }

    adminRemoveLevel(levelNumber) {
        if (this.gameState.levels.length <= 1) {
            this.adminLog('Нельзя удалить последний уровень');
            return;
        }
        
        this.gameState.levels = this.gameState.levels.filter(l => l.number !== levelNumber);
        // Перенумеровываем уровни
        this.gameState.levels.forEach((level, index) => {
            level.number = index + 1;
        });
        
        this.updateAdminLevels();
        this.updateUI();
        this.forceSave();
        this.adminLog(`Удален уровень: ${levelNumber}`);
    }

    adminUnlockAllLevels() {
        this.gameState.levels.forEach(level => {
            level.completed = true;
        });
        this.gameState.level = this.gameState.levels.length;
        this.updateAdminLevels();
        this.updateUI();
        this.forceSave();
        this.adminLog('Все уровни разблокированы');
    }

    // Методы для управления достижениями
    adminAddAchievement() {
        const newAchievement = {
            id: `achievement_${Date.now()}`,
            name: "Новое достижение",
            desc: "Описание достижения",
            icon: "⭐",
            unlocked: false,
            requirement: 100
        };
        
        this.gameState.achievements.push(newAchievement);
        this.updateAdminAchievements();
        this.updateUI();
        this.adminLog(`Добавлено новое достижение: ${newAchievement.name}`);
    }

    adminToggleAchievement(achievementId) {
        const achievement = this.gameState.achievements.find(a => a.id === achievementId);
        if (achievement) {
            achievement.unlocked = !achievement.unlocked;
            this.updateAdminAchievements();
            this.updateUI();
            this.forceSave();
            this.adminLog(`Достижение ${achievement.name} ${achievement.unlocked ? 'разблокировано' : 'заблокировано'}`);
        }
    }

    adminRemoveAchievement(achievementId) {
        this.gameState.achievements = this.gameState.achievements.filter(a => a.id !== achievementId);
        this.updateAdminAchievements();
        this.updateUI();
        this.forceSave();
        this.adminLog('Достижение удалено');
    }

    adminUnlockAllAchievements() {
        this.gameState.achievements.forEach(achievement => {
            achievement.unlocked = true;
        });
        this.updateAdminAchievements();
        this.updateUI();
        this.forceSave();
        this.adminLog('Все достижения разблокированы');
    }

    // Методы для управления картами
    adminAddCard() {
        const newCard = {
            id: Date.now(),
            name: "Новая карта",
            rarity: "common",
            icon: "🃏",
            stats: "+1 к чему-то",
            unlocked: false
        };
        
        this.gameState.comboCards.push(newCard);
        this.updateAdminComboCards();
        this.updateUI();
        this.adminLog(`Добавлена новая карта: ${newCard.name}`);
    }

    adminToggleCard(cardId) {
        const card = this.gameState.comboCards.find(c => c.id === cardId);
        if (card) {
            card.unlocked = !card.unlocked;
            this.updateAdminComboCards();
            this.updateUI();
            this.forceSave();
            this.adminLog(`Карта ${card.name} ${card.unlocked ? 'разблокирована' : 'заблокирована'}`);
        }
    }

    adminRemoveCard(cardId) {
        this.gameState.comboCards = this.gameState.comboCards.filter(c => c.id !== cardId);
        this.updateAdminComboCards();
        this.updateUI();
        this.forceSave();
        this.adminLog('Карта удалена');
    }

    adminUnlockAllCards() {
        this.gameState.comboCards.forEach(card => {
            card.unlocked = true;
        });
        this.updateAdminComboCards();
        this.updateUI();
        this.forceSave();
        this.adminLog('Все карты разблокированы');
    }

    // Методы для управления игроками
    adminSavePlayer() {
        const playerName = document.getElementById('admin-player-name').value;
        if (this.user && playerName) {
            this.user.first_name = playerName;
            this.updateUserInfo();
            this.forceSave();
            this.adminLog(`Игрок сохранен: ${playerName}`);
        }
    }

    adminLoadPlayers() {
        // Заглушка для загрузки списка игроков
        this.adminLog('Загрузка списка игроков...');
    }

    adminClearPlayers() {
        if (confirm('Очистить данные всех игроков?')) {
            localStorage.removeItem('darkPawsClicker_players');
            this.adminLog('Данные игроков очищены');
        }
    }

    // Обновленные методы для улучшений
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
            this.forceSave();
            this.showUpgradeNotification(upgradeKey);
        } else {
            this.showInsufficientFundsNotification(cost);
        }
    }

    updateUpgradeButtons() {
        const container = document.getElementById('upgrades-grid');
        if (!container) return;

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

        // Добавляем обработчики событий
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    const upgradeType = upgradeCard.dataset.upgrade;
                    this.buyUpgrade(upgradeType);
                }
            });
        });
    }

    // Обновленные методы для уровней
    updateLevelsTab() {
        this.updateLevelIndicator();
        this.updateLevelCards();
    }

    updateLevelIndicator() {
        const container = document.getElementById('level-indicator');
        if (!container) return;

        let html = '';
        const visibleLevels = this.gameState.levels.slice(0, 5); // Показываем первые 5 уровней
        
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

    // Обновленные методы для достижений
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

    // Обновленные методы для комбо-карт
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
        this.setupComboCardListeners();
    }

    // Обновленный метод для проверки достижений
    checkAchievements() {
        const clicks = this.gameState.stats.totalClicks;
        
        this.gameState.achievements.forEach(achievement => {
            if (!achievement.unlocked && clicks >= achievement.requirement) {
                achievement.unlocked = true;
                this.showAchievementNotification(achievement.name);
            }
        });
    }

    // Обновленный метод adminMaxAll
    adminMaxAll() {
        this.adminMaxUpgrades();
        this.adminUnlockAllLevels();
        this.adminUnlockAllAchievements();
        this.adminUnlockAllCards();
        this.gameState.score = 999999;
        this.gameState.level = this.gameState.levels.length;
        this.updateUI();
        this.forceSave();
        this.adminLog('Всё максимально улучшено и разблокировано');
    }

    // ... (остальные методы остаются без изменений)

    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        const levelData = this.gameState.levels.find(l => l.number === level);
        return levelData ? levelData.requiredScore : Math.floor(100 * level * (level + 1) / 2);
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

    forceSave() {
        console.log('Принудительное сохранение...');
        
        try {
            const saveData = {
                gameState: this.gameState,
                userId: this.user?.id,
                lastSave: Date.now(),
                version: '2.0'
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            console.log('✅ Локальное сохранение успешно');
            return true;
        } catch (error) {
            console.error('❌ Ошибка локального сохранения:', error);
            return false;
        }
    }
}

// Добавляем CSS анимацию для встряски
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -100px) scale(1.2);
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

// Закрытие модальных окон по ESC и горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window.clickerGame) {
            window.clickerGame.closeProfile();
            window.clickerGame.closeAdminPanel();
            window.clickerGame.closeEditUpgradeModal();
            
            // Закрытие модального окна активации админки
            const adminActivationModal = document.getElementById('admin-activation-modal');
            if (adminActivationModal) {
                adminActivationModal.remove();
            }
        }
    }
    
    // Секретная комбинация Ctrl+Alt+A для админки
    if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        if (window.clickerGame) {
            window.clickerGame.showAdminActivation();
        }
    }
});
