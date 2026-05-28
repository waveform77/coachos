package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	App       AppConfig
	DB        DBConfig
	JWT       JWTConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
	AI        AIConfig
	Log       LogConfig
}

type AppConfig struct {
	Env  string
	Port int
	Name string
}

type DBConfig struct {
	Host                string
	Port                int
	User                string
	Password            string
	Name                string
	SSLMode             string
	MaxOpenConns        int
	MaxIdleConns        int
	ConnMaxLifetimeMin  int
}

type JWTConfig struct {
	Secret         string
	AccessTTL      time.Duration
	RefreshTTLDays int
}

type CORSConfig struct {
	Origins []string
}

type RateLimitConfig struct {
	Max        int
	Expiration time.Duration
}

type AIConfig struct {
	Provider       string
	DeepSeekAPIKey string
}

type LogConfig struct {
	Level  string
	Pretty bool
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		// It's okay if .env doesn't exist — use env vars
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			// Only warn if the file exists but can't be read
		}
	}

	// Set defaults
	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("APP_PORT", 8080)
	viper.SetDefault("APP_NAME", "coachos-api")
	viper.SetDefault("JWT_ACCESS_TTL_MINUTES", 15)
	viper.SetDefault("JWT_REFRESH_TTL_DAYS", 7)
	viper.SetDefault("DB_PORT", 5432)
	viper.SetDefault("DB_SSL_MODE", "disable")
	viper.SetDefault("DB_MAX_OPEN_CONNS", 25)
	viper.SetDefault("DB_MAX_IDLE_CONNS", 5)
	viper.SetDefault("DB_CONN_MAX_LIFETIME_MINUTES", 30)
	viper.SetDefault("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
	viper.SetDefault("RATE_LIMIT_MAX", 100)
	viper.SetDefault("RATE_LIMIT_EXPIRATION_SECONDS", 60)
	viper.SetDefault("AI_PROVIDER", "mock")
	viper.SetDefault("DEEPSEEK_API_KEY", "")
	viper.SetDefault("LOG_LEVEL", "debug")
	viper.SetDefault("LOG_PRETTY", true)

	// Validate required fields
	required := []string{"JWT_SECRET", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_HOST"}
	for _, key := range required {
		if viper.GetString(key) == "" {
			return nil, fmt.Errorf("required config key %s is not set", key)
		}
	}

	accessTTL := time.Duration(viper.GetInt("JWT_ACCESS_TTL_MINUTES")) * time.Minute
	rateLimitExp := time.Duration(viper.GetInt("RATE_LIMIT_EXPIRATION_SECONDS")) * time.Second

	originsStr := viper.GetString("CORS_ORIGINS")
	origins := strings.Split(originsStr, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	cfg := &Config{
		App: AppConfig{
			Env:  viper.GetString("APP_ENV"),
			Port: viper.GetInt("APP_PORT"),
			Name: viper.GetString("APP_NAME"),
		},
		DB: DBConfig{
			Host:               viper.GetString("DB_HOST"),
			Port:               viper.GetInt("DB_PORT"),
			User:               viper.GetString("DB_USER"),
			Password:           viper.GetString("DB_PASSWORD"),
			Name:               viper.GetString("DB_NAME"),
			SSLMode:            viper.GetString("DB_SSL_MODE"),
			MaxOpenConns:       viper.GetInt("DB_MAX_OPEN_CONNS"),
			MaxIdleConns:       viper.GetInt("DB_MAX_IDLE_CONNS"),
			ConnMaxLifetimeMin: viper.GetInt("DB_CONN_MAX_LIFETIME_MINUTES"),
		},
		JWT: JWTConfig{
			Secret:         viper.GetString("JWT_SECRET"),
			AccessTTL:      accessTTL,
			RefreshTTLDays: viper.GetInt("JWT_REFRESH_TTL_DAYS"),
		},
		CORS: CORSConfig{
			Origins: origins,
		},
		RateLimit: RateLimitConfig{
			Max:        viper.GetInt("RATE_LIMIT_MAX"),
			Expiration: rateLimitExp,
		},
		AI: AIConfig{
			Provider:       viper.GetString("AI_PROVIDER"),
			DeepSeekAPIKey: viper.GetString("DEEPSEEK_API_KEY"),
		},
		Log: LogConfig{
			Level:  viper.GetString("LOG_LEVEL"),
			Pretty: viper.GetBool("LOG_PRETTY"),
		},
	}

	return cfg, nil
}

func (d DBConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

func (a AppConfig) IsDevelopment() bool {
	return a.Env == "development"
}

func (a AppConfig) IsProduction() bool {
	return a.Env == "production"
}
