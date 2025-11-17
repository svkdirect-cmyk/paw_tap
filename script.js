class DarkPawsClicker {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.gameState = {
            score: 0,
            level: 1,
            upgrades: {
                clickPower: 1,
                autoClick: 0,
                criticalChance: 1
            },
            stats: {
                totalClicks: 0,
                totalScore: 0,
                playTime: 0,
                joinDate: new Date().toISOString(),
                criticalHits: 0
            },
            friends: [],
            comboCards: [],
            achievements: {
                firstSteps: false,
                hardWorker: false,
                clickMaster: false,
                clickLegend: false
            },
            lastSave: Date.now()
        };
        
        this.particles = [];
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.lastTouch = null;
        this.cardClickHandlers = [];
        
        // Настройки сервера
        this.apiUrl = 'https://your-server.com/api';
        this.botToken = 'YOUR_BOT_TOKEN_HERE';
        
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
    }

    initServerFeatures() {
        // Автоматическая загрузка состояния при старте
        if (this.user && this.user.id) {
            this.loadGameStateFromServer();
        }
        
        // Обработка реферальных ссылок
        this.processReferralLink();
    }

    setupEventListeners() {
        // Клик по лапке
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            pawButton.addEventListener('click', (e) => {
                this.handleClick(e);
            });
            
            // Добавляем тактильную обратную связь
            pawButton.addEventListener('mousedown', () => {
                pawButton.classList.add('click-animation');
            });
            
            pawButton.addEventListener('mouseup', () => {
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
            });
            
            pawButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                pawButton.classList.add('click-animation');
                // Сохраняем позицию касания для создания частиц
                this.lastTouch = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            });
            
            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
                
                // Обрабатываем клик с позицией касания
                if (this.lastTouch) {
                    const touchEvent = {
                        clientX: this.lastTouch.clientX,
                        clientY: this.lastTouch.clientY
                    };
                    this.handleClick(touchEvent);
                    this.lastTouch = null;
                }
            });
        }

        // Кнопки улучшений
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

        // Кнопка приглашения друзей
        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.inviteFriends();
            });
        }

        // Кнопка обновления списка друзей
        const refreshBtn = document.getElementById('refresh-friends');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadFriendsList();
                this.loadLeaderboard();
            });
        }

        // Клик по всей секции профиля для открытия
        const profileOpener = document.getElementById('profile-opener');
        if (profileOpener) {
            profileOpener.addEventListener('click', (e) => {
                e.preventDefault();
                this.openProfile();
            });
        }

        // Закрытие модального окна профиля
        const closeProfile = document.getElementById('close-profile');
        if (closeProfile) {
            closeProfile.addEventListener('click', (e) => {
                e.preventDefault();
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

        // Кнопка поделиться профилем
        const shareProfile = document.getElementById('share-profile');
        if (shareProfile) {
            shareProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareProfile();
            });
        }
    }

    initTelegramAuth() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            console.log('User authenticated:', this.user);
            this.updateUserInfo();
        } else {
            console.log('No user data available');
            // Для демо создаем тестового пользователя
            this.user = {
                id: Math.floor(Math.random() * 10000),
                first_name: 'Игрок',
                username: 'player_' + Math.floor(Math.random() * 1000),
                photo_url: ''
            };
            this.updateUserInfo();
        }
    }

    // СЕРВЕРНЫЕ ФУНКЦИИ

    // Серверное сохранение
    async saveGameStateToServer() {
        if (!this.apiUrl || this.apiUrl === 'https://your-server.com/api') {
            console.log('Server URL not configured, skipping server save');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/save-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: this.user,
                    gameState: this.gameState,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('Game saved to server');
                return true;
            } else {
                console.error('Server save failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Server save error:', error);
            return false;
        }
    }

    // Серверная загрузка
    async loadGameStateFromServer() {
        if (!this.apiUrl || this.apiUrl === 'https://your-server.com/api' || !this.user?.id) {
            console.log('Server URL or user ID not configured, skipping server load');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/load-game/${this.user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.exists && result.gameState) {
                // Сохраняем важные данные, но обновляем состояние игры
                const currentStats = { ...this.gameState.stats };
                this.gameState = { ...this.gameState, ...result.gameState };
                this.gameState.stats = { ...this.gameState.stats, ...currentStats };
                console.log('Game loaded from server');
                this.updateUI();
                return true;
            } else {
                console.log('No server save found');
                return false;
            }
        } catch (error) {
            console.error('Server load error:', error);
            return false;
        }
    }

    // Улучшенная система приглашения друзей
    async inviteFriends() {
        if (this.tg && this.tg.showContactPicker) {
            try {
                const contact = await this.tg.showContactPicker();
                
                if (contact) {
                    const inviteMessage = `🎮 <b>Dark Paws Clicker</b>\n\n` +
                        `Привет! ${this.user.first_name} приглашает тебя в увлекательную игру-кликер!\n\n` +
                        `• Прокачивай свою лапу 🐾\n` +
                        `• Открывай улучшения ⚡\n` +
                        `• Соревнуйся с друзьями 🏆\n\n` +
                        `Присоединяйся и стань легендой кликов!`;

                    // Отправляем приглашение через сервер
                    const response = await fetch(`${this.apiUrl}/invite-friend`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fromUserId: this.user.id,
                            toUserId: contact.user_id,
                            message: inviteMessage
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (result.success) {
                        this.tg.showPopup({
                            title: '✅ Приглашение отправлено',
                            message: `Приглашение успешно отправлено ${contact.first_name || 'другу'}`,
                            buttons: [{ type: 'ok' }]
                        });
                    } else {
                        throw new Error(result.error || 'Failed to send invite');
                    }
                }
            } catch (error) {
                console.error('Invite error:', error);
                this.tg.showPopup({
                    title: '❌ Ошибка',
                    message: 'Не удалось отправить приглашение',
                    buttons: [{ type: 'ok' }]
                });
            }
        } else {
            // Fallback для браузера
            const shareText = `Присоединяйся к Dark Paws Clicker! 🎮\nИграй и прокачивай свою лапу!\n\nСсылка: ${window.location.href}?ref=${this.user.id}`;
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Dark Paws Clicker',
                        text: shareText,
                        url: window.location.href + `?ref=${this.user.id}`
                    });
                } catch (error) {
                    console.log('Share cancelled:', error);
                }
            } else {
                // Копирование ссылки в буфер обмена
                try {
                    await navigator.clipboard.writeText(window.location.href + `?ref=${this.user.id}`);
                    alert('Ссылка скопирована в буфер обмена! Отправь её другу: ' + shareText);
                } catch (error) {
                    console.error('Clipboard error:', error);
                    alert('Поделитесь ссылкой: ' + window.location.href + `?ref=${this.user.id}`);
                }
            }
        }
    }

    // Добавление друга
    async addFriend(friendId) {
        try {
            const response = await fetch(`${this.apiUrl}/add-friend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.user.id,
                    friendId: friendId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Add friend error:', error);
            return false;
        }
    }

    // Загрузка списка друзей
    async loadFriendsList() {
        if (!this.user?.id) return false;

        try {
            const response = await fetch(`${this.apiUrl}/friends/${this.user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.friends) {
                this.gameState.friends = result.friends;
                this.updateFriendsTab();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Load friends error:', error);
            return false;
        }
    }

    // Загрузка таблицы лидеров
    async loadLeaderboard() {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.leaderboard) {
                this.updateLeaderboard(result.leaderboard);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Load leaderboard error:', error);
            return false;
        }
    }

    // Обработка реферальных ссылок
    async processReferral(referrerId) {
        if (!referrerId || referrerId === this.user.id.toString() || !this.user?.id) {
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/referral/${referrerId}?userId=${this.user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.bonusApplied) {
                // Начисляем бонусы
                this.gameState.score += 100;
                this.updateUI();
                
                if (this.tg && this.tg.showPopup) {
                    this.tg.showPopup({
                        title: '🎁 Бонус за приглашение!',
                        message: 'Вы получили +100 очков за присоединение по приглашению друга!',
                        buttons: [{ type: 'ok' }]
                    });
                }
            }
            return result.success;
        } catch (error) {
            console.error('Referral processing error:', error);
            return false;
        }
    }

    // Автоматическая обработка реферальной ссылки при загрузке
    processReferralLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        const startParam = urlParams.get('startapp');
        
        let referrerId = refParam;
        if (!referrerId && startParam && startParam.startsWith('ref_')) {
            referrerId = startParam.replace('ref_', '');
        }
        
        if (referrerId) {
            // Обрабатываем реферала после инициализации игры
            setTimeout(() => {
                if (this.user && this.user.id) {
                    this.processReferral(referrerId);
                }
            }, 3000);
        }
    }

    // ОСТАЛЬНЫЕ ФУНКЦИИ ИГРЫ

    setupTabs() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
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
            
            // Обновляем контент вкладки если нужно
            this.updateTabContent(tabId);
        }
    }

    updateTabContent(tabId) {
        switch(tabId) {
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

    updateFriendsTab() {
        // Обновляем счетчик друзей
        const friendsCount = document.querySelector('.friends-count span');
        const friendsBonus = document.querySelector('.friends-bonus span');
        
        if (friendsCount) {
            friendsCount.textContent = this.gameState.friends.length;
        }
        
        // Рассчитываем бонусы за друзей
        const friendCount = this.gameState.friends.length;
        let bonusPercent = 0;
        
        if (friendCount >= 5) bonusPercent = 15;
        else if (friendCount >= 3) bonusPercent = 10;
        else if (friendCount >= 1) bonusPercent = 5;
        
        if (friendsBonus) {
            friendsBonus.textContent = bonusPercent + '%';
        }
        
        // Обновляем список друзей
        this.updateFriendsList();
        
        // Обновляем бонусы
        this.updateFriendsBonuses();
        
        // Загружаем таблицу лидеров
        this.loadLeaderboard();
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
        } else {
            let friendsHTML = '';
            this.gameState.friends.forEach(friend => {
                friendsHTML += `
                    <div class="friend-item">
                        <div class="friend-avatar">
                            ${friend.first_name ? friend.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="friend-info">
                            <div class="friend-name">${friend.first_name || 'Unknown'}</div>
                            <div class="friend-stats">Уровень ${friend.level || 1} • <span class="friend-score">${friend.score || 0} очков</span></div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = friendsHTML;
        }
    }

    updateFriendsBonuses() {
        const bonusCards = document.querySelectorAll('.bonus-card');
        const friendCount = this.gameState.friends.length;
        
        bonusCards.forEach((card, index) => {
            const status = card.querySelector('.bonus-status');
            const requiredFriends = [1, 3, 5][index];
            
            if (status) {
                if (friendCount >= requiredFriends) {
                    status.textContent = 'Активно';
                    status.classList.add('active');
                } else {
                    status.textContent = 'Не активно';
                    status.classList.remove('active');
                }
            }
        });
    }

    updateLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="loading">Нет данных</div>';
            return;
        }
        
        let leaderboardHTML = '';
        leaderboard.forEach((player, index) => {
            const rank = index + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + '.';
            
            leaderboardHTML += `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${rankIcon}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-avatar">
                            ${player.first_name ? player.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="leaderboard-name">${player.first_name || 'Unknown'}</div>
                    </div>
                    <div class="leaderboard-score">${player.score || 0}</div>
                </div>
            `;
        });
        
        container.innerHTML = leaderboardHTML;
    }

    updateLevelsTab() {
        // Обновляем текущий уровень
        const currentLevel = document.querySelector('.current-level span');
        if (currentLevel) {
            currentLevel.textContent = this.gameState.level;
        }
        
        // Обновляем индикатор прогресса
        this.updateLevelsProgress();
        
        // Обновляем карточки уровней
        this.updateLevelCards();
    }

    updateLevelsProgress() {
        const levelCircles = document.querySelectorAll('.level-circle');
        levelCircles.forEach((circle, index) => {
            const levelNumber = index + 1;
            
            circle.classList.remove('active');
            if (levelNumber <= this.gameState.level) {
                circle.classList.add('active');
            }
        });
    }

    updateLevelCards() {
        const levelCards = document.querySelectorAll('.level-card');
        
        levelCards.forEach((card, index) => {
            const levelNumber = index + 1;
            const status = card.querySelector('.level-status');
            
            // Убираем все классы статуса
            card.classList.remove('active', 'locked', 'completed');
            
            if (levelNumber < this.gameState.level) {
                card.classList.add('completed');
                if (status) {
                    status.textContent = 'Пройден';
                    status.classList.add('completed');
                }
            } else if (levelNumber === this.gameState.level) {
                card.classList.add('active');
                
                // Показываем прогресс до следующего уровня (от накопленных очков)
                const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
                const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
                const progress = Math.max(0, this.gameState.score - currentLevelScore);
                const totalNeeded = nextLevelScore - currentLevelScore;
                
                if (status) {
                    if (totalNeeded > 0) {
                        const percentage = Math.min(100, (progress / totalNeeded) * 100);
                        status.textContent = `${Math.floor(percentage)}%`;
                    } else {
                        status.textContent = 'Макс уровень';
                    }
                    status.classList.remove('completed');
                }
            } else {
                card.classList.add('locked');
                const requiredScore = this.getRequiredScoreForLevel(levelNumber);
                if (status) {
                    status.textContent = `${requiredScore} очков`;
                    status.classList.remove('completed');
                }
            }
        });
    }

    updateComboTab() {
        // Обновляем статистику колоды
        this.updateDeckStats();
        
        // Обновляем коллекцию карт
        this.updateComboCards();
    }

    updateDeckStats() {
        const deckPower = document.querySelector('.power-value');
        const deckStats = document.querySelectorAll('.stat-value');
        
        if (deckPower) {
            deckPower.textContent = this.calculateDeckPower();
        }
        
        // Заглушка для статистики
        if (deckStats.length >= 3) {
            deckStats[0].textContent = '0%';
            deckStats[1].textContent = '0%';
            deckStats[2].textContent = '0%';
        }
    }

    calculateDeckPower() {
        // Простой расчет силы колоды
        return this.gameState.comboCards.length * 10;
    }

    updateComboCards() {
        const comboCards = [
            {
                id: 1,
                name: 'Лапа новичка',
                rarity: 'common',
                icon: '🐾',
                stats: '+5% к клику',
                unlocked: false
            },
            {
                id: 2,
                name: 'Энергия',
                rarity: 'rare',
                icon: '⚡',
                stats: '+3 авто-клика',
                unlocked: false
            },
            {
                id: 3,
                name: 'Точность',
                rarity: 'epic',
                icon: '🎯',
                stats: '+15% шанс крита',
                unlocked: false
            },
            {
                id: 4,
                name: 'Алмазная лапа',
                rarity: 'legendary',
                icon: '💎',
                stats: 'x2 все бонусы',
                unlocked: false
            },
            {
                id: 5,
                name: 'Удача',
                rarity: 'common',
                icon: '🍀',
                stats: '+10% к шансу крита',
                unlocked: false
            },
            {
                id: 6,
                name: 'Скорость',
                rarity: 'rare',
                icon: '🚀',
                stats: '+5 авто-кликов',
                unlocked: false
            },
            {
                id: 7,
                name: 'Мощь',
                rarity: 'epic',
                icon: '💪',
                stats: '+25% к силе клика',
                unlocked: false
            },
            {
                id: 8,
                name: 'Феникс',
                rarity: 'legendary',
                icon: '🔥',
                stats: 'x3 бонус при крите',
                unlocked: false
            }
        ];

        const cardsGrid = document.querySelector('.cards-grid');
        if (!cardsGrid) return;

        let cardsHTML = '';
        comboCards.forEach(card => {
            const lockedClass = card.unlocked ? '' : 'locked';
            cardsHTML += `
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

        cardsGrid.innerHTML = cardsHTML;

        // Добавляем обработчики для карточек
        this.setupComboCardListeners();
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

    setupComboCardListeners() {
        // Удаляем старые обработчики
        this.cardClickHandlers.forEach(({ card, handler }) => {
            card.removeEventListener('click', handler);
        });
        this.cardClickHandlers = [];

        const cards = document.querySelectorAll('.combo-card');
        cards.forEach(card => {
            const handler = () => {
                if (card.classList.contains('locked')) {
                    this.showCardLockedMessage(card);
                } else {
                    this.showCardInfo(card);
                }
            };
            card.addEventListener('click', handler);
            this.cardClickHandlers.push({ card, handler });
        });
    }

    showCardLockedMessage(card) {
        const cardId = card.dataset.cardId;
        console.log(`Карта ${cardId} заблокирована`);
        
        // Можно добавить красивое уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🔒 Карта заблокирована',
                message: 'Эта карта будет доступна на более высоких уровнях',
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert('Эта карта будет доступна на более высоких уровнях');
        }
    }

    showCardInfo(card) {
        const cardId = card.dataset.cardId;
        console.log(`Информация о карте ${cardId}`);
        
        // Можно добавить модальное окно с информацией о карте
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'ℹ️ Информация о карте',
                message: 'Подробная информация о карте будет здесь',
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert('Подробная информация о карте будет здесь');
        }
    }

    openProfile() {
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateProfileModal() {
        // Обновляем аватар
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            if (this.user && this.user.photo_url) {
                profileAvatar.src = this.user.photo_url;
                profileAvatar.style.display = 'block';
            } else {
                profileAvatar.style.display = 'none';
            }
        }

        // Обновляем основную информацию
        const profileName = document.getElementById('profile-name');
        const profileLevel = document.getElementById('profile-level');
        const profileId = document.getElementById('profile-id');
        const profileRank = document.getElementById('profile-rank');

        if (profileName) {
            profileName.textContent = this.user ? this.user.first_name : 'Player';
        }
        if (profileLevel) {
            profileLevel.textContent = this.gameState.level;
        }
        if (profileId) {
            profileId.textContent = this.user ? this.user.id : '0000';
        }
        if (profileRank) {
            profileRank.textContent = this.getPlayerRank();
        }

        // Обновляем статистику
        this.updateProfileStats();

        // Обновляем достижения
        this.updateProfileAchievements();

        // Обновляем улучшения
        this.updateProfileUpgrades();
    }

    updateProfileStats() {
        const totalClicks = document.getElementById('profile-total-clicks');
        const playTime = document.getElementById('profile-play-time');
        const totalScore = document.getElementById('profile-total-score');
        const joinDate = document.getElementById('profile-join-date');

        if (totalClicks) {
            totalClicks.textContent = this.gameState.stats.totalClicks.toLocaleString();
        }
        if (playTime) {
            const hours = Math.floor(this.gameState.stats.playTime / 3600000);
            playTime.textContent = `${hours}ч`;
        }
        if (totalScore) {
            totalScore.textContent = this.gameState.stats.totalScore.toLocaleString();
        }
        if (joinDate) {
            const joinDateObj = new Date(this.gameState.stats.joinDate);
            const now = new Date();
            const diffTime = Math.abs(now - joinDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                joinDate.textContent = 'Сегодня';
            } else if (diffDays === 2) {
                joinDate.textContent = 'Вчера';
            } else if (diffDays <= 7) {
                joinDate.textContent = `${diffDays} дней назад`;
            } else {
                joinDate.textContent = joinDateObj.toLocaleDateString('ru-RU');
            }
        }
    }

    updateProfileAchievements() {
        // Обновляем статус достижений
        const achievements = document.querySelectorAll('.achievement');
        
        if (achievements.length >= 4) {
            achievements[0].classList.toggle('unlocked', this.gameState.achievements.firstSteps);
            achievements[1].classList.toggle('unlocked', this.gameState.achievements.hardWorker);
            achievements[2].classList.toggle('unlocked', this.gameState.achievements.clickMaster);
            achievements[3].classList.toggle('unlocked', this.gameState.achievements.clickLegend);
        }
    }

    updateProfileUpgrades() {
        const clickPower = document.getElementById('profile-click-power');
        const autoClick = document.getElementById('profile-auto-click');
        const critical = document.getElementById('profile-critical');

        if (clickPower) {
            clickPower.textContent = this.gameState.upgrades.clickPower;
        }
        if (autoClick) {
            autoClick.textContent = this.gameState.upgrades.autoClick;
        }
        if (critical) {
            critical.textContent = this.gameState.upgrades.criticalChance;
        }
    }

    getPlayerRank() {
        const level = this.gameState.level;
        if (level >= 20) return 'Легенда';
        if (level >= 15) return 'Мастер';
        if (level >= 10) return 'Опытный';
        if (level >= 5) return 'Новичок';
        return 'Начинающий';
    }

    shareProfile() {
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'Поделиться профилем',
                message: `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${this.gameState.score}\nПрисоединяйся!`,
                buttons: [
                    { type: 'default', text: 'Поделиться' },
                    { type: 'cancel', text: 'Отмена' }
                ]
            });
        } else {
            // Заглушка для браузера
            const shareText = `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${this.gameState.score}\nПрисоединяйся!`;
            if (navigator.share) {
                navigator.share({
                    title: 'Dark Paws Clicker',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                alert(shareText);
            }
        }
    }

    startPlayTimeCounter() {
        let saveCounter = 0;
        setInterval(() => {
            this.gameState.stats.playTime += 1000; // +1 секунда
            saveCounter++;
            
            // Сохраняем на сервер каждую минуту
            if (saveCounter >= 60) {
                this.saveGameState();
                saveCounter = 0;
            }
        }, 1000);
    }

    handleClick(event) {
        // Увеличиваем счетчик кликов
        this.gameState.stats.totalClicks++;
        this.gameState.stats.totalScore += this.gameState.upgrades.clickPower;

        // Проверяем достижения
        this.checkAchievements();

        // Создаем эффекты частиц
        this.createParticles(event);
        
        // Вычисляем очки
        let points = this.gameState.upgrades.clickPower;
        let isCritical = false;
        
        // Шанс критического удара
        const critChance = this.gameState.upgrades.criticalChance * 0.03;
        if (Math.random() < critChance) {
            points *= 3;
            isCritical = true;
            this.gameState.stats.criticalHits++;
        }
        
        this.addScore(points, isCritical);
        
        // Автосохранение на сервер каждые 10 кликов
        if (this.gameState.stats.totalClicks % 10 === 0) {
            this.saveGameState();
        }
    }

    checkAchievements() {
        const clicks = this.gameState.stats.totalClicks;
        
        if (clicks >= 100 && !this.gameState.achievements.firstSteps) {
            this.gameState.achievements.firstSteps = true;
            this.showAchievementNotification('Первые шаги');
        }
        if (clicks >= 1000 && !this.gameState.achievements.hardWorker) {
            this.gameState.achievements.hardWorker = true;
            this.showAchievementNotification('Усердный работник');
        }
        if (clicks >= 10000 && !this.gameState.achievements.clickMaster) {
            this.gameState.achievements.clickMaster = true;
            this.showAchievementNotification('Клик-мастер');
        }
        if (clicks >= 50000 && !this.gameState.achievements.clickLegend) {
            this.gameState.achievements.clickLegend = true;
            this.showAchievementNotification('Легенда кликов');
        }
    }

    showAchievementNotification(achievementName) {
        // Можно добавить красивое уведомление
        console.log(`🎉 Достижение разблокировано: ${achievementName}`);
        
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎉 Новое достижение!',
                message: `Вы получили достижение: "${achievementName}"`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`🎉 Новое достижение: ${achievementName}`);
        }
        
        // Сохраняем достижение на сервер
        this.saveGameState();
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        // Ограничиваем количество частиц для производительности
        const existingParticles = container.querySelectorAll('.particle');
        if (existingParticles.length > 50) {
            // Удаляем старые частицы
            existingParticles.forEach((particle, index) => {
                if (index < 10) {
                    particle.remove();
                }
            });
        }
        
        // Получаем координаты клика
        let clientX, clientY;
        
        if (event.touches && event.touches.length > 0) {
            // Для touch событий
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            // Для touchend событий
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            // Для mouse событий
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Создаем 8-12 частиц
        const particleCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Случайное направление и расстояние
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Устанавливаем CSS переменные для анимации
            particle.style.cssText = `
                --tx: ${tx}px;
                --ty: ${ty}px;
                left: ${x}px;
                top: ${y}px;
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

    animateParticles() {
        // Фоновая анимация редких частиц
        setInterval(() => {
            if (Math.random() < 0.1) {
                this.createBackgroundParticle();
            }
        }, 1000);
    }

    createBackgroundParticle() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Случайная позиция по краям
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // верх
                x = Math.random() * container.offsetWidth;
                y = 0;
                break;
            case 1: // право
                x = container.offsetWidth;
                y = Math.random() * container.offsetHeight;
                break;
            case 2: // низ
                x = Math.random() * container.offsetWidth;
                y = container.offsetHeight;
                break;
            case 3: // лево
                x = 0;
                y = Math.random() * container.offsetHeight;
                break;
        }
        
        // Направление к центру
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        const angle = Math.atan2(centerY - y, centerX - x);
        const distance = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.cssText = `
            --tx: ${tx}px;
            --ty: ${ty}px;
            left: ${x}px;
            top: ${y}px;
            width: ${1 + Math.random() * 2}px;
            height: ${1 + Math.random() * 2}px;
            opacity: ${0.1 + Math.random() * 0.2};
            animation: particle-float ${2 + Math.random() * 2}s ease-out forwards;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode === container) {
                container.removeChild(particle);
            }
        }, 4000);
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ДОБАВЛЕНИЯ ОЧКОВ
    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        
        // Проверка уровня - используем накопленные очки (не вычитаем потраченные на улучшения)
        let leveledUp = false;
        const maxLevel = this.getMaxLevel();
        
        while (this.gameState.level < maxLevel && 
               this.gameState.score >= this.getRequiredScoreForLevel(this.gameState.level + 1)) {
            this.gameState.level++;
            leveledUp = true;
            
            // Защита от бесконечного цикла
            if (this.gameState.level >= maxLevel) break;
        }
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
        
        // Визуальный эффект при критическом ударе
        if (isCritical) {
            this.showCriticalEffect(points);
        }
    }

    // Добавляем метод для получения максимального уровня
    getMaxLevel() {
        return 100; // Максимальный уровень игры
    }

    // ИСПРАВЛЕННАЯ ФОРМУЛА РАСЧЕТА ОЧКОВ ДЛЯ УРОВНЕЙ
    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100;
    }

    showLevelUp() {
        // Можно добавить анимацию уровня
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
        if (levelText) {
            levelText.textContent = `Уровень ${this.gameState.level}`;
        }
        
        // Сохраняем на сервер при повышении уровня
        this.saveGameState();
    }

    showCriticalEffect(points) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const critText = document.createElement('div');
        critText.className = 'particle critical-hit';
        critText.textContent = `CRIT! +${points}`;
        critText.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: var(--text-accent);
            pointer-events: none;
            z-index: 20;
            animation: floatUp 1.5s ease-out forwards;
        `;
        
        container.appendChild(critText);
        
        setTimeout(() => {
            if (critText.parentNode === container) {
                container.removeChild(critText);
            }
        }, 1500);
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ПОКУПКИ УЛУЧШЕНИЙ
    buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 50 * Math.pow(2, this.gameState.upgrades.autoClick),
            'critical-chance': 25 * Math.pow(2, this.gameState.upgrades.criticalChance - 1)
        };

        const cost = costs[upgradeType];
        
        if (this.gameState.score >= cost) {
            // Просто вычитаем стоимость улучшения
            this.gameState.score -= cost;
            
            switch(upgradeType) {
                case 'click-power':
                    this.gameState.upgrades.clickPower++;
                    break;
                case 'auto-click':
                    this.gameState.upgrades.autoClick++;
                    break;
                case 'critical-chance':
                    this.gameState.upgrades.criticalChance++;
                    break;
            }
            
            this.updateUI();
            this.saveGameState();
            
            // Показываем сообщение о успешной покупке
            this.showUpgradeNotification(upgradeType);
        } else {
            // Показываем сообщение о недостатке очков
            this.showInsufficientFundsNotification(cost);
        }
    }

    showUpgradeNotification(upgradeType) {
        const upgradeNames = {
            'click-power': 'Сила лапы',
            'auto-click': 'Авто-клик', 
            'critical-chance': 'Точность'
        };
        
        console.log(`🔼 Улучшение куплено: ${upgradeNames[upgradeType]}`);
        
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '✅ Улучшение куплено!',
                message: `Вы улучшили: ${upgradeNames[upgradeType]}`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`✅ Улучшение куплено: ${upgradeNames[upgradeType]}`);
        }
    }

    showInsufficientFundsNotification(requiredAmount) {
        console.log(`❌ Недостаточно очков. Нужно: ${requiredAmount}`);
        
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '❌ Недостаточно очков',
                message: `Для покупки нужно: ${requiredAmount} очков`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`❌ Недостаточно очков. Нужно: ${requiredAmount}`);
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0) {
                const autoPoints = this.gameState.upgrades.autoClick;
                this.addScore(autoPoints);
                
                // Сохраняем на сервер каждые 60 авто-кликов
                if (Math.random() < 0.016) { // ~1 раз в минуту
                    this.saveGameState();
                }
            }
        }, 1000);
    }

    updateUI() {
        // Обновляем счет и уровень
        const scoreElement = document.getElementById('score');
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        
        if (scoreElement) scoreElement.textContent = Math.floor(this.gameState.score).toLocaleString();
        if (levelBadge) levelBadge.textContent = this.gameState.level;
        if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;
        
        // Обновляем прогресс бар в шапке
        this.updateHeaderProgressBar();
        
        // Обновляем кнопки улучшений
        this.updateUpgradeButtons();
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ОБНОВЛЕНИЯ ПРОГРЕСС БАРА
    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        // Прогресс рассчитывается от накопленных очков (включая потраченные на улучшения)
        let progress = Math.max(0, this.gameState.score - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        let percentage = 0;
        if (totalNeeded > 0) {
            percentage = (progress / totalNeeded) * 100;
        } else {
            percentage = 100;
        }
        
        // Ограничиваем процент от 0 до 100
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        
        if (progressFillHeader) {
            progressFillHeader.style.width = `${percentage}%`;
        }
    }

    updateUpgradeButtons() {
        const upgrades = document.querySelectorAll('.upgrade-card');
        
        upgrades.forEach(card => {
            const type = card.dataset.upgrade;
            const levelSpan = card.querySelector('.upgrade-level span');
            const button = card.querySelector('.upgrade-btn');
            
            if (!levelSpan || !button) return;
            
            let level, cost;
            
            switch(type) {
                case 'click-power':
                    level = this.gameState.upgrades.clickPower;
                    cost = 10 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
                    
                case 'auto-click':
                    level = this.gameState.upgrades.autoClick;
                    cost = level === 0 ? 50 : 50 * Math.pow(2, level);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
                    
                case 'critical-chance':
                    level = this.gameState.upgrades.criticalChance;
                    cost = 25 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
            }
            
            // Обновляем доступность кнопок
            if (this.gameState.score >= cost) {
                button.disabled = false;
                button.classList.add('affordable');
            } else {
                button.disabled = true;
                button.classList.remove('affordable');
            }
        });
    }

    // ОБНОВЛЕННАЯ СИСТЕМА СОХРАНЕНИЯ
    saveGameState() {
        // Сохраняем в localStorage как fallback
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
        } catch (error) {
            console.error('Local storage save error:', error);
        }

        // Сохраняем на сервер
        this.saveGameStateToServer().catch(error => {
            console.error('Failed to save to server:', error);
        });
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Проверяем, что сохранение принадлежит текущему пользователю
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    console.log('Game state loaded from localStorage:', this.gameState);
                }
            }
        } catch (error) {
            console.error('Error loading game state from localStorage:', error);
        }
    }
}

// Добавляем CSS анимацию
const style = document.createElement('style');
style.textContent = `
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
