package cache

import "context"

type Cache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl int) error
	Delete(ctx context.Context, key string) error
}

type MemoryCache struct{}

func (m *MemoryCache) Get(ctx context.Context, key string) (string, error) { return "", nil }
func (m *MemoryCache) Set(ctx context.Context, key string, value string, ttl int) error { return nil }
func (m *MemoryCache) Delete(ctx context.Context, key string) error { return nil }
