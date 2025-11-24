import {useState, useEffect, useMemo} from 'react'
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
import {PublishIcon} from '@sanity/icons'
import {DefaultDialogBox} from './DefaultDialogBox'

export const PublishAndCreateRedirect =
  (context: DocumentActionsContext, config: SanityNextRedirectsOptions) =>
  (props: DocumentActionProps): DocumentActionComponent | DocumentActionDescription => {
    const {
      toastMessage,
      toastDuration,
      pathResolvers,
      apiVersion,
      hideRedirectType,
      redirectSchemaName,
      debug,
      suppressDialog,
    } = config

    const DialogBox = config.dialogBoxComponent ?? DefaultDialogBox

    const {onComplete} = props

    const {id, type} = props
    const {publish} = useDocumentOperation(id, type)
    const [isPublishing, setIsPublishing] = useState(false)
    const toast = useToast()
    const [isDialogOpen, setDialogOpen] = useState(false)

    const [redirectPath, setRedirectPath] = useState<string | null>(null)
    // this is the path that will go in the new Redirect entry
    const [destinationPath, setDestinationPath] = useState<string | null>(null)
    // this is just UI so the user knows what's going on
    const [destination, setDestination] = useState<SanityDocument>()
    // this is the destination for the new redirect
    const [redirectType, setRedirectType] = useState<RedirecTypeEnum>('PERMANENT')

    const client = useMemo(
      () =>
        context.getClient({
          apiVersion: apiVersion!,
        }),
      [context]
    )

    useEffect(() => {
      // if the isPublishing state was set to true and the draft has changed
      // to become `null` the document has been published
      if (isPublishing && !props.draft) {
        setIsPublishing(false)
      }
    }, [props.draft])

    const debugMessage = (message: string) => {
      if (debug) {
        alert(message)
      }
    }

    const checkForSlugChange = (
      draft?: SanityDocument | null,
      published?: SanityDocument | null
    ) => {
      if (!draft) {
        debugMessage('Error: Publishing without a draft. This should be unreachable.')
        publishNow()
        return
      }
      if (!published) {
        debugMessage('first time publishing this doc; proceed')
        publishNow()
        return
      }
      const resolvePath = pathResolvers[draft._type]
      const oldPath = resolvePath(published)
      const newPath = resolvePath(draft)
      if (oldPath === newPath) {
        debugMessage('no slug change; proceed')
        publishNow()
        return
      }
      if (suppressDialog) {
        debugMessage('slug change; proceed without modal check')
        void createRedirectAndPublish(draft, oldPath)
      } else {
        debugMessage('slug change; display proceed options')
        setRedirectPath(oldPath)
        setDestinationPath(newPath)
        setDestination(draft)
        setDialogOpen(true)
      }
    }

    const createRedirectAndPublish = async (destination: SanityDocument, redirectPath: string) => {
      if (!destination || !redirectPath) {
        debugMessage('ERROR (should be unreachable')
        return
      }
      debugMessage('creating redirect')
      await client.create({
        _type: redirectSchemaName!,
        destination: {
          _ref: id,
          _type: destination._type,
        },
        redirectType,
        url: redirectPath,
      })
      if (!!toastMessage) {
        toast.push({
          title: toastMessage,
          duration: toastDuration,
        })
      }
      publishNow()
    }

    const publishNow = () => {
      debugMessage('publishing')
      setDialogOpen(false)
      setIsPublishing(true)
      // Perform the publish
      publish.execute()
      debugMessage('publish executed')
      // Signal that the action is completed
      onComplete()
      debugMessage('publish complete')
      setRedirectPath(null)
      setDestinationPath(null)
    }

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
            <p>Error: this should be unreachable!</p>
          ) : (
            <DialogBox
              timeSinceCreated={timeSinceCreated}
              redirectPath={redirectPath}
              destinationPath={destinationPath}
              closeDialogBox={() => setDialogOpen(false)}
              publishNow={publishNow}
              createRedirectAndPublish={() => createRedirectAndPublish(destination!, redirectPath)}
              redirectType={redirectType}
              setRedirectType={setRedirectType}
              hideRedirectType={hideRedirectType!}
            />
          ),
        },
    }
  }
