import { create } from "zustand"

export type AuthView = "login" | "register" | "forgot-password"

interface AuthModalStore {
  isOpen: boolean
  view: AuthView
  redirectTo: string | null
  registeredMessage: boolean
  openAuth: (view?: AuthView, redirectTo?: string | null) => void
  closeAuth: () => void
  setAuthView: (view: AuthView) => void
  setRegisteredMessage: (value: boolean) => void
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  view: "login",
  redirectTo: null,
  registeredMessage: false,
  openAuth: (view = "login", redirectTo = null) =>
    set({ isOpen: true, view, redirectTo }),
  closeAuth: () =>
    set({ isOpen: false, redirectTo: null, registeredMessage: false }),
  setAuthView: (view) => set({ view }),
  setRegisteredMessage: (value) => set({ registeredMessage: value }),
}))
