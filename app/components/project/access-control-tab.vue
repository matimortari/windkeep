<template>
  <TabSection title="Access Control">
    <template #context>
      <h3 class="navigation-group max-w-lg truncate text-muted-foreground">
        <span class="truncate">{{ project?.name }}</span>
        <nuxt-link v-if="project?.website" :href="project.website" target="_blank" aria-label="Visit project website">
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

    <template #actions>
      <nav v-if="canManage" class="navigation-group w-full justify-end md:w-auto">
        <button class="btn-primary" :disabled="!availableOrgMembers.length" @click="isAddDialogOpen = true">
          <icon name="ph:plus-circle-bold" size="20" />
          <span>Add Member</span>
        </button>
        <button class="btn-primary" @click="isTokenDialogOpen = true">
          <icon name="ph:key-bold" size="20" />
          <span>Generate Token</span>
        </button>
      </nav>
    </template>

    <div class="flex flex-col gap-4 py-2">
      <section class="flex flex-col gap-2">
        <header class="flex flex-col gap-1">
          <h6>
            Members
          </h6>
          <p class="text-caption">
            Users with access to this project and their roles.
          </p>
        </header>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="col in memberColumns" :key="col.key" :class="col.class">
                  <div class="navigation-group">
                    <span>{{ col.label }}</span>
                    <button v-if="col.sortable" class="flex items-center hover:text-secondary" :aria-label="`Sort by ${col.label}`" @click="toggleMemberSort(col.key)">
                      <icon :name="getMemberSortIconName(col.key)" size="15" class="transition-transform" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="!sortedMembers.length">
                <td :colspan="memberColumns.length" class="p-8 text-center">
                  <Empty message="No members found." icon-name="ph:users-three-bold" />
                </td>
              </tr>

              <tr
                v-for="member in sortedMembers" :key="member.userId"
                class="hover:bg-muted/20" :class="canManageMember(member) ? 'cursor-pointer' : ''"
                @click="canManageMember(member) && openMemberDialog(member)"
              >
                <td>
                  <div class="navigation-group items-start!">
                    <img :src="member.user.image" alt="Avatar" class="hidden size-8 rounded-full border md:block">
                    <div class="flex flex-col truncate">
                      <span class="font-semibold">{{ member.user?.name }}</span>
                      <span class="text-caption">{{ member.user?.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="w-28">
                  {{ ROLES.find(role => role.value === member.role)?.label }}
                </td>
                <td class="w-24">
                  <button v-if="canManageMember(member)" class="btn" aria-label="Manage member" @click.stop="openMemberDialog(member)">
                    <icon name="ph:gear-bold" size="15" class="text-muted-foreground hover:text-secondary" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="flex flex-col gap-2 border-t pt-4">
        <header class="flex flex-col gap-1">
          <h6>
            Service Tokens
          </h6>
          <p class="text-caption">
            Tokens for CI/CD pipelines and external tools to read secrets from selected environments.
          </p>
        </header>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-for="col in tokenColumns" :key="col.key" :class="col.class">
                  <div class="navigation-group">
                    <span>{{ col.label }}</span>
                    <button v-if="col.sortable" class="flex items-center hover:text-secondary" :aria-label="`Sort by ${col.label}`" @click="toggleTokenSort(col.key)">
                      <icon :name="getTokenSortIconName(col.key)" size="15" class="transition-transform" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="!sortedTokens.length">
                <td :colspan="tokenColumns.length" class="p-8 text-center">
                  <Empty message="No service tokens for this project." icon-name="ph:key-bold" />
                </td>
              </tr>

              <tr v-for="token in sortedTokens" :key="token.id" class="hover:bg-muted/20">
                <td>
                  <div class="navigation-group font-semibold">
                    <span class="truncate">{{ token.name }}</span>
                    <div v-if="token.environment?.length" class="flex flex-wrap items-center gap-1">
                      <span v-for="env in token.environment" :key="env" class="rounded-full border border-muted/40 bg-muted/20 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {{ ENVIRONMENTS.find(e => e.value === env)?.label }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="w-40 whitespace-nowrap">
                  {{ token.expiresAt ? formatDate(token.expiresAt) : "Never" }}
                </td>
                <td class="w-40 whitespace-nowrap">
                  {{ token.lastUsedAt ? formatDate(token.lastUsedAt) : "Never" }}
                </td>
                <td class="max-w-xs truncate">
                  {{ token.user?.name }}
                </td>
                <td class="w-24">
                  <button class="btn" aria-label="Revoke token" @click="handleRevokeToken(token.id)">
                    <icon name="ph:trash-bold" size="15" class="text-muted-foreground hover:text-danger" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <ProjectMemberAddDialog v-model:is-open="isAddDialogOpen" :project-id="project?.id ?? ''" :available-members="availableOrgMembers" @added="projectStore.getProjects()" />

    <ProjectMemberManageDialog
      v-model:is-open="isMemberDialogOpen" :project-id="project?.id ?? ''"
      :member="selectedMember" :can-remove="isOwner(project?.id ?? '')"
      @updated="projectStore.getProjects()"
    />

    <ProjectServiceTokenDialog v-model:is-open="isTokenDialogOpen" :project-id="project?.id ?? ''" @created="refreshTokens" />
  </TabSection>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { user } = storeToRefs(useUserStore())
const { orgMembers } = storeToRefs(useOrgStore())
const projectStore = useProjectStore()
const { projects, serviceTokens, isOwner, isAdmin } = storeToRefs(projectStore)
const project = computed(() => projects.value.find(p => p.slug === slug))
const memberships = computed(() => project.value?.memberships ?? [])
const canManage = computed(() => isOwner.value(project.value?.id ?? "") || isAdmin.value(project.value?.id ?? ""))
const isAddDialogOpen = ref(false)
const isMemberDialogOpen = ref(false)
const isTokenDialogOpen = ref(false)
const selectedMember = ref<ProjectMembership | null>(null)

const memberColumns = [
  { key: "user.name", label: "Member", class: "", sortable: true },
  { key: "role", label: "Role", class: "w-28", sortable: true },
  { key: "actions", label: "Actions", class: "w-24", sortable: false },
]

const tokenColumns = [
  { key: "name", label: "Name", class: "", sortable: true },
  { key: "expiresAt", label: "Expires", class: "w-40", sortable: true },
  { key: "lastUsedAt", label: "Last used", class: "w-40", sortable: true },
  { key: "user.name", label: "Created by", class: "", sortable: true },
  { key: "actions", label: "Actions", class: "w-24", sortable: false },
]

const { sortedData: sortedMembers, toggleSort: toggleMemberSort, getSortIconName: getMemberSortIconName } = useTableSort(memberships)
const { sortedData: sortedTokens, toggleSort: toggleTokenSort, getSortIconName: getTokenSortIconName } = useTableSort(serviceTokens)

const availableOrgMembers = computed(() => {
  if (!project.value || !orgMembers.value) {
    return []
  }
  const memberIds = new Set(project.value.memberships?.map(m => m.userId) || [])
  return orgMembers.value.filter(member => !memberIds.has(member.user.id))
})

function canManageMember(member: ProjectMembership) {
  return canManage.value && member.userId !== user.value?.id && member.role !== "OWNER"
}

function openMemberDialog(member: ProjectMembership) {
  selectedMember.value = member
  isMemberDialogOpen.value = true
}

async function refreshTokens() {
  if (project.value?.id) {
    await projectStore.getProjectServiceTokens(project.value.id)
  }
}

async function handleRevokeToken(tokenId: string) {
  if (!confirm("Are you sure you want to revoke this service token? Any system using it will lose access immediately.")) {
    return
  }
  await projectStore.revokeProjectServiceToken(project.value?.id ?? "", tokenId)
}

watch(() => project.value?.id, async (id) => {
  if (!id) {
    return
  }
  await projectStore.getProjectServiceTokens(id)
}, { immediate: true })
</script>
