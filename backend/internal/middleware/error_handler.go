package middleware

import (
	"errors"
	"net/http"

	"github.com/coachos/backend/internal/domain"
	"github.com/gofiber/fiber/v2"
)

// ErrorResponse is the standard error response body.
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// ErrorHandler is the central Fiber error handler.
func ErrorHandler(c *fiber.Ctx, err error) error {
	var appErr *domain.AppError
	if errors.As(err, &appErr) {
		status := appErrToHTTPStatus(appErr)
		return c.Status(status).JSON(ErrorResponse{
			Error: ErrorDetail{
				Code:    appErr.Code,
				Message: appErr.Message,
				Details: appErr.Details,
			},
		})
	}

	// Handle Fiber's built-in errors
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return c.Status(fiberErr.Code).JSON(ErrorResponse{
			Error: ErrorDetail{
				Code:    "http_error",
				Message: fiberErr.Message,
			},
		})
	}

	// Fallback: 500 Internal Server Error
	return c.Status(http.StatusInternalServerError).JSON(ErrorResponse{
		Error: ErrorDetail{
			Code:    "internal_server_error",
			Message: "An unexpected error occurred",
		},
	})
}

func appErrToHTTPStatus(err *domain.AppError) int {
	switch {
	case errors.Is(err.Err, domain.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err.Err, domain.ErrForbidden):
		return http.StatusForbidden
	case errors.Is(err.Err, domain.ErrUnauthorized):
		return http.StatusUnauthorized
	case errors.Is(err.Err, domain.ErrConflict):
		return http.StatusConflict
	case errors.Is(err.Err, domain.ErrValidation):
		return http.StatusUnprocessableEntity
	case errors.Is(err.Err, domain.ErrBadRequest):
		return http.StatusBadRequest
	case errors.Is(err.Err, domain.ErrInternal):
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}
