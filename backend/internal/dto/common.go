package dto

// PaginationQuery holds standard pagination parameters.
type PaginationQuery struct {
	Page  int `query:"page" validate:"min=1"`
	Limit int `query:"limit" validate:"min=1,max=100"`
}

// Defaults sets default pagination values if not provided.
func (p *PaginationQuery) Defaults() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit > 100 {
		p.Limit = 20
	}
}

// Offset calculates the SQL OFFSET value.
func (p *PaginationQuery) Offset() int {
	return (p.Page - 1) * p.Limit
}

// PaginatedResponse wraps a paginated list with metadata.
type PaginatedResponse[T any] struct {
	Data []T      `json:"data"`
	Meta MetaData `json:"meta"`
}

// MetaData holds pagination metadata.
type MetaData struct {
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
	Total int64 `json:"total"`
}

// NewPaginated creates a PaginatedResponse.
func NewPaginated[T any](data []T, total int64, page, limit int) PaginatedResponse[T] {
	if data == nil {
		data = []T{}
	}
	return PaginatedResponse[T]{
		Data: data,
		Meta: MetaData{Page: page, Limit: limit, Total: total},
	}
}

// MessageResponse is a simple message response.
type MessageResponse struct {
	Message string `json:"message"`
}

// IDResponse is a response containing only an ID.
type IDResponse struct {
	ID string `json:"id"`
}
