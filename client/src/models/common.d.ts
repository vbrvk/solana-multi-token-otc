export type Nullable<T> = T | null
export type Empty<T> = T | Nullable<T> | undefined | void
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type IObject = Record<string, unknown>

export interface ISomeData {
  [key: string]: unknown
}
