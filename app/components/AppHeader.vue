<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-between items-center">
    <!-- Left side: Hamburger and Title -->
    <div class="flex items-center gap-4">
      <!-- Hamburger Menu Button (Mobile, Notes Page Only) -->
      <UButton
        v-if="showMenuButton"
        color="neutral"
        variant="ghost"
        aria-label="Open sidebar"
        @click="toggleSidebar"
      >
        <Icon name="lucide:menu" class="w-5 h-5" />
      </UButton>
      <!-- Logo and Title -->
      <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        High Notes
      </NuxtLink>
    </div>

    <!-- Right side: Prefetch Indicator, Theme Toggle and User Menu -->
    <div class="flex items-center gap-4">
      <!-- Prefetch indicator -->
      <ClientOnly>
        <div v-if="prefetch.active" class="flex items-center gap-2 text-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" aria-live="polite" aria-atomic="true">
          <Icon name="lucide:cloud-download" class="w-4 h-4" />
          <span>Preparing offline ({{ prefetch.done }}/{{ prefetch.total }})</span>
        </div>
      </ClientOnly>
      <ClientOnly>
        <UButton
          color="neutral"
          variant="ghost"
          aria-label="Theme"
          @click="isDark = !isDark"
        >
          <Icon :name="isDark ? 'lucide:moon' : 'lucide:sun'" class="w-5 h-5" />
        </UButton>
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>

      <!-- Online/Offline indicator -->
      <ClientOnly>
        <div
          v-if="!online"
          class="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900"
          aria-live="polite"
          aria-atomic="true"
        >
          <Icon name="lucide:wifi-off" class="w-4 h-4" />
          <span>Offline</span>
        </div>
      </ClientOnly>

      <ClientOnly>
        <UDropdownMenu :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
          <UButton variant="ghost" square class="rounded-full w-10 h-10 flex items-center justify-center" aria-label="User menu">
            <UAvatar v-if="isLoggedIn" :alt="user?.email?.charAt(0).toUpperCase() || 'U'" />
            <Icon v-else name="lucide:user" class="w-6 h-6" />
          </UButton>

          <template #account="{ item }">
            <div class="text-left">
              <p>Signed in as</p>
              <p class="truncate font-medium text-gray-900 dark:text-white">
                {{ user?.email }}
              </p>
            </div>
          </template>

          <template #item="{ item }">
            <span class="truncate">{{ item.label }}</span>
            <Icon v-if="item.icon" :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto" />
          </template>
        </UDropdownMenu>
        <template #fallback>
          <div class="w-8 h-8" />
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
