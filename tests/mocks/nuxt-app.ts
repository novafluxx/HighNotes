import { vi } from 'vitest'

// Mock Nuxt app composables
export const useRouter = vi.fn()
export const useRoute = vi.fn()
export const useNuxtApp = vi.fn()
export const navigateTo = vi.fn()
export const useState = vi.fn()
export const useCookie = vi.fn()
export const useRuntimeConfig = vi.fn()
export const useSupabaseClient = vi.fn()
export const useSupabaseUser = vi.fn()
export const useSupabaseSession = vi.fn()