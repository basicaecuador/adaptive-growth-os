import { create } from 'zustand'

interface BrandContextState {
  activeBrandId: string | null
  activeOrgId: string | null
  setActiveBrand: (brandId: string | null) => void
  setActiveOrg: (orgId: string | null) => void
}

export const useBrandContextStore = create<BrandContextState>((set) => ({
  activeBrandId: null,
  activeOrgId: null,
  setActiveBrand: (brandId) => set({ activeBrandId: brandId }),
  setActiveOrg: (orgId) => set({ activeOrgId: orgId }),
}))
