import type { UpdateUserInput } from "#shared/lib/schemas/user"

export function useUserActions() {
  const userStore = useUserStore()
  const router = useRouter()

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
    await router.push("/sign-in")
  }

  /**
   * Check if user has a specific role in the active organization
   * @param requiredRole Role to check against (OWNER, ADMIN, or MEMBER)
   */
  const hasRole = (requiredRole: Role | Role[]) => {
    if (!userStore.activeOrg)
      return false

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(userStore.activeOrg.role)
  }

  /**
   * Check if user is an owner of the active organization
   */
  const isOwner = computed(() => hasRole("OWNER"))

  /**
   * Check if user is an admin or owner of the active organization
   */
  const isAdmin = computed(() => hasRole(["OWNER", "ADMIN"]))

  /**
   * Check if user has any organization membership
   */
  const hasOrganization = computed(() => userStore.organizations.length > 0)

  return {
    // Store state
    user: computed(() => userStore.user),
    organizations: computed(() => userStore.organizations),
    activeOrg: computed(() => userStore.activeOrg),
    loading: computed(() => userStore.loading),
    errors: computed(() => userStore.errors),

    // Actions
    fetchUser,
    switchOrganization,
    updateProfile,
    updateProfileImage,
    deleteAccount,

    // Role checks
    hasRole,
    isOwner,
    isAdmin,
    hasOrganization,
  }
}
