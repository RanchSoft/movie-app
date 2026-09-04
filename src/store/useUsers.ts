import { useEffect, useState } from 'react'

const KEY = 'movie-picker:users'

function loadUsers(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useUsers() {
  const [users, setUsers] = useState<string[]>(() => loadUsers())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(users))
  }, [users])

  const addUser = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setUsers((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
  }

  const removeUser = (name: string) => {
    setUsers((prev) => prev.filter((u) => u !== name))
  }

  return { users, addUser, removeUser }
}
