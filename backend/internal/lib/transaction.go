package lib

import "context"

type TxFunc func(ctx context.Context) error

func WithTransaction(ctx context.Context, fn TxFunc) error {
	return fn(ctx)
}
