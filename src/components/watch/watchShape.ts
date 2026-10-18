export type WatchShape = 'round' | 'square'

export const watchShapeLabels: Record<WatchShape, string> = {
  round: 'Redondo',
  square: 'Cuadrado',
}

/** Corner radius class for any layer of the watch (case, bezel, screen). */
export const watchShapeRadius: Record<WatchShape, string> = {
  round: 'rounded-full',
  square: 'rounded-watch-square',
}
