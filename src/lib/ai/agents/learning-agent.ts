// Learning agent — implemented in FASE 4
// Consolidates monthly learnings from approved/rejected content patterns

export interface LearningInput {
  brandId: string
  month: number
  year: number
  approvedContent: string[]
  rejectedContent: string[]
  feedbackSummary: string
}

export interface LearningOutput {
  insights: string[]
  newRules: Array<{ category: string; instruction: string }>
  summary: string
}

export async function generateMonthlyLearning(_input: LearningInput): Promise<LearningOutput> {
  throw new Error('Learning agent — implement in FASE 4')
}
