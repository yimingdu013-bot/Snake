// 游戏变量
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let newDirection = 'right';
let gameSpeed = 100; // 毫秒
let baseGameSpeed = 100; // 基础速度值
let gameInterval;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let speedLevel = 5; // 默认速度级别（1-10）

// DOM 元素
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const speedSlider = document.getElementById('speed-slider');
const speedValueDisplay = document.getElementById('speed-value');
const moveSound = document.getElementById('move-sound');
const eatSound = document.getElementById('eat-sound');
const soundToggle = document.getElementById('sound-toggle');

// 音效相关变量
let soundEnabled = true;

// 初始化游戏
function initGame() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    // 设置初始蛇的位置和长度
    snake = [
        {x: 200, y: 200},
        {x: 190, y: 200},
        {x: 180, y: 200},
    ];
    
    // 生成第一个食物
    generateFood();
    
    // 更新高分显示
    highScoreElement.textContent = highScore;
    
    // 初始化音效
    initSounds();
    
    // 添加事件监听器
    document.addEventListener('keydown', changeDirection);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    speedSlider.addEventListener('input', changeSpeed);
    soundToggle.addEventListener('change', toggleSound);
    
    // 初始化速度显示
    updateSpeedDisplay();
    
    // 初始按钮状态
    pauseBtn.disabled = true;
    
    // 绘制初始游戏状态
    draw();
}

