export type JobExperience = 'stage' | 'junior' | 'middle' | 'senior'

const EXPERIENCE_LABELS: Record<JobExperience, string> = {
  stage: 'Stage',
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
}

export function getJobExperienceLabel(value?: string | null): string | undefined {
  if (!value) return undefined
  return EXPERIENCE_LABELS[value as JobExperience] ?? value
}
