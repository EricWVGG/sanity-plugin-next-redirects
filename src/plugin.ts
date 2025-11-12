import {definePlugin} from 'sanity'
import {PublishAndCreateRedirect} from './'
import type {SanityNextRedirectsOptions} from './types'

export const sanityNextRedirects = definePlugin<SanityNextRedirectsOptions>((config) => {
  return {
    name: 'sanity-plugin-sanity-next-redirects',

    document: {
      actions: (previousInputs, context) => [
        ...previousInputs.map((originalAction) =>
          originalAction.action === 'publish'
            ? PublishAndCreateRedirect(context, originalAction, config)
            : originalAction,
        ),
      ],
    },
  }
})
