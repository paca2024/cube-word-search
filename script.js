class CubeWordSearch {
    constructor() {
        this.cube = document.querySelector('.cube');
        this.faces = Array.from(document.querySelectorAll('.face'));
        this.rotationX = 0;
        this.rotationY = 0;
        this.currentFaceDisplay = document.getElementById('currentFace');
        this.selectedCells = [];
        this.words = [];
        this.foundWords = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.totalWords = 0;
        this.score = 0;
        this.timeElapsed = 0;
        this.gameActive = true;
        this.timerElement = document.getElementById('timer');
        this.isSelecting = false;
        
        // Get user ID from localStorage
        this.userId = localStorage.getItem('userId');
        if (!this.userId) {
            window.location.href = 'login.html';
            return;
        }

        // Anti-cheat properties
        this.lastActionTime = Date.now();
        this.actionCounts = {
            selections: 0,
            foundWords: 0,
            rotations: 0
        };
        this.suspiciousActivity = false;
        this.maxActionsPerSecond = 10;
        this.maxWordsPerMinute = 20;
        this.consecutiveFinds = 0;
        this.lastWordFoundTime = Date.now();
        
        // Initialize game components
        this.initializeGame();
        this.initializeTimer();
        this.setupEventListeners();
        this.initializeEndButton();
        document.getElementById('userId').textContent = `Player: ${this.userId}`;
        document.getElementById('score').textContent = `Score: ${this.score}`;
        
        // Initialize anti-cheat monitoring
        this.initializeAntiCheat();
    }

    initializeTimer() {
        this.timerElement = document.getElementById('timer');
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const currentTime = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            this.timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.updateScore();
        }, 1000);
    }

    initializeGame() {
        // Define words for each face
        const wordsByFace = [
            // Face 1: Blockchain Basics
            ['BLOCKCHAIN', 'BITCOIN', 'ETHEREUM', 'MINING', 'VALIDATOR', 'NETWORK', 'PROTOCOL', 'GENESIS', 'ALTCOIN', 'MEMPOOL'],
            
            // Face 2: DeFi & Trading
            ['SMARTCHAIN', 'DEFI', 'STAKING', 'LENDING', 'YIELDFARM', 'LIQUIDITY', 'TRADING', 'EXCHANGE', 'LEVERAGE', 'FUTURES'],
            
            // Face 3: Security & Storage
            ['COLDWALLET', 'PRIVATE', 'SECURITY', 'STORAGE', 'HARDWARE', 'DIGITAL', 'ASSETS', 'HOLDING', 'WALLET', 'KEYSTORE'],
            
            // Face 4: Technical Terms
            ['CONSENSUS', 'HASHRATE', 'MERKLE', 'SIGNATURE', 'VIRTUAL', 'SCALING', 'ORACLE', 'SHARDING', 'BRIDGE', 'LAYER'],
            
            // Face 5: Sustainability
            ['RENEWABLE', 'CLEAN', 'CARBON', 'CLIMATE', 'ECOSYSTEM', 'GREEN', 'ENERGY', 'EARTH', 'RECYCLE', 'NATURE'],
            
            // Face 6: NFT & Gaming
            ['METAVERSE', 'GAMING', 'AVATAR', 'VIRTUAL', 'DIGITAL', 'PLAYER', 'REWARD', 'TOKEN', 'ITEM', 'CRAFT']
        ];

        this.words = [];
        this.foundWords = 0;
        this.selectedCells = [];

        // Initialize each face with its words
        this.faces.forEach((face, index) => {
            const grid = face.querySelector('.grid');
            const generatedGrid = this.generateGrid(wordsByFace[index]);
            this.createGridElements(face, generatedGrid);
            
            // Add words to the word list
            const wordList = document.getElementById('words');
            wordsByFace[index].forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                li.dataset.word = word;
                wordList.appendChild(li);
                this.words.push(word);
            });
        });
        
        this.totalWords = this.words.length;
        this.initializeSelection();
    }

    createGridElements(face, grid) {
        const gridContainer = face.querySelector('.grid');
        gridContainer.innerHTML = '';
        
        // Create the grid elements
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                const cell = document.createElement('div');
                cell.textContent = grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                gridContainer.appendChild(cell);
            }
        }
    }

    generateGrid(words) {
        const size = 10;
        const grid = Array(size).fill().map(() => Array(size).fill(''));
        const directions = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal right-down
            [-1, 1],  // diagonal right-up
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal left-up
            [1, -1]   // diagonal left-down
        ];

        // Sort words by length (longest first)
        const sortedWords = [...words].sort((a, b) => b.length - a.length);

        for (const word of sortedWords) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 500;

            while (!placed && attempts < maxAttempts) {
                // Try strategic positions first for longer words
                let startPos;
                if (attempts < 100 && word.length > 5) {
                    // Strategic positions for longer words
                    const strategicPositions = [
                        [0, 0], [0, size-1],           // top corners
                        [size-1, 0], [size-1, size-1], // bottom corners
                        [Math.floor(size/2), Math.floor(size/2)] // center
                    ];
                    startPos = strategicPositions[Math.floor(attempts / 20)];
                } else {
                    // Random position
                    startPos = [
                        Math.floor(Math.random() * size),
                        Math.floor(Math.random() * size)
                    ];
                }

                // Try each direction
                const shuffledDirections = [...directions]
                    .sort(() => Math.random() - 0.5);

                for (const [dx, dy] of shuffledDirections) {
                    if (this.canPlaceWord(grid, word, startPos[0], startPos[1], dx, dy, size)) {
                        this.placeWord(grid, word, startPos[0], startPos[1], dx, dy);
                        placed = true;
                        break;
                    }
                }

                attempts++;
            }

            if (!placed) {
                console.error(`❌ Failed to place word: "${word}" after ${maxAttempts} attempts`);
            }
        }

        // Fill empty spaces with random letters
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (grid[i][j] === '') {
                    grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }

        return grid;
    }

    canPlaceWord(grid, word, startX, startY, dx, dy, size) {
        const length = word.length;

        // Check if word fits within grid bounds
        const endX = startX + (length - 1) * dx;
        const endY = startY + (length - 1) * dy;
        if (endX < 0 || endX >= size || endY < 0 || endY >= size) {
            return false;
        }

        // Check if path is clear
        for (let i = 0; i < length; i++) {
            const x = startX + i * dx;
            const y = startY + i * dy;
            const currentCell = grid[x][y];
            
            if (currentCell !== '' && currentCell !== word[i]) {
                return false;
            }
        }

        return true;
    }

    placeWord(grid, word, startX, startY, dx, dy) {
        for (let i = 0; i < word.length; i++) {
            const x = startX + i * dx;
            const y = startY + i * dy;
            grid[x][y] = word[i];
        }
    }

    initializeSelection() {
        let selectedCells = [];

        this.faces.forEach(face => {
            const grid = face.querySelector('.grid');
            
            // Click selection
            grid.addEventListener('click', (e) => {
                if (e.target.classList.contains('grid')) return;
                
                const cell = e.target;
                
                // If cell is already selected and it's the last one, remove it
                if (selectedCells.includes(cell) && cell === selectedCells[selectedCells.length - 1]) {
                    cell.classList.remove('selected');
                    selectedCells.pop();
                    return;
                }
                
                // Add new cell to selection (even if it's part of a found word)
                cell.classList.add('selected');
                selectedCells.push(cell);
                
                // Check if we've formed a valid word
                const word = selectedCells.map(c => c.textContent).join('');
                const reversedWord = word.split('').reverse().join('');
                const foundWord = this.words.find(w => w === word || w === reversedWord);
                
                if (foundWord) {
                    // Mark word as found in the list
                    const wordElement = document.querySelector(`#words li[data-word="${foundWord}"]`);
                    if (wordElement && !wordElement.classList.contains('found')) {
                        wordElement.classList.add('found');
                        this.foundWords++;

                        // Mark cells as found while preserving existing found state
                        selectedCells.forEach(c => {
                            c.classList.remove('selected');
                            c.classList.add('found');
                        });

                        // Clear selection
                        selectedCells = [];

                        // Check for game completion
                        if (this.foundWords === this.totalWords) {
                            this.endGame();
                        }
                    } else {
                        // Word was already found, clear selection
                        selectedCells.forEach(c => {
                            c.classList.remove('selected');
                        });
                        selectedCells = [];
                    }
                }
            });

            // Clear button (right click)
            grid.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
                selectedCells = [];
            });
        });
    }

    endGame() {
        clearInterval(this.timerInterval);
        
        // Calculate final score based on words found
        const finalScore = this.foundWords === 0 ? 0 : this.score;
        const timeBonus = this.foundWords === 0 ? 0 : Math.max(0, Math.floor((300 - this.timeElapsed) * 2));
        const totalScore = finalScore + timeBonus;

        // Create game history entry
        const gameEntry = {
            userId: this.userId,
            timestamp: new Date().toISOString(),
            score: totalScore,
            wordsFound: this.foundWords,
            totalWords: this.totalWords,
            timeElapsed: this.timeElapsed
        };

        // Save to localStorage
        const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        gameHistory.push(gameEntry);
        localStorage.setItem('gameHistory', JSON.stringify(gameHistory));

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        let message = '';
        if (this.foundWords === 0) {
            message = `
                <h2>Game Over!</h2>
                <p>😔 No words found!</p>
                <p>Keep trying - you can do better!</p>
                <div class="stats">
                    <div>Words Found: 0/${this.totalWords}</div>
                    <div>Base Score: 0</div>
                    <div>Time Bonus: 0</div>
                    <div>Total Score: 0</div>
                </div>
            `;
        } else if (this.foundWords === this.totalWords) {
            message = `
                <h2>🎉 Congratulations!</h2>
                <p>You found all the words!</p>
                <div class="stats">
                    <div>Words Found: ${this.foundWords}/${this.totalWords}</div>
                    <div>Base Score: ${finalScore}</div>
                    <div>Time Bonus: ${timeBonus}</div>
                    <div>Total Score: ${totalScore}</div>
                </div>
            `;
        } else {
            message = `
                <h2>Game Over!</h2>
                <p>Good effort! You found ${this.foundWords} out of ${this.totalWords} words.</p>
                <div class="stats">
                    <div>Words Found: ${this.foundWords}/${this.totalWords}</div>
                    <div>Base Score: ${finalScore}</div>
                    <div>Time Bonus: ${timeBonus}</div>
                    <div>Total Score: ${totalScore}</div>
                </div>
            `;
        }

        modal.innerHTML = message + `
            <div class="button-group">
                <button onclick="location.reload()">Play Again</button>
                <button onclick="window.location.href='login.html'" class="secondary">Back to Login</button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    updateScore() {
        // Calculate score based on time taken and words found
        const timeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const baseScore = this.foundWords * 100; // 100 points per word
        const timeBonus = Math.max(0, 1000 - timeInSeconds); // Time bonus decreases as time increases
        this.score = baseScore + timeBonus;
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    updateCurrentFace() {
        const x = ((this.rotationX % 360 + 360) % 360) / 90;
        const y = ((this.rotationY % 360 + 360) % 360) / 90;
        
        let currentFace;
        if (x === 0) {
            if (y === 0) currentFace = 1;      // front
            else if (y === 1) currentFace = 3;  // right
            else if (y === 2) currentFace = 2;  // back
            else currentFace = 4;               // left
        } else if (x === 1) {
            currentFace = 5;  // top
        } else if (x === 3) {
            currentFace = 6;  // bottom
        }
        
        this.currentFaceDisplay.textContent = currentFace;
    }

    updateCubeRotation() {
        this.cube.style.transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
    }

    rotateCube(direction) {
        const step = 90;
        switch (direction) {
            case 'up':
                this.rotationX = Math.min(this.rotationX + step, 90);
                break;
            case 'down':
                this.rotationX = Math.max(this.rotationX - step, -90);
                break;
            case 'left':
                this.rotationY -= step;
                break;
            case 'right':
                this.rotationY += step;
                break;
        }
        this.updateCubeRotation();
        this.updateCurrentFace();
    }

    initializeControls() {
        const controls = document.querySelectorAll('.control-btn');
        controls.forEach(control => {
            control.addEventListener('click', () => {
                if (this.isSelecting) return;
                
                const direction = control.dataset.direction;
                this.rotateCube(direction);
                
                // Add click animation
                control.classList.add('clicked');
                setTimeout(() => {
                    control.classList.remove('clicked');
                }, 200);
            });
        });
    }

    initializeEndButton() {
        const endButton = document.getElementById('endGame');
        endButton.addEventListener('click', () => this.endGame());
    }

    initializeAntiCheat() {
        // Monitor console opening
        let devtoolsOpen = false;
        const timeThreshold = 100;
        const threshold = 160;
        const handler = {
            get: function(target, name) {
                if (name === 'toString') {
                    devtoolsOpen = true;
                    return function() {
                        return '[native code]';
                    };
                }
                return target[name];
            }
        };
        
        const check = new Proxy(handler, handler);
        setInterval(() => {
            const start = performance.now();
            debugger;
            const end = performance.now();
            
            if (end - start > threshold || devtoolsOpen) {
                this.handleCheating('DevTools detected');
            }
        }, timeThreshold);

        // Prevent source code viewing
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey && (e.key === 'u' || e.key === 's')) || 
                (e.key === 'F12') || 
                (e.ctrlKey && e.shiftKey && e.key === 'i')) {
                e.preventDefault();
                this.handleCheating('Attempted to view source code');
            }
        });

        // Monitor localStorage tampering
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (...args) => {
            if (args[0].includes('gameHistory')) {
                const data = JSON.parse(args[1]);
                if (this.isScoreSuspicious(data)) {
                    this.handleCheating('Suspicious score detected');
                    return;
                }
            }
            originalSetItem.apply(localStorage, args);
        };
    }

    isScoreSuspicious(data) {
        if (!Array.isArray(data)) return true;
        
        const lastEntry = data[data.length - 1];
        if (!lastEntry) return false;

        // Check for impossibly high scores
        if (lastEntry.score > this.totalWords * 1100) return true;

        // Check for impossible completion times
        const minTimePerWord = 1000; // 1 second minimum per word
        const gameTime = new Date(lastEntry.timestamp) - this.startTime;
        if (gameTime < lastEntry.wordsFound * minTimePerWord) return true;

        return false;
    }

    handleCheating(reason) {
        if (this.suspiciousActivity) return; // Only handle once
        
        this.suspiciousActivity = true;
        console.warn('Suspicious activity detected:', reason);
        
        // Save cheating attempt to localStorage
        const cheatingAttempts = JSON.parse(localStorage.getItem('cheatingAttempts') || '[]');
        cheatingAttempts.push({
            userId: this.userId,
            timestamp: new Date().toISOString(),
            reason: reason
        });
        localStorage.setItem('cheatingAttempts', JSON.stringify(cheatingAttempts));

        // Clear game progress
        this.score = 0;
        this.foundWords = 0;
        clearInterval(this.timerInterval);
        
        // Show warning modal
        const modal = document.createElement('div');
        modal.className = 'modal warning';
        modal.innerHTML = `
            <h2>⚠️ Warning</h2>
            <p>Suspicious activity detected. Your game has been reset.</p>
            <p>Fair play makes the game more enjoyable for everyone!</p>
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        // Reload after 3 seconds
        setTimeout(() => location.reload(), 3000);
    }

    checkActionRate() {
        const now = Date.now();
        const timeDiff = now - this.lastActionTime;
        
        this.actionCounts.selections++;
        
        // Check for rapid actions
        if (timeDiff < 1000 && this.actionCounts.selections > this.maxActionsPerSecond) {
            this.handleCheating('Too many actions per second');
            return false;
        }
        
        // Reset counters every second
        if (timeDiff > 1000) {
            this.actionCounts.selections = 0;
            this.lastActionTime = now;
        }
        
        return true;
    }

    checkWordFindRate() {
        const now = Date.now();
        const timeSinceLastWord = now - this.lastWordFoundTime;
        
        // Check for consecutive quick finds
        if (timeSinceLastWord < 500) {
            this.consecutiveFinds++;
            if (this.consecutiveFinds > 3) {
                this.handleCheating('Words found too quickly');
                return false;
            }
        } else {
            this.consecutiveFinds = 0;
        }
        
        // Check words per minute
        const gameTime = (now - this.startTime) / 1000 / 60; // in minutes
        if (gameTime > 0 && (this.foundWords / gameTime) > this.maxWordsPerMinute) {
            this.handleCheating('Too many words found per minute');
            return false;
        }
        
        this.lastWordFoundTime = now;
        return true;
    }

    checkSelectedWord() {
        if (!this.checkActionRate()) return;
        
        let selectedCells = [];

        this.faces.forEach(face => {
            const grid = face.querySelector('.grid');
            
            // Click selection
            grid.addEventListener('click', (e) => {
                if (e.target.classList.contains('grid')) return;
                
                const cell = e.target;
                
                // If cell is already selected and it's the last one, remove it
                if (selectedCells.includes(cell) && cell === selectedCells[selectedCells.length - 1]) {
                    cell.classList.remove('selected');
                    selectedCells.pop();
                    return;
                }
                
                // Add new cell to selection (even if it's part of a found word)
                cell.classList.add('selected');
                selectedCells.push(cell);
                
                // Check if we've formed a valid word
                const word = selectedCells.map(c => c.textContent).join('');
                const reversedWord = word.split('').reverse().join('');
                const foundWord = this.words.find(w => w === word || w === reversedWord);
                
                if (foundWord) {
                    if (!this.checkWordFindRate()) return;
                    
                    // Mark word as found in the list
                    const wordElement = document.querySelector(`#words li[data-word="${foundWord}"]`);
                    if (wordElement && !wordElement.classList.contains('found')) {
                        wordElement.classList.add('found');
                        this.foundWords++;

                        // Mark cells as found while preserving existing found state
                        selectedCells.forEach(c => {
                            c.classList.remove('selected');
                            c.classList.add('found');
                        });

                        // Clear selection
                        selectedCells = [];

                        // Check for game completion
                        if (this.foundWords === this.totalWords) {
                            this.endGame();
                        }
                    } else {
                        // Word was already found, clear selection
                        selectedCells.forEach(c => {
                            c.classList.remove('selected');
                        });
                        selectedCells = [];
                    }
                }
            });

            // Clear button (right click)
            grid.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
                selectedCells = [];
            });
        });
    }

    refreshGame() {
        // Clear existing game state
        this.score = 0;
        this.timeElapsed = 0;
        this.foundWords = 0;
        this.totalWords = 0;
        this.words = [];
        clearInterval(this.timerInterval);
        
        // Remove existing elements
        const container = document.querySelector('.cube-container');
        const wordList = document.getElementById('words');
        if (container) container.remove();
        if (wordList) wordList.innerHTML = '';
        
        // Reinitialize game
        this.initializeGame();
        this.initializeTimer();
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    setupEventListeners() {
        const refreshButton = document.getElementById('refreshGame');
        refreshButton.addEventListener('click', () => this.refreshGame());
    }
}

