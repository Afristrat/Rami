"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"

const STORAGE_KEY = "rami:expert-mode"

// In-memory fallback for SSR
let memoryValue = false

function getSnapshot(): boolean {
  if (typeof window === "undefined") return memoryValue
  return localStorage.getItem(STORAGE_KEY) === "true"
}

function getServerSnapshot(): boolean {
  return false
}

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function notify() {
  listeners.forEach((cb) => cb())
}

export function useExpertMode() {
  // Track whether the component has mounted to avoid hydration mismatch.
  // SSR always returns false; we only trust the real localStorage value
  // after the first client-side render.
  const [mounted, setMounted] = useState(false)

  // Using a ref-style pattern: the effect just triggers a re-render once on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
  useEffect(() => { setMounted(true) }, [])

  const rawIsExpert = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Before mount, always return false (matches server snapshot) to avoid
  // hydration mismatch. After mount, return the real value from localStorage.
  const isExpert = mounted ? rawIsExpert : false

  const toggle = useCallback(() => {
    const next = !getSnapshot()
    memoryValue = next
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(next))
    }
    notify()
  }, [])

  const setExpertMode = useCallback((value: boolean) => {
    memoryValue = value
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value))
    }
    notify()
  }, [])

  return { isExpert, toggle, setExpertMode }
}
