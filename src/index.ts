import {definePlugin} from 'sanity'
import {PublishAndCreateRedirect} from './PublishAndCreateRedirect'
import {withRedirectSchema} from './redirectSchema'
import type {SanityNextRedirectsOptions} from './types'

export const sanityPluginNextRedirects = definePlugin<SanityNextRedirectsOptions>((config) => {
  const componentConfigWithDefaults = ({
    pathResolvers,
    apiVersion,
    toastMessage,
    toastDuration,
    dialogBoxComponent,
    documentTitleKey,
    hideRedirectType,
    customRedirectSchema,
    suppressDialog,
    debug,
  }: SanityNextRedirectsOptions): SanityNextRedirectsOptions => ({
    pathResolvers,
    apiVersion: apiVersion ?? '2025-08-25',
    toastMessage,
    toastDuration: toastDuration ?? 10000,
    dialogBoxComponent,
    documentTitleKey,
    hideRedirectType: hideRedirectType ?? false,
    redirectSchemaName: customRedirectSchema?.name ?? 'redirect',
    suppressDialog: suppressDialog ?? false,
    debug,
  })

  return {
    name: 'sanity-plugin-next-redirects',
    schema: {
      types: withRedirectSchema(config),
    },
    document: {
      actions: (inputs, context) =>
        inputs.map((input) =>
          input.action === 'publish' &&
          Object.keys(config.pathResolvers).includes(context.schemaType)
            ? PublishAndCreateRedirect(context, componentConfigWithDefaults(config))
            : input
        ),
    },
  }
})

export {PublishAndCreateRedirect} from './PublishAndCreateRedirect'
export {redirectQuery} from './redirectQuery'
export {DefaultDialogBox} from './DefaultDialogBox'
export {createRedirectSchema, withRedirectSchema} from './redirectSchema'
export {sampleRedirectSchema} from './sampleRedirectSchema'
export {generateRedirects} from './generateRedirects'
export {type PathResolver, type PathResolvers} from './types'
export {IconTemporary, IconPermanent} from './Icons'
