export type InsectOption = {
  uuid: string
  name: string
}

export type TargetPestsPluginItem = {
  uuid: string
  text?: string
}

export type TargetPestsPluginValue = {
  items: TargetPestsPluginItem[]
}

export const EMPTY_VALUE: TargetPestsPluginValue = {
  items: [],
}
