package service

import (
	"context"
	"crypto/rand"
	"math/big"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/repository"
	"github.com/google/uuid"
)

// ParentService handles parent-related business logic.
type ParentService struct {
	parentRepo repository.ParentRepository
	playerRepo repository.PlayerRepository
	userRepo   repository.UserRepository
	notifier   Notifier
}

// Notifier interface for sending notifications.
type Notifier interface {
	NotifyParentInvitation(email string, inv *domain.ParentInvitation, player *domain.Player) error
	NotifyParentLinked(parentUserID string, playerName string) error
}

// NewParentService creates a new ParentService.
func NewParentService(parentRepo repository.ParentRepository, playerRepo repository.PlayerRepository, userRepo repository.UserRepository, notifier Notifier) *ParentService {
	return &ParentService{
		parentRepo: parentRepo,
		playerRepo: playerRepo,
		userRepo:   userRepo,
		notifier:   notifier,
	}
}

// ============== Вариант A: Приглашения по email ==============

// CreateInvitation создает приглашение для родителя по email (тренер вызывает)
func (s *ParentService) CreateInvitation(ctx context.Context, playerID, email string, createdBy string) (*domain.ParentInvitation, error) {
	// Проверяем что игрок существует
	player, err := s.playerRepo.FindByID(ctx, playerID)
	if err != nil {
		return nil, err
	}
	if player.UserID != nil && *player.UserID != "" {
		return nil, domain.NewBadRequest("player card already linked to a user account")
	}

	// Проверяем нет ли уже активного приглашения
	existing, err := s.parentRepo.GetPendingInvitationByEmail(ctx, playerID, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, domain.NewBadRequest("invitation already exists for this email")
	}

	// Создаем уникальный токен
	token := uuid.New().String()

	inv := &domain.ParentInvitation{
		PlayerID:  playerID,
		ClubID:    player.ClubID,
		Email:     email,
		Token:     token,
		Status:    domain.InvitationStatusPending,
		CreatedBy: createdBy,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 дней
	}

	if err := s.parentRepo.CreateInvitation(ctx, inv); err != nil {
		return nil, err
	}

	// Отправляем уведомление (в реальном приложении здесь email)
	if s.notifier != nil {
		_ = s.notifier.NotifyParentInvitation(email, inv, player)
	}

	return inv, nil
}

// AcceptInvitation принимает приглашение по токену (родитель вызывает)
func (s *ParentService) AcceptInvitation(ctx context.Context, token string, claims *pkgjwt.Claims) error {
	inv, err := s.parentRepo.GetInvitationByToken(ctx, token)
	if err != nil {
		return err
	}

	// Проверяем статус
	if inv.Status != domain.InvitationStatusPending {
		return domain.NewBadRequest("invitation already processed")
	}

	// Проверяем срок действия
	if time.Now().After(inv.ExpiresAt) {
		return domain.NewBadRequest("invitation expired")
	}

	// Проверяем email (если в токене указан email, он должен совпадать с email пользователя)
	if inv.Email != "" && inv.Email != claims.Email {
		return domain.NewForbidden("email mismatch")
	}

	// Проверяем не связан ли уже
	alreadyLinked, err := s.parentRepo.IsParentLinkedToPlayer(ctx, claims.UserID, inv.PlayerID)
	if err != nil {
		return err
	}
	if alreadyLinked {
		return domain.NewBadRequest("already linked to this player")
	}

	// Получаем или создаем запись родителя
	parent, err := s.parentRepo.FindByUserID(ctx, claims.UserID)
	if err != nil {
		return err
	}

	var parentID string
	if parent == nil {
		parent = &domain.Parent{
			UserID:   &claims.UserID,
			FullName: claims.FirstName + " " + claims.LastName,
			Email:    claims.Email,
		}
		if err := s.parentRepo.Create(ctx, parent); err != nil {
			return err
		}
	}
	parentID = parent.ID

	// Создаем связь
	if err := s.parentRepo.LinkToPlayer(ctx, inv.PlayerID, parentID); err != nil {
		return err
	}

	// Отмечаем приглашение принятым
	if err := s.parentRepo.MarkInvitationAccepted(ctx, inv.ID, claims.UserID); err != nil {
		return err
	}

	// Уведомляем родителя
	if s.notifier != nil {
		_ = s.notifier.NotifyParentLinked(claims.UserID, inv.Player.FullName())
	}

	return nil
}

// ListInvitationsForPlayer возвращает приглашения для игрока (для тренера)
func (s *ParentService) ListInvitationsForPlayer(ctx context.Context, playerID string) ([]dto.InvitationResponse, error) {
	invs, err := s.parentRepo.ListInvitationsForPlayer(ctx, playerID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.InvitationResponse, 0, len(invs))
	for _, inv := range invs {
		resp := dto.InvitationResponse{
			ID:         inv.ID,
			PlayerID:   inv.PlayerID,
			Email:      inv.Email,
			Token:      inv.Token,
			Status:     string(inv.Status),
			ExpiresAt:  inv.ExpiresAt,
			CreatedAt:  inv.CreatedAt,
			AcceptedAt: inv.AcceptedAt,
		}
		result = append(result, resp)
	}

	return result, nil
}

// ============== Вариант C: Коды доступа ==============

