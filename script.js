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
        
        // Настройки сервера
        this.apiUrl = 'https://your-server.com/api';
        this.botToken = 'YOUR_BOT_TOKEN_HERE';
        
        // Настройки админ-панели
        this.adminEnabled = false;
        this.adminCode = '1337';
        
        this.init();
    }

    // ... (остальные методы остаются без изменений до метода updateHeaderProgressBar)

    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        // Исправление: не даем прогрессу уходить в минус
        let progress = Math.max(0, this.gameState.score - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        // Если достигнут максимум текущего уровня, показываем 100%
        let percentage = 0;
        if (totalNeeded > 0) {
            percentage = (progress / totalNeeded) * 100;
        } else {
            percentage = 100; // Если следующий уровень требует 0 очков (максимальный уровень)
        }
        
        // Ограничиваем процент от 0 до 100
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        
        if (progressFillHeader) {
            progressFillHeader.style.width = `${percentage}%`;
        }
    }

    // Исправленный метод addScore
    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        
        // Проверка уровня с защитой от ухода в минус
        let leveledUp = false;
        while (this.gameState.score >= this.getRequiredScoreForLevel(this.gameState.level + 1) && this.gameState.level < this.getMaxLevel()) {
            this.gameState.level++;
            leveledUp = true;
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

    // Исправленный метод getRequiredScoreForLevel
    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100; // Исправленная формула
    }

    // Исправленный метод buyUpgrade
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
        
        // Можно добавить визуальное уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '✅ Улучшение куплено!',
                message: `Вы улучшили: ${upgradeNames[upgradeType]}`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    showInsufficientFundsNotification(requiredAmount) {
        console.log(`❌ Недостаточно очков. Нужно: ${requiredAmount}`);
        
        // Можно добавить визуальное уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '❌ Недостаточно очков',
                message: `Для покупки нужно: ${requiredAmount} очков`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    // Исправленный метод updateLevelsProgress для вкладки уровней
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

    // Исправленный метод updateLevelCards для вкладки уровней
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
                
                // Показываем прогресс до следующего уровня
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

    // ... (остальные методы остаются без изменений)
}

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
