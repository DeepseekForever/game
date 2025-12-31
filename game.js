// ============================================
// DIPSIK: НОВОГОДНИЙ КВЕСТ - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
// ============================================

// Ждём полной загрузки страницы
window.addEventListener('load', function() {
    console.log('🎮 DIPSIK: Игра загружается...');
    
    // ==================== ПЕРЕМЕННЫЕ ====================
    let gameRunning = false;
    let gamePaused = false;
    let gameLoopId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let snowstormActive = false;
    let snowstormTimer = 0;
    let gameTime = 0;
    
    const gameState = {
        score: 0,
        lives: 3,
        gifts: 0,
        level: 1,
        difficulty: 1,
        bugsDestroyed: 0,
        gameMode: 'classic',
        highScore: localStorage.getItem('dipsikHighScore') || 0,
        totalGames: parseInt(localStorage.getItem('dipsikTotalGames')) || 0,
        linesCollected: parseInt(localStorage.getItem('dipsikLinesCollected')) || 0
    };
    
    // ==================== СИСТЕМА СЛОЖНОСТИ ====================
    const difficultySettings = {
        1: { name: "НОВИЧОК", color: "#32CD32", giftSpeed: 2, bugSpeed: 3, bugSpawnRate: 0.2, giftSpawnRate: 0.8, snowflakeChance: 0.05 },
        2: { name: "УЧЕНИК", color: "#7CFC00", giftSpeed: 2.5, bugSpeed: 3.5, bugSpawnRate: 0.25, giftSpawnRate: 0.75, snowflakeChance: 0.06 },
        3: { name: "ОПЫТНЫЙ", color: "#FFD700", giftSpeed: 3, bugSpeed: 4, bugSpawnRate: 0.3, giftSpawnRate: 0.7, snowflakeChance: 0.07 },
        4: { name: "ПРОФИ", color: "#FF8C00", giftSpeed: 3.5, bugSpeed: 4.5, bugSpawnRate: 0.35, giftSpawnRate: 0.65, snowflakeChance: 0.08 },
        5: { name: "МАСТЕР", color: "#FF4500", giftSpeed: 4, bugSpeed: 5, bugSpawnRate: 0.4, giftSpawnRate: 0.6, snowflakeChance: 0.09 },
        6: { name: "ЭКСПЕРТ", color: "#DC143C", giftSpeed: 4.5, bugSpeed: 5.5, bugSpawnRate: 0.45, giftSpawnRate: 0.55, snowflakeChance: 0.1 },
        7: { name: "ГУРУ", color: "#8B0000", giftSpeed: 5, bugSpeed: 6, bugSpawnRate: 0.5, giftSpawnRate: 0.5, snowflakeChance: 0.11 },
        8: { name: "ЛЕГЕНДА", color: "#4B0082", giftSpeed: 5.5, bugSpeed: 6.5, bugSpawnRate: 0.55, giftSpawnRate: 0.45, snowflakeChance: 0.12 },
        9: { name: "БОГ КОДА", color: "#9400D3", giftSpeed: 6, bugSpeed: 7, bugSpawnRate: 0.6, giftSpawnRate: 0.4, snowflakeChance: 0.13 },
        10: { name: "НЕВОЗМОЖНО", color: "#000000", giftSpeed: 7, bugSpeed: 8, bugSpawnRate: 0.7, giftSpawnRate: 0.3, snowflakeChance: 0.15 }
    };
    
    // ==================== ЗВУКИ ====================
    const audio = {
        jump: new Audio('assets/sounds/jump.mp3'),
        collect: new Audio('assets/sounds/collect.mp3'),
        hurt: new Audio('assets/sounds/hurt.mp3'),
        victory: new Audio('assets/sounds/victory.mp3'),
        bgMusic: new Audio('assets/sounds/bg_music.mp3'),
        snowstorm: new Audio('assets/sounds/dfng.mp3')
    };
    
    // Настройка звуков
    Object.values(audio).forEach(sound => {
        sound.volume = 0.5;
        sound.preload = 'auto';
    });
    audio.bgMusic.loop = true;
    audio.snowstorm.loop = true;
    
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
            ctx.save();
            
            if (this.isMovingLeft && !this.isMovingRight) {
                ctx.scale(-1, 1);
                ctx.translate(-this.x * 2, 0);
            }
            
            ctx.fillStyle = this.isHurt ? '#ff4444' : '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#0066cc';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 5, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DIPSIK', this.x, this.y + 30);
            
            if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                ctx.globalAlpha = 1;
            }
            
            ctx.restore();
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
        
        updateSpeed() {
            const difficulty = difficultySettings[gameState.difficulty];
            if (difficulty) this.speed = difficulty.playerSpeed || 7;
        },
        
        jump() {
            if (this.canJump) {
                this.speedY = -15;
                this.canJump = false;
                audio.jump.currentTime = 0;
                audio.jump.play().catch(e => console.log('Звук прыжка:', e));
            }
        },
        
        superJump() {
            if (this.canJump) {
                this.speedY = -25;
                this.canJump = false;
                audio.jump.currentTime = 0;
                audio.jump.play();
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
            
            audio.hurt.currentTime = 0;
            audio.hurt.play().catch(e => console.log('Звук урона:', e));
            
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
        const difficulty = difficultySettings[gameState.difficulty];
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
        const difficulty = difficultySettings[gameState.difficulty];
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
        
        audio.snowstorm.currentTime = 0;
        audio.snowstorm.play().catch(e => console.log('Звук снегопада:', e));
        
        const snowNotification = document.getElementById('snowNotification') || document.createElement('div');
        snowNotification.textContent = '❄️ СНЕГОПАД! +1 жизнь!';
        snowNotification.style.display = 'block';
        setTimeout(() => snowNotification.style.display = 'none', 2000);
        
        if (gameState.lives < 3) {
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
            player.updateSpeed();
            updateDifficultyDisplay();
        }
    }
    
    function updateDifficultyDisplay() {
        const difficulty = difficultySettings[gameState.difficulty];
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
        ctx.fillStyle = '#0a2a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёзды
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
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
        const difficulty = difficultySettings[gameState.difficulty];
        
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
                        audio.collect.currentTime = 0;
                        audio.collect.play().catch(e => console.log('Звук сбора:', e));
                        createParticles(obj.x, obj.y, obj.color, 20);
                        
                        updateLevelProgress();
                        
                        if (gameState.gifts % 5 === 0) {
                            gameState.level++;
                            audio.victory.currentTime = 0;
                            audio.victory.play().catch(e => console.log('Звук победы:', e));
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
                        audio.collect.currentTime = 0;
                        audio.collect.play();
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
                audio.snowstorm.pause();
                audio.snowstorm.currentTime = 0;
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Пол
        ctx.fillStyle = '#2a4a3a';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 3);
        
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
        for (let i = 0; i < 3; i++) {
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
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startGame(mode) {
        console.log('🚀 Запуск игры:', mode);
        
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
        audio.snowstorm.pause();
        audio.snowstorm.currentTime = 0;
        
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.speedY = 0;
        player.canJump = true;
        player.isInvincible = false;
        player.isHurt = false;
        player.updateSpeed();
        
        const modeNames = {
            'classic': 'КЛАССИКА',
            'time': 'НА ВРЕМЯ',
            'code': 'КОД-БАТТЛ',
            'survival': 'ВЫЖИВАНИЕ'
        };
        const gameModeText = document.getElementById('gameMode');
        if (gameModeText) gameModeText.textContent = modeNames[mode] || 'КЛАССИКА';
        
        const levelProgress = document.getElementById('levelProgress');
        if (levelProgress) levelProgress.style.display = 'block';
        
        updateHUD();
        updateHearts();
        updateLevelProgress();
        updateDifficultyDisplay();
        
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        
        gameRunning = true;
        gamePaused = false;
        lastTime = 0;
        spawnTimer = 0;
        
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(updateGame);
        
        audio.bgMusic.currentTime = 0;
        audio.bgMusic.play().catch(e => console.log('Фоновая музыка:', e));
    }
    
    function pauseGame() {
        gamePaused = !gamePaused;
        if (gamePaused) {
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
            audio.bgMusic.pause();
            if (snowstormActive) audio.snowstorm.pause();
        } else {
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                audio.bgMusic.play();
                if (snowstormActive) audio.snowstorm.play();
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
        
        audio.bgMusic.pause();
        audio.bgMusic.currentTime = 0;
        audio.snowstorm.pause();
        audio.snowstorm.currentTime = 0;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('dipsikHighScore', gameState.highScore);
        }
        
        gameState.totalGames++;
        gameState.linesCollected += gameState.gifts;
        
        localStorage.setItem('dipsikTotalGames', gameState.totalGames);
        localStorage.setItem('dipsikLinesCollected', gameState.linesCollected);
        
        const bestScore = document.getElementById('bestScore');
        const totalGames = document.getElementById('totalGames');
        const linesCollected = document.getElementById('linesCollected');
        const finalScore = document.getElementById('finalScore');
        const finalLevel = document.getElementById('finalLevel');
        const finalGifts = document.getElementById('finalGifts');
        const finalLives = document.getElementById('finalLives');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const resultIcon = document.getElementById('resultIcon');
        
        if (bestScore) bestScore.textContent = gameState.highScore;
        if (totalGames) totalGames.textContent = gameState.totalGames;
        if (linesCollected) linesCollected.textContent = gameState.linesCollected;
        if (finalScore) finalScore.textContent = gameState.score;
        if (finalLevel) finalLevel.textContent = gameState.level;
        if (finalGifts) finalGifts.textContent = gameState.gifts;
        if (finalLives) finalLives.textContent = gameState.lives;
        
        if (gameOverTitle) {
            if (gameState.lives <= 0) {
                gameOverTitle.textContent = 'ИГРА ОКОНЧЕНА! 💀';
                if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
                audio.hurt.currentTime = 0;
                audio.hurt.play().catch(e => console.log('Звук поражения:', e));
            } else {
                gameOverTitle.textContent = 'ПОБЕДА! 🏆';
                if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
                audio.victory.currentTime = 0;
                audio.victory.play().catch(e => console.log('Звук победы:', e));
            }
        }
        
        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        
        updateProgress();
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🔄 Инициализация игры...');
        
        // Настраиваем размер канваса
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
        // Кнопка "Играть"
        document.getElementById('startGameBtn').addEventListener('click', function() {
            console.log('▶️ Нажата кнопка "Играть"');
            hideAllScreens();
            document.getElementById('modeScreen').classList.add('active');
        });
        
        // Карточки режимов
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                console.log(`🎮 Выбран режим: ${mode}`);
                startGame(mode);
            });
        });
        
        // Кнопка "Назад"
        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ ИГРЫ ====================
        // Пауза
        document.getElementById('gamePauseBtn').addEventListener('click', pauseGame);
        
        // Кнопки в паузе
        document.getElementById('resumeBtn').addEventListener('click', function() {
            gamePaused = false;
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                audio.bgMusic.play();
                if (snowstormActive) audio.snowstorm.play();
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('quitBtn').addEventListener('click', function() {
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            audio.bgMusic.pause();
            audio.bgMusic.currentTime = 0;
            audio.snowstorm.pause();
            audio.snowstorm.currentTime = 0;
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // Кнопки конца игры
        document.getElementById('playAgainBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('menuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ УПРАВЛЕНИЯ ====================
        // Клавиатура
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
                        audio.collect.currentTime = 0;
                        audio.collect.play();
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
        
        // Мобильные кнопки (если есть)
        const moveLeftBtn = document.getElementById('moveLeftBtn');
        const moveRightBtn = document.getElementById('moveRightBtn');
        const moveUpBtn = document.getElementById('moveUpBtn');
        const actionBtn = document.getElementById('actionBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        if (moveLeftBtn) {
            moveLeftBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveLeft();
            });
            
            moveLeftBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
            });
        }
        
        if (moveRightBtn) {
            moveRightBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveRight();
            });
            
            moveRightBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
            });
        }
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.jump();
            });
        }
        
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.superJump();
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
                    audio.collect.currentTime = 0;
                    audio.collect.play();
                }
            });
        }
        
        // ==================== ПАСХАЛЬНЫЕ КНОПКИ ====================
        document.getElementById('howToPlayBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '🎮 <b>КАК ИГРАТЬ:</b><br><br>' +
                             '← → или A/D - движение<br>' +
                             'SPACE или ↑ или W - прыжок<br>' +
                             'S - супер-прыжок<br>' +
                             'E - удалить все баги<br>' +
                             'ESC - пауза<br>' +
                             '🎁 Лови подарки<br>' +
                             '🐛 Избегай багов<br>' +
                             '❄️ Лови снежинки для снегопада!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '⚙️ <b>НАСТРОЙКИ</b><br><br>' +
                             'Звук: ВКЛ<br>' +
                             'Музыка: ВКЛ<br>' +
                             'Сложность: АВТО<br>' +
                             'Управление: КЛАВИАТУРА/ТАЧ';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('creditsBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '👨‍💻 <b>АВТОРЫ</b><br><br>' +
                             'Главный герой: <b>DIPSIK</b><br>' +
                             '🎄 С Новым Годом!<br>' +
                             '🎮 Удачи в игре!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('closeEasterBtn').addEventListener('click', function() {
            document.getElementById('easterEgg').style.display = 'none';
        });
        
        // Чит-коды
        document.getElementById('cheatBtn').addEventListener('click', function() {
            const code = document.getElementById('cheatInput').value;
            const cheats = {
                'DIPSIK': () => { gameState.score += 1000; updateHUD(); },
                'INVINCIBLE': () => { player.isInvincible = true; setTimeout(() => player.isInvincible = false, 10000); },
                'GIFTS': () => { for (let i = 0; i < 10; i++) createGift(); },
                'HEAL': () => { gameState.lives = 3; updateHearts(); },
                'SNOW': () => activateSnowstorm(),
                'EASY': () => { gameState.difficulty = Math.max(1, gameState.difficulty - 1); player.updateSpeed(); updateDifficultyDisplay(); },
                'HARD': () => { gameState.difficulty = Math.min(10, gameState.difficulty + 1); player.updateSpeed(); updateDifficultyDisplay(); }
            };
            
            if (cheats[code.toUpperCase()]) {
                cheats[code.toUpperCase()]();
                document.getElementById('cheatInput').value = '';
                document.getElementById('easterMessage').innerHTML = '✅ Чит-код активирован!';
                document.getElementById('easterEgg').style.display = 'block';
            } else {
                document.getElementById('easterMessage').innerHTML = '❌ Неверный чит-код!<br>Попробуй: DIPSIK, INVINCIBLE, GIFTS, HEAL, SNOW, EASY, HARD';
                document.getElementById('easterEgg').style.display = 'block';
            }
        });
        
        document.getElementById('cheatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') document.getElementById('cheatBtn').click();
        });
        
        // Поделиться
        document.getElementById('shareTelegramBtn').addEventListener('click', function() {
            shareResults('telegram');
        });
        
        document.getElementById('shareWhatsappBtn').addEventListener('click', function() {
            shareResults('whatsapp');
        });
        
        function shareResults(platform) {
            const gameUrl = window.location.href;
            const difficulty = difficultySettings[gameState.difficulty];
            
            let message = `🎮 Я поиграл в DIPSIK: НОВОГОДНИЙ КВЕСТ! 🎄\n\n`;
            message += `✨ Собрано подарков: ${gameState.gifts} 🎁\n`;
            message += `🐛 Уничтожено багов: ${gameState.bugsDestroyed}\n`;
            message += `🏆 Очки: ${gameState.score}\n`;
            message += `📈 Уровень: ${gameState.level}\n`;
            message += `🔥 Сложность: ${difficulty ? difficulty.name : 'НОВИЧОК'}\n\n`;
            message += `🎄 Поиграть можно тут: ${gameUrl}\n\n`;
            message += `#DeepSeekНГ #НовогодняяИгра #DIPSIK`;
            
            let shareUrl = '';
            
            if (platform === 'telegram') {
                const encodedMessage = encodeURIComponent(message);
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodedMessage}`;
            } else if (platform === 'whatsapp') {
                const encodedMessage = encodeURIComponent(message);
                shareUrl = `https://wa.me/?text=${encodedMessage}`;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=500');
            }
        }
        
        // Обновляем статистику в меню
        const bestScore = document.getElementById('bestScore');
        const totalGames = document.getElementById('totalGames');
        const linesCollected = document.getElementById('linesCollected');
        
        if (bestScore) bestScore.textContent = gameState.highScore;
        if (totalGames) totalGames.textContent = gameState.totalGames;
        if (linesCollected) linesCollected.textContent = gameState.linesCollected;
        
        console.log('✅ Игра готова! Нажимай "Играть"!');
    }
    
    // Запускаем инициализацию
    setTimeout(init, 100);
});// ============================================
// DIPSIK: НОВОГОДНИЙ КВЕСТ - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
// ============================================

