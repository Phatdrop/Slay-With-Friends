let socket;
let isConnected = false;

function sendPlayerAction(action) {
    if (isConnected && socket.readyState === WebSocket.OPEN) {
        console.log(`Sending action: ${action}`);
        socket.send(action);
    } else {
        console.error("WebSocket is not open. Cannot send action.");
    }
}

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:8080/ws');

    socket.onopen = function() {
        console.log("WebSocket connection established");
        isConnected = true;
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data); // Ensure data format
        updateGameState(data); // Ensure this correctly calls updateHealthBars
    };
    
    socket.onerror = function(error) {
        console.error("WebSocket error:", error);
    };
    
    socket.onclose = function(event) {
        console.log("WebSocket connection closed:", event.code);
        if (event.code === 1001) {
            console.log("Connection closed (going away). Attempting to reconnect...");
            setTimeout(connectWebSocket, 1000); // Retry connection after 1 second
        }
    };
}

function validateValue(value, max) {
    // Ensure value is a finite number between 0 and max
    if (isNaN(value) || value === undefined || value < 0) {
        return 0;
    } else if (value > max) {
        return max;
    }
    return value;
}

function updateHealthBars(group, creature) {
    console.log('Updating health bars with group:', group);
    console.log('Updating health bars with creature:', creature);

    if (Array.isArray(group) && group.length === 5) {
        group.forEach((member, index) => {
            if (member && typeof member.hp === 'number') {
                const healthBar = document.getElementById(`member${index + 1}Health`);
                if (healthBar) {
                    const validatedValue = validateValue(member.hp, healthBar.max);
                    console.log(`Setting health bar ${index + 1} to value: ${validatedValue}`); // Log value being set
                    healthBar.value = validatedValue;
                } else {
                    console.warn(`Health bar element for member ${index + 1} not found`);
                }
            } else {
                console.warn(`Invalid member data for index ${index}:`, member);
            }
        });
    } else {
        console.error("Invalid group data received:", group);
    }

    if (creature && typeof creature.hp === 'number') {
        const creatureHealthBar = document.getElementById('creatureHealth');
        if (creatureHealthBar) {
            const validatedValue = validateValue(creature.hp, creatureHealthBar.max);
            console.log(`Setting creature health bar to value: ${validatedValue}`); // Log value being set
            creatureHealthBar.value = validatedValue;
        } else {
            console.warn('Creature health bar element not found');
        }
    } else {
        console.warn("Invalid creature data received:", creature);
    }
}

function updateGameState(data) {
    console.log('Updating game state with:', data);

    if (data.type === 'update') {
        updateHealthBars(data.group, data.creature);
        updateLog(data.log); // Assuming `data.log` is used for battle logs
    }
}

function updateLogWindow(log) {
    const logWindow = document.getElementById("log");
    if (logWindow) {
        const logEntry = document.createElement('li');
        logEntry.textContent = log;
        logEntry.className = getLogClass(log);
        logWindow.appendChild(logEntry);
        logWindow.scrollTop = logWindow.scrollHeight;
        // Add a limit to the number of log entries
        if (logWindow.children.length > 100) {
            logWindow.removeChild(logWindow.firstChild);
        }
    }
}

function getLogClass(log) {
    if (log.includes("heal")) {
        return "log--heal";
    } else if (log.includes("attack")) {
        return "log--player";
    } else {
        return "log--monster";
    }
}

function addEventListeners() {
    console.log("addEventListeners called");
    const buttonContainer = document.getElementById('controls');
    if (buttonContainer) {
        buttonContainer.addEventListener('click', event => {
            if (event.target.tagName === 'BUTTON') {
                const action = event.target.dataset.action;
                if (action) {
                    sendPlayerAction(action);
                }
            }
        });
    } else {
        console.error("Button container element not found. Make sure it exists in your HTML file.");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const startGameButton = document.getElementById('startGameButton');

    if (startGameButton) {
        startGameButton.addEventListener('click', function() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'start_game' }));
            }
        });
    }
});

function checkDOMElements() {
    console.log("Checking DOM elements...");
    const elements = [
        'attackButton', 'healTankButton', 'healDPS1Button', 
        'healDPS2Button', 'healHealerButton', 'healDPS3Button',
        'creatureHealth', 'member1Health', 'member2Health', 
        'member3Health', 'member4Health', 'member5Health',
        'log'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`Element '${id}' found`);
        } else {
            console.warn(`Element '${id}' not found`);
        }
    });
}

function initializeGame() {
    console.log("Initializing game...");
    checkDOMElements();
    connectWebSocket();
    addEventListeners();
}

// Try to initialize as soon as the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOM is already ready, call initializeGame immediately
    initializeGame();
}

// Fallback initialization
window.addEventListener('load', function() {
    console.log("Window load event fired");
    if (!socket) {
        console.log("Initializing game from window load event");
        initializeGame();
    }
});