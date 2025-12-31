// ============================================
// DIPSIK: МОБИЛЬНОЕ УПРАВЛЕНИЕ
// ============================================

const MobileControl = (function() {
    let isMobile = false;
    let isTablet = false;
    let isTouchDevice = false;
    let playerRef = null;
    
    function detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        isTouchDevice = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);
        
        isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        isAndroid = /android/i.test(userAgent);
        
        const mobileCheck = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        isMobile = mobileCheck && !isTablet;
        isTablet = /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(userAgent);
        
        if (!isTablet && window.innerWidth >= 768 && window.innerWidth <= 1024) {
            isTablet = true;
            isMobile = false;
        }
    }
    
    function getPlatformName() {
        if (isIOS) return 'iOS';
        if (isAndroid) return 'Android';
        if (isTablet) return 'Tablet';
        if (isMobile) return 'Mobile';
        return 'Desktop';
    }
    
    function setupPlayer(player) {
        playerRef = player;
        console.log('🎮 Объект игрока установлен');
    }
    
    function showTouchControls() {
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.display = 'flex';
            console.log('📱 Показываем мобильное управление');
        }
    }
    
    function hideTouchControls() {
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.display = 'none';
        }
    }
    
    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        detectPlatform();
        
        // Экспортируем объект в глобальную область видимости
        window.MobileControl = {
            isMobile: () => isMobile,
            isTablet: () => isTablet,
            isTouchDevice: () => isTouchDevice,
            getPlatform: () => getPlatformName(),
            setupPlayer: setupPlayer,
            showControls: showTouchControls,
            hideControls: hideTouchControls
        };
        
        console.log(`🎮 Мобильное управление готово (${getPlatformName()})`);
    });
    
    return {
        init: () => {}, // Заглушка для совместимости
        isMobile: () => isMobile,
        isTablet: () => isTablet,
        isTouchDevice: () => isTouchDevice,
        getPlatform: () => getPlatformName(),
        setupPlayer: setupPlayer,
        showControls: showTouchControls,
        hideControls: hideTouchControls
    };
})();

// Автоматическая инициализация
if (typeof MobileControl !== 'undefined') {
    MobileControl.init();
}
