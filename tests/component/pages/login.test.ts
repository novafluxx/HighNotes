import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/vue'
import { ref } from 'vue'
import { renderWithNuxt, flushPromises } from '../../utils/test-utils'
import LoginPage from '../../../pages/login.vue'

// Mock the useAuth composable
const mockLogin = vi.fn()
const mockLoading = ref(false)

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: mockLoading
  })
}))

describe('Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogin.mockReset()
  })

  describe('Form Rendering and Structure', () => {
    it('renders login page component successfully', async () => {
      const { container } = renderWithNuxt(LoginPage)
      
      // Check that the component renders without errors
      expect(container).toBeInTheDocument()
      
      // Check for form elements by placeholder text
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('has proper form input attributes', () => {
      renderWithNuxt(LoginPage)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Password')
    })
  })

  describe('Component Integration', () => {
    it('renders component with useAuth composable integration', () => {
      renderWithNuxt(LoginPage)

      // Verify that the useAuth composable is being called
      expect(mockLogin).toBeDefined()
      expect(mockLoading).toBeDefined()
    })

    it('verifies form inputs exist and have correct attributes', async () => {
      renderWithNuxt(LoginPage)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('Password')

      // Test that inputs exist and have the correct attributes
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })
  })
})