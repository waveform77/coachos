package lib

type Pagination struct {
	Page    int `json:"page"`
	Limit   int `json:"limit"`
	Total   int `json:"total"`
	Offset  int `json:"-"`
}

func NewPagination(page, limit int) Pagination {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	return Pagination{Page: page, Limit: limit, Offset: (page - 1) * limit}
}
