import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, ref, watch } from 'vue'
import { useLayout } from '~/composables/useLayout'

// Mock window object for testing
const mockWindow = {
  innerWidth: 1024,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Mock import.meta.client
Object.defineProperty(import.meta, 'client', {
  value: true,
  writable: true
})

describe('useLayout', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup window mock
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    })
    
    // Reset window dimensions
    mockWindow.innerWidth = 1024
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default state for desktop', () => {
      // Arrange
      mockWindow.innerWidth = 1024 // Desktop width
      
      // Act
      const { sidebarOpen, isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(false)
      expect(sidebarOpen.value).toBe(true) // Should be open on desktop
    })

    it('should initialize with correct default state for mobile', () => {
      // Arrange
      mockWindow.innerWidth = 600 // Mobile width
      
      // Act
      const { sidebarOpen, isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(true)
      expect(sidebarOpen.value).toBe(false) // Should be closed on mobile
    })

    it('should handle SSR environment gracefully', () => {
      // Arrange - simulate SSR by removing window
      Object.defineProperty(import.meta, 'client', {
        value: false,
        writable: true
      })
      
      delete (global as any).window
      
      // Act
      const { sidebarOpen, isMobile } = useLayout()
      
      // Assert - should use SSR-safe defaults
      expect(isMobile.value).toBe(true) // Default to mobile for SSR
      expect(sidebarOpen.value).toBe(false) // Default to closed for SSR
      
      // Restore
      Object.defineProperty(import.meta, 'client', {
        value: true,
        writable: true
      })
    })
  })

  describe('responsive behavior', () => {
    it('should detect mobile breakpoint correctly', () => {
      // Arrange
      mockWindow.innerWidth = 768 // Exactly at breakpoint
      
      // Act
      const { isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(true) // 768 and below is mobile
    })

    it('should detect desktop breakpoint correctly', () => {
      // Arrange
      mockWindow.innerWidth = 769 // Just above breakpoint
      
      // Act
      const { isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(false) // Above 768 is desktop
    })

    it('should handle very small mobile screens', () => {
      // Arrange
      mockWindow.innerWidth = 320 // Small mobile
      
      // Act
      const { sidebarOpen, isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(true)
      expect(sidebarOpen.value).toBe(false)
    })

    it('should handle large desktop screens', () => {
      // Arrange
      mockWindow.innerWidth = 1920 // Large desktop
      
      // Act
      const { sidebarOpen, isMobile } = useLayout()
      
      // Assert
      expect(isMobile.value).toBe(false)
      expect(sidebarOpen.value).toBe(true)
    })
  })

  describe('sidebar toggle functionality', () => {
    it('should toggle sidebar state', () => {
      // Arrange
      const { sidebarOpen, toggleSidebar } = useLayout()
      const initialState = sidebarOpen.value
      
      // Act
      toggleSidebar()
      
      // Assert
      expect(sidebarOpen.value).toBe(!initialState)
    })

    it('should toggle sidebar multiple times', () => {
      // Arrange
      const { sidebarOpen, toggleSidebar } = useLayout()
      const initialState = sidebarOpen.value
      
      // Act & Assert
      toggleSidebar()
      expect(sidebarOpen.value).toBe(!initialState)
      
      toggleSidebar()
      expect(sidebarOpen.value).toBe(initialState)
      
      toggleSidebar()
      expect(sidebarOpen.value).toBe(!initialState)
    })

    it('should work independently of screen size', () => {
      // Arrange - mobile
      mockWindow.innerWidth = 600
      const { sidebarOpen, toggleSidebar } = useLayout()
      
      // Act
      expect(sidebarOpen.value).toBe(false) // Initially closed on mobile
      toggleSidebar()
      expect(sidebarOpen.value).toBe(true) // Can be opened on mobile
      
      toggleSidebar()
      expect(sidebarOpen.value).toBe(false) // Can be closed again
    })
  })

  describe('window resize handling', () => {
    it('should register resize event listener on mount', async () => {
      // Act
      useLayout()
      await nextTick()
      
      // Assert
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should update state when window is resized', async () => {
      // Arrange
      mockWindow.innerWidth = 1024 // Start desktop
      const { isMobile, sidebarOpen } = useLayout()
      
      // Verify initial state
      expect(isMobile.value).toBe(false)
      expect(sidebarOpen.value).toBe(true)
      
      // Act - simulate resize to mobile
      mockWindow.innerWidth = 600
      
      // Get the resize handler that was registered
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      if (resizeHandler) {
        resizeHandler()
      }
      
      await nextTick()
      
      // Assert
      expect(isMobile.value).toBe(true)
      expect(sidebarOpen.value).toBe(false) // Should close on mobile
    })

    it('should update state when resizing from mobile to desktop', async () => {
      // Arrange
      mockWindow.innerWidth = 600 // Start mobile
      const { isMobile, sidebarOpen } = useLayout()
      
      // Verify initial state
      expect(isMobile.value).toBe(true)
      expect(sidebarOpen.value).toBe(false)
      
      // Act - simulate resize to desktop
      mockWindow.innerWidth = 1024
      
      // Get the resize handler that was registered
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      if (resizeHandler) {
        resizeHandler()
      }
      
      await nextTick()
      
      // Assert
      expect(isMobile.value).toBe(false)
      expect(sidebarOpen.value).toBe(true) // Should open on desktop
    })

    it('should handle multiple resize events', async () => {
      // Arrange
      const { isMobile } = useLayout()
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      // Act & Assert - multiple resizes
      mockWindow.innerWidth = 600
      if (resizeHandler) resizeHandler()
      await nextTick()
      expect(isMobile.value).toBe(true)
      
      mockWindow.innerWidth = 1024
      if (resizeHandler) resizeHandler()
      await nextTick()
      expect(isMobile.value).toBe(false)
      
      mockWindow.innerWidth = 400
      if (resizeHandler) resizeHandler()
      await nextTick()
      expect(isMobile.value).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle window being undefined', () => {
      // Arrange
      delete (global as any).window
      
      // Act & Assert - should not throw
      expect(() => useLayout()).not.toThrow()
    })

    it('should handle resize event when window is undefined', async () => {
      // Arrange
      const { isMobile } = useLayout()
      delete (global as any).window
      
      // Act - try to trigger resize (should not throw)
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      // Assert - should not throw
      expect(() => {
        if (resizeHandler) resizeHandler()
      }).not.toThrow()
    })

    it('should handle extreme window sizes', () => {
      // Test very small window
      mockWindow.innerWidth = 1
      const { isMobile: isMobile1 } = useLayout()
      expect(isMobile1.value).toBe(true)
      
      // Test very large window
      mockWindow.innerWidth = 10000
      const { isMobile: isMobile2 } = useLayout()
      expect(isMobile2.value).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('should have reactive sidebar state', async () => {
      // Arrange
      const { sidebarOpen, toggleSidebar } = useLayout()
      let reactiveValue: boolean | undefined
      
      // Watch the reactive value
      const stopWatcher = watch(sidebarOpen, (newValue) => {
        reactiveValue = newValue
      }, { immediate: true })
      
      // Act
      const initialValue = sidebarOpen.value
      toggleSidebar()
      await nextTick()
      
      // Assert
      expect(reactiveValue).toBe(!initialValue)
      
      // Cleanup
      stopWatcher()
    })

    it('should have reactive mobile state', async () => {
      // Arrange
      mockWindow.innerWidth = 1024
      const { isMobile } = useLayout()
      let reactiveValue: boolean | undefined
      
      // Watch the reactive value
      const stopWatcher = watch(isMobile, (newValue) => {
        reactiveValue = newValue
      }, { immediate: true })
      
      // Act - simulate resize
      mockWindow.innerWidth = 600
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'resize'
      )?.[1]
      
      if (resizeHandler) {
        resizeHandler()
      }
      await nextTick()
      
      // Assert
      expect(reactiveValue).toBe(true)
      
      // Cleanup
      stopWatcher()
    })
  })

  describe('accessibility considerations', () => {
    it('should provide accessible sidebar toggle', () => {
      // Arrange
      const { toggleSidebar } = useLayout()
      
      // Act & Assert
      expect(typeof toggleSidebar).toBe('function')
      expect(() => toggleSidebar()).not.toThrow()
    })

    it('should maintain consistent state for screen readers', () => {
      // Arrange
      const { sidebarOpen, isMobile } = useLayout()
      
      // Act & Assert - state should be predictable
      expect(typeof sidebarOpen.value).toBe('boolean')
      expect(typeof isMobile.value).toBe('boolean')
    })
  })
})