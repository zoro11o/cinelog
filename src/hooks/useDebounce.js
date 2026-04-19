// ─── useDebounce hook ──────────────────────────────────────
// Delays updating a value until the user stops typing.
// Used in the search page to avoid firing an API call on every keystroke.

import { useState, useEffect } from 'react'

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
