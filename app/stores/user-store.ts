import type { UpdateUserInput } from "#shared/schemas/user-schema"

export interface TokenMetadata {
  hasToken: boolean
  expiresAt: string | null
}

export const useUserStore = defineStore("user", () => {
  const toast = useToast()
  const user = ref<User | null>(null)
  const tokenMetadata = ref<TokenMetadata | null>(null)
  const loading = ref(false)

  async function getUser() {
    loading.value = true

    try {
      const res = await $fetch<{ user: User }>("/api/user", { method: "GET", credentials: "include" })
      user.value = res.user
      return res
    }
    catch (err: unknown) {
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
    catch (err: unknown) {
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
    catch (err: unknown) {
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
      tokenMetadata.value = null
      toast.success("User deleted successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete user")
      toast.error(message)
      console.error("deleteUser error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getTokenMetadata() {
    loading.value = true

    try {
      const res = await $fetch<TokenMetadata>("/api/user/token", { method: "GET", credentials: "include" })
      tokenMetadata.value = res
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch token metadata")
      toast.error(message)
      console.error("getTokenMetadata error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function generateApiToken() {
    loading.value = true

    try {
      const res = await $fetch<{ rawToken: string, expiresAt: string, message: string }>("/api/user/token", { method: "POST", credentials: "include" })
      tokenMetadata.value = { hasToken: true, expiresAt: res.expiresAt }
      toast.success("API token generated successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to generate API token")
      toast.error(message)
      console.error("generateApiToken error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function revokeApiToken() {
    loading.value = true

    try {
      await $fetch("/api/user/token", { method: "DELETE", credentials: "include" })
      tokenMetadata.value = { hasToken: false, expiresAt: null }
      toast.success("API token revoked successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to revoke API token")
      toast.error(message)
      console.error("revokeApiToken error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    user,
    tokenMetadata,
    getUser,
    updateUser,
    updateUserImage,
    deleteUser,
    getTokenMetadata,
    generateApiToken,
    revokeApiToken,
  }
})
