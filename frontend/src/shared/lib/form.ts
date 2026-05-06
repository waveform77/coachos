export function getFieldError(field: string, errors: Record<string, string>): string | undefined {
  return errors[field];
}

export function hasFieldError(field: string, errors: Record<string, string>): boolean {
  return field in errors;
}