// 开始游戏
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// 改变游戏速度
function changeSpeed() {
    speedLevel = parseInt(speedSlider.value);
    
    // 根据滑块值计算游戏速度（值越大，速度越快）
    // 速度范围：150ms（最慢）到 50ms（最快）
    gameSpeed = baseGameSpeed + 50 - (speedLevel * 10);
    
    // 更新速度显示文本
    updateSpeedDisplay();
    
    // 如果游戏正在运行，重新设置游戏循环以应用新速度
    if (gameRunning && !gamePaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// 更新速度显示
function updateSpeedDisplay() {
    let speedText;
    
    if (speedLevel <= 3) {
        speedText = '慢速';
    } else if (speedLevel <= 7) {
        speedText = '中等';
    } else {
        speedText = '快速';
    }
    
    speedValueDisplay.textContent = speedText;
}

// 切换音效开关
function toggleSound() {
    soundEnabled = soundToggle.checked;
    
    // 更新音效状态显示
    soundToggle.nextElementSibling.textContent = soundEnabled ? '开启' : '关闭';
}

// 暂停/继续游戏
function togglePause() {
    if (gameRunning) {
        if (gamePaused) {
            // 继续游戏
            gamePaused = false;
            pauseBtn.textContent = '暂停';
            gameInterval = setInterval(gameLoop, gameSpeed);
        } else {
            // 暂停游戏
            gamePaused = true;
            pauseBtn.textContent = '继续';
            clearInterval(gameInterval);
        }
    }
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameInterval);
    score = 0;
    scoreElement.textContent = score;
    direction = 'right';
    newDirection = 'right';
    gameRunning = false;
    gamePaused = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    
    // 重置游戏速度为当前滑块值
    changeSpeed();
    
    // 重置蛇和食物
    snake = [
        {x: 200, y: 200},
        {x: 190, y: 200},
        {x: 180, y: 200},
    ];
    generateFood();
    
    // 重绘游戏
    draw();
}

// 游戏主循环
function gameLoop() {
    moveSnake();
    if (checkCollision()) {
        gameOver();
        return;
    }
    checkFoodCollision();
    draw();
}

// 移动蛇
function moveSnake() {
    // 更新方向
    direction = newDirection;
    
    // 根据当前方向计算新的头部位置
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 计算移动距离，可以根据蛇的长度适当调整速度
    const moveDistance = 10;
    
    switch(direction) {
        case 'up':
            head.y -= moveDistance;
            break;
        case 'down':
            head.y += moveDistance;
            break;
        case 'left':
            head.x -= moveDistance;
            break;
        case 'right':
            head.x += moveDistance;
            break;
    }
    
    // 将新头部添加到蛇的开头
    snake.unshift(head);
    
    // 播放移动音效
    playMoveSound();
    
    // 如果没有吃到食物，移除尾部；否则保留尾部，蛇会变长
    if (head.x !== food.x || head.y !== food.y) {
        snake.pop();
    }
    
    // 平滑处理蛇的身体段，使其看起来更自然
    smoothSnakeBody();
}

// 平滑处理蛇的身体，使其看起来更自然
function smoothSnakeBody() {
    // 至少需要3个段才能进行平滑处理
    if (snake.length < 3) return;
    
    // 遍历蛇的身体（除头部和尾部外），调整中间段的位置使其更平滑
    for (let i = 1; i < snake.length - 1; i++) {
        const prev = snake[i - 1]; // 前一个段
        const current = snake[i];   // 当前段
        const next = snake[i + 1];  // 后一个段
        
        // 计算当前段到前后段的方向向量
        const toPrev = {x: prev.x - current.x, y: prev.y - current.y};
        const toNext = {x: next.x - current.x, y: next.y - current.y};
        
        // 计算平滑因子，控制平滑程度
        const smoothFactor = 0.2;
        
        // 根据前后段的位置微调当前段的位置
        // 这会使蛇的身体在转弯时看起来更自然
        if (i % 2 === 0) { // 交替应用不同的偏移，使蛇看起来更有弯曲感
            current.smoothX = current.x + (toPrev.x + toNext.x) * smoothFactor * 0.1;
            current.smoothY = current.y + (toPrev.y + toNext.y) * smoothFactor * 0.1;
        } else {
            current.smoothX = current.x - (toPrev.x + toNext.x) * smoothFactor * 0.1;
            current.smoothY = current.y - (toPrev.y + toNext.y) * smoothFactor * 0.1;
        }
    }
}

// 改变方向
function changeDirection(event) {
    const key = event.key;
    
    // 防止180度转弯（蛇不能直接掉头）
    if (key === 'ArrowUp' && direction !== 'down') {
        newDirection = 'up';
    } else if (key === 'ArrowDown' && direction !== 'up') {
        newDirection = 'down';
    } else if (key === 'ArrowLeft' && direction !== 'right') {
        newDirection = 'left';
    } else if (key === 'ArrowRight' && direction !== 'left') {
        newDirection = 'right';
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return true;
    }
    
    // 检查自身碰撞（从第二个身体部分开始检查）
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查是否吃到食物
function checkFoodCollision() {
    const head = snake[0];
    
    if (head.x === food.x && head.y === food.y) {
        // 播放吃食物音效
        playEatSound();
        
        // 增加分数
        score += 10;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 生成新的食物
        generateFood();
        
        // 根据得分适度增加游戏速度，但不超过当前设置的速度级别限制
        if (score % 50 === 0) {
            // 计算当前速度级别允许的最快速度
            let minSpeedForLevel = baseGameSpeed + 50 - (speedLevel * 10);
            // 稍微加快速度，但不超过当前级别的限制
            if (gameSpeed > minSpeedForLevel + 5 && gameSpeed > 50) {
                gameSpeed -= 5;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, gameSpeed);
            }
        }
    }
}

// 生成食物
function generateFood() {
    // 计算网格上的可用位置（10px为一个单位）
    const gridSize = 10;
    const availableX = Math.floor(canvas.width / gridSize);
    const availableY = Math.floor(canvas.height / gridSize);
    
    let newFood;
    let foodOnSnake;
    
    // 确保食物不会生成在蛇身上
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * availableX) * gridSize,
            y: Math.floor(Math.random() * availableY) * gridSize
        };
        
        // 检查是否与蛇身重叠
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 绘制游戏结束信息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
}

// 初始化音效
function initSounds() {
    // 使用Web Audio API创建音效
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 创建移动音效
    createMoveSound(audioContext);
    
    // 创建吃食物音效
    createEatSound(audioContext);
}

// 创建移动音效
function createMoveSound(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 300;
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const soundData = {
        oscillator: oscillator,
        gainNode: gainNode,
        audioContext: audioContext
    };
    
    // 将音效数据存储在音频元素的自定义属性中
    moveSound.soundData = soundData;
}

// 创建吃食物音效
function createEatSound(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.2;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const soundData = {
        oscillator: oscillator,
        gainNode: gainNode,
        audioContext: audioContext
    };
    
    // 将音效数据存储在音频元素的自定义属性中
    eatSound.soundData = soundData;
}

// 播放移动音效
function playMoveSound() {
    if (!soundEnabled || !gameRunning || gamePaused) return;
    
    try {
        const soundData = moveSound.soundData;
        const audioContext = soundData.audioContext;
        
        // 创建短暂的音效
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 300;
        
        gainNode.gain.value = 0.05;
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.error('播放移动音效时出错:', error);
    }
}