class SnowAnimation {
    constructor() {
        this.snowContainer = document.querySelector('.snow-container');
        this.snowflakeCount = 50;
        this.createSnowflakes();
    }

    createSnowflakes() {
        for (let i = 0; i < this.snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            
            // Random properties for natural look
            const size = Math.random() * 5 + 2;
            const startPositionX = Math.random() * window.innerWidth;
            const startPositionY = Math.random() * window.innerHeight;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;
            
            // Apply styles
            snowflake.style.width = `${size}px`;
            snowflake.style.height = `${size}px`;
            snowflake.style.left = `${startPositionX}px`;
            snowflake.style.top = `${startPositionY}px`;
            snowflake.style.animationDuration = `${duration}s`;
            snowflake.style.animationDelay = `${delay}s`;
            
            this.snowContainer.appendChild(snowflake);
            
            // Remove and recreate snowflake when animation ends
            snowflake.addEventListener('animationend', () => {
                snowflake.remove();
                this.createSingleSnowflake();
            });
        }
    }

    createSingleSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        const size = Math.random() * 5 + 2;
        const startPositionX = Math.random() * window.innerWidth;
        const duration = Math.random() * 3 + 2;
        
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        snowflake.style.left = `${startPositionX}px`;
        snowflake.style.top = '-10px';
        snowflake.style.animationDuration = `${duration}s`;
        
        this.snowContainer.appendChild(snowflake);
        
        snowflake.addEventListener('animationend', () => {
            snowflake.remove();
            this.createSingleSnowflake();
        });
    }
}

// Initialize both game and snow animation
window.onload = function() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    new CubeWordSearch();
    new SnowAnimation();
}
