import { ref, onMounted, onUnmounted } from 'vue';
import { useState } from '#app';

export function useLayout() {
  // --- Responsive Sidebar State ---
  // Use Nuxt's useState for a single, global state
  const sidebarOpen = useState('sidebarOpen', () => false);
  const isMobile = useState('isMobile', () => true);

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

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkMobile);
    }
  });

  return {
    sidebarOpen,
    isMobile,
    toggleSidebar,
  };
}