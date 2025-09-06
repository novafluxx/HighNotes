// app/composables/useEncryption.ts
import { ref, computed, watch, readonly } from 'vue';
import type { Database } from '../../types/database.types';
import { useCrypto } from './useCrypto';
import { useToast } from '#imports';

export function useEncryption() {
  // --- Supabase Setup ---
  const client = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const crypto = useCrypto();
  const toast = useToast();

  // --- Reactive State ---
  const masterKey = ref<CryptoKey | null>(null);
  const userSalt = ref<Uint8Array | null>(null);
  const hasEncryptionSetup = ref(false);
  const isEncryptionLocked = ref(true);
  const isSettingUpEncryption = ref(false);
  const isUnlocking = ref(false);

  // --- Computed Properties ---
  const isEncryptionUnlocked = computed(() => !!masterKey.value && !isEncryptionLocked.value);
  const canEncryptNotes = computed(() => hasEncryptionSetup.value && isEncryptionUnlocked.value);

  // --- Core Functions ---

  /**
   * Initialize encryption state for the current user
   */
  const initializeEncryption = async () => {
    if (!user.value) return;

    try {
      const { data: profile, error } = await client
        .from('profiles')
        .select('has_encryption, encryption_salt, kdf_params, key_verification_payload')
        .eq('user_id', user.value.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (profile) {
        hasEncryptionSetup.value = profile.has_encryption;
        if (profile.encryption_salt) {
          userSalt.value = Uint8Array.from(atob(profile.encryption_salt), c => c.charCodeAt(0));
        }
      } else {
        // Create profile if it doesn't exist
        await createUserProfile();
      }
    } catch (error) {
      console.error('Error initializing encryption:', error);
      toast.add({
        title: 'Error loading encryption settings',
        description: 'Failed to load your encryption configuration',
        color: 'error',
        duration: 5000
      });
    }
  };

  /**
   * Create user profile for encryption
   */
  const createUserProfile = async () => {
    if (!user.value) return;

    try {
      const { error } = await client
        .from('profiles')
        .insert({
          user_id: user.value.id,
          has_encryption: false,
          encryption_salt: null,
          kdf_params: null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  /**
   * Set up encryption for the first time
   */
  const setupEncryption = async (passphrase: string): Promise<boolean> => {
    if (!user.value || hasEncryptionSetup.value) return false;

    isSettingUpEncryption.value = true;

    try {
      // Derive master key and generate salt
      const { key, salt, iterations } = await crypto.deriveKey({ 
        password: passphrase 
      });

      // Create a verification payload to verify the key later
      const verificationData = { title: 'verification', content: String(Date.now()) };
      const verificationPayload = await crypto.encryptNote(verificationData, key);
      const verificationPayloadSerialized = crypto.serializeEncryptedPayload(verificationPayload);

      // Store salt, KDF params, and verification payload in profile
      const saltBase64 = btoa(String.fromCharCode(...salt));
      const kdfParams = {
        iterations,
        memory: 65536, // 64MB
        parallelism: 1
      };

      const { error } = await client
        .from('profiles')
        .update({
          has_encryption: true,
          encryption_salt: saltBase64,
          kdf_params: kdfParams,
          key_verification_payload: verificationPayloadSerialized
        })
        .eq('user_id', user.value.id);

      if (error) throw error;

      // Update local state
      masterKey.value = key;
      userSalt.value = salt;
      hasEncryptionSetup.value = true;
      isEncryptionLocked.value = false;

      toast.add({
        title: 'Encryption enabled',
        description: 'You can now encrypt your notes securely',
        color: 'success',
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Error setting up encryption:', error);
      toast.add({
        title: 'Failed to set up encryption',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'error',
        duration: 5000
      });
      return false;
    } finally {
      isSettingUpEncryption.value = false;
    }
  };

  /**
   * Unlock encryption with passphrase
   */
  const unlockEncryption = async (passphrase: string): Promise<boolean> => {
    if (!user.value || !hasEncryptionSetup.value || !userSalt.value) {
      return false;
    }

    isUnlocking.value = true;

    try {
      // First, fetch the verification payload from the database
      const { data: profile, error: fetchError } = await client
        .from('profiles')
        .select('key_verification_payload')
        .eq('user_id', user.value.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch verification data: ${fetchError.message}`);
      }

      if (!profile?.key_verification_payload) {
        throw new Error('No verification payload found. Encryption may need to be set up again.');
      }

      // Derive master key using stored salt
      const { key } = await crypto.deriveKey({ 
        password: passphrase, 
        salt: userSalt.value 
      });

      // Verify the key by attempting to decrypt the verification payload
      try {
        const verificationPayload = crypto.parseEncryptedPayload(profile.key_verification_payload);
        const decryptedVerification = await crypto.decryptNote(verificationPayload, key);
        
        // Check if the decrypted data has the expected structure
        if (!decryptedVerification || decryptedVerification.title !== 'verification') {
          throw new Error('Key verification failed');
        }
      } catch (verificationError) {
        // If decryption fails, the passphrase is incorrect
        toast.add({
          title: 'Incorrect passphrase',
          description: 'The passphrase you entered is incorrect. Please try again.',
          color: 'error',
          duration: 5000
        });
        return false;
      }

      // Key verification successful - set the master key
      masterKey.value = key;
      isEncryptionLocked.value = false;

      toast.add({
        title: 'Encryption unlocked',
        description: 'You can now access encrypted notes',
        color: 'success',
        duration: 2000
      });

      return true;
    } catch (error) {
      console.error('Error unlocking encryption:', error);
      toast.add({
        title: 'Failed to unlock encryption',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        color: 'error',
        duration: 5000
      });
      return false;
    } finally {
      isUnlocking.value = false;
    }
  };

  /**
   * Lock encryption (clear master key from memory)
   */
  const lockEncryption = () => {
    masterKey.value = null;
    isEncryptionLocked.value = true;
    
    toast.add({
      title: 'Encryption locked',
      description: 'Encrypted notes are now protected',
      color: 'info',
      duration: 2000
    });
  };

  /**
   * Encrypt note content
   */
  const encryptNote = async (title: string, content: string): Promise<string | null> => {
    if (!masterKey.value) {
      throw new Error('Encryption is locked. Please unlock to encrypt notes.');
    }

    try {
      const plaintextData = { title, content };
      const encryptedPayload = await crypto.encryptNote(plaintextData, masterKey.value);
      return crypto.serializeEncryptedPayload(encryptedPayload);
    } catch (error) {
      console.error('Error encrypting note:', error);
      toast.add({
        title: 'Encryption failed',
        description: 'Failed to encrypt note content',
        color: 'error',
        duration: 5000
      });
      return null;
    }
  };

  /**
   * Decrypt note content
   */
  const decryptNote = async (encryptedPayload: string): Promise<{ title: string; content: string } | null> => {
    if (!masterKey.value) {
      throw new Error('Encryption is locked. Please unlock to decrypt notes.');
    }

    try {
      const payload = crypto.parseEncryptedPayload(encryptedPayload);
      const decryptedData = await crypto.decryptNote(payload, masterKey.value);
      return decryptedData;
    } catch (error) {
      console.error('Error decrypting note:', error);
      toast.add({
        title: 'Decryption failed',
        description: 'Failed to decrypt note. The note may be corrupted or your passphrase may be incorrect.',
        color: 'error',
        duration: 5000
      });
      return null;
    }
  };

  // Initialize encryption state when user changes
  watch(() => user.value?.id, (userId) => {
    if (userId) {
      initializeEncryption();
    } else {
      // Reset state when user logs out
      masterKey.value = null;
      userSalt.value = null;
      hasEncryptionSetup.value = false;
      isEncryptionLocked.value = true;
    }
  }, { immediate: true });

  return {
    // State
    hasEncryptionSetup: readonly(hasEncryptionSetup),
    isEncryptionUnlocked: readonly(isEncryptionUnlocked),
    isEncryptionLocked: readonly(isEncryptionLocked),
    canEncryptNotes: readonly(canEncryptNotes),
    isSettingUpEncryption: readonly(isSettingUpEncryption),
    isUnlocking: readonly(isUnlocking),

    // Actions
    setupEncryption,
    unlockEncryption,
    lockEncryption,
    encryptNote,
    decryptNote,
    initializeEncryption
  };
}