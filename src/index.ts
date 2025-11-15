import {definePlugin} from 'sanity'
import {PublishAndCreateRedirect} from './PublishAndCreateRedirect'
import {withRedirectSchema} from './redirectSchema'
import type {SanityNextRedirectsOptions} from './types'
import {DefaultDialogBox} from './DefaultDialogBox'

export const DEFAULT_TOAST_DURATION = 10000

export const DEFAULTS: Partial<SanityNextRedirectsOptions> = {
  redirectSchemaName: 'redirect',
  dialogBoxComponent: DefaultDialogBox,
  hideRedirectType: false,
}

export const sanityPluginNextRedirects = definePlugin<SanityNextRedirectsOptions>((config) => {
  const componentConfig = ({
    pathResolvers,
    apiVersion,
    toastMessage,
    dialogBoxComponent,
    documentTitleKey,
    hideRedirectType,
    customRedirectSchema,
  }: SanityNextRedirectsOptions): SanityNextRedirectsOptions => ({
    pathResolvers,
    apiVersion,
    toastMessage,
    dialogBoxComponent,
    documentTitleKey,
    hideRedirectType,
    redirectSchemaName: !!customRedirectSchema
      ? customRedirectSchema.name
      : DEFAULTS.redirectSchemaName,
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
            ? PublishAndCreateRedirect(context, componentConfig(config))
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
