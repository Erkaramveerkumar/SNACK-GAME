document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const GRID_SIZE = 20;
    const DIFFICULTY_SETTINGS = {
        easy: { speed: 200, specialFoodChance: 0.1, obstaclesCount: 0 },
        medium: { speed: 150, specialFoodChance: 0.15, obstaclesCount: 3 },
        hard: { speed: 100, specialFoodChance: 0.2, obstaclesCount: 5 },
        extreme: { speed: 70, specialFoodChance: 0.25, obstaclesCount: 8 }
    };
    const DIRECTIONS = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    };
    const SPECIAL_FOOD_POINTS = 5;
    const SPECIAL_FOOD_DURATION = 7000; // milliseconds
    const LEVEL_UP_THRESHOLD = 5; // Score needed to level up
    const VIBRATION_DURATION = 30; // milliseconds for button vibration

    // Game variables
    let snake = [];
    let food = {};
    let specialFood = null;
    let specialFoodTimer = null;
    let obstacles = [];
    let direction = DIRECTIONS.RIGHT;
    let nextDirection = DIRECTIONS.RIGHT;
    let gameInterval;
    let score = 0;
    let highScore = 0;
    let level = 1;
    let gameRunning = false;
    let currentDifficulty = 'medium';
    let currentTheme = 'classic';
    let soundEnabled = true;
    let musicEnabled = true;
    let highScores = [];
    let justAteFood = false; // Flag to track if snake just ate food
    let vibrationEnabled = true; // Flag to enable/disable vibration

    // DOM elements - Screens
    const mainMenu = document.getElementById('main-menu');
    const optionsMenu = document.getElementById('options-menu');
    const highscoresScreen = document.getElementById('highscores-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');

    // DOM elements - Game
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const levelElement = document.getElementById('level');
    const finalScoreElement = document.getElementById('final-score');
    const finalHighScoreElement = document.getElementById('final-high-score');
    const newHighScoreMessage = document.getElementById('new-high-score-message');
    const playerNameInput = document.getElementById('player-name');

    // DOM elements - Controls
    const playButton = document.getElementById('play-button');
    const optionsButton = document.getElementById('options-button');
    const highscoresButton = document.getElementById('highscores-button');
    const optionsBackButton = document.getElementById('options-back');
    const highscoresBackButton = document.getElementById('highscores-back');
    const pauseButton = document.getElementById('pause-button');
    const restartButton = document.getElementById('restart-button');
    const menuButton = document.getElementById('menu-button');
    const playAgainButton = document.getElementById('play-again-button');
    const gameOverMenuButton = document.getElementById('game-over-menu-button');

    // DOM elements - Options
    const difficultySelect = document.getElementById('difficulty');
    const themeSelect = document.getElementById('game-theme');
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const vibrationToggle = document.getElementById('vibration-toggle');

    // DOM elements - Mobile Controls
    const upButton = document.getElementById('up-button');
    const downButton = document.getElementById('down-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');

    // Audio elements
    const eatSound = document.getElementById('eat-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    const levelUpSound = document.getElementById('level-up-sound');
    const backgroundMusic = document.getElementById('background-music');

    // Helper function to trigger vibration
    function vibrateDevice() {
        if (vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(VIBRATION_DURATION);
        }
    }

    // Initialize the game
    function init() {
        // Load saved settings and high scores
        loadSettings();
        loadHighScores();
        updateHighScoreDisplay();
        
        // Apply initial theme
        applyTheme(currentTheme);
        
        // Set up event listeners
        setupEventListeners();
    }

    // Load saved settings from localStorage
    function loadSettings() {
        if (localStorage.getItem('snakeSettings')) {
            const settings = JSON.parse(localStorage.getItem('snakeSettings'));
            currentDifficulty = settings.difficulty || 'medium';
            currentTheme = settings.theme || 'classic';
            soundEnabled = settings.sound !== undefined ? settings.sound : true;
            musicEnabled = settings.music !== undefined ? settings.music : true;
            vibrationEnabled = settings.vibration !== undefined ? settings.vibration : true;
            
            // Update DOM to reflect settings
            difficultySelect.value = currentDifficulty;
            themeSelect.value = currentTheme;
            soundToggle.checked = soundEnabled;
            musicToggle.checked = musicEnabled;
            vibrationToggle.checked = vibrationEnabled;
        }
    }

    // Save settings to localStorage
    function saveSettings() {
        const settings = {
            difficulty: currentDifficulty,
            theme: currentTheme,
            sound: soundEnabled,
            music: musicEnabled,
            vibration: vibrationEnabled
        };
        localStorage.setItem('snakeSettings', JSON.stringify(settings));
    }

    // Load high scores from localStorage
    function loadHighScores() {
        if (localStorage.getItem('snakeHighScores')) {
            highScores = JSON.parse(localStorage.getItem('snakeHighScores'));
            if (highScores.length > 0) {
                highScore = highScores[0].score;
            }
        }
    }

    // Save high scores to localStorage
    function saveHighScore(name, newScore, difficulty) {
        highScores.push({
            name: name || 'Anonymous',
            score: newScore,
            difficulty: difficulty,
            date: new Date().toISOString()
        });
        
        // Sort high scores and keep only top 10
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > 10) {
            highScores = highScores.slice(0, 10);
        }
        
        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
        updateHighScoreDisplay();
    }

    // Update high score table
    function updateHighScoreDisplay() {
        const highScoresBody = document.getElementById('highscores-body');
        highScoresBody.innerHTML = '';
        
        highScores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.difficulty}</td>
            `;
            highScoresBody.appendChild(row);
        });
        
        // Update high score display in game
        if (highScores.length > 0) {
            highScore = highScores[0].score;
            highScoreElement.textContent = highScore;
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Menu navigation
        playButton.addEventListener('click', () => {
            vibrateDevice();
            showScreen(gameScreen);
            startNewGame();
        });
        
        optionsButton.addEventListener('click', () => {
            vibrateDevice();
            showScreen(optionsMenu);
        });
        
        highscoresButton.addEventListener('click', () => {
            vibrateDevice();
            showScreen(highscoresScreen);
        });
        
        optionsBackButton.addEventListener('click', () => {
            vibrateDevice();
            showScreen(mainMenu);
            saveSettings();
        });
        
        highscoresBackButton.addEventListener('click', () => {
            vibrateDevice();
            showScreen(mainMenu);
        });
        
        // Game controls
        pauseButton.addEventListener('click', () => {
            vibrateDevice();
            togglePause();
        });
        
        restartButton.addEventListener('click', () => {
            vibrateDevice();
            startNewGame();
        });
        
        menuButton.addEventListener('click', () => {
            vibrateDevice();
            resetGame();
            showScreen(mainMenu);
        });
        
        // Game over controls
        playAgainButton.addEventListener('click', () => {
            vibrateDevice();
            if (newHighScoreMessage.classList.contains('hidden') === false) {
                const playerName = playerNameInput.value.trim() || 'Anonymous';
                saveHighScore(playerName, score, currentDifficulty);
            }
            showScreen(gameScreen);
            startNewGame();
        });
        
        gameOverMenuButton.addEventListener('click', () => {
            vibrateDevice();
            if (newHighScoreMessage.classList.contains('hidden') === false) {
                const playerName = playerNameInput.value.trim() || 'Anonymous';
                saveHighScore(playerName, score, currentDifficulty);
            }
            showScreen(mainMenu);
        });
        
        // Options controls
        difficultySelect.addEventListener('change', (e) => {
            vibrateDevice();
            currentDifficulty = e.target.value;
        });
        
        themeSelect.addEventListener('change', (e) => {
            vibrateDevice();
            currentTheme = e.target.value;
            applyTheme(currentTheme);
        });
        
        soundToggle.addEventListener('change', (e) => {
            vibrateDevice();
            soundEnabled = e.target.checked;
        });
        
        musicToggle.addEventListener('change', (e) => {
            vibrateDevice();
            musicEnabled = e.target.checked;
            if (musicEnabled) {
                backgroundMusic.play();
            } else {
                backgroundMusic.pause();
            }
        });
        
        vibrationToggle.addEventListener('change', (e) => {
            // Don't vibrate here to respect the new setting immediately
            vibrationEnabled = e.target.checked;
        });
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);
        
        // Mobile controls
        upButton.addEventListener('click', () => {
            vibrateDevice();
            if (direction !== DIRECTIONS.DOWN) {
                nextDirection = DIRECTIONS.UP;
            }
        });
        
        downButton.addEventListener('click', () => {
            vibrateDevice();
            if (direction !== DIRECTIONS.UP) {
                nextDirection = DIRECTIONS.DOWN;
            }
        });
        
        leftButton.addEventListener('click', () => {
            vibrateDevice();
            if (direction !== DIRECTIONS.RIGHT) {
                nextDirection = DIRECTIONS.LEFT;
            }
        });
        
        rightButton.addEventListener('click', () => {
            vibrateDevice();
            if (direction !== DIRECTIONS.LEFT) {
                nextDirection = DIRECTIONS.RIGHT;
            }
        });
    }

    // Show a specific screen
    function showScreen(screen) {
        // Hide all screens
        mainMenu.classList.remove('active');
        optionsMenu.classList.remove('active');
        highscoresScreen.classList.remove('active');
        gameScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        
        // Show the requested screen
        screen.classList.add('active');
        
        // Special handling for game screen
        if (screen === gameScreen) {
            if (musicEnabled && !backgroundMusic.playing) {
                backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }

    // Apply selected theme
    function applyTheme(theme) {
        document.body.className = ''; // Clear existing themes
        if (theme !== 'classic') {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    // Initialize the game board
    function initializeBoard() {
        gameBoard.innerHTML = '';
        // Create grid cells
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            gameBoard.appendChild(cell);
        }
    }

    // Start a new game
    function startNewGame() {
        resetGame();
        gameRunning = true;
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        const gameSpeed = DIFFICULTY_SETTINGS[currentDifficulty].speed;
        gameInterval = setInterval(gameLoop, gameSpeed);
        
        if (musicEnabled) {
            backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    // Toggle pause state
    function togglePause() {
        if (gameRunning) {
            gameRunning = false;
            pauseButton.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(gameInterval);
            if (musicEnabled) {
                backgroundMusic.pause();
            }
        } else {
            gameRunning = true;
            pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            const gameSpeed = DIFFICULTY_SETTINGS[currentDifficulty].speed;
            gameInterval = setInterval(gameLoop, gameSpeed);
            if (musicEnabled) {
                backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }

    // Reset the game
    function resetGame() {
        clearInterval(gameInterval);
        if (specialFoodTimer) {
            clearTimeout(specialFoodTimer);
            specialFoodTimer = null;
        }
        
        // Initialize snake
        snake = [{ x: 10, y: 10 }]; // Starting position
        
        // Generate food and obstacles
        food = generateFood();
        specialFood = null;
        generateObstacles();
        
        // Reset game state
        direction = DIRECTIONS.RIGHT;
        nextDirection = DIRECTIONS.RIGHT;
        score = 0;
        level = 1;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        highScoreElement.textContent = highScore;
        
        // Reset game status
        gameRunning = false;
        
        // Initialize board and draw game
        initializeBoard();
        drawGame();
    }

    // Generate obstacles based on difficulty
    function generateObstacles() {
        obstacles = [];
        const obstaclesCount = DIFFICULTY_SETTINGS[currentDifficulty].obstaclesCount;
        
        for (let i = 0; i < obstaclesCount; i++) {
            let obstaclePosition;
            let validPosition = false;
            
            // Keep trying until we find a valid position
            while (!validPosition) {
                obstaclePosition = {
                    x: Math.floor(Math.random() * GRID_SIZE),
                    y: Math.floor(Math.random() * GRID_SIZE)
                };
                
                // Check if position is valid (not on snake or food)
                validPosition = true;
                
                // Check if on snake
                for (const segment of snake) {
                    if (segment.x === obstaclePosition.x && segment.y === obstaclePosition.y) {
                        validPosition = false;
                        break;
                    }
                }
                
                // Check if on food
                if (validPosition && food.x === obstaclePosition.x && food.y === obstaclePosition.y) {
                    validPosition = false;
                }
                
                // Check if too close to snake head (give player some space)
                if (validPosition) {
                    const head = snake[0];
                    const distance = Math.abs(head.x - obstaclePosition.x) + Math.abs(head.y - obstaclePosition.y);
                    if (distance < 5) { // Minimum Manhattan distance
                        validPosition = false;
                    }
                }
                
                // Check if too close to other obstacles
                if (validPosition) {
                    for (const obstacle of obstacles) {
                        if (Math.abs(obstacle.x - obstaclePosition.x) + Math.abs(obstacle.y - obstaclePosition.y) < 2) {
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            
            obstacles.push(obstaclePosition);
        }
    }

    // Main game loop
    function gameLoop() {
        if (!gameRunning) return;
        
        direction = nextDirection;
        moveSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        if (checkFoodCollision()) {
            eatFood();
        }
        
        if (specialFood && checkSpecialFoodCollision()) {
            eatSpecialFood();
        }
        
        drawGame();
    }

    // Move the snake
    function moveSnake() {
        // Create new head position based on current direction
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;
        
        // Add new head to beginning of snake array
        snake.unshift(head);
        
        // Remove tail unless snake just ate food (handled in eatFood/eatSpecialFood)
        if (!justAteFood) {
            snake.pop();
        } else {
            justAteFood = false; // Reset the flag
        }
        
        // Calculate movement direction for snake head animation
        if (snake.length > 1) {
            const prevHead = snake[1];
            if (prevHead.x < head.x) {
                lastDirection = 'right';
            } else if (prevHead.x > head.x) {
                lastDirection = 'left';
            } else if (prevHead.y < head.y) {
                lastDirection = 'down';
            } else if (prevHead.y > head.y) {
                lastDirection = 'up';
            }
        }
    }

    // This function is no longer needed as growth is handled by the justAteFood flag
    // Keeping it for reference but it's not used anymore
    function growSnake() {
        // The snake automatically grows because we don't remove the tail in the next move
        // when justAteFood is true
        justAteFood = true;
    }

    // Check for collisions with walls, obstacles, or self
    function checkCollision() {
        const head = snake[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true;
        }
        
        // Check self collision (start from index 1 to avoid checking head against itself)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        // Check obstacle collision
        for (const obstacle of obstacles) {
            if (head.x === obstacle.x && head.y === obstacle.y) {
                return true;
            }
        }
        
        return false;
    }

    // Check if snake eats regular food
    function checkFoodCollision() {
        const head = snake[0];
        return head.x === food.x && head.y === food.y;
    }

    // Check if snake eats special food
    function checkSpecialFoodCollision() {
        if (!specialFood) return false;
        const head = snake[0];
        return head.x === specialFood.x && head.y === specialFood.y;
    }

    // Handle eating regular food
    function eatFood() {
        // Set flag that snake just ate food (will prevent tail removal in next move)
        justAteFood = true;
        
        // Generate new food
        food = generateFood();
        updateScore(1);
        
        // Play sound effect
        if (soundEnabled) {
            eatSound.currentTime = 0;
            eatSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Chance to spawn special food
        if (!specialFood && Math.random() < DIFFICULTY_SETTINGS[currentDifficulty].specialFoodChance) {
            spawnSpecialFood();
        }
    }

    // Handle eating special food
    function eatSpecialFood() {
        // Set flag that snake just ate food (will prevent tail removal in next move)
        justAteFood = true;
        
        // Give extra points and make snake grow even more (one segment already added by justAteFood)
        justAteFood = true; // Set again to grow by one more segment in the next move
        
        updateScore(SPECIAL_FOOD_POINTS);
        specialFood = null;
        
        if (specialFoodTimer) {
            clearTimeout(specialFoodTimer);
            specialFoodTimer = null;
        }
        
        // Play sound effect
        if (soundEnabled) {
            eatSound.currentTime = 0;
            eatSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Flash effect
        gameBoard.classList.add('flash');
        setTimeout(() => {
            gameBoard.classList.remove('flash');
        }, 300);
    }

    // Spawn special food
    function spawnSpecialFood() {
        specialFood = generateFood(true);
        
        // Set timer for special food to disappear
        specialFoodTimer = setTimeout(() => {
            specialFood = null;
            specialFoodTimer = null;
            drawGame(); // Redraw to remove special food
        }, SPECIAL_FOOD_DURATION);
    }

    // Generate food at random position
    function generateFood(isSpecial = false) {
        let newFood;
        let validPosition = false;
        
        while (!validPosition) {
            validPosition = true;
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            
            // Check if on snake
            for (const segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check if on obstacles
            if (validPosition) {
                for (const obstacle of obstacles) {
                    if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Check if on other food
            if (validPosition && !isSpecial && specialFood) {
                if (specialFood.x === newFood.x && specialFood.y === newFood.y) {
                    validPosition = false;
                }
            }
            
            if (validPosition && isSpecial && food) {
                if (food.x === newFood.x && food.y === newFood.y) {
                    validPosition = false;
                }
            }
        }
        
        return newFood;
    }

    // Update score
    function updateScore(points) {
        score += points;
        scoreElement.textContent = score;
        
        // Check for high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
        }
        
        // Check for level up
        if (score >= level * LEVEL_UP_THRESHOLD) {
            levelUp();
        }
    }

    // Level up
    function levelUp() {
        level++;
        levelElement.textContent = level;
        
        // Play level up sound
        if (soundEnabled) {
            levelUpSound.currentTime = 0;
            levelUpSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Visual effect
        levelElement.classList.add('level-up-animation');
        setTimeout(() => {
            levelElement.classList.remove('level-up-animation');
        }, 1000);
        
        // Increase game speed slightly with each level
        clearInterval(gameInterval);
        const baseSpeed = DIFFICULTY_SETTINGS[currentDifficulty].speed;
        const speedReduction = Math.min(30, (level - 1) * 5); // Cap the speed increase
        const newSpeed = Math.max(50, baseSpeed - speedReduction); // Don't go below 50ms
        
        gameInterval = setInterval(gameLoop, newSpeed);
    }

    // Variable to track snake head direction for animation
    let lastDirection = 'right'; // Default direction for snake head
    
    // Draw the game
    function drawGame() {
        // Clear the board
        const cells = gameBoard.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].className = '';
        }
        
        // Draw obstacles
        obstacles.forEach(obstacle => {
            const obstacleIndex = obstacle.y * GRID_SIZE + obstacle.x;
            if (cells[obstacleIndex]) {
                cells[obstacleIndex].classList.add('obstacle');
            }
        });
        
        // Draw snake
        snake.forEach((segment, index) => {
            if (segment.x >= 0 && segment.x < GRID_SIZE && segment.y >= 0 && segment.y < GRID_SIZE) {
                const cellIndex = segment.y * GRID_SIZE + segment.x;
                if (cells[cellIndex]) {
                    cells[cellIndex].classList.add('snake');
                    if (index === 0) {
                        cells[cellIndex].classList.add('head');
                        cells[cellIndex].classList.add(lastDirection);
                        
                        // Randomly show tongue animation (1 in 10 chance)
                        if (Math.random() < 0.1) {
                            cells[cellIndex].classList.add('show-tongue');
                            setTimeout(() => {
                                const head = document.querySelector('.snake.head');
                                if (head) head.classList.remove('show-tongue');
                            }, 500);
                        }
                    } else if (index === snake.length - 1) {
                        cells[cellIndex].classList.add('tail');
                    }
                }
            }
        });
        
        // Draw food
        const foodIndex = food.y * GRID_SIZE + food.x;
        if (cells[foodIndex]) {
            cells[foodIndex].classList.add('food');
        }
        
        // Draw special food if it exists
        if (specialFood) {
            const specialFoodIndex = specialFood.y * GRID_SIZE + specialFood.x;
            if (cells[specialFoodIndex]) {
                cells[specialFoodIndex].classList.add('special-food');
            }
        }
    }

    // Handle keyboard input
    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowUp':
                if (direction !== DIRECTIONS.DOWN) {
                    nextDirection = DIRECTIONS.UP;
                    vibrateDevice();
                }
                break;
            case 'ArrowDown':
                if (direction !== DIRECTIONS.UP) {
                    nextDirection = DIRECTIONS.DOWN;
                    vibrateDevice();
                }
                break;
            case 'ArrowLeft':
                if (direction !== DIRECTIONS.RIGHT) {
                    nextDirection = DIRECTIONS.LEFT;
                    vibrateDevice();
                }
                break;
            case 'ArrowRight':
                if (direction !== DIRECTIONS.LEFT) {
                    nextDirection = DIRECTIONS.RIGHT;
                    vibrateDevice();
                }
                break;
            case ' ': // Spacebar
                if (gameScreen.classList.contains('active')) {
                    togglePause();
                    vibrateDevice();
                }
                break;
            case 'Escape': // Escape key
                if (gameScreen.classList.contains('active')) {
                    resetGame();
                    showScreen(mainMenu);
                    vibrateDevice();
                }
                break;
        }
    }

    // Game over
    function gameOver() {
        clearInterval(gameInterval);
        gameRunning = false;
        
        if (soundEnabled) {
            gameOverSound.currentTime = 0;
            gameOverSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        if (musicEnabled) {
            backgroundMusic.pause();
        }
        
        // Update game over screen
        finalScoreElement.textContent = score;
        finalHighScoreElement.textContent = highScore;
        
        // Check if this is a new high score
        if (score > 0 && (highScores.length < 10 || score > highScores[highScores.length - 1].score)) {
            newHighScoreMessage.classList.remove('hidden');
            playerNameInput.value = '';
            playerNameInput.focus();
        } else {
            newHighScoreMessage.classList.add('hidden');
        }
        
        showScreen(gameOverScreen);
    }

    // Initialize the game
    init();
});