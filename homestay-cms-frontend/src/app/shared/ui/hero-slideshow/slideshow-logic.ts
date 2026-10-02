/** Index of the slide after `current`, wrapping to the first. An empty list yields 0. */
export function nextIndex(current: number, total: number): number {
  if (total <= 1) {
    return 0;
  }
  return (current + 1) % total;
}

/** Keeps a stored index valid when the slide list shrinks or empties. */
export function resolveIndex(current: number, total: number): number {
  return current >= 0 && current < total ? current : 0;
}
