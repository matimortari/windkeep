export function useProjectFilters(showAllProjects: Ref<boolean>) {
  const userStore = useUserStore()
  const { activeOrg } = storeToRefs(useOrgStore())
  const { projects } = storeToRefs(useProjectStore())

  const allProjects = computed(() => projects.value.filter(project => project.memberships?.some(m => m.userId === userStore.user?.id)))

  const activeOrgProjects = computed(() => {
    if (!activeOrg.value?.id) {
      return []
    }

    return allProjects.value.filter(project => project.orgId === activeOrg.value?.id)
  })

  const filteredProjects = computed(() => showAllProjects.value ? allProjects.value : activeOrgProjects.value)

  return { activeOrgProjects, allProjects, filteredProjects }
}
