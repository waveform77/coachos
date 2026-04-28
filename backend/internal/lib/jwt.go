package lib

import "time"

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Exp    int64  `json:"exp"`
}

func GenerateToken(userID, email string, ttl time.Duration) (string, error) {
	_ = Claims{UserID: userID, Email: email, Exp: time.Now().Add(ttl).Unix()}
	return "token", nil
}
