import type { Movie } from '../types'

/** A movie already owned physically, or streaming somewhere with no listed price, costs nothing extra to watch right now. */
export function isFreeToWatch(movie: Movie): boolean {
  if (movie.availability.physical.length > 0) return true
  return movie.availability.streaming.some((s) => !s.price)
}