// Ждём полной загрузки страницы
window.addEventListener('load', function() {
    console.log('🎮 DIPSIK: Игра загружается...');
    
    // ==================== ПЕРЕМЕННЫЕ ====================
    let gameRunning = false;
    let gamePaused = false;
    let gameLoopId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let snowstormActive = false;
    let snowstormTimer = 0;
    let gameTime = 0;
    
    const gameState = {
        score: 0,
        lives: 3,
        gifts: 0,
        level: 1,
        difficulty: 1,
        bugsDestroyed: 0,
        gameMode: 'classic',
        highScore: localStorage.getItem('dipsikHighScore') || 0,
        totalGames: parseInt(localStorage.getItem('dipsikTotalGames')) || 0,
        linesCollected: parseInt(localStorage.getItem('dipsikLinesCollected')) || 0
    };
    
    // ==================== СИСТЕМА СЛОЖНОСТИ ====================
    const difficultySettings = {
        1: { name: "НОВИЧОК", color: "#32CD32", giftSpeed: 2, bugSpeed: 3, bugSpawnRate: 0.2, giftSpawnRate: 0.8, snowflakeChance: 0.05 },
        2: { name: "УЧЕНИК", color: "#7CFC00", giftSpeed: 2.5, bugSpeed: 3.5, bugSpawnRate: 0.25, giftSpawnRate: 0.75, snowflakeChance: 0.06 },
        3: { name: "ОПЫТНЫЙ", color: "#FFD700", giftSpeed: 3, bugSpeed: 4, bugSpawnRate: 0.3, giftSpawnRate: 0.7, snowflakeChance: 0.07 },
        4: { name: "ПРОФИ", color: "#FF8C00", giftSpeed: 3.5, bugSpeed: 4.5, bugSpawnRate: 0.35, giftSpawnRate: 0.65, snowflakeChance: 0.08 },
        5: { name: "МАСТЕР", color: "#FF4500", giftSpeed: 4, bugSpeed: 5, bugSpawnRate: 0.4, giftSpawnRate: 0.6, snowflakeChance: 0.09 },
        6: { name: "ЭКСПЕРТ", color: "#DC143C", giftSpeed: 4.5, bugSpeed: 5.5, bugSpawnRate: 0.45, giftSpawnRate: 0.55, snowflakeChance: 0.1 },
        7: { name: "ГУРУ", color: "#8B0000", giftSpeed: 5, bugSpeed: 6, bugSpawnRate: 0.5, giftSpawnRate: 0.5, snowflakeChance: 0.11 },
        8: { name: "ЛЕГЕНДА", color: "#4B0082", giftSpeed: 5.5, bugSpeed: 6.5, bugSpawnRate: 0.55, giftSpawnRate: 0.45, snowflakeChance: 0.12 },
        9: { name: "БОГ КОДА", color: "#9400D3", giftSpeed: 6, bugSpeed: 7, bugSpawnRate: 0.6, giftSpawnRate: 0.4, snowflakeChance: 0.13 },
        10: { name: "НЕВОЗМОЖНО", color: "#000000", giftSpeed: 7, bugSpeed: 8, bugSpawnRate: 0.7, giftSpawnRate: 0.3, snowflakeChance: 0.15 }
    };
    
    // ==================== ЗВУКИ ====================
    const audio = {
        jump: new Audio('assets/sounds/jump.mp3'),
        collect: new Audio('assets/sounds/collect.mp3'),
        hurt: new Audio('assets/sounds/hurt.mp3'),
        victory: new Audio('assets/sounds/victory.mp3'),
        bgMusic: new Audio('assets/sounds/bg_music.mp3'),
        snowstorm: new Audio('assets/sounds/dfng.mp3')
    };
    
    // Настройка звуков
    Object.values(audio).forEach(sound => {
        sound.volume = 0.5;
        sound.preload = 'auto';
    });
    audio.bgMusic.loop = true;
    audio.snowstorm.loop = true;
    
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
            ctx.save();
            
            if (this.isMovingLeft && !this.isMovingRight) {
                ctx.scale(-1, 1);
                ctx.translate(-this.x * 2, 0);
            }
            
            ctx.fillStyle = this.isHurt ? '#ff4444' : '#00ffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#0066cc';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 5, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DIPSIK', this.x, this.y + 30);
            
            if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                ctx.globalAlpha = 1;
            }
            
            ctx.restore();
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
        
        updateSpeed() {
            const difficulty = difficultySettings[gameState.difficulty];
            if (difficulty) this.speed = difficulty.playerSpeed || 7;
        },
        
        jump() {
            if (this.canJump) {
                this.speedY = -15;
                this.canJump = false;
                audio.jump.currentTime = 0;
                audio.jump.play().catch(e => console.log('Звук прыжка:', e));
            }
        },
        
        superJump() {
            if (this.canJump) {
                this.speedY = -25;
                this.canJump = false;
                audio.jump.currentTime = 0;
                audio.jump.play();
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
            
            audio.hurt.currentTime = 0;
            audio.hurt.play().catch(e => console.log('Звук урона:', e));
            
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
        const difficulty = difficultySettings[gameState.difficulty];
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
        const difficulty = difficultySettings[gameState.difficulty];
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
        
        audio.snowstorm.currentTime = 0;
        audio.snowstorm.play().catch(e => console.log('Звук снегопада:', e));
        
        const snowNotification = document.getElementById('snowNotification') || document.createElement('div');
        snowNotification.textContent = '❄️ СНЕГОПАД! +1 жизнь!';
        snowNotification.style.display = 'block';
        setTimeout(() => snowNotification.style.display = 'none', 2000);
        
        if (gameState.lives < 3) {
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
            player.updateSpeed();
            updateDifficultyDisplay();
        }
    }
    
    function updateDifficultyDisplay() {
        const difficulty = difficultySettings[gameState.difficulty];
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
        ctx.fillStyle = '#0a2a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёзды
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
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
        const difficulty = difficultySettings[gameState.difficulty];
        
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
                        audio.collect.currentTime = 0;
                        audio.collect.play().catch(e => console.log('Звук сбора:', e));
                        createParticles(obj.x, obj.y, obj.color, 20);
                        
                        updateLevelProgress();
                        
                        if (gameState.gifts % 5 === 0) {
                            gameState.level++;
                            audio.victory.currentTime = 0;
                            audio.victory.play().catch(e => console.log('Звук победы:', e));
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
                        audio.collect.currentTime = 0;
                        audio.collect.play();
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
                audio.snowstorm.pause();
                audio.snowstorm.currentTime = 0;
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Пол
        ctx.fillStyle = '#2a4a3a';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 3);
        
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
        for (let i = 0; i < 3; i++) {
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
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startGame(mode) {
        console.log('🚀 Запуск игры:', mode);
        
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
        audio.snowstorm.pause();
        audio.snowstorm.currentTime = 0;
        
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.speedY = 0;
        player.canJump = true;
        player.isInvincible = false;
        player.isHurt = false;
        player.updateSpeed();
        
        const modeNames = {
            'classic': 'КЛАССИКА',
            'time': 'НА ВРЕМЯ',
            'code': 'КОД-БАТТЛ',
            'survival': 'ВЫЖИВАНИЕ'
        };
        const gameModeText = document.getElementById('gameMode');
        if (gameModeText) gameModeText.textContent = modeNames[mode] || 'КЛАССИКА';
        
        const levelProgress = document.getElementById('levelProgress');
        if (levelProgress) levelProgress.style.display = 'block';
        
        updateHUD();
        updateHearts();
        updateLevelProgress();
        updateDifficultyDisplay();
        
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        
        gameRunning = true;
        gamePaused = false;
        lastTime = 0;
        spawnTimer = 0;
        
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(updateGame);
        
        audio.bgMusic.currentTime = 0;
        audio.bgMusic.play().catch(e => console.log('Фоновая музыка:', e));
    }
    
    function pauseGame() {
        gamePaused = !gamePaused;
        if (gamePaused) {
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
            audio.bgMusic.pause();
            if (snowstormActive) audio.snowstorm.pause();
        } else {
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                audio.bgMusic.play();
                if (snowstormActive) audio.snowstorm.play();
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
        
        audio.bgMusic.pause();
        audio.bgMusic.currentTime = 0;
        audio.snowstorm.pause();
        audio.snowstorm.currentTime = 0;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('dipsikHighScore', gameState.highScore);
        }
        
        gameState.totalGames++;
        gameState.linesCollected += gameState.gifts;
        
        localStorage.setItem('dipsikTotalGames', gameState.totalGames);
        localStorage.setItem('dipsikLinesCollected', gameState.linesCollected);
        
        const bestScore = document.getElementById('bestScore');
        const totalGames = document.getElementById('totalGames');
        const linesCollected = document.getElementById('linesCollected');
        const finalScore = document.getElementById('finalScore');
        const finalLevel = document.getElementById('finalLevel');
        const finalGifts = document.getElementById('finalGifts');
        const finalLives = document.getElementById('finalLives');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const resultIcon = document.getElementById('resultIcon');
        
        if (bestScore) bestScore.textContent = gameState.highScore;
        if (totalGames) totalGames.textContent = gameState.totalGames;
        if (linesCollected) linesCollected.textContent = gameState.linesCollected;
        if (finalScore) finalScore.textContent = gameState.score;
        if (finalLevel) finalLevel.textContent = gameState.level;
        if (finalGifts) finalGifts.textContent = gameState.gifts;
        if (finalLives) finalLives.textContent = gameState.lives;
        
        if (gameOverTitle) {
            if (gameState.lives <= 0) {
                gameOverTitle.textContent = 'ИГРА ОКОНЧЕНА! 💀';
                if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
                audio.hurt.currentTime = 0;
                audio.hurt.play().catch(e => console.log('Звук поражения:', e));
            } else {
                gameOverTitle.textContent = 'ПОБЕДА! 🏆';
                if (resultIcon) resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
                audio.victory.currentTime = 0;
                audio.victory.play().catch(e => console.log('Звук победы:', e));
            }
        }
        
        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        
        updateProgress();
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🔄 Инициализация игры...');
        
        // Настраиваем размер канваса
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
        // Кнопка "Играть"
        document.getElementById('startGameBtn').addEventListener('click', function() {
            console.log('▶️ Нажата кнопка "Играть"');
            hideAllScreens();
            document.getElementById('modeScreen').classList.add('active');
        });
        
        // Карточки режимов
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                console.log(`🎮 Выбран режим: ${mode}`);
                startGame(mode);
            });
        });
        
        // Кнопка "Назад"
        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ ИГРЫ ====================
        // Пауза
        document.getElementById('gamePauseBtn').addEventListener('click', pauseGame);
        
        // Кнопки в паузе
        document.getElementById('resumeBtn').addEventListener('click', function() {
            gamePaused = false;
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
                audio.bgMusic.play();
                if (snowstormActive) audio.snowstorm.play();
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('quitBtn').addEventListener('click', function() {
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            audio.bgMusic.pause();
            audio.bgMusic.currentTime = 0;
            audio.snowstorm.pause();
            audio.snowstorm.currentTime = 0;
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // Кнопки конца игры
        document.getElementById('playAgainBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('menuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ УПРАВЛЕНИЯ ====================
        // Клавиатура
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
                        audio.collect.currentTime = 0;
                        audio.collect.play();
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
        
        // Мобильные кнопки (если есть)
        const moveLeftBtn = document.getElementById('moveLeftBtn');
        const moveRightBtn = document.getElementById('moveRightBtn');
        const moveUpBtn = document.getElementById('moveUpBtn');
        const actionBtn = document.getElementById('actionBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        if (moveLeftBtn) {
            moveLeftBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveLeft();
            });
            
            moveLeftBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
            });
        }
        
        if (moveRightBtn) {
            moveRightBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.moveRight();
            });
            
            moveRightBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                player.stop();
            });
        }
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.jump();
            });
        }
        
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                player.superJump();
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
                    audio.collect.currentTime = 0;
                    audio.collect.play();
                }
            });
        }
        
        // ==================== ПАСХАЛЬНЫЕ КНОПКИ ====================
        document.getElementById('howToPlayBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '🎮 <b>КАК ИГРАТЬ:</b><br><br>' +
                             '← → или A/D - движение<br>' +
                             'SPACE или ↑ или W - прыжок<br>' +
                             'S - супер-прыжок<br>' +
                             'E - удалить все баги<br>' +
                             'ESC - пауза<br>' +
                             '🎁 Лови подарки<br>' +
                             '🐛 Избегай багов<br>' +
                             '❄️ Лови снежинки для снегопада!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '⚙️ <b>НАСТРОЙКИ</b><br><br>' +
                             'Звук: ВКЛ<br>' +
                             'Музыка: ВКЛ<br>' +
                             'Сложность: АВТО<br>' +
                             'Управление: КЛАВИАТУРА/ТАЧ';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('creditsBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '👨‍💻 <b>АВТОРЫ</b><br><br>' +
                             'Главный герой: <b>DIPSIK</b><br>' +
                             '🎄 С Новым Годом!<br>' +
                             '🎮 Удачи в игре!';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('closeEasterBtn').addEventListener('click', function() {
            document.getElementById('easterEgg').style.display = 'none';
        });
        
        // Чит-коды
        document.getElementById('cheatBtn').addEventListener('click', function() {
            const code = document.getElementById('cheatInput').value;
            const cheats = {
                'DIPSIK': () => { gameState.score += 1000; updateHUD(); },
                'INVINCIBLE': () => { player.isInvincible = true; setTimeout(() => player.isInvincible = false, 10000); },
                'GIFTS': () => { for (let i = 0; i < 10; i++) createGift(); },
                'HEAL': () => { gameState.lives = 3; updateHearts(); },
                'SNOW': () => activateSnowstorm(),
                'EASY': () => { gameState.difficulty = Math.max(1, gameState.difficulty - 1); player.updateSpeed(); updateDifficultyDisplay(); },
                'HARD': () => { gameState.difficulty = Math.min(10, gameState.difficulty + 1); player.updateSpeed(); updateDifficultyDisplay(); }
            };
            
            if (cheats[code.toUpperCase()]) {
                cheats[code.toUpperCase()]();
                document.getElementById('cheatInput').value = '';
                document.getElementById('easterMessage').innerHTML = '✅ Чит-код активирован!';
                document.getElementById('easterEgg').style.display = 'block';
            } else {
                document.getElementById('easterMessage').innerHTML = '❌ Неверный чит-код!<br>Попробуй: DIPSIK, INVINCIBLE, GIFTS, HEAL, SNOW, EASY, HARD';
                document.getElementById('easterEgg').style.display = 'block';
            }
        });
        
        document.getElementById('cheatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') document.getElementById('cheatBtn').click();
        });
        
        // Поделиться
        document.getElementById('shareTelegramBtn').addEventListener('click', function() {
            shareResults('telegram');
        });
        
        document.getElementById('shareWhatsappBtn').addEventListener('click', function() {
            shareResults('whatsapp');
        });
        
        function shareResults(platform) {
            const gameUrl = window.location.href;
            const difficulty = difficultySettings[gameState.difficulty];
            
            let message = `🎮 Я поиграл в DIPSIK: НОВОГОДНИЙ КВЕСТ! 🎄\n\n`;
            message += `✨ Собрано подарков: ${gameState.gifts} 🎁\n`;
            message += `🐛 Уничтожено багов: ${gameState.bugsDestroyed}\n`;
            message += `🏆 Очки: ${gameState.score}\n`;
            message += `📈 Уровень: ${gameState.level}\n`;
            message += `🔥 Сложность: ${difficulty ? difficulty.name : 'НОВИЧОК'}\n\n`;
            message += `🎄 Поиграть можно тут: ${gameUrl}\n\n`;
            message += `#DeepSeekНГ #НовогодняяИгра #DIPSIK`;
            
            let shareUrl = '';
            
            if (platform === 'telegram') {
                const encodedMessage = encodeURIComponent(message);
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodedMessage}`;
            } else if (platform === 'whatsapp') {
                const encodedMessage = encodeURIComponent(message);
                shareUrl = `https://wa.me/?text=${encodedMessage}`;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=500');
            }
        }
        
        // Обновляем статистику в меню
        const bestScore = document.getElementById('bestScore');
        const totalGames = document.getElementById('totalGames');
        const linesCollected = document.getElementById('linesCollected');
        
        if (bestScore) bestScore.textContent = gameState.highScore;
        if (totalGames) totalGames.textContent = gameState.totalGames;
        if (linesCollected) linesCollected.textContent = gameState.linesCollected;
        
        console.log('✅ Игра готова! Нажимай "Играть"!');
    }
    
    // Запускаем инициализацию
    setTimeout(init, 100);
})
