// Core domain types — source of truth for all business entities

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationMember {
  userId: string
  organizationId: string
  role: UserRole
  joinedAt: Date
}

export interface Brand {
  id: string
  organizationId: string
  name: string
  slug: string
  isActive: boolean
  logoUrl: string | null
  fontUrl: string | null
  primaryColor: string
  createdAt: Date
  updatedAt: Date
}

export interface BrandSetup {
  brandId: string
  voice: string
  tone: string
  targetAudience: string
  valueProposition: string
  contentPillars: string[]
  restrictions: string[]
  updatedAt: Date
}

export type ContentStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'published'

export type ContentType = 'post' | 'story' | 'reel' | 'carousel' | 'caption'

export type ContentPlatform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'

export interface ContentPlan {
  id: string
  brandId: string
  month: number
  year: number
  status: 'draft' | 'active' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface ContentItem {
  id: string
  brandId: string
  planId: string
  type: ContentType
  platform: ContentPlatform
  status: ContentStatus
  body: string
  notes: string | null
  imageUrl: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type RuleCategory = 'tone' | 'format' | 'topic' | 'restriction'
export type RuleSource = 'feedback' | 'manual' | 'learning'

export interface Rule {
  id: string
  brandId: string
  category: RuleCategory
  description: string
  instruction: string
  source: RuleSource
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RuleSet {
  brandId: string
  rules: Rule[]
}

export interface Feedback {
  id: string
  contentId: string
  brandId: string
  comment: string
  type: 'correction' | 'suggestion' | 'approval'
  createdBy: string
  createdAt: Date
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'

export interface Approval {
  id: string
  contentId: string
  status: ApprovalStatus
  comment: string | null
  reviewedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ContentGenerationInput {
  brand: Brand
  setup: BrandSetup
  rules: Rule[]
  type: ContentType
  platform: ContentPlatform
  topic?: string
  notes?: string
}

export interface ContentGenerationOutput {
  body: string
  suggestions: string[]
  appliedRules: string[]
}
