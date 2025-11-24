import type { UpdateUserInput } from "#shared/schemas/user-schema"

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({ getUser: null, updateUser: null, updateUserImage: null, deleteUser: null })

  async function getUser() {
    loading.value = true
    errors.value.getUser = null

    try {
      const res = await $fetch<User>(`${API_URL}/user`, { method: "GET", credentials: "include" })
      user.value = res
    }
    catch (err: any) {
      errors.value.getUser = err.data.message || "Failed to get user"
      console.error("getUser error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateUser(data: UpdateUserInput) {
    loading.value = true
    errors.value.updateUser = null

    try {
      await $fetch(`${API_URL}/user`, { method: "PUT", body: data, credentials: "include" })
      if (user.value) {
        Object.assign(user.value, data)
      }
    }
    catch (err: any) {
      errors.value.updateUser = err.data.message || "Failed to update user"
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

      const res = await $fetch<{ imageUrl: string }>(`${API_URL}/user/image-upload`, { method: "PUT", body: formData, credentials: "include" })
      if (user.value && res.imageUrl) {
        user.value.image = res.imageUrl
      }

      return res
    }
    catch (err: any) {
      errors.value.updateUserImage = err.data.message || "Failed to update user image"
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
      await $fetch(`${API_URL}/user`, { method: "DELETE", credentials: "include" })
      user.value = null
    }
    catch (err: any) {
      errors.value.deleteUser = err.data.message || "Failed to delete user"
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
    getUser,
    updateUser,
    updateUserImage,
    deleteUser,
  }
})
