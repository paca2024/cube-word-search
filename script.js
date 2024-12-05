class WordSearchGame {
    constructor() {
        this.gridSize = 10;
        this.score = 0;
        this.currentFace = 1;
        this.selectedCells = [];
        this.currentWord = '';
        this.isSelecting = false;
        
        // Initialize word lists for each face
        this.wordLists = {
            1: ['BLOCKCHAIN', 'CRYPTO', 'MINING', 'WALLET', 'TOKEN'],
            2: ['FIREWALL', 'ENCRYPT', 'PASSWORD', 'SECURE', 'PROTECT', 'PRIVACY', 'ACCESS'],
            3: ['FUTURES', 'EXCHANGE', 'MARKET', 'TRADE', 'PRICE', 'BUY', 'SELL', 'ORDER', 'LIMIT'],
            4: ['DATABASE', 'CLOUD', 'BACKUP', 'SERVER', 'DISK', 'CACHE', 'FILE', 'DATA', 'SYNC', 'STORE', 'SAVE'],
            5: ['PROTOCOL', 'ROUTER', 'SWITCH', 'PACKET', 'NODE', 'PEER', 'PORT', 'HOST', 'CLIENT', 'PROXY', 'SOCKET', 'DNS', 'IP'],
            6: ['LIQUIDITY', 'YIELD', 'STAKE', 'LOAN', 'SWAP', 'POOL', 'APY', 'FARM', 'VAULT', 'COLLATERAL', 'LENDING', 'BORROW', 'MINT', 'BURN', 'DAO']
        };

        this.foundWordsPerFace = new Map();
        this.completedFaces = new Set();
        
        // Get player name or prompt for it
        this.playerName = localStorage.getItem('playerName');
        if (!this.playerName) {
            this.promptForPlayerName();
        } else {
            this.updatePlayerDisplay();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize game
        this.initializeGame();
        
        // Start timer
        this.startTimer();
    }

    promptForPlayerName() {
        let name = prompt('Enter your name:', '');
        if (name === null || name.trim() === '') {
            name = 'Guest';
        }
        this.playerName = name.trim();
        localStorage.setItem('playerName', this.playerName);
        this.updatePlayerDisplay();
    }

    updatePlayerDisplay() {
        document.getElementById('player-name').textContent = `Player: ${this.playerName}`;
    }

    resetPlayer() {
        localStorage.removeItem('playerName');
        this.promptForPlayerName();
        this.score = 0;
        document.getElementById('score').textContent = '0';
        this.foundWordsPerFace = new Map();
        this.completedFaces = new Set();
        this.generateGrid();
        this.updateWordList();
    }

    setupEventListeners() {
        // Face button listeners
        document.querySelectorAll('.face-btn').forEach(button => {
            button.addEventListener('click', () => {
                const face = parseInt(button.dataset.face);
                this.changeFace(face);
            });
        });

        // Grid cell selection listeners
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        // End game button listener
        document.getElementById('end-game').addEventListener('click', () => this.endGame());

        // Reset player button listener
        document.getElementById('reset-player').addEventListener('click', () => this.resetPlayer());
    }

    initializeGame() {
        this.score = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('current-face').textContent = `Face ${this.currentFace}`;
        
        // Clear any existing game state
        this.foundWordsPerFace = new Map();
        this.completedFaces = new Set();
        this.selectedCells = [];
        this.currentWord = '';
        
        // Generate initial grid and word list
        this.generateGrid();
        this.updateWordList();
    }

    generateGrid() {
        const grid = document.getElementById('letter-grid');
        grid.innerHTML = ''; // Clear existing grid
        
        // Create 10x10 grid array
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(''));
        
        // Get current face's words
        const words = this.wordLists[this.currentFace];
        
        // Place words in grid
        words.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const direction = Math.floor(Math.random() * 8);
                const row = Math.floor(Math.random() * this.gridSize);
                const col = Math.floor(Math.random() * this.gridSize);
                
                if (this.canPlaceWord(word, row, col, direction)) {
                    this.placeWord(word, row, col, direction);
                    placed = true;
                }
                attempts++;
            }
        });
        
        // Fill remaining cells with random letters
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.grid[i][j]) {
                    this.grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                }
            }
        }
        
        // Create grid cells in DOM
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = this.grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Add mouse event listeners
                cell.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                cell.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                
                grid.appendChild(cell);
            }
        }
        
        // Mark previously found words
        this.markFoundWords();
    }

    updateWordList() {
        const wordList = document.getElementById('word-list');
        wordList.innerHTML = ''; // Clear existing list
        
        const currentWords = this.wordLists[this.currentFace];
        const foundWords = this.foundWordsPerFace.get(this.currentFace) || new Set();
        
        currentWords.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.textContent = word;
            if (foundWords.has(word)) {
                wordElement.classList.add('found');
            }
            wordList.appendChild(wordElement);
        });
    }

    markFoundWords() {
        if (!this.foundWordsPerFace.has(this.currentFace)) {
            return;
        }

        const foundWords = this.foundWordsPerFace.get(this.currentFace);
        const gridCells = document.getElementsByClassName('grid-cell');

        // For each found word
        foundWords.forEach(word => {
            // For each cell in the grid
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    // Check if this cell starts a found word
                    if (this.doesWordStartAtCell(i, j, word)) {
                        this.markWordCells(i, j, word);
                    }
                }
            }
        });
    }

    doesWordStartAtCell(row, col, word) {
        const directions = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal down-right
            [-1, 1],  // diagonal up-right
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal up-left
            [1, -1]   // diagonal down-left
        ];

        for (let [dx, dy] of directions) {
            let matches = true;
            for (let i = 0; i < word.length; i++) {
                const newRow = row + (dx * i);
                const newCol = col + (dy * i);
                
                if (newRow < 0 || newRow >= this.gridSize || 
                    newCol < 0 || newCol >= this.gridSize || 
                    this.grid[newRow][newCol] !== word[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return [dx, dy]; // Return direction if word is found
            }
        }
        return false;
    }

    markWordCells(startRow, startCol, word) {
        const direction = this.doesWordStartAtCell(startRow, startCol, word);
        if (!direction) return;

        const [dx, dy] = direction;
        const cells = document.getElementsByClassName('grid-cell');

        for (let i = 0; i < word.length; i++) {
            const row = startRow + (dx * i);
            const col = startCol + (dy * i);
            const index = row * this.gridSize + col;
            cells[index].classList.add('found');
        }
    }

    startTimer() {
        const timerElement = document.getElementById('timer');
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTime = new Date();
        
        this.timerInterval = setInterval(() => {
            const currentTime = new Date();
            const timeDiff = Math.floor((currentTime - this.startTime) / 1000);
            const minutes = Math.floor(timeDiff / 60);
            const seconds = timeDiff % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    canPlaceWord(word, row, col, direction) {
        const dirs = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal down-right
            [-1, 1],  // diagonal up-right
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal up-left
            [1, -1]   // diagonal down-left
        ];

        const [dRow, dCol] = dirs[direction];
        const len = word.length;

        // Check if word fits on grid
        for (let i = 0; i < len; i++) {
            const newRow = row + (dRow * i);
            const newCol = col + (dCol * i);

            if (newRow < 0 || newRow >= 10 || 
                newCol < 0 || newCol >= 10) {
                return false;
            }

            // Check if cell is empty or has matching letter
            if (this.grid[newRow][newCol] !== '' && 
                this.grid[newRow][newCol] !== word[i]) {
                return false;
            }
        }
        return true;
    }

    placeWord(word, row, col, direction) {
        const dirs = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal down-right
            [-1, 1],  // diagonal up-right
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal up-left
            [1, -1]   // diagonal down-left
        ];

        const [dRow, dCol] = dirs[direction];
        
        for (let i = 0; i < word.length; i++) {
            const newRow = row + (dRow * i);
            const newCol = col + (dCol * i);
            this.grid[newRow][newCol] = word[i];
        }
    }

    handleMouseDown(e) {
        if (e.target.classList.contains('grid-cell')) {
            this.isSelecting = true;
            this.currentWord = e.target.textContent;
            this.selectedCells = [e.target];
            e.target.classList.add('selected');
        }
    }
    
    handleMouseMove(e) {
        if (this.isSelecting && e.target.classList.contains('grid-cell')) {
            if (this.selectedCells.length && !this.selectedCells.includes(e.target)) {
                this.selectedCells.push(e.target);
                this.currentWord += e.target.textContent;
                e.target.classList.add('selected');
            }
        }
    }
    
    handleMouseUp() {
        if (this.isSelecting) {
            this.isSelecting = false;
            
            // Get the selected word
            const normalizedWord = this.currentWord.toUpperCase();
            const reversedWord = this.currentWord.split('').reverse().join('');
            
            // Check if word exists in current face's word list
            const currentWords = this.wordLists[this.currentFace];
            if (currentWords.includes(normalizedWord)) {
                this.wordFound(normalizedWord);
            } else if (currentWords.includes(reversedWord)) {
                this.wordFound(reversedWord);
            }
            
            // Clear selection
            this.selectedCells.forEach(cell => cell.classList.remove('selected'));
            this.selectedCells = [];
            this.currentWord = '';
        }
    }
    
    wordFound(word) {
        // Initialize set for current face if it doesn't exist
        if (!this.foundWordsPerFace.has(this.currentFace)) {
            this.foundWordsPerFace.set(this.currentFace, new Set());
        }
        
        // Add word to found words
        this.foundWordsPerFace.get(this.currentFace).add(word);
        
        // Update score
        this.updateScore(this.score + 10);
        
        // Mark cells as found
        this.selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
        });
        
        // Mark word as found in word list
        const wordList = document.getElementById('word-list');
        const wordElements = wordList.children;
        for (let element of wordElements) {
            if (element.textContent === word) {
                element.classList.add('found');
                break;
            }
        }
        
        // Check if face is completed
        this.checkFaceCompletion();
    }

    checkFaceCompletion() {
        const currentWords = this.wordLists[this.currentFace];
        const foundWords = this.foundWordsPerFace.get(this.currentFace) || new Set();
        
        if (foundWords.size === currentWords.length) {
            this.completedFaces.add(this.currentFace);
            this.updateFaceButtons();
            
            // Check if all faces are completed
            if (this.completedFaces.size === 6) {
                setTimeout(() => {
                    alert('Congratulations! You have completed all faces!');
                    this.endGame();
                }, 500);
            }
        }
    }

    changeFace(faceNumber) {
        if (faceNumber >= 1 && faceNumber <= 6) {
            this.currentFace = faceNumber;
            document.getElementById('current-face').textContent = `Face ${this.currentFace}`;
            
            // Update face buttons
            document.querySelectorAll('.face-btn').forEach(btn => {
                const face = parseInt(btn.dataset.face);
                btn.classList.toggle('active', face === this.currentFace);
                if (this.completedFaces.has(face)) {
                    btn.classList.add('completed');
                }
            });
            
            // Generate new grid
            this.generateGrid();
            
            // Update word list
            this.updateWordList();
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;
    }
    
    updateTimer() {
        const now = new Date();
        const diff = Math.floor((now - this.startTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        this.timeElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    endGame() {
        // Stop the timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Get final score and time
        const finalScore = this.score;
        const finalTime = document.getElementById('timer').textContent;
        const playerName = document.getElementById('player-name').textContent.replace('Player: ', '');

        // Create game record
        const gameRecord = {
            playerId: playerName,
            score: finalScore,
            time: finalTime,
            timestamp: new Date().toISOString()
        };

        // Get existing records from localStorage
        let gameRecords = JSON.parse(localStorage.getItem('gameRecords') || '[]');
        
        // Add new record
        gameRecords.push(gameRecord);
        
        // Sort by score (highest first) and time (shortest first)
        gameRecords.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time.localeCompare(b.time);
        });

        // Keep only top 10 scores
        gameRecords = gameRecords.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('gameRecords', JSON.stringify(gameRecords));

        // Show end game message with stats
        alert(`Game Over!\n\nPlayer: ${playerName}\nFinal Score: ${finalScore}\nTime: ${finalTime}\n\nYour score has been recorded.`);

        // Reset the game
        this.initializeGame();
    }

}

function createSnowflakes() {
    const snowContainer = document.querySelector('.snow-container');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake(snowContainer);
    }
}

