// ============================================
// DIPSIK: НОВОГОДНИЙ КВЕСТ - ПОЛНЫЙ КОД СО ВСЕМИ ФУНКЦИЯМИ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 DIPSIK: Полная версия игры загружается...');
    
    // ==================== КОНСТАНТЫ И ПЕРЕМЕННЫЕ ====================
    const GAME_MODES = {
        CLASSIC: 'classic',
        TIME: 'time',
        CODE: 'code',
        SURVIVAL: 'survival'
    };
    
    const DIFFICULTY = {
        EASY: { name: 'НОВИЧОК', speed: 1, spawnRate: 1.0 },
        MEDIUM: { name: 'ПРОГРАММИСТ', speed: 1.3, spawnRate: 1.5 },
        HARD: { name: 'ХАКЕР', speed: 1.7, spawnRate: 2.0 },
        HARDCORE: { name: 'БОГ КОДА', speed: 2.2, spawnRate: 2.5 }
    };
    
    let gameRunning = false;
    let gamePaused = false;
    let gameLoopId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let gameTime = 0;
    let levelTimer = 0;
    let currentDifficulty = DIFFICULTY.EASY;
    let snowMode = false;
    let snowTimer = 0;
    let cheatsActive = {};
    
    // ==================== ИГРОВОЕ СОСТОЯНИЕ ====================
    const gameState = {
        score: 0,
        lives: 3,
        gifts: 0,
        level: 1,
        bugsKilled: 0,
        totalObjects: 0,
        accuracy: 100,
        gameMode: GAME_MODES.CLASSIC,
        highScore: parseInt(localStorage.getItem('dipsikHighScore')) || 0,
        totalGames: parseInt(localStorage.getItem('dipsikTotalGames')) || 0,
        linesCollected: parseInt(localStorage.getItem('dipsikLinesCollected')) || 0,
        bestTime: parseInt(localStorage.getItem('dipsikBestTime')) || 0,
        achievements: JSON.parse(localStorage.getItem('dipsikAchievements')) || []
    };
    
    // ==================== ЗВУКИ ====================
    const sounds = {
        jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-jumping-in-a-video-game-2043.mp3'),
        collect: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
        hurt: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-over-470.mp3'),
        victory: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-arcade-tone-2019.mp3'),
        levelUp: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
        snow: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-sparkles-300.mp3'),
        click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
        bgMusic: new Audio('https://assets.mixkit.co/music/preview/mixkit-christmas-time-119.mp3')
    };
    
    // Настройка звуков
    Object.values(sounds).forEach(sound => {
        sound.volume = 0.3;
        sound.preload = 'auto';
    });
    sounds.bgMusic.volume = 0.2;
    sounds.bgMusic.loop = true;
    
    // ==================== КАНВАС ====================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // ==================== ИГРОК ====================
    const player = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 60,
        height: 60,
        speed: 7,
        speedY: 0,
        isMovingLeft: false,
        isMovingRight: false,
        canJump: true,
        isInvincible: false,
        invincibleTimer: 0,
        isSuper: false,
        superTimer: 0,
        color: '#00ffff',
        
        draw() {
            // Эффект неуязвимости
            if (this.isInvincible) {
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            }
            
            // Основной круг
            ctx.fillStyle = this.isSuper ? '#FFD700' : this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Глаза
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Зрачки
            ctx.fillStyle = '#0066cc';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Улыбка
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 5, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            // Имя
            ctx.fillStyle = this.isSuper ? '#B22222' : '#FFD700';
            ctx.font = 'bold 14px "Mountains of Christmas", Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DIPSIK', this.x, this.y + 30);
            
            // Эффект супер-режима
            if (this.isSuper) {
                ctx.strokeStyle = '#FF8C00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2 + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1.0;
        },
        
        update(deltaTime) {
            // Движение
            if (this.isMovingLeft) this.x -= this.speed * currentDifficulty.speed;
            if (this.isMovingRight) this.x += this.speed * currentDifficulty.speed;
            
            // Гравитация
            this.speedY += 0.5;
            this.y += this.speedY;
            
            // Границы
            if (this.x - this.width/2 < 0) this.x = this.width/2;
            if (this.x + this.width/2 > canvas.width) this.x = canvas.width - this.width/2;
            
            // Пол
            if (this.y + this.height/2 > canvas.height - 50) {
                this.y = canvas.height - 50 - this.height/2;
                this.speedY = 0;
                this.canJump = true;
            }
            
            // Таймеры
            if (this.isInvincible) {
                this.invincibleTimer -= deltaTime;
                if (this.invincibleTimer <= 0) {
                    this.isInvincible = false;
                }
            }
            
            if (this.isSuper) {
                this.superTimer -= deltaTime;
                if (this.superTimer <= 0) {
                    this.isSuper = false;
                }
            }
        },
        
        jump() {
            if (this.canJump) {
                this.speedY = -15 * currentDifficulty.speed;
                this.canJump = false;
                sounds.jump.currentTime = 0;
                sounds.jump.play();
            }
        },
        
        superJump() {
            if (this.canJump) {
                this.speedY = -25 * currentDifficulty.speed;
                this.canJump = false;
                sounds.jump.currentTime = 0;
                sounds.jump.play();
                this.activateSuper(2000);
            }
        },
        
        moveLeft() {
            this.isMovingLeft = true;
        },
        
        moveRight() {
            this.isMovingRight = true;
        },
        
        stop() {
            this.isMovingLeft = false;
            this.isMovingRight = false;
        },
        
        hurt() {
            if (this.isInvincible || this.isSuper) return false;
            
            this.isInvincible = true;
            this.invincibleTimer = 1500;
            sounds.hurt.currentTime = 0;
            sounds.hurt.play();
            return true;
        },
        
        activateSuper(duration = 5000) {
            this.isSuper = true;
            this.superTimer = duration;
            this.color = '#FFD700';
        },
        
        collectPower(powerType) {
            switch(powerType) {
                case 'invincible':
                    this.isInvincible = true;
                    this.invincibleTimer = 5000;
                    break;
                case 'super':
                    this.activateSuper(7000);
                    break;
                case 'speed':
                    this.speed = 12;
                    setTimeout(() => this.speed = 7, 5000);
                    break;
            }
        }
    };
    
    // ==================== ОБЪЕКТЫ ИГРЫ ====================
    const fallingObjects = [];
    const particles = [];
    const powerUps = [];
    
    class GameObject {
        constructor(type, x, y, width, height) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.speed = 0;
            this.collected = false;
            this.rotation = 0;
            this.alpha = 1;
        }
        
        update(deltaTime) {
            this.y += this.speed * currentDifficulty.speed;
            this.rotation += 0.02;
            return this.y > canvas.height + 50;
        }
        
        draw() {
            if (this.collected) return;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.alpha;
            
            this.drawSpecific();
            
            ctx.restore();
        }
        
        drawSpecific() {
            // Переопределяется в дочерних классах
        }
        
        checkCollision() {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (player.width/2 + this.width/2);
        }
    }
    
    class Gift extends GameObject {
        constructor(x, y) {
            super('gift', x, y, 50, 50);
            this.speed = 3 + Math.random() * 2;
            this.color = this.getRandomColor();
            this.value = 100;
        }
        
        getRandomColor() {
            const colors = ['#FF0000', '#228B22', '#1E90FF', '#FF8C00', '#8A2BE2'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        drawSpecific() {
            // Коробка
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Лента
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-this.width/2, -5, this.width, 10);
            ctx.fillRect(-5, -this.height/2, 10, this.height);
            
            // Бант
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎁', 0, 0);
        }
        
        collect() {
            if (this.collected) return false;
            this.collected = true;
            
            gameState.score += this.value;
            gameState.gifts++;
            gameState.linesCollected++;
            
            // Эффект частиц
            createParticles(this.x, this.y, 10, this.color);
            
            // Проверка уровня
            if (gameState.gifts % 5 === 0) {
                levelUp();
            }
            
            sounds.collect.currentTime = 0;
            sounds.collect.play();
            showNotification('🎁 +' + this.value + ' очков!', '#32CD32');
            
            return true;
        }
    }
    
    class Bug extends GameObject {
        constructor(x, y) {
            super('bug', x, y, 45, 45);
            this.speed = 4 + Math.random() * 2;
            this.rotationSpeed = 0.05;
        }
        
        update(deltaTime) {
            this.y += this.speed * currentDifficulty.speed;
            this.rotation += this.rotationSpeed;
            this.x += Math.sin(Date.now() / 500 + this.y / 100) * 2;
            return this.y > canvas.height + 50;
        }
        
        drawSpecific() {
            // Тело
            ctx.fillStyle = '#B22222';
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Глаза
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-8, -8, 4, 0, Math.PI * 2);
            ctx.arc(8, -8, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Зрачки
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(-8, -8, 2, 0, Math.PI * 2);
            ctx.arc(8, -8, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Рот
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 5, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            // Текст
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BUG', 0, 20);
            
            // Антенны
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-5, -20);
            ctx.lineTo(-15, -30);
            ctx.moveTo(5, -20);
            ctx.lineTo(15, -30);
            ctx.stroke();
        }
        
        collect() {
            if (this.collected || player.isInvincible || player.isSuper) return false;
            this.collected = true;
            
            if (player.hurt()) {
                gameState.lives--;
                
                // Эффект частиц
                createParticles(this.x, this.y, 15, '#B22222');
                
                sounds.hurt.currentTime = 0;
                sounds.hurt.play();
                showNotification('💔 -1 жизнь!', '#DC143C');
                
                if (gameState.lives <= 0) {
                    setTimeout(gameOver, 500);
                }
            }
            
            return true;
        }
    }
    
    class Snowflake extends GameObject {
        constructor(x, y) {
            super('snowflake', x, y, 35, 35);
            this.speed = 8 + Math.random() * 4;
            this.rotation = Math.random() * Math.PI * 2;
        }
        
        update(deltaTime) {
            this.y += this.speed * currentDifficulty.speed;
            this.rotation += 0.03;
            this.x += Math.sin(Date.now() / 200 + this.y / 50) * 2;
            return this.y > canvas.height + 50;
        }
        
        drawSpecific() {
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(15, 0);
                ctx.stroke();
            }
            
            ctx.fillStyle = '#00aaff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄️', 0, 0);
        }
        
        collect() {
            if (this.collected) return false;
            this.collected = true;
            
            if (gameState.lives < 5) {
                gameState.lives++;
                showNotification('❄️ +1 жизнь!', '#00aaff');
            } else {
                gameState.score += 200;
                showNotification('❄️ +200 очков!', '#00aaff');
            }
            
            createParticles(this.x, this.y, 12, '#00aaff');
            sounds.snow.currentTime = 0;
            sounds.snow.play();
            
            return true;
        }
    }
    
    class PowerUp extends GameObject {
        constructor(x, y, type) {
            super('powerup', x, y, 40, 40);
            this.speed = 2 + Math.random() * 1;
            this.type = type;
            this.colors = {
                invincible: '#FFFF00',
                super: '#FFD700',
                speed: '#32CD32',
                time: '#1E90FF'
            };
            this.pulse = 0;
        }
        
        update(deltaTime) {
            this.y += this.speed * currentDifficulty.speed;
            this.pulse = Math.sin(Date.now() / 200) * 5;
            return this.y > canvas.height + 50;
        }
        
        drawSpecific() {
            const size = this.width + this.pulse;
            
            // Внешний круг
            ctx.fillStyle = this.colors[this.type] || '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Внутренний круг
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, size/2 - 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Иконка
            ctx.fillStyle = this.colors[this.type] || '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const icons = {
                invincible: '🛡️',
                super: '⚡',
                speed: '💨',
                time: '⏰'
            };
            
            ctx.fillText(icons[this.type] || '❓', 0, 0);
        }
        
        collect() {
            if (this.collected) return false;
            this.collected = true;
            
            player.collectPower(this.type);
            
            let message = '';
            switch(this.type) {
                case 'invincible': message = '🛡️ Неуязвимость!'; break;
                case 'super': message = '⚡ Супер-сила!'; break;
                case 'speed': message = '💨 Супер-скорость!'; break;
                case 'time': message = '⏰ +10 секунд!'; break;
            }
            
            createParticles(this.x, this.y, 15, this.colors[this.type]);
            sounds.collect.currentTime = 0;
            sounds.collect.play();
            showNotification(message, this.colors[this.type]);
            
            return true;
        }
    }
    
    class CodeSnippet extends GameObject {
        constructor(x, y) {
            super('code', x, y, 60, 60);
            this.speed = 2 + Math.random() * 1;
            this.code = this.generateCode();
            this.value = 500;
        }
        
        generateCode() {
            const snippets = [
                'function()',
                'if(score>100)',
                'for(let i=0)',
                'const x = 10',
                'return true',
                'console.log()',
                'Math.random()',
                'new Date()',
                'Array.map()',
                'JSON.parse()'
            ];
            return snippets[Math.floor(Math.random() * snippets.length)];
        }
        
        drawSpecific() {
            // Фон
            ctx.fillStyle = '#4B0082';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Бордер
            ctx.strokeStyle = '#9370DB';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Код
            ctx.fillStyle = '#32CD32';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Разбиваем длинный код
            if (this.code.length > 10) {
                ctx.fillText(this.code.substring(0, 10), 0, -10);
                ctx.fillText(this.code.substring(10), 0, 5);
            } else {
                ctx.fillText(this.code, 0, 0);
            }
            
            // Иконка
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('💻', 0, 25);
        }
        
        collect() {
            if (this.collected) return false;
            this.collected = true;
            
            gameState.score += this.value;
            createParticles(this.x, this.y, 20, '#32CD32');
            sounds.levelUp.currentTime = 0;
            sounds.levelUp.play();
            showNotification('💻 +' + this.value + ' очков за код!', '#32CD32');
            
            return true;
        }
    }
    
    // ==================== СИСТЕМА ЧАСТИЦ ====================
    function createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    function drawParticles() {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
    
    // ==================== СПАВН ОБЪЕКТОВ ====================
    function spawnObject() {
        const spawnChance = Math.random();
        const x = Math.random() * (canvas.width - 60) + 30;
        
        if (spawnChance < 0.01 && gameState.level >= 3) {
            // Кодовый сниппет (редко)
            fallingObjects.push(new CodeSnippet(x, -40));
        } else if (spawnChance < 0.05 && gameState.level >= 2) {
            // Пауэр-ап
            const types = ['invincible', 'super', 'speed', 'time'];
            const type = types[Math.floor(Math.random() * types.length)];
            fallingObjects.push(new PowerUp(x, -40, type));
        } else if (spawnChance < 0.1) {
            // Снежинка
            fallingObjects.push(new Snowflake(x, -40));
        } else if (spawnChance < 0.4) {
            // Бак
            fallingObjects.push(new Bug(x, -40));
        } else {
            // Подарок
            fallingObjects.push(new Gift(x, -40));
        }
        
        gameState.totalObjects++;
    }
    
    // ==================== УРОВНИ И СЛОЖНОСТЬ ====================
    function updateDifficulty() {
        if (gameState.level >= 10) {
            currentDifficulty = DIFFICULTY.HARDCORE;
        } else if (gameState.level >= 6) {
            currentDifficulty = DIFFICULTY.HARD;
        } else if (gameState.level >= 3) {
            currentDifficulty = DIFFICULTY.MEDIUM;
        } else {
            currentDifficulty = DIFFICULTY.EASY;
        }
        
        document.getElementById('difficultyLevel').textContent = currentDifficulty.name;
    }
    
    function levelUp() {
        gameState.level++;
        updateDifficulty();
        
        sounds.levelUp.currentTime = 0;
        sounds.levelUp.play();
        
        showNotification('🎮 Уровень ' + gameState.level + '!', '#FFD700');
        
        // Специальные события
        if (gameState.level === 5) {
            activateSnowMode(10000);
        }
        
        if (gameState.level === 10) {
            player.activateSuper(15000);
            showNotification('🎉 Юбилейный 10 уровень!', '#FF8C00');
        }
        
        updateHUD();
        checkAchievements();
    }
    
    function activateSnowMode(duration) {
        snowMode = true;
        snowTimer = duration;
        showNotification('❄️ Снегопад активирован!', '#00aaff');
        sounds.snow.currentTime = 0;
        sounds.snow.play();
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function updateGame(timestamp) {
        if (!gameRunning || gamePaused) return;
        
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        gameTime += deltaTime;
        spawnTimer += deltaTime;
        levelTimer += deltaTime;
        
        if (snowMode) {
            snowTimer -= deltaTime;
            if (snowTimer <= 0) {
                snowMode = false;
            }
        }
        
        // Очистка канваса
        ctx.fillStyle = snowMode ? '#1a3d4a' : '#0a2a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Снегопад на заднем фоне
        if (snowMode) {
            drawSnowfall();
        }
        
        // Обновление и отрисовка игрока
        player.update(deltaTime);
        player.draw();
        
        // Спавн объектов
        const spawnInterval = Math.max(200, 1000 - gameState.level * 50);
        if (spawnTimer > spawnInterval / currentDifficulty.spawnRate) {
            spawnObject();
            if (snowMode && Math.random() < 0.3) {
                spawnObject(); // Больше объектов в снегопад
            }
            spawnTimer = 0;
        }
        
        // Обновление объектов
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];
            
            if (obj.update(deltaTime)) {
                fallingObjects.splice(i, 1);
                continue;
            }
            
            obj.draw();
            
            if (!obj.collected && obj.checkCollision()) {
                if (obj.collect()) {
                    fallingObjects.splice(i, 1);
                }
            }
        }
        
        // Частицы
        updateParticles(deltaTime);
        drawParticles();
        
        // Пол
        drawFloor();
        
        // Обновление интерфейса
        if (levelTimer > 1000) {
            updateGameTimer();
            levelTimer = 0;
        }
        
        // Проверка условий победы
        if (gameState.gameMode === GAME_MODES.CLASSIC && gameState.gifts >= 50) {
            victory();
            return;
        }
        
        if (gameState.gameMode === GAME_MODES.TIME && gameTime >= 60000) {
            gameOver();
            return;
        }
        
        gameLoopId = requestAnimationFrame(updateGame);
    }
    
    function drawSnowfall() {
        for (let i = 0; i < 30; i++) {
            const x = (Date.now() / 50 + i * 100) % canvas.width;
            const y = (Date.now() / 30 + i * 50) % canvas.height;
            const size = Math.random() * 4 + 2;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawFloor() {
        const gradient = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
        gradient.addColorStop(0, '#2a4a3a');
        gradient.addColorStop(1, '#1a3a2a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        // Узор на полу
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 2;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, canvas.height - 50);
            ctx.lineTo(i + 20, canvas.height - 30);
            ctx.stroke();
        }
    }
    
    // ==================== ИНТЕРФЕЙС ====================
    function updateHUD() {
        document.getElementById('scoreValue').textContent = String(gameState.score).padStart(6, '0');
        document.getElementById('giftsCount').textContent = gameState.gifts;
        document.getElementById('gameLevel').textContent = gameState.level;
        
        const heartsContainer = document.getElementById('heartsContainer');
        heartsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('i');
            heart.className = `fas fa-heart ${i >= gameState.lives ? 'lost' : ''}`;
            heartsContainer.appendChild(heart);
        }
        
        // Прогресс уровня
        const progress = Math.min(100, (gameState.gifts % 5) * 20);
        document.getElementById('levelProgressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = `${gameState.gifts % 5}/5 подарков`;
        
        // Сложность
        document.getElementById('difficultyLevel').textContent = currentDifficulty.name;
    }
    
    function updateGameTimer() {
        if (gameState.gameMode === GAME_MODES.TIME) {
            const timeLeft = Math.max(0, 60000 - gameTime);
            const seconds = Math.ceil(timeLeft / 1000);
            document.getElementById('timeValue').textContent = seconds;
        } else {
            const seconds = Math.floor(gameTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            document.getElementById('timeValue').textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    function showNotification(message, color) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: ${100 + Math.random() * 50}px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeUp 1s forwards;
            border: 2px solid ${color};
            font-family: 'Mountains of Christmas', cursive;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => notification.remove(), 500);
        }, 1500);
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startGame(mode) {
        console.log('🚀 Запуск игры в режиме:', mode);
        
        // Сброс состояния
        gameState.score = 0;
        gameState.lives = 3;
        gameState.gifts = 0;
        gameState.level = 1;
        gameState.gameMode = mode;
        gameState.bugsKilled = 0;
        gameState.totalObjects = 0;
        gameState.accuracy = 100;
        gameTime = 0;
        levelTimer = 0;
        snowMode = false;
        
        fallingObjects.length = 0;
        particles.length = 0;
        powerUps.length = 0;
        
        // Сброс игрока
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.speedY = 0;
        player.canJump = true;
        player.isMovingLeft = false;
        player.isMovingRight = false;
        player.isInvincible = false;
        player.isSuper = false;
        player.color = '#00ffff';
        player.speed = 7;
        
        // Настройка интерфейса
        document.getElementById('gameMode').textContent = getModeName(mode);
        updateDifficulty();
        updateHUD();
        
        // Музыка
        if (sounds.bgMusic.paused) {
            sounds.bgMusic.currentTime = 0;
            sounds.bgMusic.play().catch(e => console.log('Автовоспроизведение заблокировано'));
        }
        
        // Переключение экранов
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        
        // Запуск игры
        gameRunning = true;
        gamePaused = false;
        lastTime = 0;
        spawnTimer = 0;
        
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(updateGame);
        
        // Мобильное управление
        if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            const controls = document.querySelector('.game-controls');
            if (controls) controls.style.display = 'flex';
        }
        
        // Статистика
        gameState.totalGames++;
        saveGameState();
    }
    
    function getModeName(mode) {
        const names = {
            'classic': 'КЛАССИКА',
            'time': 'НА ВРЕМЯ',
            'code': 'КОД-БАТТЛ',
            'survival': 'ВЫЖИВАНИЕ'
        };
        return names[mode] || mode.toUpperCase();
    }
    
    function pauseGame() {
        gamePaused = !gamePaused;
        sounds.click.play();
        
        if (gamePaused) {
            document.getElementById('pauseGifts').textContent = gameState.gifts;
            document.getElementById('pauseBugs').textContent = gameState.bugsKilled;
            document.getElementById('pauseTime').textContent = document.getElementById('timeValue').textContent;
            document.getElementById('pauseDifficulty').textContent = currentDifficulty.name;
            
            const accuracy = gameState.totalObjects > 0 
                ? Math.round((gameState.gifts / gameState.totalObjects) * 100)
                : 100;
            document.getElementById('pauseAccuracy').textContent = accuracy + '%';
            
            // Случайная подсказка
            const tips = [
                'Используй супер-прыжок для сбора высоких предметов!',
                'Снежинки восстанавливают жизни!',
                'На 5 уровне начинается снегопад!',
                'Кодовые сниппеты дают много очков!',
                'Избегай красных багов!',
                'Собирай пауэр-апы для особых способностей!',
                'На 10 уровне ты станешь неуязвимым на 15 секунд!'
            ];
            document.getElementById('pauseTip').textContent = tips[Math.floor(Math.random() * tips.length)];
            
            document.getElementById('pauseScreen').classList.add('active');
        } else {
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
            }
        }
    }
    
    function victory() {
        gameRunning = false;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        
        sounds.victory.currentTime = 0;
        sounds.victory.play();
        
        // Награда за победу
        gameState.score += 5000;
        unlockAchievement('ПОБЕДА', '🎮 Пройди игру в классическом режиме');
        
        showGameOverScreen(true);
    }
    
    function gameOver() {
        gameRunning = false;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        
        // Сохранение рекордов
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            unlockAchievement('РЕКОРД', '🏆 Установи новый рекорд очков');
        }
        
        if (gameState.gameMode === GAME_MODES.TIME) {
            const timeScore = Math.floor(gameTime / 1000);
            if (timeScore > gameState.bestTime) {
                gameState.bestTime = timeScore;
                localStorage.setItem('dipsikBestTime', gameState.bestTime);
            }
        }
        
        saveGameState();
        showGameOverScreen(false);
    }
    
    function showGameOverScreen(isVictory) {
        document.getElementById('gameOverTitle').textContent = isVictory ? 'ПОБЕДА! 🏆' : 'ИГРА ОКОНЧЕНА 💀';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalLevel').textContent = gameState.level;
        document.getElementById('finalGifts').textContent = gameState.gifts;
        document.getElementById('finalLives').textContent = gameState.lives;
        document.getElementById('finalDifficulty').textContent = currentDifficulty.name;
        
        const icon = document.getElementById('resultIcon');
        icon.innerHTML = isVictory ? 
            '<i class="fas fa-trophy" style="font-size: 4rem; color: #FFD700;"></i>' :
            '<i class="fas fa-skull-crossbones" style="font-size: 4rem; color: #B22222;"></i>';
        
        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        
        // Скрываем мобильное управление
        const controls = document.querySelector('.game-controls');
        if (controls) controls.style.display = 'none';
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // ==================== ДОСТИЖЕНИЯ ====================
    function checkAchievements() {
        if (gameState.gifts >= 10) {
            unlockAchievement('НОВИЧОК', '🎁 Собери 10 подарков');
        }
        if (gameState.gifts >= 50) {
            unlockAchievement('КОЛЛЕКЦИОНЕР', '📦 Собери 50 подарков');
        }
        if (gameState.level >= 5) {
            unlockAchievement('ЭКСПЕРТ', '⭐ Достигни 5 уровня');
        }
        if (gameState.level >= 10) {
            unlockAchievement('МАСТЕР', '👑 Достигни 10 уровня');
        }
        if (gameState.score >= 10000) {
            unlockAchievement('БОГАТЫЙ', '💰 Заработай 10,000 очков');
        }
        if (snowMode) {
            unlockAchievement('СНЕГОВИК', '❄️ Активируй снегопад');
        }
    }
    
    function unlockAchievement(name, description) {
        const achievement = { name, description, date: new Date().toLocaleDateString() };
        
        if (!gameState.achievements.some(a => a.name === name)) {
            gameState.achievements.push(achievement);
            showNotification('🏆 Достижение: ' + name, '#FFD700');
            saveGameState();
        }
    }
    
    // ==================== СОХРАНЕНИЕ ====================
    function saveGameState() {
        localStorage.setItem('dipsikHighScore', gameState.highScore);
        localStorage.setItem('dipsikTotalGames', gameState.totalGames);
        localStorage.setItem('dipsikLinesCollected', gameState.linesCollected);
        localStorage.setItem('dipsikAchievements', JSON.stringify(gameState.achievements));
        
        // Обновляем меню
        document.getElementById('bestScore').textContent = gameState.highScore;
        document.getElementById('totalGames').textContent = gameState.totalGames;
        document.getElementById('linesCollected').textContent = gameState.linesCollected;
        
        // Прогресс сезона
        const progress = Math.min(100, Math.floor((gameState.totalGames / 10) * 100));
        document.getElementById('progressPercent').textContent = progress + '%';
        document.getElementById('progressFill').style.width = progress + '%';
        
        const messages = [
            'Начинаем новогоднее кодирование! 🎄',
            'Уже неплохо! 🎁',
            'Половина пути пройдена! ⭐',
            'Почти всё собрано! 🎮',
            'Сезон завершён! 🏆'
        ];
        const messageIndex = Math.min(4, Math.floor(progress / 25));
        document.getElementById('seasonMessage').textContent = messages[messageIndex];
    }
    
    // ==================== ЧИТ-КОДЫ ====================
    function activateCheat(code) {
        const cheats = {
            'DIPSIK2024': () => { gameState.score += 10000; showNotification('🎅 +10000 очков!', '#FFD700'); },
            'SNOWMAGIC': () => { activateSnowMode(30000); },
            'INVINCIBLE': () => { player.isInvincible = true; player.invincibleTimer = 30000; showNotification('🛡️ Бессмертие!', '#FFFF00'); },
            'SUPERJUMP': () => { player.activateSuper(30000); showNotification('⚡ Супер-сила!', '#FFD700'); },
            'MORELIVES': () => { gameState.lives = 5; updateHUD(); showNotification('💖 +5 жизней!', '#FF69B4'); },
            'LEVELUP': () => { levelUp(); },
            'GODMODE': () => { 
                player.isInvincible = true; 
                player.activateSuper(60000);
                gameState.lives = 5;
                updateHUD();
                showNotification('👑 РЕЖИМ БОГА!', '#FF0000');
            }
        };
        
        if (cheats[code]) {
            cheats[code]();
            cheatsActive[code] = true;
            sounds.victory.play();
            return true;
        }
        
        return false;
    }
    
    // ==================== МОБИЛЬНОЕ УПРАВЛЕНИЕ ====================
    function setupMobileControls() {
        const leftBtn = document.getElementById('moveLeftBtn');
        const rightBtn = document.getElementById('moveRightBtn');
        const upBtn = document.getElementById('moveUpBtn');
        const actionBtn = document.getElementById('actionBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        // Касания
        const addTouchControl = (button, action, endAction) => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (action) action();
                button.classList.add('active');
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (endAction) endAction();
                button.classList.remove('active');
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                if (endAction) endAction();
                button.classList.remove('active');
            });
        };
        
        addTouchControl(leftBtn, () => player.moveLeft(), () => player.stop());
        addTouchControl(rightBtn, () => player.moveRight(), () => player.stop());
        addTouchControl(upBtn, () => player.jump());
        addTouchControl(actionBtn, () => player.superJump());
        addTouchControl(specialBtn, () => {
            // Дебаг-режим: удаляет всех багов
            for (let i = fallingObjects.length - 1; i >= 0; i--) {
                if (fallingObjects[i].type === 'bug') {
                    fallingObjects.splice(i, 1);
                    gameState.bugsKilled++;
                    createParticles(player.x, player.y, 10, '#FF0000');
                }
            }
            showNotification('🐛 Дебаг активирован!', '#32CD32');
        });
        
        // Мышь (для десктопов с сенсорными экранами)
        const addMouseControl = (button, action, endAction) => {
            button.addEventListener('mousedown', (e) => {
                if (!('ontouchstart' in window)) return;
                e.preventDefault();
                if (action) action();
                button.classList.add('active');
            });
            
            button.addEventListener('mouseup', (e) => {
                if (!('ontouchstart' in window)) return;
                e.preventDefault();
                if (endAction) endAction();
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', (e) => {
                if (!('ontouchstart' in window)) return;
                if (endAction) endAction();
                button.classList.remove('active');
            });
        };
        
        addMouseControl(leftBtn, () => player.moveLeft(), () => player.stop());
        addMouseControl(rightBtn, () => player.moveRight(), () => player.stop());
        addMouseControl(upBtn, () => player.jump());
        addMouseControl(actionBtn, () => player.superJump());
        
        // Показываем управление на мобильных
        if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            const controls = document.querySelector('.game-controls');
            if (controls) controls.style.display = 'flex';
        }
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🔄 Инициализация полной версии игры...');
        
        // Размер канваса
        function resizeCanvas() {
            const container = canvas.parentElement;
            const width = Math.min(1200, container.clientWidth - 40);
            const height = Math.min(700, window.innerHeight * 0.7);
            
            canvas.width = width;
            canvas.height = height;
            
            player.x = width / 2;
            player.y = height - 100;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // ==================== КНОПКИ МЕНЮ ====================
        document.getElementById('startGameBtn').addEventListener('click', function() {
            sounds.click.play();
            hideAllScreens();
            document.getElementById('modeScreen').classList.add('active');
        });
        
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                sounds.click.play();
                const mode = this.getAttribute('data-mode');
                startGame(mode);
            });
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            sounds.click.play();
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ ИГРЫ ====================
        document.getElementById('gamePauseBtn').addEventListener('click', pauseGame);
        
        document.getElementById('resumeBtn').addEventListener('click', function() {
            sounds.click.play();
            gamePaused = false;
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', function() {
            sounds.click.play();
            startGame(gameState.gameMode || GAME_MODES.CLASSIC);
        });
        
        document.getElementById('quitBtn').addEventListener('click', function() {
            sounds.click.play();
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            sounds.bgMusic.pause();
            
            const controls = document.querySelector('.game-controls');
            if (controls) controls.style.display = 'none';
        });
        
        document.getElementById('saveBtn').addEventListener('click', function() {
            sounds.click.play();
            saveGameState();
            showNotification('💾 Игра сохранена!', '#32CD32');
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', function() {
            sounds.click.play();
            startGame(gameState.gameMode || GAME_MODES.CLASSIC);
        });
        
        document.getElementById('menuBtn').addEventListener('click', function() {
            sounds.click.play();
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            sounds.bgMusic.pause();
            
            const controls = document.querySelector('.game-controls');
            if (controls) controls.style.display = 'none';
        });
        
        // ==================== КЛАВИАТУРА ====================
        document.addEventListener('keydown', function(e) {
            if (!gameRunning || gamePaused) return;
            
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                    player.moveLeft();
                    break;
                    
                case 'arrowright':
                case 'd':
                    player.moveRight();
                    break;
                    
                case 'arrowup':
                case 'w':
                case ' ':
                    player.jump();
                    e.preventDefault();
                    break;
                    
                case 's':
                    player.superJump();
                    break;
                    
                case 'escape':
                    pauseGame();
                    break;
                    
                case '1':
                    activateCheat('DIPSIK2024');
                    break;
                    
                case '2':
                    activateCheat('SNOWMAGIC');
                    break;
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (!gameRunning || gamePaused) return;
            
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                case 'a':
                case 'arrowright':
                case 'd':
                    player.stop();
                    break;
            }
        });
        
        // ==================== ЧИТ-КОДЫ ====================
        document.getElementById('cheatBtn').addEventListener('click', function() {
            const code = document.getElementById('cheatInput').value.toUpperCase();
            if (activateCheat(code)) {
                document.getElementById('cheatInput').value = '';
                sounds.collect.play();
            } else {
                showNotification('❌ Неверный чит-код!', '#B22222');
                sounds.hurt.play();
            }
        });
        
        document.getElementById('cheatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('cheatBtn').click();
            }
        });
        
        // ==================== ПАСХАЛЬНЫЕ КНОПКИ ====================
        document.getElementById('howToPlayBtn').addEventListener('click', function() {
            sounds.click.play();
            document.getElementById('easterMessage').innerHTML = '🎮 <b>ПОЛНОЕ РУКОВОДСТВО:</b><br><br>' +
                                     '<b>Управление:</b><br>' +
                                     '← → / A/D - движение<br>' +
                                     'SPACE / ↑ / W - прыжок<br>' +
                                     'S - супер-прыжок<br>' +
                                     'ESC - пауза<br><br>' +
                                     '<b>Объекты:</b><br>' +
                                     '🎁 Подарки: +100 очков<br>' +
                                     '🐛 Баги: -1 жизнь<br>' +
                                     '❄️ Снежинки: +1 жизнь<br>' +
                                     '💻 Код: +500 очков<br>' +
                                     '⚡ Пауэр-апы: особые способности<br><br>' +
                                     '<b>Уровни:</b><br>' +
                                     'Каждые 5 подарков = новый уровень<br>' +
                                     'Выше уровень = выше сложность';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', function() {
            sounds.click.play();
            document.getElementById('easterMessage').innerHTML = '⚙️ <b>НАСТРОЙКИ</b><br><br>' +
                                     'Звук: ВКЛ (громкость 30%)<br>' +
                                     'Музыка: ВКЛ (новогодняя)<br>' +
                                     'Сложность: АВТО (растёт с уровнем)<br>' +
                                     'Управление: КЛАВИАТУРА + ТАЧСКРИН<br>' +
                                     'Графика: ВЫСОКАЯ (частицы + анимации)<br><br>' +
                                     '<b>Чит-коды:</b> DIPSIK2024, SNOWMAGIC<br>INVINCIBLE, SUPERJUMP, GODMODE';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('creditsBtn').addEventListener('click', function() {
            sounds.click.play();
            document.getElementById('easterMessage').innerHTML = '👨‍💻 <b>АВТОРЫ И БЛАГОДАРНОСТИ</b><br><br>' +
                                     '<b>Главный герой:</b> DIPSIK<br>' +
                                     '<b>Дизайн и программирование:</b> AI Assistant<br>' +
                                     '<b>Музыка:</b> Mixkit.co<br>' +
                                     '<b>Звуки:</b> Mixkit.co<br>' +
                                     '<b>Шрифты:</b> Google Fonts<br>' +
                                     '<b>Иконки:</b> Font Awesome<br><br>' +
                                     '🎄 С Новым Годом и счастливого кодирования!<br>' +
                                     '🎮 Удачи в игре!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('closeEasterBtn').addEventListener('click', function() {
            sounds.click.play();
            document.getElementById('easterEgg').style.display = 'none';
        });
        
        // ==================== ПОДЕЛИТЬСЯ ====================
        document.getElementById('shareTelegramBtn').addEventListener('click', function() {
            const text = `🎮 Я набрал ${gameState.score} очков в игре DIPSIK: Новогодний Квест! Попробуй и ты!`;
            const url = window.location.href;
            window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        });
        
        document.getElementById('shareWhatsappBtn').addEventListener('click', function() {
            const text = `🎮 Я набрал ${gameState.score} очков в игре DIPSIK: Новогодний Квест! Попробуй и ты! ${window.location.href}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });
        
        // ==================== СЕКРЕТНЫЙ КОД ====================
        let secretCode = '';
        document.addEventListener('keypress', function(e) {
            secretCode += e.key.toUpperCase();
            if (secretCode.length > 10) secretCode = secretCode.slice(1);
            
            if (secretCode.includes('DIPSIK')) {
                document.getElementById('codeDisplay').textContent = '🎄 СЕКРЕТ АКТИВИРОВАН!';
                setTimeout(() => {
                    document.getElementById('codeDisplay').textContent = '🎄 CODE: 2024';
                }, 2000);
                secretCode = '';
            }
        });
        
        // ==================== МОБИЛЬНОЕ УПРАВЛЕНИЕ ====================
        setupMobileControls();
        
        // ==================== ЗАГРУЗКА СОХРАНЕНИЙ ====================
        saveGameState();
        
        // ==================== АВТОПРОИГРЫВАНИЕ МУЗЫКИ ====================
        setTimeout(() => {
            sounds.bgMusic.play().catch(e => {
                console.log('Автовоспроизведение музыки заблокировано. Нажмите на экран для запуска.');
                // Ждём первого взаимодействия
                document.addEventListener('click', function startMusic() {
                    sounds.bgMusic.play();
                    document.removeEventListener('click', startMusic);
                }, { once: true });
            });
        }, 1000);
        
        console.log('✅ Полная версия игры готова!');
        console.log('🎮 Режимы:', Object.keys(GAME_MODES));
        console.log('🎵 Звуки загружены');
        console.log('📱 Мобильное управление настроено');
        console.log('💾 Сохранения загружены');
    }
    
    // Запуск инициализации
    setTimeout(init, 500);
});
