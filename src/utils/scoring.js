// Targets based on MoE guidelines
const TARGETS = {
  primary:   { ratio: 400,  weight: 55 },
  secondary: { ratio: 280,  weight: 55 },
  tertiary:  { ratio: 8000, weight: 60 },
}

export function calcScore(agePop, institutions, level) {
  if (!institutions || institutions === 0) return 100
  const { ratio, weight } = TARGETS[level]
  return Math.min(100, (agePop / institutions / ratio) * weight)
}

export function getNeedLevel(score) {
  if (score >= 80) return { label: 'Critical', color: '#EF4444' }
  if (score >= 60) return { label: 'High',     color: '#F97316' }
  if (score >= 40) return { label: 'Medium',   color: '#EAB308' }
  return              { label: 'Low',      color: '#22C55E' }
}

export function getRecommendedNew(agePop, institutions, level) {
  const { ratio } = TARGETS[level]
  const needed = Math.ceil(agePop / ratio)
  return Math.max(0, needed - institutions)
}