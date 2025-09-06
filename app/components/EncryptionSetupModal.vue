<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <Icon name="lucide:shield-check" class="w-6 h-6 text-primary-500" />
          <h3 class="text-lg font-semibold">Set Up Note Encryption</h3>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Warning Message -->
        <UAlert
          color="amber"
          variant="soft"
          icon="lucide:alert-triangle"
          title="Important Security Notice"
          description="Your passphrase cannot be recovered. If you lose it, encrypted notes will be permanently inaccessible."
        />

        <!-- Passphrase Form -->
        <UForm :state="form" @submit="handleSubmit" class="space-y-4">
          <UFormField label="Enter Passphrase" name="passphrase" required>
            <UInput
              v-model="form.passphrase"
              type="password"
              placeholder="Enter a strong passphrase"
              :disabled="loading"
              autocomplete="new-password"
            />
            <template #help>
              <span class="text-sm text-gray-500">
                Use a long, unique passphrase that you'll remember
              </span>
            </template>
          </UFormField>

          <UFormField label="Confirm Passphrase" name="confirmPassphrase" required>
            <UInput
              v-model="form.confirmPassphrase"
              type="password"
              placeholder="Confirm your passphrase"
              :disabled="loading"
              autocomplete="new-password"
            />
            <template #error>
              <span v-if="form.passphrase && form.confirmPassphrase && form.passphrase !== form.confirmPassphrase" class="text-red-500 text-sm">
                Passphrases do not match
              </span>
            </template>
          </UFormField>

          <!-- Security Requirements -->
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h4 class="text-sm font-medium mb-2">Security Requirements:</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li class="flex items-center gap-2">
                <Icon 
                  :name="form.passphrase.length >= 12 ? 'lucide:check' : 'lucide:x'" 
                  :class="form.passphrase.length >= 12 ? 'text-green-500' : 'text-red-500'" 
                  class="w-4 h-4" 
                />
                At least 12 characters
              </li>
              <li class="flex items-center gap-2">
                <Icon 
                  :name="hasUppercase ? 'lucide:check' : 'lucide:x'" 
                  :class="hasUppercase ? 'text-green-500' : 'text-red-500'" 
                  class="w-4 h-4" 
                />
                Contains uppercase letters
              </li>
              <li class="flex items-center gap-2">
                <Icon 
                  :name="hasLowercase ? 'lucide:check' : 'lucide:x'" 
                  :class="hasLowercase ? 'text-green-500' : 'text-red-500'" 
                  class="w-4 h-4" 
                />
                Contains lowercase letters
              </li>
              <li class="flex items-center gap-2">
                <Icon 
                  :name="hasNumbers ? 'lucide:check' : 'lucide:x'" 
                  :class="hasNumbers ? 'text-green-500' : 'text-red-500'" 
                  class="w-4 h-4" 
                />
                Contains numbers
              </li>
            </ul>
          </div>

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
              :disabled="!isFormValid || loading"
              :loading="loading"
            >
              <template #leading>
                <Icon name="lucide:shield-check" class="w-4 h-4" />
              </template>
              Enable Encryption
            </UButton>
          </div>
        </UForm>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
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
  passphrase: '',
  confirmPassphrase: ''
});

const loading = computed(() => props.loading || false);

// Password strength validation
const hasUppercase = computed(() => /[A-Z]/.test(form.value.passphrase));
const hasLowercase = computed(() => /[a-z]/.test(form.value.passphrase));
const hasNumbers = computed(() => /\d/.test(form.value.passphrase));

const isFormValid = computed(() => {
  return form.value.passphrase.length >= 12 &&
         hasUppercase.value &&
         hasLowercase.value &&
         hasNumbers.value &&
         form.value.passphrase === form.value.confirmPassphrase;
});

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', form.value.passphrase);
  }
};

// Reset form when modal closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    form.value.passphrase = '';
    form.value.confirmPassphrase = '';
  }
});
</script>