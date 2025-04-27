<template>
  <nav class="container-fluid header-nav">
    <ul>
      <li><NuxtLink to="/" class="header-title"><strong>High Notes</strong></NuxtLink></li>
    </ul>
    <ul>
      <li>
        <button @click="toggleTheme" class="theme-toggle" :aria-label="`Switch to ${isDarkMode ? 'light' : 'dark'} theme`">
          <!-- Sun icon for Light Mode (when isDarkMode is true) -->
          <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Moon icon for Dark Mode (when isDarkMode is false) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </li>
      <!-- User Menu if logged in -->
      <li v-if="isLoggedIn" class="user-menu-container">
        <a href="#" @click.prevent="toggleUserMenu" class="user-email-link" aria-haspopup="true" :aria-expanded="isUserMenuOpen">
          {{ user?.email }} &#9660;
        </a>
        <transition name="slide-fade">
          <div v-if="isUserMenuOpen" class="user-menu-dropdown" ref="userMenuRef">
            <a href="#" @click.prevent="handleLogout" class="dropdown-item">Logout</a>
            <!-- Add other menu items here if needed -->
          </div>
        </transition>
      </li>
      <!-- Login Link if logged out -->
      <li v-else>
        <NuxtLink to="/" class="login-link">Login</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { NuxtLink } from '#components'; // Import NuxtLink for programmatic usage if needed, or just use in template

const { user, isLoggedIn, logout } = useAuth();

// --- Theme State & Logic ---
const isDarkMode = ref(false);

const applyTheme = (dark: boolean) => {
  const theme = dark ? 'dark' : 'light';
  // Ensure this runs only client-side
  if (process.client) {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
  }
  isDarkMode.value = dark;
}

const toggleTheme = () => {
  applyTheme(!isDarkMode.value);
}

const initializeTheme = () => {
  if (!process.client) return; // Only run on client
  const storedTheme = localStorage.getItem('theme');
  let preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (storedTheme) {
    applyTheme(storedTheme === 'dark');
  } else {
    applyTheme(preferDark);
  }
}

// --- User Menu State & Logic ---
const isUserMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false;
}

const handleLogout = async () => {
  closeUserMenu();
  await logout(); // Use logout from useAuth
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    userMenuRef.value &&
    !userMenuRef.value.contains(target) &&
    !target.closest('.user-email-link')
  ) {
    closeUserMenu();
  }
};

watch(isUserMenuOpen, (isOpen) => {
  if (isOpen && process.client) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside);
    });
  } else if (process.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});

onMounted(() => {
  initializeTheme();
});

onUnmounted(() => {
  if (process.client) {
      document.removeEventListener('click', handleClickOutside);
  }
});

</script>

<style scoped>
.header-nav {
  border-bottom: 1px solid var(--pico-muted-border-color);
  padding-top: 1px;
  padding-bottom: 1px;
  margin-bottom: var(--pico-block-spacing-vertical);
  background-color: var(--pico-card-background-color); /* Ensure contrast */
}

.header-nav ul {
  margin-bottom: 0;
}

.header-title,
.login-link {
    text-decoration: none;
    color: var(--pico-contrast);
}
.login-link:hover {
    text-decoration: underline;
}

/* Theme Toggle Styles */
.theme-toggle {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--pico-contrast);
}
.theme-toggle svg {
  width: 20px;
  height: 20px;
}
.theme-toggle:hover {
  opacity: 0.8;
}

/* User Menu Specific Styles */
.user-menu-container {
  position: relative;
  margin-left: 0.5rem; /* Reduced margin slightly */
}

.user-email-link {
  cursor: pointer;
  text-decoration: none;
  color: var(--pico-contrast);
  padding: 0.5rem;
}
.user-email-link:hover {
  text-decoration: underline;
}

.user-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--pico-card-background-color);
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
  box-shadow: var(--pico-card-box-shadow);
  padding: 0.5rem 0;
  min-width: 150px;
  z-index: 10;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--pico-contrast);
  text-decoration: none;
  white-space: nowrap;
}

.dropdown-item:hover {
  background-color: var(--pico-muted-background-color);
}

/* Transition Styles */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
