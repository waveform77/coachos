package logger

import (
	"context"
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
)

type contextKey string

const loggerKey contextKey = "logger"

// New creates a new zerolog logger.
func New(level string, pretty bool) *zerolog.Logger {
	var output io.Writer = os.Stdout

	if pretty {
		output = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
	}

	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.DebugLevel
	}

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zerolog.SetGlobalLevel(lvl)

	l := zerolog.New(output).
		With().
		Timestamp().
		Caller().
		Logger()

	return &l
}

// WithContext returns a new context with the logger attached.
func WithContext(ctx context.Context, l *zerolog.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, l)
}

// FromContext retrieves the logger from the context.
// Returns a default logger if none is found.
func FromContext(ctx context.Context) *zerolog.Logger {
	if l, ok := ctx.Value(loggerKey).(*zerolog.Logger); ok && l != nil {
		return l
	}
	l := zerolog.Nop()
	return &l
}
