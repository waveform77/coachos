package validator

import (
	"errors"
	"fmt"
	"strings"

	"github.com/coachos/backend/internal/domain"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()

	// Register custom validators
	_ = validate.RegisterValidation("role", validateRole)
	_ = validate.RegisterValidation("position", validatePosition)
	_ = validate.RegisterValidation("exercise_category", validateExerciseCategory)
}

// Validate validates a struct and returns a domain AppError if invalid.
func Validate(s interface{}) error {
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	var validationErrors validator.ValidationErrors
	if !errors.As(err, &validationErrors) {
		return domain.NewValidation(err.Error())
	}

	details := make(map[string]string, len(validationErrors))
	for _, fe := range validationErrors {
		field := strings.ToLower(fe.Field()[:1]) + fe.Field()[1:]
		details[field] = validationMessage(fe)
	}

	return domain.NewValidation(details)
}

func validationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", fe.Field())
	case "email":
		return "invalid email address"
	case "min":
		return fmt.Sprintf("%s must be at least %s", fe.Field(), fe.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s", fe.Field(), fe.Param())
	case "uuid":
		return "invalid UUID"
	case "role":
		return "invalid role"
	case "position":
		return "invalid position"
	case "exercise_category":
		return "invalid exercise category"
	default:
		return fmt.Sprintf("%s is invalid (rule: %s)", fe.Field(), fe.Tag())
	}
}

func validateRole(fl validator.FieldLevel) bool {
	roles := map[string]struct{}{
		"admin": {}, "coach": {}, "player": {}, "parent": {}, "analyst": {},
	}
	_, ok := roles[fl.Field().String()]
	return ok
}

func validatePosition(fl validator.FieldLevel) bool {
	positions := map[string]struct{}{
		"goalkeeper": {}, "defender": {}, "midfielder": {}, "forward": {}, "universal": {},
	}
	val := fl.Field().String()
	if val == "" {
		return true // optional
	}
	_, ok := positions[val]
	return ok
}

func validateExerciseCategory(fl validator.FieldLevel) bool {
	categories := map[string]struct{}{
		"technique": {}, "tactics": {}, "physical": {}, "coordination": {},
		"goalkeeping": {}, "warmup": {}, "cooldown": {},
	}
	_, ok := categories[fl.Field().String()]
	return ok
}
