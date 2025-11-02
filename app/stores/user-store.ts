import type { UpdateUserInput } from "#shared/lib/schemas/user"

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const organizations = ref<Array<Pick<Organization, "id" | "name"> & { role: Role }>>([])
  const activeOrg = ref<Pick<Organization, "id" | "name"> & { role: Role } | null>(null)
  const loading = ref(false)
  const errors = ref<Record<
    "getUser" | "setActiveOrg" | "updateUser" | "updateUserImage" | "deleteUser",
    string | null
  >>({
    getUser: null,
    setActiveOrg: null,
    updateUser: null,
    updateUserImage: null,
    deleteUser: null,
  })

  async function getUser() {
    loading.value = true
    errors.value.getUser = null

    try {
      const userData = await userService.getUser() as User
      user.value = userData
      if (!userData.memberships?.length)
        return

      // Map memberships to organizations
      organizations.value = userData.memberships.map(m => ({
        id: m.organization!.id,
        name: m.organization!.name,
        role: m.role,
      }))

      // Find active org
      const activeMembership = userData.memberships.find(m => m.organization?.id === userData.activeOrgId)
      if (activeMembership?.organization) {
        activeOrg.value = {
          id: activeMembership.organization.id,
          name: activeMembership.organization.name,
          role: activeMembership.role,
          createdAt: (activeMembership.organization as any).createdAt,
          updatedAt: (activeMembership.organization as any).updatedAt,
          members: (activeMembership.organization as any).memberships || [],
        } as any
        if (!userData.activeOrgId) {
          await userService.updateUser({ activeOrgId: activeMembership.organization.id })
        }
      }
    }
    catch (err: any) {
      errors.value.getUser = err?.message || "Failed to get user"
      console.error("getUser error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function setActiveOrg(orgId: string) {
    if (!user.value)
      return

    loading.value = true
    errors.value.setActiveOrg = null

    try {
      await userService.updateUser({ activeOrgId: orgId })

      // Update local state
      const organization = organizations.value.find(org => org.id === orgId)
      if (organization) {
        activeOrg.value = {
          id: organization.id,
          name: organization.name,
          role: organization.role,
        }
      }

      if (user.value) {
        user.value.activeOrgId = orgId
      }
    }
    catch (err: any) {
      errors.value.setActiveOrg = err?.message || "Failed to set active organization"
      console.error("setActiveOrg error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateUser(data: UpdateUserInput) {
    loading.value = true
    errors.value.updateUser = null

    try {
      const updatedUser = await userService.updateUser(data) as Partial<User>
      if (user.value) {
        if (updatedUser.name !== undefined) {
          user.value.name = updatedUser.name
        }
        if (updatedUser.image !== undefined) {
          user.value.image = updatedUser.image
        }
        if (updatedUser.updatedAt) {
          user.value.updatedAt = updatedUser.updatedAt
        }
        if (updatedUser.activeOrgId !== undefined) {
          user.value.activeOrgId = updatedUser.activeOrgId
        }
      }
    }
    catch (err: any) {
      errors.value.updateUser = err?.message || "Failed to update user"
      console.error("updateUser error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateUserImage(file: File) {
    loading.value = true
    errors.value.updateUserImage = null

    try {
      const res = await userService.updateUserImage(file)
      if (user.value && res.imageUrl) {
        user.value.image = res.imageUrl
      }
      return res
    }
    catch (err: any) {
      errors.value.updateUserImage = err?.message || "Failed to update user image"
      console.error("updateUserImage error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function deleteUser() {
    loading.value = true
    errors.value.deleteUser = null

    try {
      await userService.deleteUser()
      user.value = null
      organizations.value = []
      activeOrg.value = null
    }
    catch (err: any) {
      errors.value.deleteUser = err?.message || "Failed to delete user"
      console.error("deleteUser error:", err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    errors,
    user,
    organizations,
    activeOrg,
    getUser,
    setActiveOrg,
    updateUser,
    updateUserImage,
    deleteUser,
  }
})
