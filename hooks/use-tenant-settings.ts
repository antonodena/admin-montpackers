"use client"

import * as React from "react"

import { type Tenant, users } from "@/lib/mock-data"
import {
  getTenantSettingsRecord,
  type TenantNotificationSettings,
  type TenantSettingsRecord,
  type TenantTeamMember,
  type TenantTeamRole,
  TENANT_SETTINGS_UPDATED_EVENT,
  upsertTenantSettingsRecord,
} from "@/lib/tenant-settings-storage"
import {
  DEFAULT_TENANT_BRAND_COLOR,
  fileToDataUrl,
  getTenantBrandColor,
  type TenantAssetTarget,
  validateTenantAssetFile,
  validateTenantName,
} from "@/lib/tenant-form"
import { buildTenantUrl, upsertStoredTenant } from "@/lib/tenant-storage"
import { useResolvedTenant } from "@/hooks/use-resolved-tenant"

type SectionFeedback = {
  error: string | null
  success: string | null
}

type AppearanceDraft = {
  logoDataUrl: string
  logoFileName: string
  logoError: string | null
  faviconDataUrl: string
  faviconFileName: string
  faviconError: string | null
  brandColor: string
}

type AccountDraft = {
  displayName: string
  username: string
  newPassword: string
  confirmPassword: string
}

type InviteDraft = {
  name: string
  email: string
  role: TenantTeamRole
}

function createSectionFeedback(): SectionFeedback {
  return { error: null, success: null }
}

function createAppearanceDraft(tenant: Tenant | null): AppearanceDraft {
  return {
    logoDataUrl: tenant?.logoDataUrl ?? tenant?.imageUrl ?? "",
    logoFileName: "",
    logoError: null,
    faviconDataUrl: tenant?.faviconDataUrl ?? "",
    faviconFileName: "",
    faviconError: null,
    brandColor: getTenantBrandColor(tenant?.brandColor),
  }
}

function createInviteDraft(): InviteDraft {
  return { name: "", email: "", role: "viewer" }
}

function buildSettingsSnapshot(tenant: Tenant | null) {
  if (!tenant) {
    return null
  }

  return getTenantSettingsRecord(
    tenant,
    users.filter((user) => user.tenantSlug === tenant.slug)
  )
}

function buildTeamSignature(team: TenantTeamMember[]) {
  return JSON.stringify(team)
}

function isValidUsername(value: string) {
  return /^[a-z0-9._-]{3,32}$/i.test(value)
}

function isValidInviteEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeTenantMemberList(team: TenantTeamMember[]) {
  const nextTeam = [...team]

  if (!nextTeam.some((member) => member.role === "owner") && nextTeam.length > 0) {
    nextTeam[0] = { ...nextTeam[0], role: "owner" }
  }

  return nextTeam
}

