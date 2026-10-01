export type FamilyOption = {
  uuid: string
  name: string
}

export type InsectOption = {
  uuid: string
  name: string
  familyUuid: string | null
}

export type TargetPestsPluginKind = 'insect' | 'family'

export type TargetPestsPluginItem = {
  kind: TargetPestsPluginKind
  uuid: string
}

export type TargetPestsPluginValue = {
  items: TargetPestsPluginItem[]
}

export const EMPTY_VALUE: TargetPestsPluginValue = {
  items: [],
}
