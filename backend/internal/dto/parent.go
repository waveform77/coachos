package dto

import "time"

// ParentChildResponse is a child player linked to the authenticated parent account.
type ParentChildResponse struct {
	ID        string  `json:"id"`
	FirstName string  `json:"firstName"`
	LastName  string  `json:"lastName"`
	DevIndex  float64 `json:"devIndex"`
	PhotoURL  string  `json:"photoUrl,omitempty"`
	Position  string  `json:"position,omitempty"`
}

// ============== Вариант A: Приглашения по email ==============

// CreateInvitationRequest запрос на создание приглашения (от тренера)
type CreateInvitationRequest struct {
	PlayerID string `json:"playerID" validate:"required,uuid"`
	Email    string `json:"email" validate:"required,email"`
}

// InvitationResponse ответ с данными приглашения
type InvitationResponse struct {
	ID         string     `json:"id"`
	PlayerID   string     `json:"playerID"`
	Email      string     `json:"email"`
	Token      string     `json:"token"`
	Status     string     `json:"status"`
	ExpiresAt  time.Time  `json:"expiresAt"`
	CreatedAt  time.Time  `json:"createdAt"`
	AcceptedAt *time.Time `json:"acceptedAt,omitempty"`
}

// AcceptInvitationRequest запрос на принятие приглашения (от родителя)
type AcceptInvitationRequest struct {
	Token string `json:"token" validate:"required"`
}

// ListInvitationsResponse список приглашений
type ListInvitationsResponse struct {
	Invitations []InvitationResponse `json:"invitations"`
}

// ============== Вариант C: Коды доступа ==============

// GenerateLinkCodeRequest запрос на генерацию кода (от тренера)
type GenerateLinkCodeRequest struct {
	PlayerID string `json:"playerID" validate:"required,uuid"`
}

// LinkCodeResponse ответ с кодом доступа
type LinkCodeResponse struct {
	ID        string    `json:"id"`
	PlayerID  string    `json:"playerID"`
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// UseLinkCodeRequest запрос на использование кода (от родителя)
type UseLinkCodeRequest struct {
	Code string `json:"code" validate:"required,len=6"`
}

// ListLinkCodesResponse список кодов
type ListLinkCodesResponse struct {
	Codes []LinkCodeResponse `json:"codes"`
}
