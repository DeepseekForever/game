// ============================================
// DIPSIK: МОБИЛЬНОЕ УПРАВЛЕНИЕ И ОПРЕДЕЛЕНИЕ ПЛАТФОРМЫ
// ============================================

const MobileControl = (function() {
    // ==================== ПЕРЕМЕННЫЕ ====================
    let isMobile = false;
    let isTablet = false;
    let isIOS = false;
    let isAndroid = false;
    let isTouchDevice = false;
    
    // Ссылка на объект игрока (будет установлена позже)
    let playerRef = null;
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        detectPlatform();
        setupEventListeners();
        
        console.log(`📱 Платформа: ${getPlatformName()}`);
        console.log(`🖐️ Устройство: ${isTouchDevice ? 'Сенсорное' : 'Не сенсорное'}`);
        
        return {
            isMobile: isMobile,
            isTablet: isTablet,
            isTouchDevice: isTouchDevice,
            platform: getPlatformName(),
            setupPlayer: setupPlayer,
            showTouchControls: showTouchControls,
            hideTouchControls: hideTouchControls
        };
    }
    
    // ==================== ОПРЕДЕЛЕНИЕ ПЛАТФОРМЫ ====================
    function detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Проверка на сенсорное устройство
        isTouchDevice = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);
        
        // Проверка на iOS
        isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        
        // Проверка на Android
        isAndroid = /android/i.test(userAgent);
        
        // Проверка на мобильное устройство
        const mobileCheck = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        isMobile = mobileCheck && !isTablet;
        
        // Проверка на планшет
        isTablet = /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(userAgent);
        
        // Дополнительные проверки для планшетов
        if (!isTablet && window.innerWidth >= 768 && window.innerWidth <= 1024) {
            isTablet = true;
            isMobile = false;
        }
        
        // Для разработки можно принудительно установить
        const forceMobile = localStorage.getItem('forceMobile') === 'true';
        const forceDesktop = localStorage.getItem('forceDesktop') === 'true';
        
        if (forceMobile) {
            isMobile = true;
            isTouchDevice = true;
        } else if (forceDesktop) {
            isMobile = false;
            isTablet = false;
        }
    }
    
    function getPlatformName() {
        if (isIOS) return 'iOS';
        if (isAndroid) return 'Android';
        if (isTablet) return 'Tablet';
        if (isMobile) return 'Mobile';
        return 'Desktop';
    }
    
    // ==================== НАСТРОЙКА ИГРОКА ====================
    function setupPlayer(player) {
        playerRef = player;
        console.log('🎮 Объект игрока установлен для мобильного управления');
    }
    
    // ==================== УПРАВЛЕНИЕ КНОПКАМИ ====================
    function setupEventListeners() {
        // Находим элементы управления
        const moveLeftBtn = document.getElementById('moveLeftBtn');
        const moveRightBtn = document.getElementById('moveRightBtn');
        const moveUpBtn = document.getElementById('moveUpBtn');
        const actionBtn = document.getElementById('actionBtn');
        const specialBtn = document.getElementById('specialBtn');
        
        if (!moveLeftBtn || !moveRightBtn) {
            console.warn('⚠️ Элементы управления не найдены');
            return;
        }
        
        // Левая кнопка
        addTouchListeners(moveLeftBtn, 'left');
        
        // Правая кнопка
        addTouchListeners(moveRightBtn, 'right');
        
        // Кнопка прыжка
        addJumpListener(moveUpBtn);
        
        // Супер-прыжок
        addSuperJumpListener(actionBtn);
        
        // Дебаг (удаление багов)
        addDebugListener(specialBtn);
        
        // Адаптация интерфейса для мобильных устройств
        if (isMobile || isTablet) {
            adaptInterfaceForMobile();
        }
        
        console.log('🎮 Слушатели мобильного управления установлены');
    }
    
    function addTouchListeners(button, direction) {
        if (!button) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!playerRef) {
                console.warn('Игрок не установлен');
                return;
            }
            
            if (direction === 'left') {
                playerRef.moveLeft();
            } else if (direction === 'right') {
                playerRef.moveRight();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (playerRef) {
                playerRef.stop();
            }
            
            button.classList.remove('active');
        });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (playerRef) {
                playerRef.stop();
            }
            
            button.classList.remove('active');
        });
        
        // Также поддерживаем мышь для десктопов с сенсорными экранами
        button.addEventListener('mousedown', (e) => {
            if (!isTouchDevice) return;
            
            e.preventDefault();
            if (direction === 'left') {
                playerRef.moveLeft();
            } else if (direction === 'right') {
                playerRef.moveRight();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('mouseup', (e) => {
            if (!isTouchDevice) return;
            
            e.preventDefault();
            if (playerRef) {
                playerRef.stop();
            }
            
            button.classList.remove('active');
        });
        
        button.addEventListener('mouseleave', (e) => {
            if (!isTouchDevice) return;
            
            if (playerRef) {
                playerRef.stop();
            }
            
            button.classList.remove('active');
        });
    }
    
    function addJumpListener(button) {
        if (!button) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (playerRef) {
                playerRef.jump();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.classList.remove('active');
        });
        
        button.addEventListener('mousedown', (e) => {
            if (!isTouchDevice) return;
            
            e.preventDefault();
            if (playerRef) {
                playerRef.jump();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('mouseup', (e) => {
            if (!isTouchDevice) return;
            
            e.preventDefault();
            button.classList.remove('active');
        });
    }
    
    function addSuperJumpListener(button) {
        if (!button) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (playerRef) {
                playerRef.superJump();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.classList.remove('active');
        });
    }
    
    function addDebugListener(button) {
        if (!button) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Вызываем глобальную функцию удаления багов
            if (typeof window.removeAllBugs === 'function') {
                window.removeAllBugs();
            }
            
            button.classList.add('active');
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.classList.remove('active');
        });
    }
    
    // ==================== АДАПТАЦИЯ ИНТЕРФЕЙСА ====================
    function adaptInterfaceForMobile() {
        console.log('📱 Адаптация интерфейса для мобильных устройств');
        
        // Увеличиваем размер кнопок на мобильных
        const controlBtns = document.querySelectorAll('.control-btn');
        controlBtns.forEach(btn => {
            btn.style.width = '80px';
            btn.style.height = '80px';
            btn.style.fontSize = '2rem';
        });
        
        // Увеличиваем кнопки действий
        const actionBtns = document.querySelectorAll('.action-btn, .special-btn');
        actionBtns.forEach(btn => {
            btn.style.padding = '15px 25px';
            btn.style.fontSize = '1.1rem';
        });
        
        // Показываем кнопку паузы большего размера
        const pauseBtn = document.querySelector('.hud-btn');
        if (pauseBtn) {
            pauseBtn.style.width = '60px';
            pauseBtn.style.height = '60px';
            pauseBtn.style.fontSize = '1.8rem';
        }
        
        // Адаптируем меню для мобильных
        const menuBtns = document.querySelectorAll('.menu-btn');
        menuBtns.forEach(btn => {
            btn.style.padding = '18px 25px';
            btn.style.fontSize = '1.2rem';
            btn.style.margin = '8px auto';
        });
        
        // Добавляем вибрацию на кнопки (если поддерживается)
        if (navigator.vibrate) {
            document.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('touchstart', () => {
                    navigator.vibrate(30);
                });
            });
        }
        
        // Добавляем стили для активных кнопок
        const style = document.createElement('style');
        style.textContent = `
            .control-btn.active {
                transform: scale(0.9);
                background: linear-gradient(45deg, #32CD32, #228B22) !important;
                box-shadow: 0 0 20px #32CD32 !important;
            }
            
            .action-btn.active, .special-btn.active {
                transform: scale(0.95);
                opacity: 0.9;
            }
            
            @media (max-width: 768px) {
                .control-btn {
                    width: 70px !important;
                    height: 70px !important;
                    font-size: 1.8rem !important;
                }
                
                .game-controls {
                    padding: 15px 10px !important;
                }
                
                .control-row {
                    gap: 20px !important;
                    margin-bottom: 15px !important;
                }
            }
            
            @media (max-width: 480px) {
                .control-btn {
                    width: 65px !important;
                    height: 65px !important;
                    font-size: 1.6rem !important;
                }
                
                .action-btn, .special-btn {
                    padding: 12px 20px !important;
                    font-size: 1rem !important;
                    min-width: 140px !important;
                }
            }
            
            /* Предотвращение выделения текста при касании */
            * {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ==================== УПРАВЛЕНИЕ ВИДИМОСТЬЮ КНОПОК ====================
    function showTouchControls() {
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.display = 'flex';
            gameControls.style.opacity = '1';
            
            // Добавляем анимацию появления
            gameControls.style.animation = 'fadeIn 0.3s ease';
        }
    }
    
    function hideTouchControls() {
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.display = 'none';
        }
    }
    
    // ==================== СВАЙПЫ И ЖЕСТЫ ====================
    function setupSwipeControls() {
        if (!isTouchDevice) return;
        
        let startX, startY, endX, endY;
        const minSwipeDistance = 50;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY || !playerRef) return;
            
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            // Горизонтальные свайпы
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > minSwipeDistance) {
                    if (diffX > 0) {
                        // Свайп вправо
                        playerRef.moveRight();
                        setTimeout(() => playerRef.stop(), 300);
                    } else {
                        // Свайп влево
                        playerRef.moveLeft();
                        setTimeout(() => playerRef.stop(), 300);
                    }
                }
            }
            // Вертикальные свайпы
            else if (Math.abs(diffY) > minSwipeDistance) {
                if (diffY < 0) {
                    // Свайп вверх (прыжок)
                    playerRef.jump();
                }
            }
            
            // Сброс
            startX = null;
            startY = null;
        });
    }
    
    // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================
    return {
        init: init,
        
        // Определение платформы
        isMobile: () => isMobile,
        isTablet: () => isTablet,
        isTouchDevice: () => isTouchDevice,
        getPlatform: () => getPlatformName(),
        
        // Управление
        setupPlayer: setupPlayer,
        showControls: showTouchControls,
        hideControls: hideTouchControls,
        setupSwipeControls: setupSwipeControls,
        
        // Для отладки
        forceMobile: () => {
            isMobile = true;
            isTouchDevice = true;
            localStorage.setItem('forceMobile', 'true');
            console.log('📱 Принудительно включен мобильный режим');
        },
        
        forceDesktop: () => {
            isMobile = false;
            isTablet = false;
            isTouchDevice = false;
            localStorage.setItem('forceDesktop', 'true');
            console.log('🖥️ Принудительно включен десктопный режим');
        }
    };
})();

// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    window.MobileControl = MobileControl.init();
    console.log('🎮 Мобильное управление инициализировано');
    
    // Экспортируем функцию удаления багов для мобильного управления
    window.removeAllBugs = function() {
        // Эта функция должна быть определена в game.js
        console.log('🐛 Удаление всех багов вызвано из мобильного управления');
    };
});

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControl;
}
