import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden', 'FORBIDDEN', 403)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export function toApiError(error: unknown): { message: string; code: string; status: number } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code, status: error.status }
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'INTERNAL_ERROR', status: 500 }
  }
  return { message: 'An unexpected error occurred', code: 'INTERNAL_ERROR', status: 500 }
}

export function errorResponse(error: unknown): NextResponse {
  const { message, code, status } = toApiError(error)
  return NextResponse.json({ data: null, error: { message, code, status } }, { status })
}
