<template>
  <!-- Use Tailwind for layout, background, border -->
  <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-between items-center">
    <!-- Left side: Mobile Toggle (if needed) and Title -->
    <div class="flex items-center gap-4">
      <!-- Mobile Hamburger Toggle (Kept structure, needs Tailwind styling) -->
      <button v-if="isMobile" @click="$emit('toggle-sidebar')" class="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label="Toggle sidebar">
        <!-- Simple hamburger icon using divs -->
        <div class="space-y-1.5">
          <div class="w-6 h-0.5 bg-current"></div>
          <div class="w-6 h-0.5 bg-current"></div>
          <div class="w-6 h-0.5 bg-current"></div>
        </div>
      </button>
      <!-- Title -->
      <a href="#" @click.prevent="refreshPage" class="text-xl font-bold text-gray-900 dark:text-white">
        High Notes
      </a>
    </div>

    <!-- Right side: Theme Toggle and User Menu/Login -->
    <div class="flex items-center gap-4">
      <!-- Theme Toggle using NuxtUI's useColorMode -->
      <ClientOnly>
        <UButton
          :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          variant="ghost"
          aria-label="Theme"
          @click="isDark = !isDark"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>

      <!-- User Menu Dropdown (if logged in) -->
      <div v-if="isLoggedIn">
         <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
           <UAvatar :alt="user?.email?.charAt(0).toUpperCase() || 'U'" size="sm" />

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
      </div>

      <!-- Login Link (if logged out) -->
      <NuxtLink v-else to="/login" class="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary">
        Login
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
// Keep necessary imports, remove unused ones related to old theme/dropdown
import { computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
// NuxtLink is auto-imported if used in template

// --- Props and Emits (Keep) ---
defineProps({
  isMobile: {
    type: Boolean,
    default: false
  }
});
defineEmits(['toggle-sidebar']);

// --- Supabase User State (Keep) ---
const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value);

// --- Logout Logic (Keep) ---
const { logout, loading: logoutLoading } = useAuth();
const handleLogout = async () => {
  console.log('Logout initiated');
  await logout();
}

// --- NuxtUI Color Mode --- NEW
const colorMode = useColorMode();
const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
});

// --- User Dropdown Items --- NEW
const userMenuItems = [
  [
    {
      label: user.value?.email || 'Account',
      slot: 'account',
      disabled: true
    }
  ], [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-left-on-rectangle',
      onSelect: () => {
        handleLogout();
      }
    }
  ]
];

// --- Page Refresh Logic (Keep) ---
const refreshPage = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};
</script>
