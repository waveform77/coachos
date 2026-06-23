package dto

import "github.com/coachos/backend/internal/domain"

// RegisterRequest holds data for user registration.
type RegisterRequest struct {
	Email      string             `json:"email" validate:"required,email,max=255"`
	Password   string             `json:"password" validate:"required,min=8,max=100"`
	FirstName  string             `json:"firstName" validate:"required,min=1,max=100"`
	LastName   string             `json:"lastName" validate:"required,min=1,max=100"`
	Role       domain.Role        `json:"role" validate:"required,role"`
	ClubID     string             `json:"clubID" validate:"omitempty,uuid"`
	CreateClub *CreateClubRequest `json:"createClub" validate:"omitempty"`
}

// LoginRequest holds credentials for user login.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RefreshRequest holds the refresh token (used if not in cookie).
type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" validate:"omitempty"`
}

// AuthResponse is returned on successful login or registration.
type AuthResponse struct {
	AccessToken string       `json:"accessToken"`
	User        UserResponse `json:"user"`
}

// TokenPair holds both access and refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken,omitempty"`
}
