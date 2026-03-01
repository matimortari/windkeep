import type { UpdateUserInput } from "#shared/schemas/user-schema"

export const useUserStore = defineStore("user", () => {
  const toast = useToast()
  const user = ref<User | null>(null)
  const loading = ref(false)

  async function getUser() {
    loading.value = true

    try {
      const res = await $fetch<{ userData: User }>("/api/user", { method: "GET", credentials: "include" })
      user.value = res.userData
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to get user")
      toast.error(message)
      console.error("getUser error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateUser(data: UpdateUserInput) {
    loading.value = true

    try {
      const res = await $fetch<{ updatedUser: User }>("/api/user", { method: "PUT", body: data, credentials: "include" })
      user.value = res.updatedUser
      toast.success("User updated successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to update user")
      toast.error(message)
      console.error("updateUser error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateUserImage(file: File) {
    loading.value = true

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await $fetch<{ imageUrl: string }>("/api/user/image-upload", { method: "PUT", body: formData, credentials: "include" })
      if (user.value && res.imageUrl) {
        user.value.image = res.imageUrl
      }
      toast.success("User image updated successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to update user image")
      toast.error(message)
      console.error("updateUserImage error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteUser() {
    loading.value = true

    try {
      await $fetch("/api/user", { method: "DELETE", credentials: "include" })
      user.value = null
      toast.success("User deleted successfully")
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to delete user")
      toast.error(message)
      console.error("deleteUser error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    user,
    getUser,
    updateUser,
    updateUserImage,
    deleteUser,
  }
})
