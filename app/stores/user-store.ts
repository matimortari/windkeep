import type { UpdateUserInput } from "#shared/schemas/user-schema"

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const activeOrg = ref<Organization | null>(null)
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
      const userData = await $fetch(`${API_URL}/user`, {
        method: "GET",
        credentials: "include",
      })
      user.value = userData as User

      if (user.value?.activeOrgId) {
        const membership = user.value.orgMemberships?.find(
          m => m.orgId === user.value?.activeOrgId,
        )
        activeOrg.value = membership?.org
          ? { ...membership.org, memberships: membership.org.memberships || [] }
          : null
      }
      else {
        activeOrg.value = null
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
      await $fetch(`${API_URL}/user`, {
        method: "PUT",
        body: { activeOrgId: orgId },
        credentials: "include",
      })

      const membership = user.value.orgMemberships?.find(m => m.orgId === orgId)
      activeOrg.value = membership?.org
        ? { ...membership.org, memberships: membership.org.memberships || [] }
        : null
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
      await $fetch(`${API_URL}/user`, {
        method: "PUT",
        body: data,
        credentials: "include",
      })
      if (user.value)
        Object.assign(user.value, data)
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
      const formData = new FormData()
      formData.append("file", file)

      const res = await $fetch<{ imageUrl: string }>(`${API_URL}/user/image-upload`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      })

      if (user.value && res.imageUrl)
        user.value.image = res.imageUrl
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
      await $fetch(`${API_URL}/user`, {
        method: "DELETE",
        credentials: "include",
      })
      user.value = null
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
    activeOrg,
    getUser,
    setActiveOrg,
    updateUser,
    updateUserImage,
    deleteUser,
  }
})
