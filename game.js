// ============================================
// DIPSIK: НОВОГОДНИЙ КВЕСТ - ПОЛНЫЙ КОД
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 DIPSIK: Игра загружается...');
    
    // ==================== ПЕРЕМЕННЫЕ ====================
    let gameRunning = false;
    let gamePaused = false;
    let gameLoopId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    
    const gameState = {
        score: 0,
        lives: 3,
        gifts: 0,
        level: 1,
        gameMode: 'classic',
        highScore: localStorage.getItem('dipsikHighScore') || 0,
        totalGames: parseInt(localStorage.getItem('dipsikTotalGames')) || 0,
        linesCollected: parseInt(localStorage.getItem('dipsikLinesCollected')) || 0
    };
    
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
        
        draw() {
            ctx.fillStyle = '#00ffff';
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
        },
        
        jump() {
            if (this.canJump) {
                this.speedY = -15;
                this.canJump = false;
            }
        },
        
        superJump() {
            if (this.canJump) {
                this.speedY = -25;
                this.canJump = false;
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
        }
    };
    
    // ==================== ОБЪЕКТЫ ИГРЫ ====================
    const fallingObjects = [];
    const particles = [];
    
    function createGift() {
        fallingObjects.push({
            type: 'gift',
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 50,
            height: 50,
            speed: 3 + Math.random() * 2,
            collected: false,
            
            draw() {
                if (this.collected) return;
                
                ctx.fillStyle = '#FF0000';
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
        fallingObjects.push({
            type: 'bug',
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            width: 45,
            height: 45,
            speed: 4 + Math.random() * 2,
            collected: false,
            
            draw() {
                if (this.collected) return;
                
                ctx.fillStyle = '#B22222';
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
        `;
        leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.moveLeft(); });
        leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); player.stop(); });
        
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
        `;
        jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.jump(); });
        
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
        `;
        rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.moveRight(); });
        rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); player.stop(); });
        
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
        `;
        superBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.superJump(); });
        
        controlsContainer.appendChild(leftBtn);
        controlsContainer.appendChild(jumpBtn);
        controlsContainer.appendChild(rightBtn);
        controlsContainer.appendChild(superBtn);
        document.body.appendChild(controlsContainer);
    }
    
    function removeMobileControls() {
        const controls = document.getElementById('mobileCompactControls');
        if (controls) controls.remove();
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function updateGame(timestamp) {
        if (!gameRunning || gamePaused) return;
        
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        
        ctx.fillStyle = '#0a2a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        player.update();
        player.draw();
        
        spawnTimer += deltaTime;
        if (spawnTimer > 1000) {
            if (Math.random() < 0.7) createGift();
            if (Math.random() < 0.3) createBug();
            if (Math.random() < 0.1) createSnowflake();
            spawnTimer = 0;
        }
        
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
                        updateHUD();
                        
                        if (gameState.gifts % 5 === 0) {
                            gameState.level++;
                        }
                    } else if (obj.type === 'bug') {
                        gameState.lives--;
                        updateHUD();
                        
                        if (gameState.lives <= 0) {
                            gameOver();
                            return;
                        }
                    } else if (obj.type === 'snowflake') {
                        if (gameState.lives < 3) gameState.lives++;
                        updateHUD();
                    }
                    
                    fallingObjects.splice(i, 1);
                }
            }
        }
        
        ctx.fillStyle = '#2a4a3a';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        gameLoopId = requestAnimationFrame(updateGame);
    }
    
    // ==================== ИНТЕРФЕЙС ====================
    function updateHUD() {
        document.getElementById('scoreValue').textContent = String(gameState.score).padStart(6, '0');
        document.getElementById('giftsCount').textContent = `${gameState.gifts}`;
        document.getElementById('gameLevel').textContent = gameState.level;
        
        const heartsContainer = document.getElementById('heartsContainer');
        let heartsHTML = '';
        for (let i = 0; i < 3; i++) {
            heartsHTML += `<i class="fas fa-heart ${i >= gameState.lives ? 'lost' : ''}"></i>`;
        }
        heartsContainer.innerHTML = heartsHTML;
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startGame(mode) {
        console.log('🚀 Запуск игры:', mode);
        
        gameState.score = 0;
        gameState.lives = 3;
        gameState.gifts = 0;
        gameState.level = 1;
        gameState.gameMode = mode;
        
        fallingObjects.length = 0;
        
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.speedY = 0;
        player.canJump = true;
        player.isMovingLeft = false;
        player.isMovingRight = false;
        
        document.getElementById('gameMode').textContent = mode.toUpperCase();
        
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        
        gameRunning = true;
        gamePaused = false;
        lastTime = 0;
        spawnTimer = 0;
        
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(updateGame);
        
        updateHUD();
        
        // Создаём мобильное управление на телефонах
        if (window.innerWidth <= 768) {
            createMobileControls();
        }
    }
    
    function pauseGame() {
        gamePaused = !gamePaused;
        if (gamePaused) {
            document.getElementById('pauseScreen').classList.add('active');
        } else {
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
            }
        }
    }
    
    function gameOver() {
        gameRunning = false;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('dipsikHighScore', gameState.highScore);
        }
        
        gameState.totalGames++;
        gameState.linesCollected += gameState.gifts;
        
        localStorage.setItem('dipsikTotalGames', gameState.totalGames);
        localStorage.setItem('dipsikLinesCollected', gameState.linesCollected);
        
        document.getElementById('bestScore').textContent = gameState.highScore;
        document.getElementById('totalGames').textContent = gameState.totalGames;
        document.getElementById('linesCollected').textContent = gameState.linesCollected;
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalLevel').textContent = gameState.level;
        document.getElementById('finalGifts').textContent = gameState.gifts;
        document.getElementById('finalLives').textContent = gameState.lives;
        
        if (gameState.lives <= 0) {
            document.getElementById('gameOverTitle').textContent = 'ИГРА ОКОНЧЕНА! 💀';
            document.getElementById('resultIcon').innerHTML = '<i class="fas fa-skull-crossbones"></i>';
        } else {
            document.getElementById('gameOverTitle').textContent = 'ПОБЕДА! 🏆';
            document.getElementById('resultIcon').innerHTML = '<i class="fas fa-trophy"></i>';
        }
        
        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
        
        removeMobileControls();
    }
    
    function hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🔄 Инициализация игры...');
        
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
            hideAllScreens();
            document.getElementById('modeScreen').classList.add('active');
        });
        
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                startGame(mode);
            });
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
        });
        
        // ==================== КНОПКИ ИГРЫ ====================
        document.getElementById('gamePauseBtn').addEventListener('click', pauseGame);
        
        document.getElementById('resumeBtn').addEventListener('click', function() {
            gamePaused = false;
            document.getElementById('pauseScreen').classList.remove('active');
            if (gameRunning) {
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(updateGame);
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('quitBtn').addEventListener('click', function() {
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            removeMobileControls();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', function() {
            startGame(gameState.gameMode || 'classic');
        });
        
        document.getElementById('menuBtn').addEventListener('click', function() {
            hideAllScreens();
            document.getElementById('menuScreen').classList.add('active');
            removeMobileControls();
        });
        
        // ==================== КНОПКИ УПРАВЛЕНИЯ ====================
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
        
        // ==================== ПАСХАЛЬНЫЕ КНОПКИ ====================
        document.getElementById('howToPlayBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '🎮 <b>КАК ИГРАТЬ:</b><br><br>' +
                                     '← → или A/D - движение<br>' +
                                     'SPACE или ↑ или W - прыжок<br>' +
                                     'S - супер-прыжок<br>' +
                                     '🎁 Лови подарки<br>' +
                                     '🐛 Избегай багов<br>' +
                                     '❄️ Снежинки дают +1 жизнь';
            document.getElementById('easterEgg').style.display = 'block';
        });
        
        document.getElementById('settingsBtn').addEventListener('click', function() {
            document.getElementById('easterMessage').innerHTML = '⚙️ <b>НАСТРОЙКИ</b><br><br>' +
                                     'Звук: ВКЛ<br>' +
                                     'Музыка: ВКЛ<br>' +
                                     'Сложность: АВТО';
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
        
        // Обновляем статистику в меню
        document.getElementById('bestScore').textContent = gameState.highScore;
        document.getElementById('totalGames').textContent = gameState.totalGames;
        document.getElementById('linesCollected').textContent = gameState.linesCollected;
        
        console.log('✅ Игра готова!');
    }
    
    setTimeout(init, 100);
});
