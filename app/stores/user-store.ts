import type { UpdateUserInput } from "#shared/schemas/user-schema"

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({
    getUser: null,
    updateUser: null,
    updateUserImage: null,
    deleteUser: null,
  })

  async function getUser() {
    loading.value = true
    errors.value.getUser = null

    try {
      const res = await $fetch<{ userData: User }>("/api/user", { method: "GET", credentials: "include" })
      user.value = res.userData
      return res
    }
    catch (err: any) {
      errors.value.getUser = getErrorMessage(err, "Failed to get user")
      console.error("getUser error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateUser(data: UpdateUserInput) {
    loading.value = true
    errors.value.updateUser = null

    try {
      const res = await $fetch<{ updatedUser: User }>("/api/user", { method: "PUT", body: data, credentials: "include" })
      user.value = res.updatedUser
      return res
    }
    catch (err: any) {
      errors.value.updateUser = getErrorMessage(err, "Failed to update user")
      console.error("updateUser error:", err)
      throw err
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

      const res = await $fetch<{ imageUrl: string }>("/api/user/image-upload", { method: "PUT", body: formData, credentials: "include" })
      if (user.value && res.imageUrl) {
        user.value.image = res.imageUrl
      }
      return res
    }
    catch (err: any) {
      errors.value.updateUserImage = getErrorMessage(err, "Failed to update user image")
      console.error("updateUserImage error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteUser() {
    loading.value = true
    errors.value.deleteUser = null

    try {
      await $fetch("/api/user", { method: "DELETE", credentials: "include" })
      user.value = null
    }
    catch (err: any) {
      errors.value.deleteUser = getErrorMessage(err, "Failed to delete user")
      console.error("deleteUser error:", err)
      throw err
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
