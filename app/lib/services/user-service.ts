import type { UpdateUserInput } from "#shared/lib/schemas/user-schema"

export const userService = {
  /**
   * Fetch current authenticated user
   */
  getUser: async () => {
    const res = await $fetch(`${API_URL}/user`, {
      method: "GET",
      credentials: "include",
    })

    return res
  },

  /**
   * Update current user
   * @param data Partial object with name and image (for updating image via URL)
   */
  updateUser: async (data: UpdateUserInput) => {
    const res = await $fetch(`${API_URL}/user`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Update user profile image
   * @param file Image file to upload (png, jpeg, or webp, max 5MB)
   */
  updateUserImage: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await $fetch<{ imageUrl: string }>(`${API_URL}/user/image-upload`, {
      method: "PUT",
      body: formData,
      credentials: "include",
    })

    return res
  },

  /**
   * Delete current user
   */
  deleteUser: async () => {
    const res = await $fetch(`${API_URL}/user`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },
}
