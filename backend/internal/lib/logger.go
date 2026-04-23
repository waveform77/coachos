package lib

import "log/slog"

func NewLogger() *slog.Logger {
	return slog.Default()
}
