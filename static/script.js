let playerHealth = 100;
let monsterHealth = 100;

function updateHealthBars() {
    document.getElementById('player-health').style.width = playerHealth + '%';
    document.getElementById('monster-health').style.width = monsterHealth + '%';
}

function addLogMessage(who, action, value) {
    const logMessages = document.getElementById('log-messages');
    const logEntry = document.createElement('li');
    logEntry.textContent = `${who} ${action} for ${value}`;
    logEntry.classList.add(`log--${who}`);
    logMessages.prepend(logEntry);
}

function attackMonster() {
    const attackValue = getRandomValue(5, 12);
    monsterHealth = Math.max(monsterHealth - attackValue, 0);
    addLogMessage('player', 'attacks', attackValue);
    attackPlayer();
    updateHealthBars();
    checkEndGame();
}

function attackPlayer() {
    const attackValue = getRandomValue(8, 15);
    playerHealth = Math.max(playerHealth - attackValue, 0);
    addLogMessage('monster', 'attacks', attackValue);
    updateHealthBars();
    checkEndGame();
}

function specialAttackMonster() {
    const attackValue = getRandomValue(10, 25);
    monsterHealth = Math.max(monsterHealth - attackValue, 0);
    addLogMessage('player', 'special attacks', attackValue);
    attackPlayer();
    updateHealthBars();
    checkEndGame();
}

function healPlayer() {
    const healValue = getRandomValue(8, 20);
    if (playerHealth + healValue > 100) {
        playerHealth = 100;
    } else {
        playerHealth += healValue;
    }
    addLogMessage('player', 'heals', healValue);
    attackPlayer();
    updateHealthBars();
    checkEndGame();
}

function surrender() {
    addLogMessage('player', 'surrenders', '');
    alert('You surrendered! Game Over.');
    resetGame();
}

function checkEndGame() {
    if (monsterHealth === 0 && playerHealth === 0) {
        alert('It\'s a draw!');
        resetGame();
    } else if (monsterHealth === 0) {
        alert('You won!');
        resetGame();
    } else if (playerHealth === 0) {
        alert('You lost!');
        resetGame();
    }
}

function resetGame() {
    playerHealth = 100;
    monsterHealth = 100;
    document.getElementById('log-messages').innerHTML = '';
    updateHealthBars();
}

function getRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.getElementById('attack-btn').addEventListener('click', attackMonster);
document.getElementById('special-attack-btn').addEventListener('click', specialAttackMonster);
document.getElementById('heal-btn').addEventListener('click', healPlayer);
document.getElementById('surrender-btn').addEventListener('click', surrender);

updateHealthBars();