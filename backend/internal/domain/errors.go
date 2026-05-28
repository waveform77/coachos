package domain

import (
	"errors"
	"fmt"
)

// Sentinel errors for domain-level error detection.
var (
	ErrNotFound     = errors.New("not found")
	ErrForbidden    = errors.New("forbidden")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict")
	ErrValidation   = errors.New("validation error")
	ErrBadRequest   = errors.New("bad request")
	ErrInternal     = errors.New("internal error")
)

// AppError wraps a domain error with a human-readable code and context.
type AppError struct {
	Code    string      // machine-readable code, e.g. "user_not_found"
	Message string      // human-readable message
	Details interface{} // optional structured details (validation errors, etc.)
	Err     error       // wrapped sentinel error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s", e.Code, e.Err.Error())
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewNotFound creates an AppError for a missing resource.
func NewNotFound(entity, id string) *AppError {
	return &AppError{
		Code:    fmt.Sprintf("%s_not_found", entity),
		Message: fmt.Sprintf("%s with ID %s not found", entity, id),
		Err:     ErrNotFound,
	}
}

// NewForbidden creates an AppError for an access-denied scenario.
func NewForbidden(msg string) *AppError {
	return &AppError{
		Code:    "forbidden",
		Message: msg,
		Err:     ErrForbidden,
	}
}

// NewUnauthorized creates an AppError for unauthenticated access.
func NewUnauthorized(msg string) *AppError {
	return &AppError{
		Code:    "unauthorized",
		Message: msg,
		Err:     ErrUnauthorized,
	}
}

// NewConflict creates an AppError for a resource conflict.
func NewConflict(msg string) *AppError {
	return &AppError{
		Code:    "conflict",
		Message: msg,
		Err:     ErrConflict,
	}
}

// NewValidation creates an AppError for input validation failures.
func NewValidation(details interface{}) *AppError {
	return &AppError{
		Code:    "validation_error",
		Message: "request validation failed",
		Details: details,
		Err:     ErrValidation,
	}
}

// NewBadRequest creates an AppError for malformed requests.
func NewBadRequest(msg string) *AppError {
	return &AppError{
		Code:    "bad_request",
		Message: msg,
		Err:     ErrBadRequest,
	}
}

// NewInternal creates an AppError for unexpected server-side failures.
func NewInternal(msg string) *AppError {
	return &AppError{
		Code:    "internal_error",
		Message: msg,
		Err:     ErrInternal,
	}
}
