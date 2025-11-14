import {defineField, defineType} from 'sanity'
import {regex} from 'sanity-advanced-validators'

export const createRedirectSchema = (types: Array<string>, destinationTitleKey: string = 'title') =>
  defineType({
    name: 'redirect',
    title: 'Redirects',
    type: 'document',

    fields: [
      defineField({
        name: 'url',
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
        destination: `destination.${destinationTitleKey}`,
      },
      prepare: ({title, redirectType, destination}) => ({
        title,
        subtitle: `${redirectType.toLowerCase()} -> “${destination}”`,
      }),
    },
  })
