package dto

import (
	"time"

	"github.com/coachos/backend/internal/domain"
)

// UserResponse is the public representation of a user.
type UserResponse struct {
	ID          string      `json:"id"`
	Email       string      `json:"email"`
	Role        domain.Role `json:"role"`
	ClubID      *string     `json:"clubId,omitempty"`
	FirstName   string      `json:"firstName"`
	LastName    string      `json:"lastName"`
	Phone       string      `json:"phone,omitempty"`
	AvatarURL   string      `json:"avatarURL,omitempty"`
	IsActive    bool        `json:"isActive"`
	LastLoginAt *time.Time  `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time   `json:"createdAt"`
}

// UpdateProfileRequest holds fields that can be updated on a user profile.
type UpdateProfileRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=1,max=100"`
	LastName  string `json:"lastName" validate:"omitempty,min=1,max=100"`
	Phone     string `json:"phone" validate:"omitempty,max=20"`
}

// CreateUserRequest holds data for admin-created users.
type CreateUserRequest struct {
	Email     string      `json:"email" validate:"required,email,max=255"`
	Password  string      `json:"password" validate:"required,min=8,max=100"`
	FirstName string      `json:"firstName" validate:"required,min=1,max=100"`
	LastName  string      `json:"lastName" validate:"required,min=1,max=100"`
	Role      domain.Role `json:"role" validate:"required,role"`
	Phone     string      `json:"phone" validate:"omitempty,max=20"`
}

// UpdateUserRequest holds fields an admin can update on any user in their club.
type UpdateUserRequest struct {
	FirstName string      `json:"firstName" validate:"omitempty,min=1,max=100"`
	LastName  string      `json:"lastName" validate:"omitempty,min=1,max=100"`
	Phone     string      `json:"phone" validate:"omitempty,max=20"`
	Role      domain.Role `json:"role" validate:"omitempty,role"`
	Password  string      `json:"password" validate:"omitempty,min=8,max=100"`
	IsActive  *bool       `json:"isActive"`
}

// ToUserResponse maps a domain User to a UserResponse DTO.
func ToUserResponse(u *domain.User) UserResponse {
	return UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		Role:        u.Role,
		ClubID:      u.ClubID,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		Phone:       u.Phone,
		AvatarURL:   u.AvatarURL,
		IsActive:    u.IsActive,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
	}
}