// GenerateLinkCode генерирует 6-значный код для игрока (тренер вызывает)
func (s *ParentService) GenerateLinkCode(ctx context.Context, playerID string, createdBy string) (*domain.PlayerLinkCode, error) {
	// Проверяем что игрок существует
	player, err := s.playerRepo.FindByID(ctx, playerID)
	if err != nil {
		return nil, err
	}
	if player.UserID != nil && *player.UserID != "" {
		return nil, domain.NewBadRequest("player card already linked to a user account")
	}

	// Генерируем 6-значный код
	code, err := generateNumericCode(6)
	if err != nil {
		return nil, err
	}

	lc := &domain.PlayerLinkCode{
		PlayerID:  playerID,
		ClubID:    player.ClubID,
		Code:      code,
		CreatedBy: createdBy,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 дней
	}

	if err := s.parentRepo.CreateLinkCode(ctx, lc); err != nil {
		return nil, err
	}

	return lc, nil
}

// UseLinkCode использует код для связывания (родитель или игрок вызывает)
func (s *ParentService) UseLinkCode(ctx context.Context, code string, claims *pkgjwt.Claims) (*domain.Player, error) {
	lc, err := s.parentRepo.GetLinkCodeByCode(ctx, code)
	if err != nil {
		return nil, err
	}

	// Проверяем не использован ли
	if lc.UsedAt != nil {
		return nil, domain.NewBadRequest("code already used")
	}

	// Проверяем срок действия
	if time.Now().After(lc.ExpiresAt) {
		return nil, domain.NewBadRequest("code expired")
	}

	// Получаем игрока для ответа и проверок
	player, err := s.playerRepo.FindByID(ctx, lc.PlayerID)
	if err != nil {
		return nil, err
	}

	// Проверяем принадлежность к клубу
	if claims.ClubID != "" && player.ClubID != claims.ClubID {
		return nil, domain.NewForbidden("player does not belong to your club")
	}

	role := domain.Role(claims.Role)

	switch role {
	case domain.RolePlayer:
		// Игрок связывает свою учетную запись с карточкой игрока
		alreadyLinked, err := s.playerRepo.IsPlayerLinked(ctx, lc.PlayerID)
		if err != nil {
			return nil, err
		}
		if alreadyLinked {
			return nil, domain.NewBadRequest("player card already linked to another account")
		}

		// Опционально: проверяем что пользователь еще не привязан к другой карточке
		existing, _ := s.playerRepo.FindByUserID(ctx, claims.UserID)
		if existing != nil {
			return nil, domain.NewBadRequest("your account is already linked to a player profile")
		}

		if err := s.playerRepo.LinkPlayerToUser(ctx, lc.PlayerID, claims.UserID); err != nil {
			return nil, err
		}

		// Привязываем пользователя к клубу игрока, если ещё не привязан
		if claims.ClubID == "" {
			user, err := s.userRepo.FindByID(ctx, claims.UserID)
			if err != nil {
				return nil, err
			}
			if user.ClubID == nil || *user.ClubID == "" {
				user.ClubID = &player.ClubID
				if err := s.userRepo.Update(ctx, user); err != nil {
					return nil, err
				}
			}
		}

	case domain.RoleParent:
		// Родитель связывается с игроком через таблицу player_parents
		alreadyLinked, err := s.parentRepo.IsParentLinkedToPlayer(ctx, claims.UserID, lc.PlayerID)
		if err != nil {
			return nil, err
		}
		if alreadyLinked {
			return nil, domain.NewBadRequest("already linked to this player")
		}

		parent, err := s.parentRepo.FindByUserID(ctx, claims.UserID)
		if err != nil {
			return nil, err
		}

		var parentID string
		if parent == nil {
			parent = &domain.Parent{
				UserID:   &claims.UserID,
				FullName: claims.FirstName + " " + claims.LastName,
				Email:    claims.Email,
			}
			if err := s.parentRepo.Create(ctx, parent); err != nil {
				return nil, err
			}
		}
		parentID = parent.ID

		if err := s.parentRepo.LinkToPlayer(ctx, lc.PlayerID, parentID); err != nil {
			return nil, err
		}

	default:
		return nil, domain.NewForbidden("only player or parent can use a link code")
	}

	// Отмечаем код использованным
	if err := s.parentRepo.MarkLinkCodeUsed(ctx, lc.ID, claims.UserID); err != nil {
		return nil, err
	}

	// Уведомляем
	if s.notifier != nil {
		_ = s.notifier.NotifyParentLinked(claims.UserID, player.FullName())
	}

	return player, nil
}

// ListActiveLinkCodes возвращает активные коды для игрока
func (s *ParentService) ListActiveLinkCodes(ctx context.Context, playerID string) ([]dto.LinkCodeResponse, error) {
	codes, err := s.parentRepo.ListActiveLinkCodesForPlayer(ctx, playerID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.LinkCodeResponse, 0, len(codes))
	for _, c := range codes {
		resp := dto.LinkCodeResponse{
			ID:        c.ID,
			PlayerID:  c.PlayerID,
			Code:      c.Code,
			ExpiresAt: c.ExpiresAt,
			CreatedAt: c.CreatedAt,
		}
		result = append(result, resp)
	}

	return result, nil
}

// generateNumericCode генерирует случайный числовой код заданной длины
func generateNumericCode(length int) (string, error) {
	const digits = "0123456789"
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		result[i] = digits[num.Int64()]
	}
	return string(result), nil
}
