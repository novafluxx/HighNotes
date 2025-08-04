<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-between items-center">
    <!-- Left side: Hamburger and Title -->
    <div class="flex items-center gap-4">
      <!-- Hamburger Menu Button (Mobile, Notes Page Only) -->
      <UButton
        v-if="showMenuButton"
        icon="i-heroicons-bars-3"
        color="neutral"
        variant="ghost"
        aria-label="Open sidebar"
        @click="toggleSidebar"
      />
      <!-- Logo and Title -->
      <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        High Notes
      </NuxtLink>
    </div>

    <!-- Right side: Theme Toggle and User Menu -->
    <div class="flex items-center gap-4">
      <ClientOnly>
        <UButton
          :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          color="neutral"
          variant="ghost"
          aria-label="Theme"
          @click="isDark = !isDark"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>

      <ClientOnly>
        <UDropdownMenu :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
          <UButton variant="ghost" square class="rounded-full w-10 h-10 flex items-center justify-center" aria-label="User menu">
            <UAvatar v-if="isLoggedIn" :alt="user?.email?.charAt(0).toUpperCase() || 'U'" />
            <UIcon v-else name="i-heroicons-user-circle" class="w-6 h-6" />
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
            <UIcon v-if="item.icon" :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto" />
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
import { useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useLayout } from '~/composables/useLayout';

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
        { label: 'Notes', icon: 'i-heroicons-pencil-square', to: '/notes' },
        { label: 'Logout', icon: 'i-heroicons-arrow-left-on-rectangle', onSelect: handleLogout },
      ],
    ];
  } else {
    return [[{ label: 'Login', icon: 'i-heroicons-arrow-right-on-rectangle', to: '/login' }]];
  }
});

// --- Event Handlers ---
const handleLogout = async () => {
  await logout();
};
</script>
