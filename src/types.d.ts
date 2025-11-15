export interface SanityNextRedirectsOptions {
  pathResolvers: PathResolvers
  apiVersion?: string
  toastMessage?: {
    title: string
    duration?: number
  }
  DialogBox?: (props: DialogBoxProps) => React.ReactElement
  redirectDocumentName?: string
  documentTitleKey?: string
}

export type RedirecTypeEnum = 'PERMANENT' | 'TEMPORARY'

type DialogBoxProps = {
  redirectPath: string
  destinationPath: string
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
