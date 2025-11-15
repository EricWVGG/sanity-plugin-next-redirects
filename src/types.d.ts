import type {SchemaTypeDefinition} from 'sanity'

export interface SanityNextRedirectsOptions {
  pathResolvers: PathResolvers
  apiVersion?: string
  toastMessage: string
  toastDuration?: number
  dialogBoxComponent?: (props: DialogBoxProps) => React.ReactElement
  documentTitleKey?: string
  hideRedirectType?: boolean
  customRedirectSchema?: SchemaTypeDefinition
  redirectSchemaName?: string
}

export type RedirecTypeEnum = 'PERMANENT' | 'TEMPORARY'

type DialogBoxProps = {
  redirectPath: string
  destinationPath: string
  hideRedirectType: boolean
  redirectType: RedirecTypeEnum
  setRedirectType: (t: RedirectTypeEnum) => void
  timeSinceCreated?: number | null
  type?: string
  id?: string
  closeDialogBox: (b: SetStateAction<boolean>) => void
  createRedirectAndPublish: () => void
  publishNow: () => void
}

export type PathResolver = (doc: any) => string

export type PathResolvers = Record<string, PathResolver>
