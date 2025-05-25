import { ref, onMounted } from 'vue';

export function useLayout() {
  // --- Responsive Sidebar State ---
  // Initialize with SSR-safe defaults that prevent flash
  const sidebarOpen = ref(false); // Always start closed to prevent flash
  const isMobile = ref(true); // Default to mobile for SSR to prevent flash

  const checkMobile = () => {
    if (typeof window !== 'undefined') {
      isMobile.value = window.innerWidth <= 768; // Use md breakpoint
      // Default sidebar state based on mobile status
      if (!isMobile.value) sidebarOpen.value = true;
      else sidebarOpen.value = false; // Closed by default on mobile
    }
  };

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  // --- Lifecycle Hooks ---
  // Use immediate execution for client-side
  if (import.meta.client) {
    checkMobile();
  }

  onMounted(() => {
    // Re-check in case it wasn't set properly
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
    }
  });

  return {
    sidebarOpen,
    isMobile,
    toggleSidebar,
  };
}