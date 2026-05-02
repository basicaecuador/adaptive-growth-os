export const ROUTES = {
  home: '/',
  login: '/login',
  authCallback: '/auth/callback',
  organizations: '/organizations',
  brands: '/brands',
  brand: (brandId: string) => `/brands/${brandId}`,
  brandSetup: (brandId: string) => `/brands/${brandId}/setup`,
  contentPlan: (brandId: string) => `/brands/${brandId}/content-plan`,
  content: (brandId: string) => `/brands/${brandId}/content`,
  reports: (brandId: string) => `/brands/${brandId}/reports`,
  approvals: '/approvals',
  settings: '/settings',
} as const

export const API_ROUTES = {
  organizations: '/api/organizations',
  organization: (id: string) => `/api/organizations/${id}`,
  brands: '/api/brands',
  brand: (id: string) => `/api/brands/${id}`,
  content: '/api/content',
  contentItem: (id: string) => `/api/content/${id}`,
  generateContent: '/api/content/generate',
  approveContent: '/api/content/approve',
  aiGenerate: '/api/ai/generate',
  aiFeedback: '/api/ai/feedback',
} as const
