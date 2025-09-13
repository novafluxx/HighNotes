<template>
  <header class="relative z-50 bg-transparent px-4 py-3 flex justify-between items-center">
    <!-- Bottom divider line -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-gray-600/60"></div>
    
    <!-- Left side: Hamburger and Title -->
    <div class="relative z-10 flex items-center gap-4">
      <!-- Hamburger Menu Button (Mobile, Notes Page Only) -->
      <UButton
        v-if="showMenuButton"
        color="neutral"
        variant="ghost"
        aria-label="Open sidebar"
        @click="toggleSidebar"
        class="hover:bg-gray-100/70 dark:hover:bg-gray-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
      >
        <Icon name="lucide:menu" class="w-5 h-5" />
      </UButton>
      
    <!-- Logo and Title (hidden on home route) -->
  <NuxtLink v-if="route.path !== '/'" to="/" class="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
        <!-- Logo Icon -->
        <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/40">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        
        <!-- Title with gradient text -->
        <span class="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
          High Notes
        </span>
      </NuxtLink>
    </div>

    <!-- Right side: Prefetch Indicator, Theme Toggle and User Menu -->
    <div class="relative z-10 flex items-center gap-3">
      <!-- Prefetch indicator -->
      <ClientOnly>
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div v-if="prefetch.active" class="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 shadow-sm" aria-live="polite" aria-atomic="true">
            <Icon name="lucide:cloud-download" class="w-4 h-4 animate-pulse" />
            <span class="font-medium">Preparing offline ({{ prefetch.done }}/{{ prefetch.total }})</span>
          </div>
        </Transition>
        <template #fallback>
          <div style="height:32px"></div>
        </template>
      </ClientOnly>

      <!-- Theme Toggle -->
      <ClientOnly>
        <UButton
          color="neutral"
          variant="ghost"
          aria-label="Toggle theme"
          @click="isDark = !isDark"
          class="w-10 h-10 rounded-xl bg-transparent hover:bg-transparent dark:hover:bg-transparent group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
        >
          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 rotate-90 scale-75"
            enter-to-class="opacity-100 rotate-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 rotate-0 scale-100"
            leave-to-class="opacity-0 -rotate-90 scale-75"
          >
            <Icon :name="isDark ? 'lucide:moon' : 'lucide:sun'" class="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </Transition>
        </UButton>
        <template #fallback>
          <div class="w-10 h-10" />
        </template>
      </ClientOnly>

      <!-- Online/Offline indicator -->
      <ClientOnly>
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="!online"
            class="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-sm border border-amber-200/50 dark:border-amber-700/50 shadow-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            <Icon name="lucide:wifi-off" class="w-4 h-4 animate-pulse" />
            <span class="font-medium">Offline</span>
          </div>
        </Transition>
      </ClientOnly>

      <!-- User Menu -->
      <ClientOnly>
        <UDropdownMenu :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
          <UButton 
            variant="ghost" 
            square 
            class="rounded-xl w-10 h-10 flex items-center justify-center hover:bg-gray-100/70 dark:hover:bg-gray-800/70 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900" 
            aria-label="User menu"
          >
            <UAvatar 
              v-if="isLoggedIn" 
              :alt="user?.email?.charAt(0).toUpperCase() || 'U'" 
              class="ring-2 ring-transparent group-hover:ring-blue-400/50 dark:group-hover:ring-blue-500/50"
              size="sm"
            />
            <div v-else class="w-6 h-6 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-400 flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-600">
              <Icon name="lucide:user" class="w-4 h-4 text-white" />
            </div>
          </UButton>

          <template #account="{ item }">
            <div class="text-left p-1">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</p>
              <p class="truncate font-semibold text-gray-900 dark:text-white text-sm">
                {{ user?.email }}
              </p>
            </div>
          </template>

          <template #item="{ item }">
            <span class="truncate font-medium">{{ item.label }}</span>
            <Icon v-if="item.icon" :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto group-hover:text-blue-500" />
          </template>
        </UDropdownMenu>
        <template #fallback>
          <div class="w-10 h-10" />
        </template>
      </ClientOnly>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOnline } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useLayout } from '~/composables/useLayout';
import { useNotesPrefetch } from '~/composables/useNotesPrefetch';

// Define a type for dropdown items to satisfy TypeScript
type DropdownItem = {
  label: string;
  slot?: string;
  disabled?: boolean;
  icon?: string;
  to?: string;
  onSelect?: (event: Event) => void;
};

// --- Composables ---
const { logout } = useAuth();
const { isMobile, toggleSidebar } = useLayout();
const route = useRoute();
const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value);
const online = useOnline();
// Prefetch status
const { status } = useNotesPrefetch();
const prefetch = computed(() => status.value);

// --- Computed Properties ---
const showMenuButton = computed(() => {
  return isMobile.value && route.path === '/notes';
});

const colorMode = useColorMode();
const isDark = computed({
  get() {
    return colorMode.value === 'dark';
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  },
});

const dropdownItems = computed<DropdownItem[][]>(() => {
  if (isLoggedIn.value) {
    return [
      [{ label: user.value?.email || 'Account', slot: 'account', disabled: true }],
      [
        { label: 'Notes', icon: 'lucide:pencil', to: '/notes' },
        { label: 'Settings', icon: 'lucide:settings', to: '/settings' },
        { label: 'Changelog', icon: 'lucide:clipboard-list', to: '/changelog' },
        { label: 'Logout', icon: 'lucide:log-out', onSelect: handleLogout },
      ],
    ];
  } else {
    return [
      [
        { label: 'Login', icon: 'lucide:log-in', to: '/login' },
        { label: 'Changelog', icon: 'lucide:clipboard-list', to: '/changelog' },
      ],
    ];
  }
});

// --- Event Handlers ---
const handleLogout = async () => {
  await logout();
};
</script>
