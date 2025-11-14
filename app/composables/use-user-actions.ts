import type { UpdateUserInput } from "#shared/schemas/user-schema"

export function useUserActions() {
  const userStore = useUserStore()
  const { clear } = useUserSession()

  const user = computed(() => userStore.user)
  const activeOrg = computed(() => userStore.activeOrg)
  const loading = computed(() => userStore.loading)
  const errors = computed(() => userStore.errors)

  /**
   * Fetch and initialize user data
   */
  const fetchUser = async () => {
    try {
      await userStore.getUser()
      if (!userStore.user) {
        await clear()
        await navigateTo("/", { replace: true })
      }
    }
    catch {
      await clear()
      await navigateTo("/", { replace: true })
    }
  }

  /**
   * Switch to a different active organization
   * @param orgId Organization ID to switch to
   */
  const setCurrentOrganization = async (orgId: string) => {
    await userStore.setActiveOrg(orgId)
    if (import.meta.client) {
      globalThis.location.reload()
    }
  }

  /**
   * Update user profile information
   * @param data User data to update (name, image URL, or activeOrgId)
   */
  const updateProfile = async (data: UpdateUserInput) => {
    await userStore.updateUser(data)
  }

  /**
   * Update user profile image by uploading a file
   * @param file Image file to upload (png, jpeg, or webp, max 5MB)
   */
  const updateProfileImage = async (file: File) => {
    return await userStore.updateUserImage(file)
  }

  /**
   * Delete user account and session cookies
   */
  const deleteAccount = async () => {
    await userStore.deleteUser()
    await clear()
    await navigateTo("/")
  }

  return {
    user,
    activeOrg,
    loading,
    errors,
    fetchUser,
    setCurrentOrganization,
    updateProfile,
    updateProfileImage,
    deleteAccount,
  }
}
