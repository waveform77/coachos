package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/config"
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/pkg/hash"
	"github.com/coachos/backend/internal/pkg/idgen"
	"github.com/coachos/backend/internal/repository"
)

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	coachProfileRepo repository.CoachProfileRepository
	clubRepo         repository.ClubRepository
	jwtCfg           config.JWTConfig
}

// NewAuthService creates a new AuthService.
func NewAuthService(
	userRepo repository.UserRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
	coachProfileRepo repository.CoachProfileRepository,
	clubRepo repository.ClubRepository,
	jwtCfg config.JWTConfig,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		coachProfileRepo: coachProfileRepo,
		clubRepo:         clubRepo,
		jwtCfg:           jwtCfg,
	}
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, email, password, firstName, lastName string, role domain.Role, clubID *string) (*domain.User, error) {
	return s.RegisterWithClub(ctx, email, password, firstName, lastName, role, clubID, nil)
}

// RegisterWithClub creates a new user account, optionally creating a club.
func (s *AuthService) RegisterWithClub(ctx context.Context, email, password, firstName, lastName string, role domain.Role, clubID *string, createClubReq *dto.CreateClubRequest) (*domain.User, error) {
	existing, err := s.userRepo.FindByEmail(ctx, email)
	if err == nil && existing != nil {
		return nil, domain.NewConflict("email already registered")
	}

	var finalClubID *string
	if createClubReq != nil {
		club := &domain.Club{
			Name:    createClubReq.Name,
			Country: createClubReq.Country,
			City:    createClubReq.City,
		}
		if err := s.clubRepo.Create(ctx, club); err != nil {
			return nil, err
		}
		finalClubID = &club.ID
		role = domain.RoleAdmin
	} else {
		finalClubID = clubID
	}

	hashedPwd, err := hash.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Email:        email,
		PasswordHash: hashedPwd,
		Role:         role,
		ClubID:       finalClubID,
		FirstName:    firstName,
		LastName:     lastName,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	if role == domain.RoleCoach {
		profile := &domain.CoachProfile{
			UserID:       user.ID,
			LicenseLevel: domain.LicenseLevelNone,
		}
		_ = s.coachProfileRepo.Create(ctx, profile)
	}

	return user, nil
}

// Login authenticates a user and returns tokens.
func (s *AuthService) Login(ctx context.Context, email, password, ip, userAgent string) (*domain.User, string, string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", "", domain.NewUnauthorized("invalid credentials")
	}

	if !hash.CheckPassword(password, user.PasswordHash) {
		return nil, "", "", domain.NewUnauthorized("invalid credentials")
	}

	if !user.IsActive {
		return nil, "", "", domain.NewUnauthorized("account is inactive")
	}

	clubID := ""
	if user.ClubID != nil {
		clubID = *user.ClubID
	}

	accessToken, err := pkgjwt.GenerateAccessToken(user.ID, user.Email, string(user.Role), clubID, user.FirstName, user.LastName, s.jwtCfg.Secret, s.jwtCfg.AccessTTL)
	if err != nil {
		return nil, "", "", err
	}

	rawRefresh, err := pkgjwt.GenerateRefreshToken()
	if err != nil {
		return nil, "", "", err
	}

	familyID := idgen.MustNew()
	rt := &domain.RefreshToken{
		UserID:    user.ID,
		FamilyID:  familyID,
		TokenHash: pkgjwt.HashToken(rawRefresh),
		ExpiresAt: time.Now().Add(time.Duration(s.jwtCfg.RefreshTTLDays) * 24 * time.Hour),
		IP:        ip,
		UserAgent: userAgent,
	}
	if err := s.refreshTokenRepo.Create(ctx, rt); err != nil {
		return nil, "", "", err
	}

	now := time.Now()
	user.LastLoginAt = &now
	_ = s.userRepo.Update(ctx, user)

	return user, accessToken, rawRefresh, nil
}