function createSnowflake(container) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Random properties for each snowflake
    const size = Math.random() * 5 + 2;
    const startingLeft = Math.random() * 100;
    const animationDuration = Math.random() * 3 + 2;
    const delay = Math.random() * 2;
    
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${startingLeft}%`;
    snowflake.style.animationDuration = `${animationDuration}s`;
    snowflake.style.animationDelay = `${delay}s`;
    
    // Add animation end listener to create snow piles and new snowflakes
    snowflake.addEventListener('animationend', () => {
        createSnowPile(startingLeft);
        container.removeChild(snowflake);
        createSnowflake(container);
    });
    
    container.appendChild(snowflake);
}

function createSnowPile(xPosition) {
    const snowGround = document.querySelector('.snow-ground');
    const pile = document.createElement('div');
    pile.className = 'snow-pile';
    
    // Random properties for snow pile
    const size = Math.random() * 15 + 10;
    const offsetX = (Math.random() - 0.5) * 20;
    
    pile.style.width = `${size}px`;
    pile.style.height = `${size}px`;
    pile.style.left = `calc(${xPosition}% + ${offsetX}px)`;
    pile.style.bottom = '0';
    
    // Remove pile after animation
    pile.addEventListener('animationend', () => {
        setTimeout(() => {
            if (pile.parentNode === snowGround) {
                snowGround.removeChild(pile);
            }
        }, 5000);
    });
    
    snowGround.appendChild(pile);
}

function initSnowman() {
    const snowman = document.querySelector('.snowman');
    let scale = 1;
    
    // Grow snowman every minute
    setInterval(() => {
        scale += 0.1;
        snowman.style.transform = `scale(${scale})`;
        
        // Add some wobble animation when growing
        snowman.style.transition = 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Reset transition after growth
        setTimeout(() => {
            snowman.style.transition = 'transform 1s ease-in-out';
        }, 1000);
    }, 60000); // 60000ms = 1 minute
}

// Initialize snowman when window loads
window.addEventListener('load', () => {
    initSnowman();
    createSnowflakes();
});

// Start game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordSearchGame();
});
