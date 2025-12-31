// ============================================
// DIPSIK: НОВОГОДНИЙ КВЕСТ - ПОЛНЫЙ КОД СО ВСЕМ ФУНКЦИОНАЛОМ
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
        1: { name: 'НОВИЧОК', color: "#32CD32", giftSpeed: 2, bugSpeed: 3, bugSpawnRate: 0.2, giftSpawnRate: 0.8, snowflakeChance: 0.05 },
        2: { name: 'УЧЕНИК', color: "#7CFC00", giftSpeed: 2.5, bugSpeed: 3.5, bugSpawnRate: 0.25, giftSpawnRate: 0.75, snowflakeChance: 0.06 },
        3: { name: 'ОПЫТНЫЙ', color: "#FFD700", giftSpeed: 3, bugSpeed: 4, bugSpawnRate: 0.3, giftSpawnRate: 0.7, snowflakeChance: 0.07 },
        4: { name: 'ПРОФИ', color: "#FF8C00", giftSpeed: 3.5, bugSpeed: 4.5, bugSpawnRate: 0.35, giftSpawnRate: 0.65, snowflakeChance: 0.08 },
        5: { name: 'МАСТЕР', color: "#FF4500", giftSpeed: 4, bugSpeed: 5, bugSpawnRate: 0.4, giftSpawnRate: 0.6, snowflakeChance: 0.09 },
        6: { name: 'ЭКСПЕРТ', color: "#DC143C", giftSpeed: 4.5, bugSpeed: 5.5, bugSpawnRate: 0.45, giftSpawnRate: 0.55, snowflakeChance: 0.1 },
        7: { name: 'ГУРУ', color: "#8B0000", giftSpeed: 5, bugSpeed: 6, bugSpawnRate: 0.5, giftSpawnRate: 0.5, snowflakeChance: 0.11 },
        8: { name: 'ЛЕГЕНДА', color: "#4B0082", giftSpeed: 5.5, bugSpeed: 6.5, bugSpawnRate: 0.55, giftSpawnRate: 0.45, snowflakeChance: 0.12 },
        9: { name: 'БОГ КОДА', color: "#9400D3", giftSpeed: 6, bugSpeed: 7, bugSpawnRate: 0.6, giftSpawnRate: 0.4, snowflakeChance: 0.13 },
        10: { name: 'НЕВОЗМОЖНО', color: "#000000", giftSpeed: 7, bugSpeed: 8, bugSpawnRate: 0.7, giftSpawnRate: 0.3, snowflakeChance: 0.15 }
    };
    
    let gameRunning = false;
    let gamePaused = false;
    let gameLoopId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let gameTime = 0;
    let snowstormActive = false;
    let snowstormTimer = 0;
    let currentDifficulty = DIFFICULTY[1];
    
    // ==================== ИГРОВОЕ СОСТОЯНИЕ ====================
    const gameState = {
        score: 0,
        lives: 3,
        gifts: 0,
        level: 1,
        difficulty: 1,
        bugsDestroyed: 0,
        gameMode: GAME_MODES.CLASSIC,
        highScore: parseInt(localStorage.getItem('dipsikHighScore')) || 0,
        totalGames: parseInt(localStorage.getItem('dipsikTotalGames')) || 0,
        linesCollected: parseInt(localStorage.getItem('dipsikLinesCollected')) || 0
    };
    
    // ==================== ЗВУКИ ====================
    const sounds = {
        jump: new Audio('assets/sounds/jump.mp3'),
        collect: new Audio('assets/sounds/collect.mp3'),
        hurt: new Audio('assets/sounds/hurt.mp3'),
        victory: new Audio('assets/sounds/victory.mp3'),
        bgMusic: new Audio('assets/sounds/bg_music.mp3'),
        snowstorm: new Audio('assets/sounds/dfng.mp3'),
        click: new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ')
    };
    
    // Заглушка для звука клика (если файла нет)
    sounds.click.volume = 0.3;
    
    // Настройка звуков
    Object.keys(sounds).forEach(key => {
        if (key !== 'click') {
            sounds[key].volume = 0.5;
            sounds[key].preload = 'auto';
        }
    });
    sounds.bgMusic.volume = 0.3;
    sounds.bgMusic.loop = true;
    sounds.snowstorm.volume = 0.2;
    sounds.snowstorm.loop = true;
    
    // Функция безопасного воспроизведения звука
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Звук не воспроизводится:', e));
    }
    
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
        isMovingLeft: false,
        isMovingRight: false,
        canJump: true,
        speedY: 0,
        isInvincible: false,
        isHurt: false,
        hurtTimer: 0,
        
        draw() {
            // Отражение при движении влево
            if (this.isMovingLeft && !this.isMovingRight) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-this.x * 2, 0);
            }
            
            // Тело игрока
            ctx.fillStyle = this.isHurt ? '#ff4444' : '#00ffff';
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
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px "Mountains of Christmas", Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DIPSIK', this.x, this.y + 30);
            
            // Эффект неуязвимости
            if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                ctx.globalAlpha = 1;
            }
            
            if (this.isMovingLeft && !this.isMovingRight) {
                ctx.restore();
            }
        },
        
        update() {
            if (this.isMovingLeft) this.x -= this.speed;
            if (this.isMovingRight) this.x += this.speed;
            
            this.speedY += 0.5;
            this.y += this.speedY;
            
            if (this.x - this.width/2 < 0) this.x = this.width/2;
            if (this.x + this.width/2 > canvas.width) this.x = canvas.width - this.width/2;
            
            if (this.y + this.height/2 > canvas.height - 50) {
                this.y = canvas.height - 50 - this.height/2;
                this.speedY = 0;
                this.canJump = true;
            }
            
            if (this.isHurt) {
                this.hurtTimer--;
                if (this.hurtTimer <= 0) this.isHurt = false;
            }
        },
        
        jump() {
            if (this.canJump) {
                this.speedY = -15;
                this.canJump = false;
                playSound(sounds.jump);
            }
        },
        
        superJump() {
            if (this.canJump) {
                this.speedY = -25;
                this.canJump = false;
                playSound(sounds.jump);
            }
        },
        
        moveLeft() {
            this.isMovingLeft = true;
            this.isMovingRight = false;
        },
        
        moveRight() {
            this.isMovingRight = true;
            this.isMovingLeft = false;
        },
        
        stop() {
            this.isMovingLeft = false;
            this.isMovingRight = false;
        },
        
        takeDamage() {
            if (this.isInvincible) return false;
            
            this.isInvincible = true;
            this.isHurt = true;
            this.hurtTimer = 60;
            
            playSound(sounds.hurt);
            
            setTimeout(() => {
                this.isInvincible = false;
                this.isHurt = false;
            }, 2000);
            
            return true;
        }
    };
    
    // ==================== ОБЪЕКТЫ ИГРЫ ====================
    const fallingObjects = [];
    const particles = [];
    const snowParticles = [];
    
    function createGift() {
        const difficulty = DIFFICULTY[gameState.difficulty];
        fallingObjects.push({
            type: 'gift',
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 50,
            height: 50,
            speed: difficulty.giftSpeed + Math.random() * 1,
            color: `hsl(${Math.floor(Math.random() * 60) + 100}, 100%, 50%)`,
            collected: false,
            
            draw() {
                if (this.collected) return;
                
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x - this.width/2, this.y - 5, this.width, 10);
                ctx.fillRect(this.x - 5, this.y - this.height/2, 10, this.height);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🎁', this.x, this.y);
            },
            
            update() {
                this.y += this.speed;
                return this.y > canvas.height + 30;
            }
        });
    }
    
    function createBug() {
        const difficulty = DIFFICULTY[gameState.difficulty];
        fallingObjects.push({
            type: 'bug',
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 45,
            height: 45,
            speed: difficulty.bugSpeed + Math.random() * 1,
            color: '#B22222',
            collected: false,
            
            draw() {
                if (this.collected) return;
                
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(this.x - 8, this.y - 8, 4, 0, Math.PI * 2);
                ctx.arc(this.x + 8, this.y - 8, 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(this.x - 8, this.y - 8, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 8, this.y - 8, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('BUG', this.x, this.y + 5);
            },
            
            update() {
                this.y += this.speed;
                return this.y > canvas.height + 30;
            }
        });
    }
    
    function createSnowflake() {
        fallingObjects.push({
            type: 'snowflake',
            x: Math.random() * (canvas.width - 30) + 15,
            y: -40,
            width: 35,
            height: 35,
            speed: 8 + Math.random() * 4,
            collected: false,
            
            draw() {
                if (this.collected) return;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Date.now() / 100);
                ctx.strokeStyle = '#00aaff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(15, 0);
                    ctx.stroke();
                }
                ctx.restore();
                
                ctx.fillStyle = '#00aaff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('❄️', this.x, this.y);
            },
            
            update() {
                this.y += this.speed;
                this.x += Math.sin(Date.now() / 200 + this.y / 50) * 2;
                return this.y > canvas.height + 40;
            }
        });
    }
    
    function createParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: Math.random() * 5 + 3,
                speedX: Math.random() * 8 - 4,
                speedY: Math.random() * 8 - 4,
                color: color,
                life: 40
            });
        }
    }
    
    function createSnowParticles(count = 100) {
        for (let i = 0; i < count; i++) {
            snowParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 8 + 4,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 3 + 1,
                life: 100,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: Math.random() * 0.1 - 0.05
            });
        }
    }
    
    function activateSnowstorm() {
        snowstormActive = true;
        snowstormTimer = 300;
        
        createSnowParticles(200);
        
        playSound(sounds.snowstorm);
        
        const snowNotification = document.getElementById('snowNotification') || document.createElement('div');
        snowNotification.id = 'snowNotification';
        snowNotification.textContent = '❄️ СНЕГОПАД! +1 жизнь!';
        snowNotification.style.cssText = `
            position: fixed;
            top: 200px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 150, 255, 0.2);
            border: 2px solid #00aaff;
            color: #00aaff;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            display: block;
            z-index: 1000;
            animation: fadeUp 1s forwards;
            font-family: 'Mountains of Christmas', cursive;
        `;
        document.body.appendChild(snowNotification);
        
        setTimeout(() => {
            if (snowNotification.parentNode) {
                snowNotification.style.animation = 'fadeOut 0.5s forwards';
                setTimeout(() => snowNotification.remove(), 500);
            }
        }, 2000);
        
        if (gameState.lives < 5) {
            gameState.lives++;
            updateHearts();
        }
    }
    
    // ==================== СИСТЕМА СЛОЖНОСТИ ====================
    function updateDifficulty() {
        let newDifficulty = Math.min(Math.floor(gameState.level / 2) + 1, 10);
        
        if (gameState.gifts > 20) newDifficulty = Math.min(newDifficulty + 1, 10);
        if (gameState.gifts > 50) newDifficulty = Math.min(newDifficulty + 1, 10);
        
        if (newDifficulty > gameState.difficulty) {
            gameState.difficulty = newDifficulty;
            currentDifficulty = DIFFICULTY[gameState.difficulty];
            updateDifficultyDisplay();
        }
    }
    
    function updateDifficultyDisplay() {
        const difficulty = currentDifficulty;
        const difficultyLevel = document.getElementById('difficultyLevel');
        if (difficultyLevel) {
            difficultyLevel.textContent = difficulty.name;
            difficultyLevel.style.color = difficulty.color;
        }
        
        const pauseDifficulty = document.getElementById('pauseDifficulty');
        if (pauseDifficulty) {
            pauseDifficulty.textContent = difficulty.name;
            pauseDifficulty.style.color = difficulty.color;
        }
        
        const finalDifficulty = document.getElementById('finalDifficulty');
        if (finalDifficulty) {
            finalDifficulty.textContent = difficulty.name;
            finalDifficulty.style.color = difficulty.color;
        }
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function updateGame(timestamp) {
        if (!gameRunning || gamePaused) return;
        
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        gameTime += deltaTime / 1000;
        
        // Фон
        ctx.fillStyle = snowstormActive ? '#1a3d4a' : '#0a2a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёзды
        ctx.fillStyle = snowstormActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % canvas.width;
            const y = (i * 23) % canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        player.update();
        player.draw();
        
        updateDifficulty();
        
        // Спавн объектов
        spawnTimer += deltaTime;
        const difficulty = currentDifficulty;
        
        if (spawnTimer > 800) {
            if (Math.random() < difficulty.giftSpawnRate) createGift();
            if (Math.random() < difficulty.bugSpawnRate) createBug();
            if (Math.random() < difficulty.snowflakeChance) createSnowflake();
            spawnTimer = 0;
        }
        
        // Обновление объектов
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];
            
            if (obj.update()) {
                fallingObjects.splice(i, 1);
                continue;
            }
            
            obj.draw();
            
            if (!obj.collected) {
                const dx = player.x - obj.x;
                const dy = player.y - obj.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const collisionDistance = player.width/2 + obj.width/2;
                
                if (distance < collisionDistance) {
                    obj.collected = true;
                    
                    if (obj.type === 'gift') {
                        gameState.score += 100;
                        gameState.gifts++;
                        playSound(sounds.collect);
                        createParticles(obj.x, obj.y, obj.color, 20);
                        
                        updateLevelProgress();
                        
                        if (gameState.gifts % 5 === 0) {
                            gameState.level++;
                            playSound(sounds.victory);
                            showNotification(`🎮 Уровень ${gameState.level}!`, '#FFD700');
                        }
                    } else if (obj.type === 'bug') {
                        if (player.takeDamage()) {
                            gameState.lives--;
                            createParticles(obj.x, obj.y, obj.color, 25);
                            updateHearts();
                            
                            if (gameState.lives <= 0) {
                                setTimeout(gameOver, 500);
                                return;
                            }
                        }
                        gameState.bugsDestroyed++;
                    } else if (obj.type === 'snowflake') {
                        activateSnowstorm();
                        playSound(sounds.collect);
                        createParticles(obj.x, obj.y, '#00aaff', 30);
                    }
                    
                    fallingObjects.splice(i, 1);
                    updateHUD();
                }
            }
        }
        
        // Частицы
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Снегопад
        if (snowstormActive) {
            snowstormTimer--;
            
            for (let i = snowParticles.length - 1; i >= 0; i--) {
                const s = snowParticles[i];
                s.x += s.speedX;
                s.y += s.speedY;
                s.rotation += s.rotationSpeed;
                
                if (s.y > canvas.height) {
                    s.y = -10;
                    s.x = Math.random() * canvas.width;
                }
                
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rotation);
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#ffffff';
                
                for (let j = 0; j < 6; j++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(s.size/2, 0);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.restore();
            }
            
            if (Math.random() < 0.3) {
                snowParticles.push({
                    x: Math.random() * canvas.width,
                    y: -10,
                    size: Math.random() * 6 + 3,
                    speedX: Math.random() * 2 - 1,
                    speedY: Math.random() * 2 + 1,
                    life: 100,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: Math.random() * 0.1 - 0.05
                });
            }
            
            if (snowstormTimer <= 0) {
                snowstormActive = false;
                sounds.snowstorm.pause();
                sounds.snowstorm.currentTime = 0;
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Пол
        const gradient = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
        gradient.addColorStop(0, snowstormActive ? '#3a5a6a' : '#2a4a3a');
        gradient.addColorStop(1, snowstormActive ? '#2a4a5a' : '#1a3a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 3);
        
        // Таймер
        updateGameTimer();
        
        gameLoopId = requestAnimationFrame(updateGame);
    }
    
    // ==================== ИНТЕРФЕЙС ====================
    function updateHUD() {
        const scoreValue = document.getElementById('scoreValue');
        const giftsCount = document.getElementById('giftsCount');
        const gameLevel = document.getElementById('gameLevel');
        
        if (scoreValue) scoreValue.textContent = String(gameState.score).padStart(6, '0');
        if (giftsCount) giftsCount.textContent = `${gameState.gifts}`;
        if (gameLevel) gameLevel.textContent = gameState.level;
        
        updateProgress();
    }
    
    function updateHearts() {
        const heartsContainer = document.getElementById('heartsContainer');
        if (!heartsContainer) return;
        
        let heartsHTML = '';
        const maxLives = 5;
        for (let i = 0; i < maxLives; i++) {
            heartsHTML += `<i class="fas fa-heart ${i >= gameState.lives ? 'lost' : ''}"></i>`;
        }
        heartsContainer.innerHTML = heartsHTML;
    }
    
    function updateLevelProgress() {
        const progressText = document.getElementById('progressText');
        const levelProgressFill = document.getElementById('levelProgressFill');
        if (!progressText || !levelProgressFill) return;
        
        const giftsForNextLevel = 5;
        const progress = (gameState.gifts % giftsForNextLevel) / giftsForNextLevel * 100;
        
        progressText.textContent = `${gameState.gifts % giftsForNextLevel}/${giftsForNextLevel} подарков`;
        levelProgressFill.style.width = `${progress}%`;
    }
    
    function updateGameTimer() {
        if (gameState.gameMode === GAME_MODES.TIME) {
            const timeLeft = Math.max(0, 60000 - gameTime * 1000);
            const seconds = Math.ceil(timeLeft / 1000);
            document.getElementById('timeValue').textContent = seconds;
        } else {
            const seconds = Math.floor(gameTime);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            document.getElementById('timeValue').textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    function updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const seasonMessage = document.getElementById('seasonMessage');
        if (!progressFill || !progressPercent || !seasonMessage) return;
        
        const maxScore = 10000;
        const progress = Math.min((gameState.score / maxScore) * 100, 100);
        
        progressFill.style.width = `${progress}%`;
        progressPercent.textContent = `${progress.toFixed(1)}%`;
        
        const messages = [
            "🎄 Начинаем новогоднее кодирование!",
            "🎁 Собрано несколько подарков!",
            "⭐ Половина пути пройдена!",
            "🏆 Почти у цели!",
            "🎉 С Новым Годом! Ты чемпион!"
        ];
        const msgIndex = Math.floor(progress / 20);
        seasonMessage.textContent = messages[Math.min(msgIndex, messages.length - 1)];
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
    
    // ==================== МОБИЛЬНОЕ УПРАВЛЕНИЕ ====================
    function createMobileControls() {
        if (document.getElementById('mobileCompactControls')) return;
        
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobileCompactControls';
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 999;
        `;
        
        // Кнопка влево
        const leftBtn = document.createElement('button');
        leftBtn.innerHTML = '←';
        leftBtn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(45deg, #228B22, #32CD32);
            border: 2px solid #FFD700;
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        leftBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            player.moveLeft();
            leftBtn.style.transform = 'scale(0.9)';
        });
        leftBtn.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            player.stop();
            leftBtn.style.transform = 'scale(1)';
        });
        leftBtn.addEventListener('touchcancel', (e) => { 
            e.preventDefault(); 
            player.stop();
            leftBtn.style.transform = 'scale(1)';
        });
        
        // Кнопка прыжка
        const jumpBtn = document.createElement('button');
        jumpBtn.innerHTML = '↑';
        jumpBtn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(45deg, #1E90FF, #00BFFF);
            border: 2px solid #FFD700;
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        jumpBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            player.jump();
            jumpBtn.style.transform = 'scale(0.9)';
        });
        jumpBtn.addEventListener('touchend', (e) => { 
            e.preventDefault();
            jumpBtn.style.transform = 'scale(1)';
        });
        
        // Кнопка вправо
        const rightBtn = document.createElement('button');
        rightBtn.innerHTML = '→';
        rightBtn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(45deg, #228B22, #32CD32);
            border: 2px solid #FFD700;
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        rightBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            player.moveRight();
            rightBtn.style.transform = 'scale(0.9)';
        });
        rightBtn.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            player.stop();
            rightBtn.style.transform = 'scale(1)';
        });
        rightBtn.addEventListener('touchcancel', (e) => { 
            e.preventDefault(); 
            player.stop();
            rightBtn.style.transform = 'scale(1)';
        });
        
        // Кнопка супер-прыжка
        const superBtn = document.createElement('button');
        superBtn.innerHTML = '⚡';
        superBtn.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: 2px solid #FF8C00;
            color: #B22222;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        superBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            player.superJump();
            superBtn.style.transform = 'scale(0.9)';
        });
        superBtn.addEventListener('touchend', (e) => { 
            e.preventDefault();
            superBtn.style.transform = 'scale(1)';
        });
        
        controlsContainer.appendChild(leftBtn);
        controlsContainer.appendChild(jumpBtn);
        controlsContainer.appendChild(rightBtn);
        controlsContainer.appendChild(superBtn);
        document.body.appendChild(controlsContainer);
        
        console.log('📱 Мобильное управление создано');
    }
    
    function removeMobileControls() {
        const controls = document.getElementById('mobileCompactControls');
        if (controls) {
            controls.remove();
            console.log('📱 Мобильное управление удалено');
        }
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startGame(mode) {
        console.log('🚀 Запуск игры в режиме:', mode);
        
        // Сброс состояния
        gameState.score = 0;
        gameState.lives = 3;
        gameState.gifts = 0;
        gameState.level = 1;
        gameState.difficulty = 1;
        gameState.bugsDestroyed = 0;
        gameState.gameMode = mode;
        gameTime = 0;
        
        fallingObjects.length = 0;
        particles.length = 0;
        snowParticles.length = 0;
        snowstormActive = false;
        sounds.snowstorm.pause();
        sounds.snowstorm.currentTime = 0;
        
        // Сброс игрока
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.speedY = 0;
        player.canJump = true;
        player.isInvincible = false;
        player.isHurt = false;
        player.isMovingLeft = false;
        player.isMovingRight = false;
        
        // Настройка интерфейса
        const modeNames = {
            'classic': 'КЛАССИКА',
            'time': 'НА ВРЕМЯ',
            'code': 'КОД-БАТТЛ',
            'survival': 'ВЫЖИВАНИЕ'
        };
        const gameModeText = document.getElementById('gameMode');
        if (gameModeText) gameModeText.textContent = modeNames[mode] || 'КЛАССИКА';
        
        updateDifficulty();
        updateHUD();
        updateHearts();
        updateLevelProgress();
        
        // Музыка
        sounds.bgMusic.currentTime = 0;
        sounds.bgMusic.play().catch(e => console.log('Фоновая музыка:', e));
        
        // Переключение экранов
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        
        // Прогресс-бар уровня
        const levelProgress = document.getElementById('levelProgress');
        if (levelProgress) levelProgress.style.display = 'block';
        
        // Запуск игры
        gameRunning = true;
        gamePaused = false;
        lastTime = 0;
        spawnTimer = 0;
        
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(updateGame);
        
        // Мобильное управление
        if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            createMobileControls();
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) gameControls.style.display = 'flex';
        }
        
        // Статистика
        gameState.totalGames++;
        saveGameState();
    }
    
    function pauseGame() {
        gamePaused = !gamePaused;
        playSound(sounds.click);
        
        if (gamePaused) {
            // Обновляем статистику в паузе
            const pauseGifts = document.getElementById('pauseGifts');
            const pauseBugs = document.getElementById('pauseBugs');
            const pauseTime = document.getElementById('pauseTime');
            const pauseAccuracy = document.getElementById('pauseAccuracy');
            
            if (pauseGifts) pauseGifts.textContent = gameState.gifts;
            if (pauseBugs) pauseBugs.textContent = gameState.bugsDestroyed;
            if (pauseTime) pauseTime.textContent = formatTime(gameTime);
            
            const totalObjects = gameState.gifts + gameState.bugsDestroyed;
            const accuracy = totalObjects > 0 ? Math.round((gameState.gifts / totalObjects) * 100) : 100;
            if (pauseAccuracy) pauseAccuracy.textContent = `${accuracy}%`;
            
            document.getElementById('pauseScreen').classList.add('active');
            sounds.bgMusic.pause();
            if (snowstormActive) sounds.snowstorm.pause();
        } else {
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                sounds.bgMusic.play();
                if (snowstormActive) sounds.snowstorm.play();
            }
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function gameOver() {
        gameRunning = false;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        
        sounds.bgMusic.pause();
        sounds.bgMusic.currentTime = 0;
        sounds.snowstorm.pause();
        sounds.snowstorm.currentTime = 0;
        
        // Сохранение рекордов
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('dipsikHighScore', gameState.highScore);
        }
        
        gameState.linesCollected += gameState.gifts;
        saveGameState();
        
        showGameOverScreen(gameState.lives <= 0);
    }
    
    function showGameOverScreen(isDefeat) {
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalLevel').textContent = gameState.level;
        document.getElementById('finalGifts').textContent = gameState.gifts;
        document.getElementById('finalLives').textContent = gameState.lives;
        
        if (isDefeat) {
            document.getElementById('gameOverTitle').textContent = 'ИГРА ОКОНЧЕНА! 💀';
            document.getElementById('resultIcon').innerHTML = '<i class="fas fa-skull-crossbones" style="font-size: 4rem; color: #B22222;"></i>';
            playSound(sounds.hurt);
        } else {
            document.getElementById('gameOverTitle').textContent = 'ПОБЕДА! 🏆';
            document.getElementById('resultIcon').innerHTML = '<i class="fas fa-trophy" style="font-size: 4rem; color: #FFD700;"></i>';
            playSound(sounds.victory);
        }
        
        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        
        // Обновляем кнопки поделиться
        updateShareButtons();
        
        // Скрываем мобильное управление
        removeMobileControls();
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) gameControls.style.display = 'none';
    }
    
    // ==================== ФУНКЦИИ ДЛЯ СОЦИАЛЬНЫХ КНОПОК ====================
    function updateShareButtons() {
        // Эти данные будут использоваться в кнопках поделиться
        const shareData = {
            gifts: gameState.gifts,
            bugs: gameState.bugsDestroyed,
            score: gameState.score,
            level: gameState.level,
            difficulty: currentDifficulty.name,
            url: 'https://deepseekforever.github.io/game/'
        };
        
        // Сохраняем данные для кнопок
        window.shareData = shareData;
    }
    
    function shareToTelegram() {
        const data = window.shareData || {
            gifts: gameState.gifts,
            bugs: gameState.bugsDestroyed,
            score: gameState.score,
            level: gameState.level,
            difficulty: currentDifficulty.name,
            url: 'https://deepseekforever.github.io/game/'
        };
        
        const message = `🎮 Я поиграл в DIPSIK: НОВОГОДНИЙ КВЕСТ! 🎄\n\n✨ Собрано подарков: ${data.gifts} 🎁\n🐛 Уничтожено багов: ${data.bugs}\n🏆 Очки: ${data.score}\n📈 Уровень: ${data.level}\n🔥 Сложность: ${data.difficulty}\n\n🎄 Поиграть можно тут: ${data.url}\n\n#DeepSeekНГ #НовогодняяИгра #DIPSIK`;
        
        const encodedMessage = encodeURIComponent(message);
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodedMessage}`;
        
        window.open(shareUrl, '_blank', 'width=600,height=500');
    }
    
    function shareToWhatsApp() {
        const data = window.shareData || {
            gifts: gameState.gifts,
            bugs: gameState.bugsDestroyed,
            score: gameState.score,
            level: gameState.level,
            difficulty: currentDifficulty.name,
            url: 'https://deepseekforever.github.io/game/'
        };
        
        const message = `🎮 Я поиграл в DIPSIK: НОВОГОДНИЙ КВЕСТ! 🎄\n\n✨ Собрано подарков: ${data.gifts} 🎁\n🐛 Уничтожено багов: ${data.bugs}\n🏆 Очки: ${data.score}\n📈 Уровень: ${data.level}\n🔥 Сложность: ${data.difficulty}\n\n🎄 Поиграть можно тут: ${data.url}\n\n#DeepSeekНГ #НовогодняяИгра #DIPSIK`;
        
        const encodedMessage = encodeURIComponent(message);
        const shareUrl = `https://wa.me/?text=${encodedMessage}`;
        
        window.open(shareUrl, '_blank');
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    function saveGameState() {
        localStorage.setItem('dipsikHighScore', gameState.highScore);
        localStorage.setItem('dipsikTotalGames', gameState.totalGames);
        localStorage.setItem('dipsikLinesCollected', gameState.linesCollected);
        
        // Обновляем меню
        document.getElementById('bestScore').textContent = gameState.highScore;
        document.getElementById('totalGames').textContent = gameState.totalGames;
        document.getElementById('linesCollected').textContent = gameState.linesCollected;
        
        // Прогресс сезона
        updateProgress();
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
            playSound(sounds.click);
            hideAllScreens();
            document.getElementById('modeScreen').classList.add('active');
        });
        
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                playSound(sounds.click);
                const mode = this.getAttribute('data-mode');
                startGame(mode);
            });
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            playSound(sounds.click);
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ ИГРЫ ====================
        document.getElementById('gamePauseBtn').addEventListener('click', pauseGame);
        
        document.getElementById('resumeBtn').addEventListener('click', function() {
            playSound(sounds.click);
            gamePaused = false;
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                sounds.bgMusic.play();
                if (snowstormActive) sounds.snowstorm.play();
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', function() {
            playSound(sounds.click);
            startGame(gameState.gameMode || GAME_MODES.CLASSIC);
        });
        
        document.getElementById('quitBtn').addEventListener('click', function() {
            playSound(sounds.click);
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            sounds.bgMusic.pause();
            sounds.bgMusic.currentTime = 0;
            sounds.snowstorm.pause();
            sounds.snowstorm.currentTime = 0;
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            removeMobileControls();
        });
        
        document.getElementById('saveBtn').addEventListener('click', function() {
            playSound(sounds.click);
            saveGameState();
            showNotification('💾 Игра сохранена!', '#32CD32');
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', function() {
            playSound(sounds.click);
            startGame(gameState.gameMode || GAME_MODES.CLASSIC);
        });
        
        document.getElementById('menuBtn').addEventListener('click', function() {
            playSound(sounds.click);
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            sounds.bgMusic.pause();
            sounds.bgMusic.currentTime = 0;
            removeMobileControls();
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
                    
                case 'e':
                    // Удалить все баги (чит)
                    let destroyed = 0;
                    for (let i = fallingObjects.length - 1; i >= 0; i--) {
                        if (fallingObjects[i].type === 'bug') {
                            createParticles(fallingObjects[i].x, fallingObjects[i].y, fallingObjects[i].color, 15);
                            fallingObjects.splice(i, 1);
                            destroyed++;
                            gameState.bugsDestroyed++;
                        }
                    }
                    if (destroyed > 0) {
                        playSound(sounds.collect);
                        showNotification(`🐛 Удалено ${destroyed} багов!`, '#32CD32');
                    }
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
        
        // ==================== МОБИЛЬНЫЕ КНОПКИ УПРАВЛЕНИЯ ====================
        const moveLeftBtn = document.getElementById('moveLeftBtn');
        const moveRightBtn = document.getElementById('moveRightBtn');
        const moveUpBtn = document.getElementById('moveUpBtn');
        const actionBtn = document.getElementById('actionBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        if (moveLeftBtn) {
            moveLeftBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveLeft();
                this.classList.add('active');
            });
            
            moveLeftBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
                this.classList.remove('active');
            });
        }
        
        if (moveRightBtn) {
            moveRightBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveRight();
                this.classList.add('active');
            });
            
            moveRightBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
                this.classList.remove('active');
            });
        }
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.jump();
                this.classList.add('active');
            });
            
            moveUpBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.classList.remove('active');
            });
        }
        
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.superJump();
                this.classList.add('active');
            });
            
            actionBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.classList.remove('active');
            });
        }
        
        if (specialBtn) {
            specialBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                // Удалить все баги
                let destroyed = 0;
                for (let i = fallingObjects.length - 1; i >= 0; i--) {
                    if (fallingObjects[i].type === 'bug') {
                        createParticles(fallingObjects[i].x, fallingObjects[i].y, fallingObjects[i].color, 15);
                        fallingObjects.splice(i, 1);
                        destroyed++;
                        gameState.bugsDestroyed++;
                    }
                }
                if (destroyed > 0) {
                    playSound(sounds.collect);
                    showNotification(`🐛 Удалено ${destroyed} багов!`, '#32CD32');
                }
                this.classList.add('active');
            });
            
            specialBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.classList.remove('active');
            });
        }
        
        // ==================== КНОПКИ ПОДЕЛИТЬСЯ ====================
        document.getElementById('shareTelegramBtn').addEventListener('click', shareToTelegram);
        document.getElementById('shareWhatsappBtn').addEventListener('click', shareToWhatsApp);
        
        // ==================== ЧИТ-КОДЫ ====================
        document.getElementById('cheatBtn').addEventListener('click', function() {
            const code = document.getElementById('cheatInput').value.toUpperCase();
            const cheats = {
                'DIPSIK2024': () => { 
                    gameState.score += 10000; 
                    updateHUD(); 
                    showNotification('🎅 +10000 очков!', '#FFD700'); 
                    playSound(sounds.victory);
                },
                'SNOWMAGIC': () => { 
                    activateSnowstorm(); 
                    playSound(sounds.victory);
                },
                'INVINCIBLE': () => { 
                    player.isInvincible = true; 
                    setTimeout(() => player.isInvincible = false, 10000); 
                    showNotification('🛡️ Бессмертие на 10 сек!', '#FFFF00'); 
                    playSound(sounds.victory);
                },
                'GIFTS': () => { 
                    for (let i = 0; i < 10; i++) createGift(); 
                    showNotification('🎁 +10 подарков!', '#32CD32'); 
                    playSound(sounds.victory);
                },
                'HEAL': () => { 
                    gameState.lives = 5; 
                    updateHearts(); 
                    showNotification('💖 +5 жизней!', '#FF69B4'); 
                    playSound(sounds.victory);
                },
                'LEVELUP': () => { 
                    gameState.level++; 
                    updateDifficultyDisplay(); 
                    updateHUD(); 
                    showNotification('⭐ Уровень повышен!', '#FFD700'); 
                    playSound(sounds.victory);
                }
            };
            
            if (cheats[code]) {
                cheats[code]();
                document.getElementById('cheatInput').value = '';
            } else {
                showNotification('❌ Неверный чит-код!', '#B22222');
                playSound(sounds.hurt);
            }
        });
        
        document.getElementById('cheatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('cheatBtn').click();
            }
        });
        
        // ==================== ПАСХАЛЬНЫЕ КНОПКИ ====================
        document.getElementById('howToPlayBtn').addEventListener('click', function() {
            playSound(sounds.click);
            document.getElementById('easterMessage').innerHTML = '🎮 <b>ПОЛНОЕ РУКОВОДСТВО:</b><br><br>' +
                                     '<b>Управление:</b><br>' +
                                     '← → / A/D - движение<br>' +
                                     'SPACE / ↑ / W - прыжок<br>' +
                                     'S - супер-прыжок<br>' +
                                     'E - удалить все баги<br>' +
                                     'ESC - пауза<br><br>' +
                                     '<b>Объекты:</b><br>' +
                                     '🎁 Подарки: +100 очков<br>' +
                                     '🐛 Баги: -1 жизнь<br>' +
                                     '❄️ Снежинки: снегопад!<br><br>' +
                                     '<b>Система уровней:</b><br>' +
                                     'Каждые 5 подарков = новый уровень<br>' +
                                     '10 уровней сложности';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', function() {
            playSound(sounds.click);
            document.getElementById('easterMessage').innerHTML = '⚙️ <b>НАСТРОЙКИ</b><br><br>' +
                                     'Звук: ВКЛ (громкость 50%)<br>' +
                                     'Музыка: ВКЛ (новогодняя)<br>' +
                                     'Сложность: АВТО (растёт с уровнем)<br>' +
                                     'Управление: КЛАВИАТУРА + ТАЧСКРИН<br>' +
                                     'Графика: ВЫСОКАЯ (частицы + анимации)<br><br>' +
                                     '<b>Чит-коды:</b><br>DIPSIK2024, SNOWMAGIC<br>INVINCIBLE, GIFTS, HEAL, LEVELUP';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('creditsBtn').addEventListener('click', function() {
            playSound(sounds.click);
            document.getElementById('easterMessage').innerHTML = '👨‍💻 <b>АВТОРЫ И БЛАГОДАРНОСТИ</b><br><br>' +
                                     '<b>Главный герой:</b> DIPSIK<br>' +
                                     '<b>Дизайн и программирование:</b> AI Assistant<br>' +
                                     '<b>Музыка и звуки:</b> Mixkit.co<br>' +
                                     '<b>Шрифты:</b> Google Fonts<br>' +
                                     '<b>Иконки:</b> Font Awesome<br><br>' +
                                     '🎄 С Новым Годом и счастливого кодирования!<br>' +
                                     '🎮 Удачи в игре!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('closeEasterBtn').addEventListener('click', function() {
            playSound(sounds.click);
            document.getElementById('easterEgg').style.display = 'none';
        });
        
        // ==================== ЗАГРУЗКА СОХРАНЕНИЙ ====================
        saveGameState();
        updateDifficultyDisplay();
        
        // ==================== АВТОПРОИГРЫВАНИЕ МУЗЫКИ ====================
        setTimeout(() => {
            sounds.bgMusic.play().catch(e => {
                console.log('Автовоспроизведение музыки заблокировано. Нажмите на экран для запуска.');
                document.addEventListener('click', function startMusic() {
                    sounds.bgMusic.play();
                    document.removeEventListener('click', startMusic);
                }, { once: true });
            });
        }, 1000);
        
        console.log('✅ Полная версия игры готова!');
        console.log('🎮 Режимы:', Object.keys(GAME_MODES));
        console.log('🎵 Звуки загружены из папки assets/sounds/');
        console.log('📱 Мобильное управление настроено');
        console.log('💾 Сохранения загружены');
        console.log('📱 Кнопки поделиться настроены');
    }
    
    // Запуск инициализации
    setTimeout(init, 500);
});
