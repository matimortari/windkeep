import type { UpdateUserInput } from "#shared/schemas/user-schema"

export function useUserActions() {
  const userStore = useUserStore()
  const { clear } = useUserSession()

  const user = computed(() => userStore.user)
  const loading = computed(() => userStore.loading)
  const errors = computed(() => userStore.errors)

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

  const updateProfile = async (data: UpdateUserInput) => {
    await userStore.updateUser(data)
  }

  const updateProfileImage = async (file: File) => {
    return await userStore.updateUserImage(file)
  }

  const deleteAccount = async () => {
    await userStore.deleteUser()
    await clear()
    await navigateTo("/")
  }

  return {
    user,
    loading,
    errors,
    fetchUser,
    updateProfile,
    updateProfileImage,
    deleteAccount,
  }
}
