import {definePlugin} from 'sanity'
import {PublishAndCreateRedirect} from './PublishAndCreateRedirect'
import type {SanityNextRedirectsOptions} from './types'

export const sanityPluginNextRedirects = definePlugin<SanityNextRedirectsOptions>((config) => {
  return {
    name: 'sanity-plugin-next-redirects',

    document: {
      actions: (previousInputs, context) => [
        ...previousInputs.map((originalAction) =>
          originalAction.action === 'publish'
            ? PublishAndCreateRedirect(context, originalAction, config)
            : originalAction
        ),
      ],
    },
  }
})

export {PublishAndCreateRedirect} from './PublishAndCreateRedirect'
export {redirectQuery} from './redirectQuery'
export {DefaultDialogBox} from './DefaultDialogBox'
export {createRedirectSchema} from './redirectSchema'
export {sampleRedirectSchema} from './sampleRedirectSchema'
export {generateRedirects} from './generateRedirects'
export {type PathResolver, type PathResolvers} from './types'
