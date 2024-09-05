package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	Username string
	Conn     *websocket.Conn
}

type GroupMember struct {
	Name  string `json:"name"`
	HP    int    `json:"hp"`
	Alive bool   `json:"alive"`
}

type CreatureData struct {
	Name string `json:"name"`
	HP   int    `json:"hp"`
}

var (
	players       = make(map[*websocket.Conn]*Player)
	playersMutex  = &sync.Mutex{}
	playerCount   = 0
	upgrader      = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	group = []*GroupMember{
		{"Tank", 100, true},
		{"DPS1", 100, true},
		{"DPS2", 100, true},
		{"Healer", 100, true},
		{"DPS3", 100, true},
	}
	creature = CreatureData{
		Name: "Dragon",
		HP:   500,
	}
)

func main() {
	fmt.Println("Game server started on :8080")

	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/ws", wsEndpoint)

	go gameLoop()

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer ws.Close()

	playersMutex.Lock()
	playerCount++
	player := &Player{Username: fmt.Sprintf("Player%d", playerCount), Conn: ws}
	players[ws] = player
	playersMutex.Unlock()

	log.Printf("New player connected: %s\n", player.Username)

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			playersMutex.Lock()
			delete(players, ws)
			playersMutex.Unlock()
			break
		}
		handlePlayerAction(player, string(msg))
	}
}

func logAction(player *Player, action string) {
	logMsg := fmt.Sprintf("Player %s performed action: %s", player.Username, action)
	log.Println(logMsg)

	message := struct {
		Log string `json:"log"`
	}{
		Log: logMsg,
	}

	playersMutex.Lock()
	defer playersMutex.Unlock()

	for _, p := range players {
		if p.Conn != nil {
			err := p.Conn.WriteJSON(message)
			if err != nil {
				log.Printf("Error sending log message to %s: %v\n", p.Username, err)
			}
		}
	}
}

var lastPlayerAction string
func handlePlayerAction(player *Player, action string) {
    if action == "" {
        log.Println("Received empty action.")
        return
    }

    log.Printf("Player %s performed action: %s\n", player.Username, action)

    switch action {
    case "heal_tank":
        healTarget(group[0], 30)
    case "heal_dps1":
        healTarget(group[1], 30)
    case "heal_dps2":
        healTarget(group[2], 30)
    case "heal_healer":
        healTarget(group[3], 30)
    case "heal_dps3":
        healTarget(group[4], 30)
    case "attack":
        creature.HP -= 20
        if creature.HP < 0 {
            creature.HP = 0
        }
    case "start_game":
        startGame() // Call a function to start the game
    default:
        log.Printf("Unknown action: %s\n", action)
    }

    // Send a response back to the client
    logAction(player, action)

    updateAllClients()
}

func startGame() {
    // Initialize or reset the game state
    creature.HP = 500 // Reset creature's HP
    for _, member := range group {
        member.HP = 100 // Reset all group members' HP
        member.Alive = true // Ensure all group members are alive
    }
    updateAllClients() // Notify all clients of the new game state
}

func healTarget(member *GroupMember, amount int) {
	if member.Alive {
		member.HP += amount
		if member.HP > 100 {
			member.HP = 100
		}
	}
}

func updateAllClients() {
    gameState := struct {
        Type     string         `json:"type"`
        Group    []*GroupMember `json:"group"`
        Creature CreatureData   `json:"creature"`
    }{
        Type:     "update",
        Group:    group,
        Creature: creature,
    }

    playersMutex.Lock()
    defer playersMutex.Unlock()

    for _, player := range players {
        if player.Conn != nil {
            err := player.Conn.WriteJSON(gameState)
            if err != nil {
                log.Printf("Error sending update to %s: %v\n", player.Username, err)
            }
        }
    }
}

func gameLoop() {
	for {
		time.Sleep(3 * time.Second) // Faster rate for AOE damage

		// Apply AOE damage
		for i := range group {
			if group[i].Alive {
				group[i].HP -= 10 // Adjust damage as needed
				if group[i].HP <= 0 {
					group[i].HP = 0
					group[i].Alive = false
				}
			}
		}

		// Apply reverse attack if the last player action was "attack"
		if lastPlayerAction == "attack" {
			creature.HP -= 15 // Adjust damage as needed for reverse attack
			if creature.HP < 0 {
				creature.HP = 0
			}
			lastPlayerAction = "" // Reset action
		}

		updateAllClients()
	}
}