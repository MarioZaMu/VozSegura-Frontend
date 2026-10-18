// Plausible fake data for the watch face complications. It only exists so the idle face
// looks like an ordinary smartwatch; it is deterministic for a given time (no flicker).

export const DAILY_STEP_GOAL = 8000

export type WatchData = {
  steps: number
  stepGoalProgress: number
  heartRate: number
  temperature: number
}

const ACTIVE_START_HOUR = 6
const ACTIVE_END_HOUR = 22

function hoursOfDay(date: Date): number {
  return date.getHours() + date.getMinutes() / 60
}

/** Steps grow during waking hours and reach ~105% of the goal by night. */
function simulateSteps(date: Date): number {
  const activeHours = ACTIVE_END_HOUR - ACTIVE_START_HOUR
  const progress = Math.min(Math.max((hoursOfDay(date) - ACTIVE_START_HOUR) / activeHours, 0), 1)
  const daySeed = (date.getDate() * 37) % 600
  return Math.round(progress * (DAILY_STEP_GOAL * 1.05 + daySeed))
}

/** Resting heart rate that drifts a few beats minute to minute. */
function simulateHeartRate(date: Date): number {
  return Math.round(72 + 4 * Math.sin(date.getHours() * 60 + date.getMinutes()))
}

/** Daily temperature curve: coolest at 5 a.m., warmest at 3 p.m. (Medellín-like). */
function simulateTemperature(date: Date): number {
  const radians = ((hoursOfDay(date) - 9) / 24) * 2 * Math.PI
  return Math.round(21 + 5 * Math.sin(radians))
}

export function getWatchData(date: Date): WatchData {
  const steps = simulateSteps(date)
  return {
    steps,
    stepGoalProgress: Math.min(steps / DAILY_STEP_GOAL, 1),
    heartRate: simulateHeartRate(date),
    temperature: simulateTemperature(date),
  }
}
