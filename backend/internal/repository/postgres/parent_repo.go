package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type parentRepo struct {
	db *gorm.DB
}

// NewParentRepository returns a GORM-backed ParentRepository.
func NewParentRepository(db *gorm.DB) *parentRepo {
	return &parentRepo{db: db}
}

func (r *parentRepo) Create(ctx context.Context, parent *domain.Parent) error {
	return r.db.WithContext(ctx).Create(parent).Error
}

func (r *parentRepo) FindByID(ctx context.Context, id string) (*domain.Parent, error) {
	var parent domain.Parent
	err := r.db.WithContext(ctx).First(&parent, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("parent", id)
	}
	return &parent, err
}

func (r *parentRepo) FindByUserID(ctx context.Context, userID string) (*domain.Parent, error) {
	var parent domain.Parent
	err := r.db.WithContext(ctx).Where("user_id = ? AND deleted_at IS NULL", userID).First(&parent).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &parent, err
}

func (r *parentRepo) Update(ctx context.Context, parent *domain.Parent) error {
	return r.db.WithContext(ctx).Save(parent).Error
}

func (r *parentRepo) LinkToPlayer(ctx context.Context, playerID, parentID string) error {
	link := domain.PlayerParent{
		PlayerID: playerID,
		ParentID: parentID,
	}
	return r.db.WithContext(ctx).Create(&link).Error
}

func (r *parentRepo) GetByPlayer(ctx context.Context, playerID string) ([]domain.Parent, error) {
	var links []domain.PlayerParent
	if err := r.db.WithContext(ctx).
		Preload("Parent").
		Where("player_id = ?", playerID).
		Find(&links).Error; err != nil {
		return nil, err
	}

	parents := make([]domain.Parent, 0, len(links))
	for _, l := range links {
		parents = append(parents, l.Parent)
	}
	return parents, nil
}

func (r *parentRepo) ListPlayersForParentUser(ctx context.Context, parentUserID string) ([]domain.Player, error) {
	var players []domain.Player
	err := r.db.WithContext(ctx).
		Model(&domain.Player{}).
		Joins("JOIN player_parents pp ON pp.player_id = players.id AND players.deleted_at IS NULL").
		Joins("JOIN parents par ON par.id = pp.parent_id AND par.user_id = ? AND par.deleted_at IS NULL", parentUserID).
		Find(&players).Error
	return players, err
}

func (r *parentRepo) IsParentLinkedToPlayer(ctx context.Context, parentUserID, playerID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.PlayerParent{}).
		Joins("JOIN parents ON parents.id = player_parents.parent_id AND parents.deleted_at IS NULL").
		Where("parents.user_id = ? AND player_parents.player_id = ?", parentUserID, playerID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ============== Вариант A: Приглашения по email ==============

func (r *parentRepo) CreateInvitation(ctx context.Context, inv *domain.ParentInvitation) error {
	return r.db.WithContext(ctx).Create(inv).Error
}

func (r *parentRepo) GetInvitationByToken(ctx context.Context, token string) (*domain.ParentInvitation, error) {
	var inv domain.ParentInvitation
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("token = ? AND deleted_at IS NULL", token).
		First(&inv).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("invitation", token)
	}
	return &inv, err
}

func (r *parentRepo) GetPendingInvitationByEmail(ctx context.Context, playerID, email string) (*domain.ParentInvitation, error) {
	var inv domain.ParentInvitation
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND email = ? AND status = ? AND deleted_at IS NULL", playerID, email, domain.InvitationStatusPending).
		First(&inv).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &inv, err
}

func (r *parentRepo) ListInvitationsForPlayer(ctx context.Context, playerID string) ([]domain.ParentInvitation, error) {
	var invs []domain.ParentInvitation
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND deleted_at IS NULL", playerID).
		Order("created_at DESC").Find(&invs).Error
	return invs, err
}

func (r *parentRepo) MarkInvitationAccepted(ctx context.Context, id string, acceptedBy string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.ParentInvitation{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       domain.InvitationStatusAccepted,
			"accepted_by":  acceptedBy,
			"accepted_at":  now,
		}).Error
}

// ============== Вариант C: Коды доступа ==============

func (r *parentRepo) CreateLinkCode(ctx context.Context, code *domain.PlayerLinkCode) error {
	return r.db.WithContext(ctx).Create(code).Error
}

func (r *parentRepo) GetLinkCodeByCode(ctx context.Context, code string) (*domain.PlayerLinkCode, error) {
	var lc domain.PlayerLinkCode
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("code = ? AND deleted_at IS NULL", code).
		First(&lc).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("link_code", code)
	}
	return &lc, err
}

func (r *parentRepo) MarkLinkCodeUsed(ctx context.Context, id string, usedBy string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.PlayerLinkCode{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"used_by": usedBy,
			"used_at": now,
		}).Error
}

func (r *parentRepo) ListActiveLinkCodesForPlayer(ctx context.Context, playerID string) ([]domain.PlayerLinkCode, error) {
	var codes []domain.PlayerLinkCode
	now := time.Now()
	err := r.db.WithContext(ctx).
		Where("player_id = ? AND used_at IS NULL AND expires_at > ? AND deleted_at IS NULL", playerID, now).
		Order("created_at DESC").Find(&codes).Error
	return codes, err
}
