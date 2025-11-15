import {useState, useEffect, useCallback} from 'react'
import {
  useDocumentOperation,
  type DocumentActionDescription,
  type DocumentActionProps,
  type DocumentActionsContext,
  type SanityDocument,
  type DocumentActionComponent,
} from 'sanity'
import {useToast} from '@sanity/ui'
import type {SanityNextRedirectsOptions, RedirecTypeEnum} from './types'
import {DefaultDialogBox} from './DefaultDialogBox'
import {PublishIcon} from '@sanity/icons'

const DEFAULTS: Partial<SanityNextRedirectsOptions> = {
  redirectDocumentName: 'redirect',
  dialogBoxComponent: DefaultDialogBox,
  hideRedirectType: false,
}

const DEFAULT_TOAST_DURATION = 10000

export const PublishAndCreateRedirect =
  (context: DocumentActionsContext, config: SanityNextRedirectsOptions) =>
  (props: DocumentActionProps): DocumentActionComponent | DocumentActionDescription => {
    const {id, type} = props
    const {publish} = useDocumentOperation(id, type)
    const [isPublishing, setIsPublishing] = useState(false)
    const toast = useToast()
    const [isDialogOpen, setDialogOpen] = useState(false)

    const {
      toastMessage,
      pathResolvers,
      apiVersion,
      redirectDocumentName,
      hideRedirectType,
      dialogBoxComponent: DialogBox,
    } = {
      ...DEFAULTS,
      ...config,
    }

    const [redirectPath, setRedirectPath] = useState<string | null>(null)
    // this is the path that will go in the new Redirect entry
    const [destinationPath, setDestinationPath] = useState<string | null>(null)
    // this is just UI so the user knows what's going on
    const [destination, setDestination] = useState<SanityDocument>()
    // this is the destination for the new redirect
    const [redirectType, setRedirectType] = useState<RedirecTypeEnum>('PERMANENT')

    useEffect(() => {
      // if the isPublishing state was set to true and the draft has changed
      // to become `null` the document has been published
      if (isPublishing && !props.draft) {
        setIsPublishing(false)
      }
    }, [props.draft])

    const checkForSlugChange = useCallback(
      (draft?: SanityDocument | null, published?: SanityDocument | null) => {
        if (!draft) {
          // alert('This should be unreachable.')
          publishNow()
          return
        }
        if (!published) {
          // alert('first time publishing this doc; proceed')
          publishNow()
          return
        }
        const resolvePath = pathResolvers[draft._type]
        const oldPath = resolvePath(published)
        const newPath = resolvePath(draft)
        if (oldPath === newPath) {
          publishNow()
        } else {
          setRedirectPath(oldPath)
          setDestinationPath(newPath)
          setDestination(draft)
          setDialogOpen(true)
        }
      },
      []
    )

    const createRedirectAndPublish = useCallback(async () => {
      if (!destination || !redirectPath) {
        alert('ERROR (should be unreachable')
        return
      }
      const client = context.getClient({
        apiVersion: apiVersion!,
      })
      if (!client) {
        throw new Error('client not found')
      }
      await client.create({
        _type: redirectDocumentName!,
        destination: {
          _ref: id,
          _type: destination._type,
        },
        redirectType,
        url: redirectPath,
      })
      if (!!toastMessage) {
        toast.push({
          duration: DEFAULT_TOAST_DURATION,
          ...toastMessage,
        })
      }
      publishNow()
    }, [destination, redirectPath, redirectType, redirectDocumentName])

    const publishNow = useCallback(() => {
      setDialogOpen(false)
      setIsPublishing(true)
      // Perform the publish
      publish.execute()
      // Signal that the action is completed
      props.onComplete()
      setRedirectPath(null)
      setDestinationPath(null)
    }, [])

    const dateOfDocument = props.published?._createdAt
      ? new Date(props.published?._createdAt)
      : undefined

    let timeSinceCreated: number | null = null
    if (dateOfDocument) {
      timeSinceCreated = new Date().getTime() - dateOfDocument.getTime()
    }

    return {
      label: isPublishing ? 'Publishing…' : 'Publish',
      icon: PublishIcon,
      disabled: !props.draft,
      onHandle: () => checkForSlugChange(props.draft, props.published),
      dialog: isDialogOpen &&
        !!redirectPath &&
        !!destinationPath && {
          type: 'dialog',
          onClose: () => setDialogOpen(false),
          header: 'Create a redirect?',
          content: !DialogBox ? (
            <p>This should be unreachable.</p>
          ) : (
            <DialogBox
              timeSinceCreated={timeSinceCreated}
              redirectPath={redirectPath}
              destinationPath={destinationPath}
              closeDialogBox={() => setDialogOpen(false)}
              publishNow={publishNow}
              createRedirectAndPublish={createRedirectAndPublish}
              redirectType={redirectType}
              setRedirectType={setRedirectType}
              hideRedirectType={hideRedirectType!}
            />
          ),
        },
    }
  }