// 播放吃食物音效
function playEatSound() {
    if (!soundEnabled) return;
    
    try {
        const soundData = eatSound.soundData;
        const audioContext = soundData.audioContext;
        
        // 创建短暂的音效
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 600;
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.value = 0.2;
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('播放吃食物音效时出错:', error);
    }
}

// 绘制游戏
function draw() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        // 保存当前绘图状态
        ctx.save();
        
        // 确定段的颜色
        if (index === 0) {
            // 头部使用不同颜色
            ctx.fillStyle = '#388E3C';
        } else {
            // 身体部分使用渐变色，使蛇看起来更有立体感
            const gradient = ctx.createLinearGradient(segment.x, segment.y, segment.x + 10, segment.y + 10);
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#2E7D32');
            ctx.fillStyle = gradient;
        }
        
        // 计算蛇的弯曲效果
if (index > 0 && index < snake.length - 1) {
    // 获取前一个和后一个段的位置，用于计算弯曲方向
    const prev = snake[index - 1];
    const next = snake[index + 1];
    
    // 使用平滑处理后的位置（如果有）或者计算弯曲偏移量
    let drawX = segment.x;
    let drawY = segment.y;
    
    if (segment.smoothX !== undefined && segment.smoothY !== undefined) {
        drawX = segment.smoothX;
        drawY = segment.smoothY;
    } else {
        // 计算弯曲偏移量（小幅度的随机偏移）
        const offsetX = (Math.sin(index * 0.5 + Date.now() * 0.001) * 2);
        const offsetY = (Math.cos(index * 0.5 + Date.now() * 0.001) * 2);
        drawX = segment.x + offsetX * 0.5;
        drawY = segment.y + offsetY * 0.5;
    }
    
    // 绘制圆角矩形作为蛇的身体段
    roundedRect(ctx, drawX, drawY, 10, 10, 3);
} else if (index === 0) {
            // 蛇头绘制为椭圆形
            ctx.beginPath();
            
            // 根据移动方向调整蛇头的形状
            if (direction === 'right') {
                ctx.ellipse(segment.x + 5, segment.y + 5, 7, 5, 0, 0, Math.PI * 2);
            } else if (direction === 'left') {
                ctx.ellipse(segment.x + 5, segment.y + 5, 7, 5, Math.PI, 0, Math.PI * 2);
            } else if (direction === 'up') {
                ctx.ellipse(segment.x + 5, segment.y + 5, 5, 7, Math.PI * 1.5, 0, Math.PI * 2);
            } else if (direction === 'down') {
                ctx.ellipse(segment.x + 5, segment.y + 5, 5, 7, Math.PI * 0.5, 0, Math.PI * 2);
            }
            
            ctx.fill();
            ctx.strokeStyle = '#E8F5E9';
            ctx.stroke();
            
            // 添加眼睛
            ctx.fillStyle = '#FFFFFF';
            
            // 根据方向绘制眼睛
            if (direction === 'right') {
                ctx.beginPath();
                ctx.ellipse(segment.x + 8, segment.y + 3, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 8, segment.y + 7, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼球
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(segment.x + 9, segment.y + 3, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 9, segment.y + 7, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'left') {
                ctx.beginPath();
                ctx.ellipse(segment.x + 2, segment.y + 3, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 2, segment.y + 7, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼球
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(segment.x + 1, segment.y + 3, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 1, segment.y + 7, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'up') {
                ctx.beginPath();
                ctx.ellipse(segment.x + 3, segment.y + 2, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 7, segment.y + 2, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼球
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(segment.x + 3, segment.y + 1, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 7, segment.y + 1, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction === 'down') {
                ctx.beginPath();
                ctx.ellipse(segment.x + 3, segment.y + 8, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 7, segment.y + 8, 1.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼球
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(segment.x + 3, segment.y + 9, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(segment.x + 7, segment.y + 9, 0.8, 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 尾部
            roundedRect(ctx, segment.x, segment.y, 10, 10, 4);
        }
        
        // 恢复绘图状态
        ctx.restore();
    });
    
    // 绘制食物
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(food.x + 5, food.y + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加食物边框和光晕效果
    ctx.strokeStyle = '#FBE9E7';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 添加食物光晕
    ctx.beginPath();
    ctx.arc(food.x + 5, food.y + 5, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.3)';
    ctx.stroke();
}

// 辅助函数：绘制圆角矩形
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E8F5E9';
    ctx.stroke();
}

// 当页面加载完成后初始化游戏
window.onload = initGame;