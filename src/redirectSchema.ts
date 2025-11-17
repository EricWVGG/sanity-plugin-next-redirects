import {defineField, defineType} from 'sanity'
import type {SchemaTypeDefinition, ConfigContext} from 'sanity'
import {regex} from 'sanity-advanced-validators'
import type {SanityNextRedirectsOptions} from './types'

export const withRedirectSchema =
  ({documentTitleKey, pathResolvers, customRedirectSchema}: SanityNextRedirectsOptions) =>
  (
    schema: Array<SchemaTypeDefinition>,
    _: Omit<ConfigContext, 'schema' | 'i18n' | 'currentUser' | 'getClient' | 'client'>
  ) => {
    if (customRedirectSchema) {
      return [...schema, customRedirectSchema]
    }
    const docTypes = Object.keys(pathResolvers)
    const redirectSchema = createRedirectSchema(docTypes, documentTitleKey)
    return [...schema, redirectSchema]
  }

// todo: it would be nice if we could pick up `sampleRedirectSchema.ts` and insert the necessary values.

export const createRedirectSchema = (types: Array<string>, documentTitleKey: string = 'title') =>
  defineType({
    name: 'redirect',
    title: 'Redirects',
    type: 'document',

    fields: [
      defineField({
        name: 'url',
        title: 'redirect from this URL:',
        description: 'relative url — ex. /events/some-event',
        type: 'string',
        validation: (rule) =>
          rule
            .required()
            .custom(
              regex(
                /^\/[^?#]*(\?[^#]*)?(#.*)?$/,
                'Please enter a valid URL path, not including the domain.'
              )
            ),
      }),
      defineField({
        name: 'destination',
        title: 'to destination:',
        type: 'reference',
        to: types.map((type) => ({type})),
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'redirectType',
        type: 'string',
        options: {
          list: ['PERMANENT', 'TEMPORARY'],
          layout: 'radio',
        },
        validation: (rule) => rule.required(),
        initialValue: 'PERMANENT',
      }),
    ],

    preview: {
      select: {
        title: 'url',
        redirectType: 'redirectType',
        destination: `destination.${documentTitleKey}`,
      },
      prepare: ({title, redirectType, destination}) => ({
        title,
        subtitle: `${redirectType.toLowerCase()} -> “${destination}”`,
      }),
    },
  })
