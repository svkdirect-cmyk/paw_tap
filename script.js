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
            });
            
            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
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
            
            // Отключаем выделение текста при касании
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
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

        // Отключаем выделение текста для всех кликабельных элементов
        document.querySelectorAll('.clickable, .tab-item, .btn-primary, .btn-secondary').forEach(el => {
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
        });
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
                photo_url: ''
            };
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        if (this.user) {
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-name');
            const levelText = document.querySelector('.level-text span');
            
            if (avatar) {
                if (this.user.photo_url) {
                    avatar.src = this.user.photo_url;
                } else {
                    avatar.style.display = 'none';
                }
            }
            if (username) {
                username.textContent = this.user.first_name || 'Player';
            }
            if (levelText) {
                levelText.textContent = this.gameState.level;
            }
        }
    }

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
        if (friendsCount) {
            friendsCount.textContent = this.gameState.friends.length;
        }
        
        // Показываем/скрываем список друзей
        const emptyState = document.querySelector('.empty-state');
        const friendsList = document.querySelector('.friends-list');
        
        if (this.gameState.friends.length > 0) {
            if (emptyState) emptyState.style.display = 'none';
            if (friendsList) friendsList.style.display = 'block';
            this.updateFriendsList();
        } else {
            if (emptyState) emptyState.style.display = 'block';
            if (friendsList) friendsList.style.display = 'none';
        }
        
        // Обновляем бонусы
        this.updateFriendsBonuses();
    }

    updateFriendsList() {
        // Заглушка - в реальном приложении здесь будет список друзей
        const friendsList = document.querySelector('.friends-list');
        if (friendsList) {
            friendsList.innerHTML = '<div class="coming-soon">Список друзей будет доступен после подключения</div>';
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
                if (status) {
                    status.textContent = 'Текущий';
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
        const comboCards = document.querySelectorAll('.combo-card');
        
        comboCards.forEach((card, index) => {
            // В реальном приложении здесь будет проверка наличия карт
            // Сейчас все карты заблокированы
            card.classList.add('locked');
        });
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
        setInterval(() => {
            this.gameState.stats.playTime += 1000; // +1 секунда
            this.saveGameState();
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
        this.saveGameState();
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
        }
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
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
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Случайный размер
            const size = 2 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Случайная прозрачность
            const opacity = 0.3 + Math.random() * 0.7;
            particle.style.opacity = opacity;
            
            // Анимация
            particle.style.animation = `particle-float ${0.8 + Math.random() * 0.4}s ease-out forwards`;
            
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
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Маленький размер и низкая opacity
        const size = 1 + Math.random() * 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = 0.1 + Math.random() * 0.2;
        
        particle.style.animation = `particle-float ${2 + Math.random() * 2}s ease-out forwards`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode === container) {
                container.removeChild(particle);
            }
        }, 4000);
    }

    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        
        // Проверка уровня
        const requiredForNextLevel = this.getRequiredScoreForLevel(this.gameState.level + 1);
        if (this.gameState.score >= requiredForNextLevel) {
            this.gameState.level++;
            this.showLevelUp();
        }
        
        this.updateUI();
        
        // Визуальный эффект при критическом ударе
        if (isCritical) {
            this.showCriticalEffect(points);
        }
    }

    getRequiredScoreForLevel(level) {
        return Math.pow(level, 2) * 100;
    }

    showLevelUp() {
        // Можно добавить анимацию уровня
        const levelBadge = document.querySelector('.level-badge');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
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

    buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 100 * Math.pow(2, this.gameState.upgrades.autoClick - 1),
            'critical-chance': 25 * Math.pow(2, this.gameState.upgrades.criticalChance - 1)
        };

        const cost = costs[upgradeType];
        
        if (this.gameState.score >= cost) {
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
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0) {
                const autoPoints = this.gameState.upgrades.autoClick;
                this.addScore(autoPoints);
            }
        }, 1000);
    }

    updateUI() {
        // Обновляем счет и уровень
        const scoreElement = document.getElementById('score');
        const levelElement = document.querySelector('.level-text span');
        const levelBadge = document.querySelector('.level-badge');
        const nextLevelElement = document.querySelector('.progress-text-header span:first-child');
        const progressRemaining = document.getElementById('progress-remaining');
        
        if (scoreElement) scoreElement.textContent = Math.floor(this.gameState.score).toLocaleString();
        if (levelElement) levelElement.textContent = this.gameState.level;
        if (levelBadge) levelBadge.textContent = this.gameState.level;
        if (nextLevelElement) nextLevelElement.textContent = this.gameState.level + 1;
        
        // Обновляем прогресс бар в шапке
        this.updateHeaderProgressBar();
        
        // Обновляем кнопки улучшений
        this.updateUpgradeButtons();
    }

    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = this.gameState.score - currentLevelScore;
        const totalNeeded = nextLevelScore - currentLevelScore;
        const percentage = (progress / totalNeeded) * 100;
        
        const progressFillHeader = document.getElementById('level-progress-header');
        const progressRemaining = document.getElementById('progress-remaining');
        
        if (progressFillHeader) {
            progressFillHeader.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        if (progressRemaining) {
            const remaining = Math.max(0, totalNeeded - progress);
            progressRemaining.textContent = remaining.toLocaleString();
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
                    cost = level === 0 ? 50 : 100 * Math.pow(2, level - 1);
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

    inviteFriends() {
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'Пригласить друзей',
                message: 'Поделитесь ссылкой с друзьями, чтобы получить бонусы!',
                buttons: [
                    { type: 'default', text: 'Поделиться' },
                    { type: 'cancel', text: 'Закрыть' }
                ]
            });
        } else {
            // Заглушка для браузера
            alert('Функция приглашения друзей будет доступна в Telegram');
        }
    }

    saveGameState() {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Проверяем, что сохранение принадлежит текущему пользователю
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    console.log('Game state loaded:', this.gameState);
                }
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

// Закрытие модального окна по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window.clickerGame) {
            window.clickerGame.closeProfile();
        }
    }
});

// Предотвращение масштабирования на мобильных устройствах
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });
