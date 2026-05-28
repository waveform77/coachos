package seeds

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/pkg/hash"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

// demoPDI mirrors analytics PDI (0–100) for believable dev_index on players.
func demoPDI(attendanceRatePct, avgAssessment1to10, goalAchievedPct float64) float64 {
	v := attendanceRatePct*0.20 + avgAssessment1to10*10*0.50 + goalAchievedPct*0.30
	return math.Round(v*100) / 100
}

type playerSeed struct {
	first, last string
	teamIdx     int
	pos         domain.Position
	birthYear   int
	heightCm    float32
	weightKg    float32
	foot        domain.DominantFoot
	potential   int
}

// formProfile describes how assessments should trend for a player.
type formProfile string

const (
	formExcellent formProfile = "excellent"
	formRising    formProfile = "rising"
	formFalling   formProfile = "falling"
	formStable    formProfile = "stable"
	formRusty     formProfile = "rusty"
)

// Run seeds the database with rich demo data (idempotent Where + FirstOrCreate).
func Run(db *gorm.DB) error {
	ctx := context.Background()
	loc := time.Local
	baseDay := time.Now().In(loc).Truncate(24 * time.Hour)

	// ── Club ─────────────────────────────────────────────────────────────────────
	club := &domain.Club{
		Name:      "Академия ФК «Москва»",
		Country:   "Россия",
		City:      "Москва",
		FoundedAt: &[]time.Time{time.Date(2010, 1, 15, 0, 0, 0, 0, time.UTC)}[0],
	}
	if err := db.WithContext(ctx).Where("name = ?", club.Name).FirstOrCreate(club).Error; err != nil {
		return err
	}
	_ = db.WithContext(ctx).Model(club).Updates(map[string]interface{}{
		"country":    "Россия",
		"city":       "Москва",
		"founded_at": club.FoundedAt,
	}).Error

	// ── Users ────────────────────────────────────────────────────────────────────
	adminPwd, _ := hash.HashPassword("Admin123!")
	admin := &domain.User{
		Email:        "admin@coachos.dev",
		PasswordHash: adminPwd,
		Role:         domain.RoleAdmin,
		ClubID:       &club.ID,
		FirstName:    "Александр",
		LastName:     "Админов",
		IsActive:     true,
	}
	if err := db.WithContext(ctx).Where("email = ?", admin.Email).FirstOrCreate(admin).Error; err != nil {
		return err
	}

	coachPwd, _ := hash.HashPassword("Coach123!")
	coaches := []*domain.User{
		{
			Email:        "coach1@coachos.dev",
			PasswordHash: coachPwd,
			Role:         domain.RoleCoach,
			ClubID:       &club.ID,
			FirstName:    "Алексей",
			LastName:     "Петров",
			IsActive:     true,
			Phone:        "+7 900 123-45-67",
		},
		{
			Email:        "coach2@coachos.dev",
			PasswordHash: coachPwd,
			Role:         domain.RoleCoach,
			ClubID:       &club.ID,
			FirstName:    "Мария",
			LastName:     "Иванова",
			IsActive:     true,
			Phone:        "+7 900 987-65-43",
		},
		{
			Email:        "coach3@coachos.dev",
			PasswordHash: coachPwd,
			Role:         domain.RoleCoach,
			ClubID:       &club.ID,
			FirstName:    "Дмитрий",
			LastName:     "Соколов",
			IsActive:     true,
			Phone:        "+7 900 456-78-90",
		},
	}
	for _, c := range coaches {
		if err := db.WithContext(ctx).Where("email = ?", c.Email).FirstOrCreate(c).Error; err != nil {
			return err
		}
		_ = db.WithContext(ctx).Model(c).Update("phone", c.Phone).Error
	}

	playerPwd, _ := hash.HashPassword("Player123!")
	playerUser := &domain.User{
		Email:        "player1@coachos.dev",
		PasswordHash: playerPwd,
		Role:         domain.RolePlayer,
		ClubID:       &club.ID,
		FirstName:    "Арсений",
		LastName:     "Голубев",
		IsActive:     true,
	}
	if err := db.WithContext(ctx).Where("email = ?", playerUser.Email).FirstOrCreate(playerUser).Error; err != nil {
		return err
	}

	parentPwd, _ := hash.HashPassword("Parent123!")
	parentUser := &domain.User{
		Email:        "parent1@coachos.dev",
		PasswordHash: parentPwd,
		Role:         domain.RoleParent,
		ClubID:       &club.ID,
		FirstName:    "Елена",
		LastName:     "Голубева",
		IsActive:     true,
	}
	if err := db.WithContext(ctx).Where("email = ?", parentUser.Email).FirstOrCreate(parentUser).Error; err != nil {
		return err
	}

	// ── Coach Profiles ───────────────────────────────────────────────────────────
	coachProfiles := []struct {
		userIdx        int
		license        domain.LicenseLevel
		specialization string
		bio            string
	}{
		{0, domain.LicenseLevelA, "Молодёжный футбол, физподготовка", "Главный тренер U15–U17. Фокус на технике и переходах. 12 лет в академическом футболе."},
		{1, domain.LicenseLevelB, "Тактическая подготовка, видеоанализ", "Работает с основной командой. Специализация — игровые автоматизмы и стандарты."},
		{2, domain.LicenseLevelC, "Вратарская подготовка, реабилитация", "Тренер вратарей всех возрастных групп. Диплом FIFA по спортивной медицине."},
	}
	for _, cp := range coachProfiles {
		profile := &domain.CoachProfile{
			UserID:         coaches[cp.userIdx].ID,
			LicenseLevel:   cp.license,
			Specialization: cp.specialization,
			Bio:            cp.bio,
		}
		if err := db.WithContext(ctx).Where("user_id = ?", profile.UserID).FirstOrCreate(profile).Error; err != nil {
			return err
		}
	}

	// ── Teams ────────────────────────────────────────────────────────────────────
	teams := []*domain.Team{
		{
			ClubID:      club.ID,
			Name:        "Юниор U15",
			AgeGroup:    domain.AgeGroupU15,
			Season:      "2025/26",
			HeadCoachID: &coaches[0].ID,
		},
		{
			ClubID:      club.ID,
			Name:        "Юниор U17",
			AgeGroup:    domain.AgeGroupU17,
			Season:      "2025/26",
			HeadCoachID: &coaches[0].ID,
		},
		{
			ClubID:      club.ID,
			Name:        "Основная команда",
			AgeGroup:    domain.AgeGroupSenior,
			Season:      "2025/26",
			HeadCoachID: &coaches[1].ID,
		},
	}
	for _, tm := range teams {
		if err := db.WithContext(ctx).Where("name = ? AND club_id = ?", tm.Name, tm.ClubID).FirstOrCreate(tm).Error; err != nil {
			return err
		}
	}

	// ── Player Specs ─────────────────────────────────────────────────────────────
	// 52 players total: 18 U15, 18 U17, 16 Senior
	playerSpecs := []playerSeed{
		// U15 (teamIdx 0) — 2010 г.р. (~14 лет)
		{"Арсений", "Голубев", 0, domain.PositionGoalkeeper, 2010, 175, 65, domain.DominantFootRight, 78},
		{"Михаил", "Лебедев", 0, domain.PositionGoalkeeper, 2010, 178, 68, domain.DominantFootLeft, 72},
		{"Матвей", "Кузнецов", 0, domain.PositionDefender, 2010, 172, 60, domain.DominantFootRight, 75},
		{"Тимофей", "Соколов", 0, domain.PositionDefender, 2010, 170, 58, domain.DominantFootLeft, 68},
		{"Марк", "Новиков", 0, domain.PositionDefender, 2010, 174, 62, domain.DominantFootRight, 80},
		{"Даниил", "Орлов", 0, domain.PositionDefender, 2010, 171, 59, domain.DominantFootRight, 70},
		{"Павел", "Волков", 0, domain.PositionDefender, 2010, 173, 61, domain.DominantFootBoth, 74},
		{"Егор", "Козлов", 0, domain.PositionDefender, 2010, 169, 57, domain.DominantFootLeft, 66},
		{"Лев", "Морозов", 0, domain.PositionMidfielder, 2010, 168, 55, domain.DominantFootRight, 82},
		{"Иван", "Петров", 0, domain.PositionMidfielder, 2010, 169, 56, domain.DominantFootBoth, 76},
		{"Давид", "Васильев", 0, domain.PositionMidfielder, 2010, 171, 59, domain.DominantFootLeft, 71},
		{"Дмитрий", "Зайцев", 0, domain.PositionMidfielder, 2010, 170, 58, domain.DominantFootRight, 69},
		{"Александр", "Павлов", 0, domain.PositionMidfielder, 2010, 172, 60, domain.DominantFootRight, 77},
		{"Максим", "Смирнов", 0, domain.PositionMidfielder, 2010, 168, 56, domain.DominantFootLeft, 65},
		{"Артём", "Попов", 0, domain.PositionForward, 2010, 173, 61, domain.DominantFootRight, 84},
		{"Кирилл", "Егоров", 0, domain.PositionForward, 2010, 170, 57, domain.DominantFootRight, 73},
		{"Никита", "Соловьёв", 0, domain.PositionForward, 2010, 171, 58, domain.DominantFootBoth, 79},
		{"Илья", "Макаров", 0, domain.PositionForward, 2010, 174, 62, domain.DominantFootLeft, 67},

		// U17 (teamIdx 1) — 2008 г.р. (~16 лет)
		{"Никита", "Семёнов", 1, domain.PositionGoalkeeper, 2008, 182, 74, domain.DominantFootRight, 81},
		{"Иван", "Фёдоров", 1, domain.PositionGoalkeeper, 2008, 184, 76, domain.DominantFootLeft, 70},
		{"Даниил", "Воронов", 1, domain.PositionDefender, 2008, 180, 72, domain.DominantFootRight, 78},
		{"Егор", "Степанов", 1, domain.PositionDefender, 2008, 179, 71, domain.DominantFootLeft, 72},
		{"Александр", "Беляев", 1, domain.PositionDefender, 2008, 181, 73, domain.DominantFootRight, 83},
		{"Андрей", "Герасимов", 1, domain.PositionDefender, 2008, 178, 70, domain.DominantFootRight, 69},
		{"Олег", "Денисов", 1, domain.PositionDefender, 2008, 180, 72, domain.DominantFootBoth, 75},
		{"Александр", "Тихонов", 1, domain.PositionDefender, 2008, 177, 69, domain.DominantFootLeft, 66},
		{"Роман", "Комаров", 1, domain.PositionMidfielder, 2008, 176, 68, domain.DominantFootRight, 85},
		{"Павел", "Афанасьев", 1, domain.PositionMidfielder, 2008, 177, 69, domain.DominantFootBoth, 77},
		{"Дмитрий", "Мартынов", 1, domain.PositionMidfielder, 2008, 175, 67, domain.DominantFootLeft, 71},
		{"Денис", "Ефимов", 1, domain.PositionMidfielder, 2008, 178, 71, domain.DominantFootRight, 74},
		{"Андрей", "Калинин", 1, domain.PositionMidfielder, 2008, 176, 68, domain.DominantFootRight, 68},
		{"Олег", "Тарасов", 1, domain.PositionMidfielder, 2008, 174, 66, domain.DominantFootLeft, 64},
		{"Илья", "Шестаков", 1, domain.PositionForward, 2008, 179, 71, domain.DominantFootRight, 88},
		{"Кирилл", "Романов", 1, domain.PositionForward, 2008, 180, 73, domain.DominantFootRight, 80},
		{"Евгений", "Борисов", 1, domain.PositionForward, 2008, 181, 74, domain.DominantFootBoth, 76},
		{"Павел", "Медведев", 1, domain.PositionForward, 2008, 178, 70, domain.DominantFootLeft, 62},

		// Senior (teamIdx 2) — 1999-2005 г.р.
		{"Владислав", "Орлов", 2, domain.PositionGoalkeeper, 2001, 188, 82, domain.DominantFootRight, 82},
		{"Сергей", "Николаев", 2, domain.PositionGoalkeeper, 2003, 186, 80, domain.DominantFootLeft, 71},
		{"Андрей", "Фёдоров", 2, domain.PositionDefender, 2002, 185, 78, domain.DominantFootRight, 79},
		{"Дмитрий", "Соколов", 2, domain.PositionDefender, 2000, 184, 79, domain.DominantFootLeft, 74},
		{"Александр", "Михайлов", 2, domain.PositionDefender, 1999, 183, 77, domain.DominantFootRight, 86},
		{"Денис", "Кузьмин", 2, domain.PositionDefender, 2004, 182, 76, domain.DominantFootBoth, 70},
		{"Олег", "Сидоров", 2, domain.PositionDefender, 2001, 185, 79, domain.DominantFootLeft, 73},
		{"Павел", "Новиков", 2, domain.PositionDefender, 2003, 181, 75, domain.DominantFootRight, 67},
		{"Евгений", "Воробьёв", 2, domain.PositionMidfielder, 2002, 180, 75, domain.DominantFootRight, 90},
		{"Павел", "Морозов", 2, domain.PositionMidfielder, 2005, 179, 74, domain.DominantFootBoth, 81},
		{"Даниил", "Козлов", 2, domain.PositionMidfielder, 2000, 181, 76, domain.DominantFootLeft, 77},
		{"Никита", "Лебедев", 2, domain.PositionMidfielder, 2003, 178, 73, domain.DominantFootRight, 72},
		{"Иван", "Петров", 2, domain.PositionMidfielder, 2001, 180, 75, domain.DominantFootRight, 68},
		{"Сергей", "Смирнов", 2, domain.PositionMidfielder, 2004, 177, 72, domain.DominantFootLeft, 65},
		{"Артём", "Попов", 2, domain.PositionForward, 2002, 184, 79, domain.DominantFootRight, 87},
		{"Максим", "Васильев", 2, domain.PositionForward, 2005, 183, 78, domain.DominantFootRight, 78},
	}

	players := make([]*domain.Player, 0, len(playerSpecs))
	formProfiles := make([]formProfile, 0, len(playerSpecs))

	// Distribute form profiles ~evenly
	profileCycle := []formProfile{formExcellent, formRising, formFalling, formStable}
	for i := range playerSpecs {
		fp := profileCycle[i%len(profileCycle)]
		// Make a few players rusty (no recent activity)
		if i == 25 || i == 45 {
			fp = formRusty
		}
		formProfiles = append(formProfiles, fp)
	}

	for i, pd := range playerSpecs {
		bd := time.Date(pd.birthYear, time.March, 10+(i%20), 0, 0, 0, 0, time.UTC)
		p := &domain.Player{
			ClubID:           club.ID,
			FirstName:        pd.first,
			LastName:         pd.last,
			Position:         pd.pos,
			BirthDate:        &bd,
			HeightCm:         &pd.heightCm,
			WeightKg:         &pd.weightKg,
			DominantFoot:     pd.foot,
			PotentialAbility: pd.potential,
		}
		if err := db.WithContext(ctx).Where("first_name = ? AND last_name = ? AND club_id = ?", p.FirstName, p.LastName, p.ClubID).FirstOrCreate(p).Error; err != nil {
			return err
		}
		players = append(players, p)

		// Jersey numbers by position
		jerseyNum := 1 + (i % 99)
		isCap := i == 0 || i == 18 || i == 36
		if i > 0 {
			switch pd.pos {
			case domain.PositionGoalkeeper:
				jerseyNum = 1
			case domain.PositionDefender:
				jerseyNum = 2 + ((i%6)*2) // 2,4,6,8,10,12
			case domain.PositionMidfielder:
				jerseyNum = 14 + (i % 7) // 14-20
			case domain.PositionForward:
				jerseyNum = 7 + ((i%2)*5) + (i%3)*3 // 7,9,10,11,13
			}
		}

		member := &domain.TeamMember{
			TeamID:       teams[pd.teamIdx].ID,
			PlayerID:     p.ID,
			JoinedAt:     time.Now().AddDate(0, -8, -(i % 30)),
			JerseyNumber: &jerseyNum,
			IsCaptain:    isCap,
		}
		if err := db.WithContext(ctx).Where("team_id = ? AND player_id = ?", member.TeamID, member.PlayerID).FirstOrCreate(member).Error; err != nil {
			return err
		}
		_ = db.WithContext(ctx).Model(member).Updates(map[string]interface{}{
			"jersey_number": jerseyNum,
			"is_captain":    isCap,
		}).Error
	}

	// Link first player to player user account
	if len(players) > 0 {
		if err := db.WithContext(ctx).Model(players[0]).Update("user_id", playerUser.ID).Error; err != nil {
			return err
		}
	}

	// ── Parent ───────────────────────────────────────────────────────────────────
	parentRec := &domain.Parent{
		UserID:   &parentUser.ID,
		FullName: "Елена Сергеевна Голубева",
		Phone:    "+7 900 111-22-33",
		Email:    "parent1@coachos.dev",
		Relation: domain.RelationMother,
	}
	if err := db.WithContext(ctx).Where("email = ?", parentRec.Email).FirstOrCreate(parentRec).Error; err != nil {
		return err
	}
	if len(players) > 0 {
		pp := &domain.PlayerParent{PlayerID: players[0].ID, ParentID: parentRec.ID}
		if err := db.WithContext(ctx).Where("player_id = ? AND parent_id = ?", pp.PlayerID, pp.ParentID).FirstOrCreate(pp).Error; err != nil {
			return err
		}
	}

	// ── Exercises ────────────────────────────────────────────────────────────────
	exerciseData := []struct {
		name        string
		category    domain.ExerciseCategory
		difficulty  int
		description string
	}{
		{"Рондо 4v1 + нейтральный", domain.ExerciseCategoryTechnique, 3, "Короткий пас в круге, прессинг 1 игрока. Учим первый пас и поддержку."},
		{"Комбинации 3-го лишнего", domain.ExerciseCategoryTechnique, 4, "Треугольники, третий игрок с отрывом за спину линии."},
		{"1v1 с воротами", domain.ExerciseCategoryTechnique, 3, "Дриблинг, финт и удар из игры."},
		{"Триггеры прессинга", domain.ExerciseCategoryTactics, 4, "Сигналы для сжатия: пас назад, слабая нога, зона 14."},
		{"Блок обороны 4-4-2", domain.ExerciseCategoryTactics, 3, "Линия, смещение, зона страховки."},
		{"Переход «выиграл мяч»", domain.ExerciseCategoryTactics, 4, "3+3 или 4+4: контратака за 8–10 касаний."},
		{"Интервалы 6×200 м", domain.ExerciseCategoryPhysical, 4, "Аэробная мощность, пульс 85–90% ЧСС."},
		{"Координационная лестница", domain.ExerciseCategoryPhysical, 2, "Частота шага + работа рук."},
		{"Плиометрика: прыжки", domain.ExerciseCategoryPhysical, 3, "Контактное время, приземление на две стопы."},
		{"Ворота: реакция ближний угол", domain.ExerciseCategoryGoalkeeping, 4, "Пружина, второе касание, добивание."},
		{"Ворота: вынос руками", domain.ExerciseCategoryGoalkeeping, 2, "Быстрый запуск контратаки после выхода мяча."},
		{"Разминка динамическая", domain.ExerciseCategoryWarmup, 1, "Суставная гимнастика + лёгкий бег с ускорениями."},
		{"Заминка + растяжка", domain.ExerciseCategoryCooldown, 1, "Фокус на задней поверхности и пояснице."},
		{"Малый матч 5v5 + условие", domain.ExerciseCategoryTactics, 3, "Не более 3 касаний / только гол после прострела."},
		{"Стандарты: угловой / подача", domain.ExerciseCategoryTactics, 3, "Блокировки, зоны, короткий расклад."},
		{"Игра в площадь 4v4+3", domain.ExerciseCategoryTechnique, 3, "Быстрый пас, ориентация в пространстве."},
		{"Силовая тренировка", domain.ExerciseCategoryPhysical, 4, "Упражнения с собственным весом, кор."},
		{"Выход 1v1 с вратарём", domain.ExerciseCategoryTechnique, 3, "Имитация игровой ситуации, хладнокровие."},
		{"Видеоанализ соперника", domain.ExerciseCategoryTactics, 2, "Разбор стандартов и ключевых игроков."},
		{"Реакционные упражнения", domain.ExerciseCategoryGoalkeeping, 3, "Свето-звуковые сигналы, прыжки."},
	}

	exercises := make([]*domain.Exercise, 0, len(exerciseData))
	for i, ed := range exerciseData {
		e := &domain.Exercise{
			ClubID:      &club.ID,
			Name:        ed.name,
			Category:    ed.category,
			Difficulty:  ed.difficulty,
			Description: ed.description,
			DurationMin: 12 + (i%4)*6,
			PlayersMin:  4 + (i % 6),
			PlayersMax:  18,
			Equipment:   pq.StringArray{"манишки", "конусы", "мячи", "ворота мини"},
			Tags:        pq.StringArray{string(ed.category), "демо"},
			CreatedByID: coaches[0].ID,
			IsGlobal:    i%3 == 0,
		}
		if err := db.WithContext(ctx).Where("name = ? AND club_id = ?", e.Name, *e.ClubID).FirstOrCreate(e).Error; err != nil {
			return err
		}
		_ = db.WithContext(ctx).Model(e).Updates(map[string]interface{}{
			"description":  ed.description,
			"duration_min": e.DurationMin,
			"difficulty":   ed.difficulty,
			"tags":         pq.StringArray{"техника", "демо"},
			"equipment":    pq.StringArray{"манишки", "конусы", "мячи", "ворота мини"},
		}).Error
		exercises = append(exercises, e)
	}

	if len(exercises) == 0 {
		return fmt.Errorf("no exercises seeded")
	}

	teamPlayers := func(teamIdx int) []*domain.Player {
		out := make([]*domain.Player, 0)
		for i, pd := range playerSpecs {
			if pd.teamIdx == teamIdx {
				out = append(out, players[i])
			}
		}
		return out
	}

	// ── Training Sessions (~50 per team over 3 months) ───────────────────────────
	sessionPlans := make([]struct {
		dayOffset int
		hour      int
		minute    int
		teamIdx   int
		focus     []string
		notes     string
		cancelled bool
		intensity domain.SessionIntensity
	}, 0)

	focusPool := [][]string{
		{"техника", "переходы"},
		{"тактика", "прессинг"},
		{"физика", "координация"},
		{"стандарты", "подачи"},
		{"техника"},
		{"игра"},
		{"тактика", "оборона"},
		{"физика"},
		{"техника", "игра"},
		{"тактика"},
		{"физика", "скорость"},
		{"техника", "игра"},
		{"техника"},
		{"тактика"},
		{"физика"},
		{"игра"},
		{"стандарты"},
		{"физика", "восстановление"},
		{"тактика"},
		{"игра"},
	}

	notesPool := []string{
		"Акцент: первый пас под давлением, компактность в середине.",
		"Малый матч с условием — быстрый переход вперёд.",
		"Интенсивность высокая — через серию релив.",
		"Угловые и штрафные — автомат при подаче.",
		"Рондо и финишные комбинации.",
		"Контроль темпа: владение 60%+.",
		"Линия обороны, смещение и зона страховки.",
		"Интервалы и ускорения без мяча + заминка.",
		"Позиционная игра 8v8 на большой зоне.",
		"Отработка линии обороны и выходы на чужую половину.",
		"Низкий блок и контратака через фланги.",
		"Ускорения 10-20-30 м, работа с мячом на скорости.",
		"Удары из средней зоны и добивания.",
		"Прессинг и быстрый переход в атаку.",
		"Спарринг 11v11, контроль темпа и ротация.",
		"Индивидуальная работа: первый пас, финт, удар.",
		"Пенальти и свободные удары.",
		"Лёгкий бег, растяжка, регенерация.",
	}

	intensityPool := []domain.SessionIntensity{
		domain.SessionIntensityLow,
		domain.SessionIntensityMedium,
		domain.SessionIntensityHigh,
	}

	// Generate ~60 sessions per team over ~90 days
	for teamIdx := 0; teamIdx < len(teams); teamIdx++ {
		day := -90
		sessionCount := 0
		for day <= 5 && sessionCount < 65 {
			// 2-3 sessions per week
			sessionsThisWeek := 2 + (sessionCount % 2)
			for s := 0; s < sessionsThisWeek && day <= 5; s++ {
				hour := 10 + (s*8) + (teamIdx*2)
				if hour > 19 {
					hour = 19
				}
				focus := focusPool[sessionCount%len(focusPool)]
				notes := notesPool[sessionCount%len(notesPool)]
				intensity := intensityPool[sessionCount%len(intensityPool)]
				cancelled := false
				if sessionCount == 42 {
					cancelled = true
					notes = "Отменено из-за непогоды (снегопад)."
				}
				sessionPlans = append(sessionPlans, struct {
					dayOffset int
					hour      int
					minute    int
					teamIdx   int
					focus     []string
					notes     string
					cancelled bool
					intensity domain.SessionIntensity
				}{
					dayOffset: day,
					hour:      hour,
					minute:    (sessionCount * 7) % 60,
					teamIdx:   teamIdx,
					focus:     focus,
					notes:     notes,
					cancelled: cancelled,
					intensity: intensity,
				})
				sessionCount++
				day += 3 + rand.Intn(2)
			}
			day += 1
		}
	}

	// Sort session plans by dayOffset for consistency
	for i := 0; i < len(sessionPlans)-1; i++ {
		for j := i + 1; j < len(sessionPlans); j++ {
			if sessionPlans[i].dayOffset > sessionPlans[j].dayOffset {
				sessionPlans[i], sessionPlans[j] = sessionPlans[j], sessionPlans[i]
			}
		}
	}

	sessions := make([]*domain.TrainingSession, 0, len(sessionPlans))
	for idx, plan := range sessionPlans {
		start := baseDay.AddDate(0, 0, plan.dayOffset).Add(time.Duration(plan.hour)*time.Hour + time.Duration(plan.minute)*time.Minute)
		coachIdx := idx % len(coaches)

		st := domain.SessionStatusCompleted
		switch {
		case start.After(time.Now()):
			st = domain.SessionStatusPlanned
		case plan.cancelled:
			st = domain.SessionStatusCancelled
		default:
			st = domain.SessionStatusCompleted
		}

		locations := []string{"Главное поле", "Поле с искусственным покрытием", "Зал ФОК", "Стадион «Салют»"}
		session := &domain.TrainingSession{
			TeamID:      teams[plan.teamIdx].ID,
			CoachID:     coaches[coachIdx].ID,
			ScheduledAt: start,
			DurationMin: 80 + (idx%4)*10,
			Location:    locations[idx%len(locations)],
			Status:      st,
			Intensity:   plan.intensity,
			Focus:       pq.StringArray(plan.focus),
			Notes:       plan.notes,
		}
		if err := db.WithContext(ctx).Where("team_id = ? AND scheduled_at = ?", session.TeamID, session.ScheduledAt).FirstOrCreate(session).Error; err != nil {
			return err
		}
		sessions = append(sessions, session)

		blockDefs := []struct {
			kind       domain.BlockKind
			order      int
			dur        int
			exerciseIx []int
		}{
			{domain.BlockKindWarmup, 1, 18, []int{0, 11}},
			{domain.BlockKindMain, 2, 28, []int{1, 3, 4}},
			{domain.BlockKindMain, 3, 25, []int{5, 13}},
			{domain.BlockKindCooldown, 4, 12, []int{12, 14}},
		}
		if st == domain.SessionStatusCancelled {
			blockDefs = blockDefs[:1]
		}

		for _, bd := range blockDefs {
			block := &domain.TrainingBlock{
				SessionID:   session.ID,
				Kind:        bd.kind,
				OrderIndex:  bd.order,
				DurationMin: bd.dur,
			}
			if err := db.WithContext(ctx).Where("session_id = ? AND order_index = ?", block.SessionID, block.OrderIndex).FirstOrCreate(block).Error; err != nil {
				return err
			}
			for oi, exIx := range bd.exerciseIx {
				ei := exIx % len(exercises)
				se := &domain.SessionExercise{
					BlockID:     block.ID,
					ExerciseID:  exercises[ei].ID,
					OrderIndex:  oi + 1,
					DurationMin: 8 + oi*2,
					Sets:        2 + oi,
					Reps:        6 + oi*2,
				}
				q := db.WithContext(ctx).Where("block_id = ? AND exercise_id = ? AND order_index = ?", se.BlockID, se.ExerciseID, se.OrderIndex)
				if err := q.FirstOrCreate(se).Error; err != nil {
					return err
				}
			}
		}
	}

	// ── Attendance ───────────────────────────────────────────────────────────────
	attendanceByPlayer := make(map[string]struct{ present, total int })
	for _, session := range sessions {
		if session.Status != domain.SessionStatusCompleted {
			continue
		}
		// Find team index
		teamIdx := -1
		for i, t := range teams {
			if t.ID == session.TeamID {
				teamIdx = i
				break
			}
		}
		if teamIdx < 0 {
			continue
		}
		tp := teamPlayers(teamIdx)
		coachIdx := 0
		for i, c := range coaches {
			if c.ID == session.CoachID {
				coachIdx = i
				break
			}
		}

		for pi, p := range tp {
			stats := attendanceByPlayer[p.ID]
			stats.total++

			hash := rand.Intn(100)
			stRec := domain.AttendanceStatusPresent
			reason := ""
			switch {
			case hash < 6:
				stRec = domain.AttendanceStatusAbsent
				reason = []string{"Семейные обстоятельства", "Простуда", "Школьные занятия"}[pi%3]
			case hash < 10:
				stRec = domain.AttendanceStatusLate
				reason = "Опоздание на 10 минут"
			case hash < 13:
				stRec = domain.AttendanceStatusInjured
				reason = []string{"Растяжение задней поверхности", "Ушиб голеностопа", "Боль в пояснице"}[pi%3]
			case hash < 16:
				stRec = domain.AttendanceStatusExcused
				reason = []string{"Школьная олимпиада", "Медосмотр", "Сборы по другому виду"}[pi%3]
			default:
				stRec = domain.AttendanceStatusPresent
				stats.present++
			}
			attendanceByPlayer[p.ID] = stats

			rec := &domain.AttendanceRecord{
				SessionID:  session.ID,
				PlayerID:   p.ID,
				Status:     stRec,
				Reason:     reason,
				MarkedByID: coaches[coachIdx].ID,
				MarkedAt:   session.ScheduledAt,
			}
			if err := db.WithContext(ctx).Where("session_id = ? AND player_id = ?", rec.SessionID, rec.PlayerID).FirstOrCreate(rec).Error; err != nil {
				return err
			}
			_ = db.WithContext(ctx).Model(rec).Updates(map[string]interface{}{
				"status":       stRec,
				"reason":       reason,
				"marked_by_id": coaches[coachIdx].ID,
			}).Error
		}
	}

	// ── Assessments ──────────────────────────────────────────────────────────────
	// 6 assessments per player, distributed over 45 days so 4-5 fall within 14-day window
	assessmentOffsets := []time.Duration{
		-1 * 24 * time.Hour,
		-4 * 24 * time.Hour,
		-7 * 24 * time.Hour,
		-11 * 24 * time.Hour,
		-15 * 24 * time.Hour,
		-22 * 24 * time.Hour,
	}

	assessmentNotes := [][]string{
		{"Отличная работа на тренировке", "Высокая интенсивность", "Лидерские качества проявлены"},
		{"Стабильная игра", "Небольшой прогресс в технике", "Требуется усиление физики"},
		{"Нужно усилить ногу опоры в поворотах", "Потеря концентрации во 2-м тайме", "Хороший прогресс в прессинге"},
		{"Травма влияет на скорость", "Возвращается к оптимальной форме", "Отличное чтение игры"},
		{"Требуется работа над ударом", "Улучшил пасовую точность", "Нужно больше общения на поле"},
		{"Физическая форма на пике", "Тактические действия безупречны", "Нужно работать над дисциплиной"},
	}

	for pi, p := range players {
		fp := formProfiles[pi]
		coachIdx := pi % len(coaches)

		for ai, off := range assessmentOffsets {
			var baseAvg float64
			switch fp {
			case formExcellent:
				baseAvg = 8.0 + float64(ai)*0.15 // rising to ~8.8
			case formRising:
				baseAvg = 6.0 + float64(ai)*0.45 // 6.0 -> 8.3
			case formFalling:
				baseAvg = 8.5 - float64(ai)*0.35 // 8.5 -> 6.8
			case formStable:
				baseAvg = 6.8 + math.Sin(float64(ai))*0.4 // ~6.5-7.2
			case formRusty:
				baseAvg = 5.5 + rand.Float64()*1.5 // low and random
			}

			// Clamp to 1-10
			baseAvg = math.Max(1, math.Min(10, baseAvg))

			tech := int(math.Round(math.Max(1, math.Min(10, baseAvg+rand.Float64()*1.2-0.6))))
			phys := int(math.Round(math.Max(1, math.Min(10, baseAvg+rand.Float64()*1.2-0.8))))
			tact := int(math.Round(math.Max(1, math.Min(10, baseAvg+rand.Float64()*1.0-0.5))))
			disc := int(math.Round(math.Max(1, math.Min(10, 6.5+rand.Float64()*2))))
			team := int(math.Round(math.Max(1, math.Min(10, 6.8+rand.Float64()*1.8))))

			notes := assessmentNotes[pi%len(assessmentNotes)][ai%3]

			a := &domain.PlayerAssessment{
				PlayerID:   p.ID,
				CoachID:    coaches[coachIdx].ID,
				AssessedAt: baseDay.Add(off).Add(time.Duration(ai) * time.Hour),
				Technical:  tech,
				Physical:   phys,
				Tactical:   tact,
				Discipline: disc,
				Teamwork:   team,
				Notes:      notes,
			}
			if err := db.WithContext(ctx).Where("player_id = ? AND assessed_at = ?", a.PlayerID, a.AssessedAt).FirstOrCreate(a).Error; err != nil {
				return err
			}
		}
	}

	// ── Player Goals ─────────────────────────────────────────────────────────────
	goalTitles := []string{
		"Улучшить удар с левой",
		"Набрать 85%+ посещаемости",
		"Выход на первый состав",
		"Увеличить скорость ускорения",
		"Улучшить игру головой",
		"Снизить количество жёлтых карточек",
		"Развить лидерские качества",
		"Повысить точность паса",
	}
	goalDescs := []string{
		"Цель сезона — минимум 70% точности ударов с левой ноги.",
		"Регулярное посещение тренировок и матчей.",
		"Закрепиться в стартовом составе на 5+ матчей подряд.",
		"Сократить время реакции на старт на 0.2 сек.",
		"Победить в 60%+ единоборств в воздухе.",
		"Дисциплина — не более 3 жёлтых за сезон.",
		"Стать капитаном команды или её лидером.",
		"Довести точность короткого паса до 90%+.",
	}

	for i, p := range players {
		numGoals := 2 + (i % 2)
		for g := 0; g < numGoals; g++ {
			gi := (i*3 + g) % len(goalTitles)
			deadline := baseDay.AddDate(0, 2, 15+(g*10))
			progress := float64(15 + (i*7+g*13)%75)
			status := domain.GoalStatusActive
			if progress >= 100 {
				progress = 100
				status = domain.GoalStatusAchieved
			} else if progress < 20 {
				status = domain.GoalStatusPaused
			}
			if i%7 == 0 && g == 0 {
				status = domain.GoalStatusAchieved
				progress = 100
			}

			goal := &domain.PlayerGoal{
				PlayerID:     p.ID,
				Title:        goalTitles[gi],
				Description:  goalDescs[gi],
				TargetMetric: "тест/матчи",
				TargetValue:  float64(60 + (i%40)),
				Deadline:     &deadline,
				Status:       status,
				ProgressPct:  progress,
			}
			if err := db.WithContext(ctx).Where("player_id = ? AND title = ?", goal.PlayerID, goal.Title).FirstOrCreate(goal).Error; err != nil {
				return err
			}
			_ = db.WithContext(ctx).Model(goal).Updates(map[string]interface{}{
				"progress_pct": progress,
				"status":       status,
				"deadline":     deadline,
			}).Error
		}
	}

	// ── Matches ──────────────────────────────────────────────────────────────────
	// 15 completed + 5 scheduled per team
	allMatchDefs := []struct {
		opponent string
		isHome   bool
		gf, ga   int
		loc      string
		daysAgo  int
		teamIdx  int
	}{
		// U15 matches
		{"Академия Спартак U15", true, 3, 1, "Домашний стадион", 2, 0},
		{"СШ Локомотив U15", false, 1, 2, "Москва, Черкизово", 5, 0},
		{"Академия Динамо U15", true, 2, 2, "Домашний стадион", 9, 0},
		{"ФК Ростов U15", false, 0, 3, "Ростов-на-Дону", 12, 0},
		{"Академия Зенит U15", true, 1, 0, "Домашний стадион", 16, 0},
		{"СШ ЦСКА U15", false, 4, 2, "Москва, Вешки", 19, 0},
		{"Академия Краснодар U15", true, 2, 1, "Домашний стадион", 23, 0},
		{"СШ Чертаново U15", false, 1, 1, "Москва, Чертаново", 26, 0},
		{"ЮФЛ — групповой этап", true, 2, 0, "Главное поле", 30, 0},
		{"ЮФЛ — групповой этап", false, 0, 1, "Москва, Химки", 33, 0},
		{"Кубок Москвы — 1/8", true, 3, 2, "Домашний стадион", 37, 0},
		{"Турнир Весна — группа", false, 1, 3, "Подольск", 40, 0},
		{"Турнир Весна — группа", true, 2, 2, "Главное поле", 44, 0},
		{"Товарищеский — СШ Орехово", true, 4, 0, "Домашний стадион", 47, 0},
		{"Товарищеский — Академия Торпедо", false, 2, 1, "Москва, ВАО", 51, 0},

		// U17 matches
		{"Академия Спартак U17", true, 2, 0, "Домашний стадион", 3, 1},
		{"СШ Локомотив U17", false, 1, 1, "Москва, Черкизово", 6, 1},
		{"Академия Динамо U17", true, 3, 2, "Домашний стадион", 10, 1},
		{"ФК Ростов U17", false, 1, 2, "Ростов-на-Дону", 13, 1},
		{"Академия Зенит U17", true, 0, 0, "Домашний стадион", 17, 1},
		{"СШ ЦСКА U17", false, 2, 1, "Москва, Вешки", 20, 1},
		{"Академия Краснодар U17", true, 1, 2, "Домашний стадион", 24, 1},
		{"СШ Чертаново U17", false, 3, 1, "Москва, Чертаново", 27, 1},
		{"ЮФЛ — групповой этап", true, 1, 1, "Главное поле", 31, 1},
		{"ЮФЛ — групповой этап", false, 2, 3, "Москва, Химки", 34, 1},
		{"Кубок РФС — 1/16", true, 2, 0, "Домашний стадион", 38, 1},
		{"Турнир Весна — группа", false, 0, 2, "Подольск", 41, 1},
		{"Турнир Весна — группа", true, 3, 1, "Главное поле", 45, 1},
		{"Товарищеский — Академия Химки", false, 1, 0, "Химки", 48, 1},
		{"Товарищеский — СШ Звезда", true, 4, 2, "Домашний стадион", 52, 1},

		// Senior matches
		{"ФК Велес", true, 2, 1, "Домашний стадион", 4, 2},
		{"ФК Торпедо М", false, 0, 3, "Москва, Эдука", 7, 2},
		{"ФК Родина", true, 1, 1, "Домашний стадион", 11, 2},
		{"ФК Знамя Труда", false, 3, 2, "Орехово-Зуево", 14, 2},
		{"ФК Химки", true, 0, 2, "Домашний стадион", 18, 2},
		{"ФК Динамо-2", false, 2, 0, "Москва, Химки", 21, 2},
		{"ФК Локомотив-2", true, 1, 0, "Домашний стадион", 25, 2},
		{"ФК Спартак-2", false, 1, 3, "Москва, Черкизово", 28, 2},
		{"Первенство ФНЛ — тур 9", true, 2, 2, "Главное поле", 32, 2},
		{"Первенство ФНЛ — тур 10", false, 0, 1, "Москва, Вешки", 35, 2},
		{"Кубок России — 1/256", true, 3, 0, "Домашний стадион", 39, 2},
		{"Товарищеский — ФК Калуга", false, 2, 1, "Калуга", 42, 2},
		{"Товарищеский — ФК Домодедово", true, 1, 1, "Главное поле", 46, 2},
		{"Первенство ФНЛ — тур 11", false, 1, 2, "Серпухов", 49, 2},
		{"Первенство ФНЛ — тур 12", true, 4, 1, "Домашний стадион", 53, 2},
	}

	scheduledMatchDefs := []struct {
		opponent string
		isHome   bool
		loc      string
		daysFrom int
		teamIdx  int
	}{
		{"ЮФЛ — 1/4 финала", true, "Домашний стадион", 4, 0},
		{"Турнир Весна — полуфинал", false, "Подольск", 9, 0},
		{"Товарищеский — Академия ЦСКА", true, "Домашний стадион", 14, 0},
		{"ЮФЛ — группа (отбор)", false, "Москва, Химки", 19, 0},
		{"Кубок города — финал", true, "Главное поле", 24, 0},

		{"ЮФЛ — 1/4 финала", true, "Домашний стадион", 5, 1},
		{"Кубок РФС — 1/8", false, "Москва, Вешки", 10, 1},
		{"Турнир Весна — полуфинал", true, "Главное поле", 15, 1},
		{"Товарищеский — Академия Локомотив", false, "Черкизово", 20, 1},
		{"ЮФЛ — финал", true, "Домашний стадион", 25, 1},

		{"Первенство ФНЛ — тур 13", false, "Москва, Эдука", 6, 2},
		{"Кубок России — 1/128", true, "Домашний стадион", 11, 2},
		{"Товарищеский — ФК Балтика", false, "Калининград", 16, 2},
		{"Первенство ФНЛ — тур 14", true, "Главное поле", 21, 2},
		{"Товарищеский — ФК Велес", false, "Подольск", 26, 2},
	}

	// Create completed matches
	for i, md := range allMatchDefs {
		kick := baseDay.Add(-time.Duration(md.daysAgo) * 24 * time.Hour).Add(time.Duration(10+i%5) * time.Hour)
		match := &domain.Match{
			TeamID:       teams[md.teamIdx].ID,
			Opponent:     md.opponent,
			KickoffAt:    kick,
			Location:     md.loc,
			IsHome:       md.isHome,
			Status:       domain.MatchStatusCompleted,
			GoalsFor:     md.gf,
			GoalsAgainst: md.ga,
			Notes:        fmt.Sprintf("Матч сезона 2025/26. %s", md.opponent),
		}
		if err := db.WithContext(ctx).Where("team_id = ? AND opponent = ? AND kickoff_at = ?", match.TeamID, match.Opponent, match.KickoffAt).FirstOrCreate(match).Error; err != nil {
			return err
		}

		// Lineup: all team players, 11 starters + rest substitutes
		tp := teamPlayers(md.teamIdx)
		starters := make([]*domain.Player, 0, 11)
		subs := make([]*domain.Player, 0)

		// Pick starters by position preference
		posOrder := []domain.Position{domain.PositionGoalkeeper, domain.PositionDefender, domain.PositionMidfielder, domain.PositionForward}
		for _, pos := range posOrder {
			for _, pl := range tp {
				if len(starters) >= 11 {
					break
				}
				if pl.Position == pos {
					// Check not already in starters
					found := false
					for _, s := range starters {
						if s.ID == pl.ID {
							found = true
							break
						}
					}
					if !found {
						starters = append(starters, pl)
					}
				}
			}
		}
		// Fill remaining with any
		for _, pl := range tp {
			if len(starters) >= 11 {
				break
			}
			found := false
			for _, s := range starters {
				if s.ID == pl.ID {
					found = true
					break
				}
			}
			if !found {
				starters = append(starters, pl)
			}
		}

		// Subs = everyone else
		for _, pl := range tp {
			found := false
			for _, s := range starters {
				if s.ID == pl.ID {
					found = true
					break
				}
			}
			if !found {
				subs = append(subs, pl)
			}
		}

		allInMatch := append(starters, subs...)

		for li, pl := range allInMatch {
			role := domain.LineupRoleStarter
			minutes := 75 + rand.Intn(16)
			if li >= 11 {
				role = domain.LineupRoleSubstitute
				minutes = 10 + rand.Intn(21)
			}
			ml := &domain.MatchLineup{
				MatchID:       match.ID,
				PlayerID:      pl.ID,
				Role:          role,
				Position:      pl.Position,
				MinutesPlayed: minutes,
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND player_id = ?", ml.MatchID, ml.PlayerID).FirstOrCreate(ml).Error; err != nil {
				return err
			}
			_ = db.WithContext(ctx).Model(ml).Update("minutes_played", minutes).Error
		}

		// Match Events
		// Goals for our team
		for g := 0; g < md.gf && len(starters) > 0; g++ {
			scorer := starters[(g+i)%len(starters)]
			minute := 10 + rand.Intn(80)
			ev := &domain.MatchEvent{
				MatchID:  match.ID,
				PlayerID: &scorer.ID,
				Minute:   minute,
				Type:     domain.MatchEventGoal,
				Notes:    []string{"Гол после прострела", "Удар со штрафного", "Гол после розыгрыша углового", "Соло-проход", "Добивание"}[g%5],
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ?", ev.MatchID, ev.Minute, ev.Type).FirstOrCreate(ev).Error; err != nil {
				return err
			}

			// Assist for some goals
			if g%2 == 0 && len(starters) > 1 {
				assister := starters[(g+i+1)%len(starters)]
				if assister.ID != scorer.ID {
					ass := &domain.MatchEvent{
						MatchID:  match.ID,
						PlayerID: &assister.ID,
						Minute:   minute,
						Type:     domain.MatchEventAssist,
						Notes:    "Голевая передача",
					}
					if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ? AND player_id = ?", ass.MatchID, ass.Minute, ass.Type, assister.ID).FirstOrCreate(ass).Error; err != nil {
						return err
					}
				}
			}
		}

		// Yellow cards
		numYellows := rand.Intn(3)
		for y := 0; y < numYellows && len(allInMatch) > 0; y++ {
			player := allInMatch[(y+i)%len(allInMatch)]
			minute := 15 + rand.Intn(75)
			ev := &domain.MatchEvent{
				MatchID:  match.ID,
				PlayerID: &player.ID,
				Minute:   minute,
				Type:     domain.MatchEventYellow,
				Notes:    []string{"Фол при контре", "Нарушение правил", "Задержка соперника", "Грубая игра"}[y%4],
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ? AND player_id = ?", ev.MatchID, ev.Minute, ev.Type, player.ID).FirstOrCreate(ev).Error; err != nil {
				return err
			}
		}

		// Red cards (rare)
		if rand.Intn(10) == 0 && len(allInMatch) > 0 {
			player := allInMatch[rand.Intn(len(allInMatch))]
			minute := 30 + rand.Intn(60)
			ev := &domain.MatchEvent{
				MatchID:  match.ID,
				PlayerID: &player.ID,
				Minute:   minute,
				Type:     domain.MatchEventRed,
				Notes:    "Вторая жёлтая карточка",
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ? AND player_id = ?", ev.MatchID, ev.Minute, ev.Type, player.ID).FirstOrCreate(ev).Error; err != nil {
				return err
			}
		}

		// Substitutions
		numSubs := 2 + rand.Intn(4)
		if numSubs > len(subs) {
			numSubs = len(subs)
		}
		for s := 0; s < numSubs && s < len(subs) && s < len(starters); s++ {
			minute := 45 + rand.Intn(40)
			out := starters[s]
			in := subs[s]
			evOut := &domain.MatchEvent{
				MatchID:  match.ID,
				PlayerID: &out.ID,
				Minute:   minute,
				Type:     domain.MatchEventSubOut,
				Notes:    "Замена по тактике",
			}
			evIn := &domain.MatchEvent{
				MatchID:  match.ID,
				PlayerID: &in.ID,
				Minute:   minute,
				Type:     domain.MatchEventSubIn,
				Notes:    "",
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ? AND player_id = ?", evOut.MatchID, evOut.Minute, evOut.Type, out.ID).FirstOrCreate(evOut).Error; err != nil {
				return err
			}
			if err := db.WithContext(ctx).Where("match_id = ? AND minute = ? AND type = ? AND player_id = ?", evIn.MatchID, evIn.Minute, evIn.Type, in.ID).FirstOrCreate(evIn).Error; err != nil {
				return err
			}
		}
	}

	// Create scheduled matches
	for _, md := range scheduledMatchDefs {
		kick := baseDay.AddDate(0, 0, md.daysFrom).Add(time.Duration(15+md.teamIdx*2) * time.Hour)
		match := &domain.Match{
			TeamID:       teams[md.teamIdx].ID,
			Opponent:     md.opponent,
			KickoffAt:    kick,
			Location:     md.loc,
			IsHome:       md.isHome,
			Status:       domain.MatchStatusScheduled,
			GoalsFor:     0,
			GoalsAgainst: 0,
			Notes:        "Проверьте состав и медицинский допуск.",
		}
		if err := db.WithContext(ctx).Where("team_id = ? AND opponent = ? AND kickoff_at = ?", match.TeamID, match.Opponent, match.KickoffAt).FirstOrCreate(match).Error; err != nil {
			return err
		}
	}

	// ── DevIndex Update ──────────────────────────────────────────────────────────
	for pi, p := range players {
		stats := attendanceByPlayer[p.ID]
		attPct := 50.0
		if stats.total > 0 {
			attPct = float64(stats.present) / float64(stats.total) * 100
		}

		// Average assessment score
		var avgAsm float64
		switch formProfiles[pi] {
		case formExcellent:
			avgAsm = 8.2 + rand.Float64()*0.8
		case formRising:
			avgAsm = 7.0 + rand.Float64()*0.8
		case formFalling:
			avgAsm = 6.5 + rand.Float64()*0.8
		case formStable:
			avgAsm = 6.8 + rand.Float64()*0.6
		case formRusty:
			avgAsm = 5.0 + rand.Float64()*1.0
		}

		// Goal achievement rate
		var goalsAchieved, goalsTotal int64
		db.WithContext(ctx).Model(&domain.PlayerGoal{}).Where("player_id = ?", p.ID).Count(&goalsTotal)
		db.WithContext(ctx).Model(&domain.PlayerGoal{}).Where("player_id = ? AND status = ?", p.ID, domain.GoalStatusAchieved).Count(&goalsAchieved)
		gPct := 30.0
		if goalsTotal > 0 {
			gPct = float64(goalsAchieved) / float64(goalsTotal) * 100
		}

		di := demoPDI(attPct, avgAsm, gPct)
		if err := db.WithContext(ctx).Model(p).Update("dev_index", di).Error; err != nil {
			return err
		}
	}

	// ── Notifications ────────────────────────────────────────────────────────────
	notifs := []struct {
		userID string
		t      domain.NotificationType
		title  string
		body   string
	}{
		{coaches[0].ID, domain.NotificationSessionCreated, "Тренировка U15 завтра 10:00", "Проверьте список и замены для основного блока."},
		{coaches[1].ID, domain.NotificationAssessmentAdded, "Новые оценки игроков", "Обновлены радары по итогам недели."},
		{coaches[2].ID, domain.NotificationMatchScheduled, "Матч в выходные — проверьте состав", "U17 играет против Академии Спартак."},
		{admin.ID, domain.NotificationGeneral, "Демо-данные CoachOS", "Можно менять составы, посещаемость и матчи — всё для презентации платформы."},
		{parentUser.ID, domain.NotificationReportReady, "Отчёт о прогрессе ребёнка", "Краткая сводка по посещаемости и оценкам доступна в кабинете."},
		{coaches[0].ID, domain.NotificationAttendanceMarked, "3 отсутствующих на тренировке U15", "Проверьте причины отсутствия."},
	}
	for _, n := range notifs {
		nf := &domain.Notification{
			UserID: n.userID,
			Type:   n.t,
			Title:  n.title,
			Body:   n.body,
		}
		if err := db.WithContext(ctx).Where("user_id = ? AND title = ?", nf.UserID, nf.Title).FirstOrCreate(nf).Error; err != nil {
			return err
		}
	}

	// ── Reports ──────────────────────────────────────────────────────────────────
	reportDefs := []struct {
		reportType  domain.ReportType
		title       string
		teamIdx     int
		playerIdx   int
		generatedBy string
	}{
		{domain.ReportTypePlayer, "Анализ прогресса — Арсений Голубев", -1, 0, coaches[0].ID},
		{domain.ReportTypeTeam, "Сводка по U15", 0, -1, coaches[0].ID},
		{domain.ReportTypeAttendance, "Посещаемость за месяц", -1, -1, coaches[0].ID},
		{domain.ReportTypePlayer, "Анализ прогресса — Роман Комаров", -1, 26, coaches[0].ID},
		{domain.ReportTypeTeam, "Сводка по U17", 1, -1, coaches[1].ID},
		{domain.ReportTypeProgress, "Командный прогресс — Основная", 2, -1, coaches[1].ID},
	}
	for ri, rd := range reportDefs {
		genAt := baseDay.Add(-time.Duration(ri*3) * 24 * time.Hour)
		scopeID := club.ID
		switch rd.reportType {
		case domain.ReportTypePlayer:
			if rd.playerIdx >= 0 && rd.playerIdx < len(players) {
				scopeID = players[rd.playerIdx].ID
			}
		case domain.ReportTypeTeam:
			if rd.teamIdx >= 0 && rd.teamIdx < len(teams) {
				scopeID = teams[rd.teamIdx].ID
			}
		case domain.ReportTypeAttendance:
			scopeID = club.ID
		}
		paramsMap := map[string]interface{}{
			"title":       rd.title,
			"generatedAt": genAt.Format(time.RFC3339),
			"fileURL":     "",
		}
		paramsJSON, _ := json.Marshal(paramsMap)
		r := &domain.Report{
			ClubID:        club.ID,
			Type:          rd.reportType,
			ScopeID:       scopeID,
			GeneratedByID: rd.generatedBy,
			Params:        datatypes.JSON(paramsJSON),
			Snapshot:      datatypes.JSON([]byte(`{}`)),
		}
		if err := db.WithContext(ctx).Where("club_id = ? AND type = ? AND scope_id = ?", r.ClubID, r.Type, r.ScopeID).FirstOrCreate(r).Error; err != nil {
			return err
		}
	}

	// ── AI Recommendations ───────────────────────────────────────────────────────
	aiRecDefs := []struct {
		targetIdx       int
		playerName      string
		summary         string
		recommendations []string
	}{
		{0, "Arseniy Golubev", "Сильный технический базис, но нужно развивать скоростные качества", []string{"Добавить интервальные ускорения 2 раза в неделю", "Работать над первым шагом при развороте", "Включить упражнения на реакцию в тренировку"}},
		{26, "Roman Komarov", "Отличная игра головой и позиционное чутьё", []string{"Улучшить удар с левой в движении", "Усилить прессинговые действия", "Развивать комбинационную игру в штрафной"}},
		{8, "Lev Morozov", "Быстрый прогресс в тактическом понимании", []string{"Добавить нагрузку на физику", "Работать над дальними передачами", "Участвовать в спаррингах с U17"}},
		{36, "Evgeniy Vorobyov", "Лидер команды, отличная дисциплина", []string{"Поддерживать текущую форму", "Делиться опытом с молодыми игроками", "Работать над стандартами"}},
	}
	for _, ai := range aiRecDefs {
		promptData := map[string]interface{}{"playerName": ai.playerName, "position": string(players[ai.targetIdx].Position)}
		responseData := map[string]interface{}{"summary": ai.summary, "recommendations": ai.recommendations}
		promptJSON, _ := json.Marshal(promptData)
		responseJSON, _ := json.Marshal(responseData)

		ar := &domain.AIRecommendation{
			TargetType:  domain.AITargetPlayer,
			TargetID:    players[ai.targetIdx].ID,
			Prompt:      datatypes.JSON(promptJSON),
			Response:    datatypes.JSON(responseJSON),
			CreatedByID: coaches[0].ID,
		}
		if err := db.WithContext(ctx).Where("target_type = ? AND target_id = ? AND created_by_id = ?", ar.TargetType, ar.TargetID, ar.CreatedByID).FirstOrCreate(ar).Error; err != nil {
			return err
		}
	}

	// ── Audit Logs ───────────────────────────────────────────────────────────────
	auditDefs := []struct {
		actorID    string
		action     string
		entityType string
		entityID   string
		oldVal     map[string]interface{}
		newVal     map[string]interface{}
	}{
		{coaches[0].ID, "update_player", "player", players[0].ID, map[string]interface{}{"dev_index": 45.5}, map[string]interface{}{"dev_index": players[0].DevIndex}},
		{coaches[0].ID, "create_session", "team", teams[0].ID, map[string]interface{}{}, map[string]interface{}{"team_id": teams[0].ID, "note": "demo session"}},
		{admin.ID, "update_club", "club", club.ID, map[string]interface{}{"name": "Old Academy"}, map[string]interface{}{"name": club.Name}},
		{coaches[1].ID, "mark_attendance", "player", players[1].ID, map[string]interface{}{"status": "unknown"}, map[string]interface{}{"status": "present"}},
		{coaches[2].ID, "add_assessment", "player", players[5].ID, map[string]interface{}{}, map[string]interface{}{"technical": 7, "physical": 8}},
		{coaches[0].ID, "schedule_match", "match", teams[1].ID, map[string]interface{}{}, map[string]interface{}{"opponent": "Академия Спартак U17"}},
	}
	for i, ad := range auditDefs {
		oldJSON, _ := json.Marshal(ad.oldVal)
		newJSON, _ := json.Marshal(ad.newVal)
		createdAt := baseDay.Add(-time.Duration(i*2) * 24 * time.Hour)
		al := &domain.AuditLog{
			ActorID:    ad.actorID,
			Action:     ad.action,
			EntityType: ad.entityType,
			EntityID:   ad.entityID,
			Before:     datatypes.JSON(oldJSON),
			After:      datatypes.JSON(newJSON),
			CreatedAt:  createdAt,
		}
		if err := db.WithContext(ctx).Where("actor_id = ? AND action = ? AND entity_id = ?", al.ActorID, al.Action, al.EntityID).FirstOrCreate(al).Error; err != nil {
			return err
		}
	}

	// ── Coach Notes ──────────────────────────────────────────────────────────────
	coachNoteDefs := []struct {
		playerIdx int
		category  string
		content   string
		isPrivate bool
	}{
		{0, "technique", "Отличная работа ногами, нужно улучшить удар с левой.", false},
		{0, "physical", "Восстановление после растяжения идёт по плану.", true},
		{5, "tactics", "Нужно больше общаться с защитниками при выходе из обороны.", false},
		{8, "behavior", "Лидерские качества проявляются в сложных матчах.", false},
		{14, "technique", "Финты стали разнообразнее, но нужна точность финальной передачи.", false},
		{18, "medical", "Лёгкий ушиб колена, пропустил одну тренировку.", true},
		{26, "tactics", "Идеально читает линию обороны, отличные разрезающие передачи.", false},
		{30, "physical", "Набрал 2 кг мышечной массы за месяц, скорость не пострадала.", false},
		{36, "behavior", "Капитан команды, организует прессинг.", false},
		{40, "technique", "Нужно работать над первым касанием при приёме длинных передач.", false},
	}
	for _, cn := range coachNoteDefs {
		if cn.playerIdx >= len(players) {
			continue
		}
		note := &domain.CoachNote{
			PlayerID:  players[cn.playerIdx].ID,
			CoachID:   coaches[0].ID,
			Category:  cn.category,
			Content:   cn.content,
			IsPrivate: cn.isPrivate,
			CreatedAt: baseDay.Add(-time.Duration(rand.Intn(30)) * 24 * time.Hour),
			UpdatedAt: baseDay.Add(-time.Duration(rand.Intn(10)) * 24 * time.Hour),
		}
		if err := db.WithContext(ctx).Where("player_id = ? AND coach_id = ? AND content = ?", note.PlayerID, note.CoachID, note.Content).FirstOrCreate(note).Error; err != nil {
			return err
		}
	}

	// ── Medical Records ──────────────────────────────────────────────────────────
	medicalDefs := []struct {
		playerIdx   int
		condition   string
		description string
		startDate   string
		endDate     string
		severity    string
		status      string
	}{
		{3, "injury", "Растяжение задней поверхности бедра", "2025-04-10", "2025-04-25", "moderate", "recovered"},
		{8, "injury", "Ушиб голеностопного сустава", "2025-05-01", "2025-05-10", "minor", "recovered"},
		{12, "illness", "ОРВИ", "2025-05-15", "2025-05-20", "minor", "recovered"},
		{18, "injury", "Вывих плеча", "2025-03-20", "2025-05-15", "severe", "recovered"},
		{25, "recovery", "Реабилитация после операции на колене", "2025-01-10", "2025-06-01", "severe", "active"},
		{30, "injury", "Растяжение паховых мышц", "2025-05-20", "", "moderate", "active"},
		{42, "illness", "Ангина", "2025-04-05", "2025-04-12", "minor", "recovered"},
		{48, "fit", "Полное восстановление, допущен к полной нагрузке", "2025-05-01", "", "minor", "recovered"},
	}
	for _, md := range medicalDefs {
		if md.playerIdx >= len(players) {
			continue
		}
		startDate := md.startDate
		mr := &domain.MedicalRecord{
			PlayerID:    players[md.playerIdx].ID,
			Condition:   md.condition,
			Description: md.description,
			StartDate:   &startDate,
			Severity:    md.severity,
			Status:      md.status,
			CreatedAt:   baseDay.Add(-time.Duration(rand.Intn(60)) * 24 * time.Hour),
			UpdatedAt:   baseDay.Add(-time.Duration(rand.Intn(20)) * 24 * time.Hour),
		}
		if md.endDate != "" {
			mr.EndDate = &md.endDate
		}
		if err := db.WithContext(ctx).Where("player_id = ? AND description = ?", mr.PlayerID, mr.Description).FirstOrCreate(mr).Error; err != nil {
			return err
		}
	}

	return nil
}
