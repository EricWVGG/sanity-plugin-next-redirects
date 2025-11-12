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

export interface SanityNextRedirectsOptions {
  resolvers: Record<string, (doc: any) => string | null>
  apiVersion?: string
  toastMessage?: {
    title: string
    duration?: number
  }
  DialogBox?: (props: DialogBoxProps) => React.ReactElement
  sanityRedirectDocumentName?: string
}