export function useTenantSettings(tenantSlug?: string) {
  const tenant = useResolvedTenant(tenantSlug)
  const [snapshot, setSnapshot] = React.useState<TenantSettingsRecord | null>(() =>
    buildSettingsSnapshot(tenant)
  )

  const [generalDraft, setGeneralDraft] = React.useState<TenantSettingsRecord["general"] | null>(
    () => snapshot?.general ?? null
  )
  const [appearanceDraft, setAppearanceDraft] = React.useState<AppearanceDraft>(() =>
    createAppearanceDraft(tenant)
  )
  const [accountDraft, setAccountDraft] = React.useState<AccountDraft | null>(() =>
    snapshot
      ? {
          displayName: snapshot.account.displayName,
          username: snapshot.account.username,
          newPassword: "",
          confirmPassword: "",
        }
      : null
  )
  const [teamDraft, setTeamDraft] = React.useState<TenantTeamMember[]>(() => snapshot?.team ?? [])
  const [inviteDraft, setInviteDraft] = React.useState<InviteDraft>(createInviteDraft)
  const [notificationsDraft, setNotificationsDraft] =
    React.useState<TenantNotificationSettings | null>(() => snapshot?.notifications ?? null)

  const [generalFeedback, setGeneralFeedback] = React.useState(createSectionFeedback)
  const [appearanceFeedback, setAppearanceFeedback] = React.useState(createSectionFeedback)
  const [accountFeedback, setAccountFeedback] = React.useState(createSectionFeedback)
  const [teamFeedback, setTeamFeedback] = React.useState(createSectionFeedback)
  const [notificationsFeedback, setNotificationsFeedback] = React.useState(createSectionFeedback)

  const [savingSection, setSavingSection] = React.useState<string | null>(null)

  React.useEffect(() => {
    function syncSnapshot() {
      const nextSnapshot = buildSettingsSnapshot(tenant)
      setSnapshot(nextSnapshot)
      setGeneralDraft(nextSnapshot?.general ?? null)
      setAppearanceDraft(createAppearanceDraft(tenant))
      setAccountDraft(
        nextSnapshot
          ? {
              displayName: nextSnapshot.account.displayName,
              username: nextSnapshot.account.username,
              newPassword: "",
              confirmPassword: "",
            }
          : null
      )
      setTeamDraft(nextSnapshot?.team ?? [])
      setInviteDraft(createInviteDraft())
      setNotificationsDraft(nextSnapshot?.notifications ?? null)
    }

    syncSnapshot()
  }, [tenant])

  React.useEffect(() => {
    function syncSnapshot() {
      const nextSnapshot = buildSettingsSnapshot(tenant)
      if (!nextSnapshot) {
        return
      }

      setSnapshot(nextSnapshot)
    }

    window.addEventListener(TENANT_SETTINGS_UPDATED_EVENT, syncSnapshot as EventListener)
    window.addEventListener("storage", syncSnapshot)

    return () => {
      window.removeEventListener(TENANT_SETTINGS_UPDATED_EVENT, syncSnapshot as EventListener)
      window.removeEventListener("storage", syncSnapshot)
    }
  }, [tenant])

  const generalBase = snapshot?.general ?? null
  const appearanceBase = React.useMemo(() => createAppearanceDraft(tenant), [tenant])
  const accountBase = snapshot?.account ?? null
  const teamBase = snapshot?.team ?? []
  const notificationsBase = snapshot?.notifications ?? null

  const generalDirty =
    generalDraft !== null && generalBase !== null && JSON.stringify(generalDraft) !== JSON.stringify(generalBase)
  const appearanceDirty =
    tenant !== null &&
    JSON.stringify({
      logoDataUrl: appearanceDraft.logoDataUrl,
      faviconDataUrl: appearanceDraft.faviconDataUrl,
      brandColor: appearanceDraft.brandColor,
    }) !==
      JSON.stringify({
        logoDataUrl: appearanceBase.logoDataUrl,
        faviconDataUrl: appearanceBase.faviconDataUrl,
        brandColor: appearanceBase.brandColor,
      })
  const accountDirty =
    accountDraft !== null &&
    accountBase !== null &&
    (accountDraft.displayName !== accountBase.displayName ||
      accountDraft.username !== accountBase.username ||
      accountDraft.newPassword.length > 0 ||
      accountDraft.confirmPassword.length > 0)
  const teamDirty = buildTeamSignature(teamDraft) !== buildTeamSignature(teamBase)
  const notificationsDirty =
    notificationsDraft !== null &&
    notificationsBase !== null &&
    JSON.stringify(notificationsDraft) !== JSON.stringify(notificationsBase)

  function updateSnapshot(nextRecord: TenantSettingsRecord) {
    if (!tenant) {
      return
    }

    upsertTenantSettingsRecord(tenant.slug, nextRecord)
    setSnapshot(nextRecord)
  }

  function setSectionSaving(section: string | null) {
    setSavingSection(section)
  }

  async function handleAssetUpload(target: TenantAssetTarget, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    const file = fileList[0]
    const validationError = validateTenantAssetFile(target, file)

    if (validationError) {
      setAppearanceDraft((current) =>
        target === "logo"
          ? { ...current, logoError: validationError }
          : { ...current, faviconError: validationError }
      )
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setAppearanceFeedback(createSectionFeedback())
      setAppearanceDraft((current) =>
        target === "logo"
          ? {
              ...current,
              logoDataUrl: dataUrl,
              logoFileName: file.name,
              logoError: null,
            }
          : {
              ...current,
              faviconDataUrl: dataUrl,
              faviconFileName: file.name,
              faviconError: null,
            }
      )
    } catch {
      setAppearanceDraft((current) =>
        target === "logo"
          ? { ...current, logoError: "No se ha podido cargar el archivo." }
          : { ...current, faviconError: "No se ha podido cargar el archivo." }
      )
    }
  }

  function updateTenantOverride(partial: Partial<Tenant>) {
    if (!tenant) {
      return
    }

    upsertStoredTenant({
      ...tenant,
      siteUrl: buildTenantUrl(tenant.slug),
      ...partial,
    })
  }

  function resetGeneral() {
    setGeneralDraft(generalBase)
    setGeneralFeedback(createSectionFeedback())
  }

  function resetAppearance() {
    setAppearanceDraft(createAppearanceDraft(tenant))
    setAppearanceFeedback(createSectionFeedback())
  }

  function resetAccount() {
    setAccountDraft(
      accountBase
        ? {
            displayName: accountBase.displayName,
            username: accountBase.username,
            newPassword: "",
            confirmPassword: "",
          }
        : null
    )
    setAccountFeedback(createSectionFeedback())
  }

  function resetTeam() {
    setTeamDraft(teamBase)
    setInviteDraft(createInviteDraft())
    setTeamFeedback(createSectionFeedback())
  }

  function resetNotifications() {
    setNotificationsDraft(notificationsBase)
    setNotificationsFeedback(createSectionFeedback())
  }

  function setGeneralField<K extends keyof NonNullable<typeof generalDraft>>(
    field: K,
    value: NonNullable<typeof generalDraft>[K]
  ) {
    setGeneralDraft((current) => (current ? { ...current, [field]: value } : current))
    setGeneralFeedback(createSectionFeedback())
  }

  function setAppearanceField<K extends keyof AppearanceDraft>(field: K, value: AppearanceDraft[K]) {
    setAppearanceDraft((current) => ({ ...current, [field]: value }))
    setAppearanceFeedback(createSectionFeedback())
  }

  function setAccountField<K extends keyof NonNullable<typeof accountDraft>>(
    field: K,
    value: NonNullable<typeof accountDraft>[K]
  ) {
    setAccountDraft((current) => (current ? { ...current, [field]: value } : current))
    setAccountFeedback(createSectionFeedback())
  }

  function setInviteField<K extends keyof InviteDraft>(field: K, value: InviteDraft[K]) {
    setInviteDraft((current) => ({ ...current, [field]: value }))
    setTeamFeedback(createSectionFeedback())
  }

  function toggleNotification(field: keyof TenantNotificationSettings) {
    setNotificationsDraft((current) =>
      current ? { ...current, [field]: !current[field] } : current
    )
    setNotificationsFeedback(createSectionFeedback())
  }

  async function saveGeneral() {
    if (!tenant || !snapshot || !generalDraft) {
      return false
    }

    const nameError = validateTenantName(generalDraft.hotelName)
    if (nameError) {
      setGeneralFeedback({ error: nameError, success: null })
      return false
    }

    setSectionSaving("general")
    const nextGeneral = {
      ...generalDraft,
      hotelName: generalDraft.hotelName.trim(),
      description: generalDraft.description.trim(),
      address: generalDraft.address.trim(),
    }
    const nextRecord = { ...snapshot, general: nextGeneral }
    updateSnapshot(nextRecord)
    updateTenantOverride({ name: nextGeneral.hotelName })
    setGeneralDraft(nextGeneral)
    setGeneralFeedback({ error: null, success: "Cambios guardados correctamente." })
    setSectionSaving(null)
    return true
  }

  async function saveAppearance() {
    if (!tenant) {
      return false
    }

    if (appearanceDraft.logoError || appearanceDraft.faviconError) {
      setAppearanceFeedback({
        error: "Corrige los errores de los archivos antes de guardar.",
        success: null,
      })
      return false
    }

    setSectionSaving("appearance")
    updateTenantOverride({
      imageUrl: appearanceDraft.logoDataUrl || undefined,
      logoDataUrl: appearanceDraft.logoDataUrl || undefined,
      faviconDataUrl: appearanceDraft.faviconDataUrl || undefined,
      brandColor: appearanceDraft.brandColor || DEFAULT_TENANT_BRAND_COLOR,
    })
    setAppearanceDraft((current) => ({
      ...current,
      logoFileName: "",
      faviconFileName: "",
    }))
    setAppearanceFeedback({ error: null, success: "Apariencia guardada correctamente." })
    setSectionSaving(null)
    return true
  }

  async function saveAccount() {
    if (!snapshot || !accountDraft) {
      return false
    }

    if (accountDraft.displayName.trim().length < 2) {
      setAccountFeedback({
        error: "El nombre debe tener al menos 2 caracteres.",
        success: null,
      })
      return false
    }

    if (!isValidUsername(accountDraft.username.trim())) {
      setAccountFeedback({
        error: "El usuario debe tener 3-32 caracteres y solo puede usar letras, números, punto, guion y guion bajo.",
        success: null,
      })
      return false
    }

    if (accountDraft.newPassword.length > 0 && accountDraft.newPassword.length < 8) {
      setAccountFeedback({
        error: "La nueva contraseña debe tener al menos 8 caracteres.",
        success: null,
      })
      return false
    }

    if (accountDraft.newPassword !== accountDraft.confirmPassword) {
      setAccountFeedback({
        error: "La confirmación de contraseña no coincide.",
        success: null,
      })
      return false
    }

    setSectionSaving("account")
    const nextRecord = {
      ...snapshot,
      account: {
        displayName: accountDraft.displayName.trim(),
        username: accountDraft.username.trim(),
        password:
          accountDraft.newPassword.length > 0
            ? accountDraft.newPassword
            : snapshot.account.password,
      },
    }
    updateSnapshot(nextRecord)
    setAccountDraft({
      displayName: nextRecord.account.displayName,
      username: nextRecord.account.username,
      newPassword: "",
      confirmPassword: "",
    })
    setAccountFeedback({ error: null, success: "Perfil guardado correctamente." })
    setSectionSaving(null)
    return true
  }

  function ensureAtLeastOneOwner(team: TenantTeamMember[]) {
    const ownerCount = team.filter((member) => member.role === "owner").length
    return ownerCount > 0
  }

  function saveTeam() {
    if (!snapshot) {
      return false
    }

    const nextTeam = normalizeTenantMemberList(teamDraft)
    if (!ensureAtLeastOneOwner(nextTeam)) {
      setTeamFeedback({
        error: "Debe existir al menos un owner en el equipo.",
        success: null,
      })
      return false
    }

    setSectionSaving("team")
    const nextRecord = { ...snapshot, team: nextTeam }
    updateSnapshot(nextRecord)
    setTeamDraft(nextTeam)
    setInviteDraft(createInviteDraft())
    setTeamFeedback({ error: null, success: "Equipo guardado correctamente." })
    setSectionSaving(null)
    return true
  }

  function saveNotifications() {
    if (!snapshot || !notificationsDraft) {
      return false
    }

    setSectionSaving("notifications")
    const nextRecord = { ...snapshot, notifications: notificationsDraft }
    updateSnapshot(nextRecord)
    setNotificationsFeedback({
      error: null,
      success: "Preferencias guardadas correctamente.",
    })
    setSectionSaving(null)
    return true
  }

  function inviteMember() {
    const nextName = inviteDraft.name.trim()
    const nextEmail = inviteDraft.email.trim().toLowerCase()

    if (nextName.length < 2) {
      setTeamFeedback({ error: "El nombre debe tener al menos 2 caracteres.", success: null })
      return
    }

    if (!isValidInviteEmail(nextEmail)) {
      setTeamFeedback({ error: "Introduce un email válido.", success: null })
      return
    }

    if (teamDraft.some((member) => member.email.toLowerCase() === nextEmail)) {
      setTeamFeedback({
        error: "Ese correo ya forma parte del equipo.",
        success: null,
      })
      return
    }

    setTeamDraft((current) => [
      ...current,
      {
        id: `team_member_${Date.now()}`,
        name: nextName,
        email: nextEmail,
        role: inviteDraft.role,
        status: "pending",
      },
    ])
    setInviteDraft(createInviteDraft())
    setTeamFeedback({
      error: null,
      success: "Miembro añadido al borrador del equipo.",
    })
  }

  function updateTeamMember(memberId: string, updates: Partial<TenantTeamMember>) {
    setTeamDraft((current) => {
      const next = current.map((member) =>
        member.id === memberId ? { ...member, ...updates } : member
      )
      const ownerCount = next.filter((member) => member.role === "owner").length
      if (ownerCount === 0) {
        setTeamFeedback({
          error: "No puedes dejar el equipo sin owner.",
          success: null,
        })
        return current
      }

      setTeamFeedback(createSectionFeedback())
      return next
    })
  }

  function removeTeamMember(memberId: string) {
    setTeamDraft((current) => {
      const target = current.find((member) => member.id === memberId)
      if (!target) {
        return current
      }

      const ownerCount = current.filter((member) => member.role === "owner").length
      if (target.role === "owner" && ownerCount === 1) {
        setTeamFeedback({
          error: "No puedes eliminar al último owner del equipo.",
          success: null,
        })
        return current
      }

      setTeamFeedback(createSectionFeedback())
      return current.filter((member) => member.id !== memberId)
    })
  }

  const domainData = React.useMemo(() => {
    if (!tenant) {
      return null
    }

    const iframeSnippet = `<iframe src="${tenant.siteUrl}" title="${tenant.name}" loading="lazy" style="width:100%;min-height:720px;border:0;"></iframe>`

    return {
      slug: tenant.slug,
      siteUrl: tenant.siteUrl,
      iframeSnippet,
    }
  }, [tenant])

  const accountPreview = React.useMemo(() => {
    if (accountDraft) {
      return {
        displayName: accountDraft.displayName,
        username: accountDraft.username,
      }
    }

    if (accountBase) {
      return {
        displayName: accountBase.displayName,
        username: accountBase.username,
      }
    }

    return null
  }, [accountBase, accountDraft])

  return {
    tenant,
    snapshot,
    savingSection,
    domainData,
    accountPreview,
    general: {
      values: generalDraft,
      baseValues: generalBase,
      dirty: generalDirty,
      feedback: generalFeedback,
      setField: setGeneralField,
      save: saveGeneral,
      reset: resetGeneral,
    },
    appearance: {
      values: appearanceDraft,
      baseValues: appearanceBase,
      dirty: appearanceDirty,
      feedback: appearanceFeedback,
      setField: setAppearanceField,
      handleAssetUpload,
      save: saveAppearance,
      reset: resetAppearance,
    },
    account: {
      values: accountDraft,
      baseValues: accountBase,
      dirty: accountDirty,
      feedback: accountFeedback,
      setField: setAccountField,
      save: saveAccount,
      reset: resetAccount,
    },
    team: {
      values: teamDraft,
      baseValues: teamBase,
      dirty: teamDirty,
      feedback: teamFeedback,
      invite: inviteDraft,
      setInviteField,
      inviteMember,
      updateMember: updateTeamMember,
      removeMember: removeTeamMember,
      save: saveTeam,
      reset: resetTeam,
    },
    notifications: {
      values: notificationsDraft,
      baseValues: notificationsBase,
      dirty: notificationsDirty,
      feedback: notificationsFeedback,
      toggle: toggleNotification,
      save: saveNotifications,
      reset: resetNotifications,
    },
  }
}
