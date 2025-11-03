import type { UpdateUserInput } from "#shared/lib/schemas/user-schema"

export function useUserActions() {
  const userStore = useUserStore()

  /**
   * Fetch and initialize user data
   */
  const fetchUser = async () => {
    await userStore.getUser()
  }

  /**
   * Switch to a different active organization
   * @param orgId Organization ID to switch to
   */
  const switchOrganization = async (orgId: string) => {
    await userStore.setActiveOrg(orgId)
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
   * Delete user account and redirect to sign-in page
   */
  const deleteAccount = async () => {
    await userStore.deleteUser()
    await navigateTo("/sign-in")
  }

  /**
   * User getter
   */
  const user = computed(() => userStore.user)

  /**
   * Active organization getter
   */
  const activeOrg = computed(() => userStore.activeOrg)

  /**
   * Loading state
   */
  const loading = computed(() => userStore.loading)

  /**
   * Error state
   */
  const errors = computed(() => userStore.errors)

  return {
    user,
    activeOrg,
    loading,
    errors,
    fetchUser,
    switchOrganization,
    updateProfile,
    updateProfileImage,
    deleteAccount,
  }
}
