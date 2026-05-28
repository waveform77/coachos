package idgen

import "github.com/google/uuid"

// New generates a new UUID v4.
func New() string {
	return uuid.New().String()
}

// MustNew generates a new UUID v4, panics on error (should never happen).
func MustNew() string {
	id, err := uuid.NewRandom()
	if err != nil {
		panic("idgen: failed to generate UUID: " + err.Error())
	}
	return id.String()
}

// IsValid returns true if the given string is a valid UUID.
func IsValid(id string) bool {
	_, err := uuid.Parse(id)
	return err == nil
}
