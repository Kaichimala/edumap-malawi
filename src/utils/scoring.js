
// Targets based on MoE guidelines
const TARGETS = {
  primary: { ratio: 400, weight: 55 },
  secondary: { ratio: 280, weight: 55 },
  tertiary: { ratio: 8000, weight: 60 },
}

export function calcScore(agePop, institutions, level) {
  if (!institutions || institutions === 0) return 100
  const { ratio, weight } = TARGETS[level]
  return Math.min(100, (agePop / institutions / ratio) * weight)
}

export function getNeedLevel(score) {
  if (score >= 80) return { label: 'Critical', color: '#dc2626' }  // Red-600
  if (score >= 60) return { label: 'High', color: '#ea580c' }  // Orange-600
  if (score >= 40) return { label: 'Medium', color: '#ca8a04' }  // Yellow-600
  return { label: 'Low', color: '#16a34a' }  // Green-600
}

export function getRecommendedNew(agePop, institutions, level) {
  const { ratio } = TARGETS[level]
  const needed = Math.ceil(agePop / ratio)
  return Math.max(0, needed - institutions)
}

export function getPopulationLevel(pop) {
  if (pop > 250000) return { label: 'Very High', color: '#1e3a8a' }
  if (pop > 150000) return { label: 'High', color: '#3b82f6' }
  if (pop > 80000) return { label: 'Medium', color: '#93c5fd' }
  return { label: 'Low', color: '#dbeafe' }
}

export function getInstitutionsLevel(inst) {
  if (inst > 100) return { label: 'Very High', color: '#581c87' }
  if (inst > 50) return { label: 'High', color: '#9333ea' }
  if (inst > 25) return { label: 'Medium', color: '#d8b4fe' }
  return { label: 'Low', color: '#f3e8ff' }
}

export function getSuitabilityLevel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#166534' }
  if (score >= 60) return { label: 'Good', color: '#22c55e' }
  if (score >= 40) return { label: 'Fair', color: '#86efac' }
  return { label: 'Poor', color: '#dcfce7' }
}
