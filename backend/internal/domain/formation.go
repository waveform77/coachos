package domain

// FormationSlot is a single position on the pitch for a formation.
type FormationSlot struct {
	Label string  `json:"label"`
	X     float64 `json:"x"` // 0-100, left to right
	Y     float64 `json:"y"` // 0-100, own goal to opponent goal
}

// PredefinedFormations holds standard football formations.
var PredefinedFormations = map[string][]FormationSlot{
	"4-4-2": {
		{"GK", 50, 5},
		{"LB", 15, 20}, {"CB", 40, 20}, {"CB", 60, 20}, {"RB", 85, 20},
		{"LM", 15, 50}, {"CM", 40, 50}, {"CM", 60, 50}, {"RM", 85, 50},
		{"ST", 40, 85}, {"ST", 60, 85},
	},
	"4-3-3": {
		{"GK", 50, 5},
		{"LB", 15, 20}, {"CB", 40, 20}, {"CB", 60, 20}, {"RB", 85, 20},
		{"CM", 30, 50}, {"CM", 50, 50}, {"CM", 70, 50},
		{"LW", 15, 80}, {"ST", 50, 85}, {"RW", 85, 80},
	},
	"4-2-3-1": {
		{"GK", 50, 5},
		{"LB", 15, 20}, {"CB", 40, 20}, {"CB", 60, 20}, {"RB", 85, 20},
		{"DM", 40, 35}, {"DM", 60, 35},
		{"AM", 20, 60}, {"AM", 50, 60}, {"AM", 80, 60},
		{"ST", 50, 85},
	},
	"3-5-2": {
		{"GK", 50, 5},
		{"CB", 30, 20}, {"CB", 50, 20}, {"CB", 70, 20},
		{"LWB", 10, 45}, {"CM", 35, 45}, {"CM", 50, 45}, {"CM", 65, 45}, {"RWB", 90, 45},
		{"ST", 40, 85}, {"ST", 60, 85},
	},
	"5-3-2": {
		{"GK", 50, 5},
		{"LWB", 10, 20}, {"CB", 30, 20}, {"CB", 50, 20}, {"CB", 70, 20}, {"RWB", 90, 20},
		{"CM", 30, 50}, {"CM", 50, 50}, {"CM", 70, 50},
		{"ST", 40, 85}, {"ST", 60, 85},
	},
}

// FormationNames returns available formation keys.
func FormationNames() []string {
	keys := make([]string, 0, len(PredefinedFormations))
	for k := range PredefinedFormations {
		keys = append(keys, k)
	}
	return keys
}