// Refresh rotates a refresh token, revoking the family on reuse.
func (s *AuthService) Refresh(ctx context.Context, rawRefresh, ip, userAgent string) (string, string, error) {
	tokenHash := pkgjwt.HashToken(rawRefresh)
	stored, err := s.refreshTokenRepo.FindByHash(ctx, tokenHash)
	if err != nil {
		return "", "", domain.NewUnauthorized("invalid refresh token")
	}

	if stored.UsedAt != nil {
		// Token reuse detected — revoke entire family
		_ = s.refreshTokenRepo.RevokeFamily(ctx, stored.FamilyID)
		return "", "", domain.NewUnauthorized("refresh token reuse detected")
	}

	if time.Now().After(stored.ExpiresAt) {
		return "", "", domain.NewUnauthorized("refresh token expired")
	}

	if err := s.refreshTokenRepo.MarkUsed(ctx, stored.ID); err != nil {
		return "", "", err
	}

	user, err := s.userRepo.FindByID(ctx, stored.UserID)
	if err != nil {
		return "", "", err
	}

	clubID := ""
	if user.ClubID != nil {
		clubID = *user.ClubID
	}

	newAccess, err := pkgjwt.GenerateAccessToken(user.ID, user.Email, string(user.Role), clubID, user.FirstName, user.LastName, s.jwtCfg.Secret, s.jwtCfg.AccessTTL)
	if err != nil {
		return "", "", err
	}

	newRawRefresh, err := pkgjwt.GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	newRT := &domain.RefreshToken{
		UserID:    user.ID,
		FamilyID:  stored.FamilyID,
		TokenHash: pkgjwt.HashToken(newRawRefresh),
		ExpiresAt: time.Now().Add(time.Duration(s.jwtCfg.RefreshTTLDays) * 24 * time.Hour),
		IP:        ip,
		UserAgent: userAgent,
	}
	if err := s.refreshTokenRepo.Create(ctx, newRT); err != nil {
		return "", "", err
	}

	return newAccess, newRawRefresh, nil
}

// Logout marks the refresh token as used.
func (s *AuthService) Logout(ctx context.Context, rawRefresh string) error {
	tokenHash := pkgjwt.HashToken(rawRefresh)
	stored, err := s.refreshTokenRepo.FindByHash(ctx, tokenHash)
	if err != nil {
		return nil
	}
	return s.refreshTokenRepo.MarkUsed(ctx, stored.ID)
}

// Me returns the authenticated user by ID.
func (s *AuthService) Me(ctx context.Context, userID string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}

// UpdateProfile updates the authenticated user's profile.
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateProfileRequest) (*domain.User, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	user.Phone = req.Phone
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

// ListUsersByClubAndRole returns users for a club filtered by role (admin UI).
func (s *AuthService) ListUsersByClubAndRole(ctx context.Context, clubID string, role domain.Role, page, limit int) ([]domain.User, error) {
	if clubID == "" {
		return nil, domain.NewBadRequest("user is not associated with a club")
	}
	users, _, err := s.userRepo.List(ctx, clubID, role, page, limit)
	return users, err
}

// CreateUserByAdmin creates a new user inside the admin's club.
func (s *AuthService) CreateUserByAdmin(ctx context.Context, adminClubID string, req dto.CreateUserRequest) (*domain.User, error) {
	if adminClubID == "" {
		return nil, domain.NewBadRequest("admin is not associated with a club")
	}
	if req.Role == domain.RoleAdmin {
		return nil, domain.NewForbidden("cannot create additional admins")
	}

	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return nil, domain.NewConflict("email already registered")
	}

	hashedPwd, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Email:        req.Email,
		PasswordHash: hashedPwd,
		Role:         req.Role,
		ClubID:       &adminClubID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	if req.Role == domain.RoleCoach {
		profile := &domain.CoachProfile{
			UserID:       user.ID,
			LicenseLevel: domain.LicenseLevelNone,
		}
		_ = s.coachProfileRepo.Create(ctx, profile)
	}

	return user, nil
}

// FindUserByID returns a user by ID.
func (s *AuthService) FindUserByID(ctx context.Context, userID string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}

// UpdateUserByAdmin updates a user within the admin's club.
func (s *AuthService) UpdateUserByAdmin(ctx context.Context, adminClubID, userID string, req dto.UpdateUserRequest) (*domain.User, error) {
	if adminClubID == "" {
		return nil, domain.NewBadRequest("admin is not associated with a club")
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.ClubID == nil || *user.ClubID != adminClubID {
		return nil, domain.NewForbidden("user does not belong to admin's club")
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.Password != "" {
		hashedPwd, err := hash.HashPassword(req.Password)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = hashedPwd
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}
