// Request/Response DTOs for Route Handlers
import type {
  Organization,
  Brand,
  ContentItem,
  ContentType,
  ContentPlatform,
} from './domain'

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
    status?: number
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// Organizations
export interface CreateOrganizationRequest {
  name: string
  slug: string
}

export interface ListOrganizationsResponse {
  organizations: Organization[]
}

// Brands
export interface CreateBrandRequest {
  organizationId: string
  name: string
  slug: string
}

export interface UpdateBrandRequest {
  name?: string
  isActive?: boolean
}

export interface ListBrandsResponse {
  brands: Brand[]
}

// Content
export interface GenerateContentRequest {
  brandId: string
  planId: string
  type: ContentType
  platform: ContentPlatform
  topic?: string
  notes?: string
}

export interface ApproveContentRequest {
  contentId: string
  status: 'approved' | 'rejected' | 'changes_requested'
  comment?: string
}

export interface ListContentResponse {
  items: ContentItem[]
  total: number
}

// AI
export interface AIGenerateRequest {
  brandId: string
  prompt: string
  context?: Record<string, unknown>
}

export interface AIFeedbackRequest {
  contentId: string
  feedback: string
}
