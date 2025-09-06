<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <Icon name="lucide:unlock" class="w-6 h-6 text-primary-500" />
          <h3 class="text-lg font-semibold">Unlock Encryption</h3>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Info Message -->
        <div class="text-center">
          <p class="text-gray-600 dark:text-gray-400">
            Enter your passphrase to access encrypted notes
          </p>
        </div>

        <!-- Passphrase Form -->
        <UForm :state="form" @submit="handleSubmit" class="space-y-4">
          <UFormField label="Passphrase" name="passphrase" required>
            <UInput
              v-model="form.passphrase"
              type="password"
              placeholder="Enter your passphrase"
              :disabled="loading"
              autocomplete="current-password"
              autofocus
            />
            <template #error>
              <span v-if="hasError" class="text-red-500 text-sm">
                {{ errorMessage }}
              </span>
            </template>
          </UFormField>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 pt-4">
            <UButton
              type="button"
              color="gray"
              variant="ghost"
              @click="emit('close')"
              :disabled="loading"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :disabled="!form.passphrase.trim() || loading"
              :loading="loading"
            >
              <template #leading>
                <Icon name="lucide:unlock" class="w-4 h-4" />
              </template>
              Unlock
            </UButton>
          </div>
        </UForm>

        <!-- Warning Message -->
        <UAlert
          color="amber"
          variant="soft"
          :icon="{ name: 'lucide:alert-triangle' }"
          title="Security Reminder"
          description="If you've forgotten your passphrase, encrypted notes cannot be recovered."
        />
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', passphrase: string): void;
  (e: 'close'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const form = ref({
  passphrase: ''
});

const loading = computed(() => props.loading || false);
const hasError = computed(() => !!props.error);
const errorMessage = computed(() => props.error || 'Invalid passphrase');

const handleSubmit = () => {
  if (form.value.passphrase.trim()) {
    emit('submit', form.value.passphrase);
  }
};

// Reset form when modal closes or opens
watch(isOpen, (newValue) => {
  if (!newValue) {
    form.value.passphrase = '';
  }
});
</script>