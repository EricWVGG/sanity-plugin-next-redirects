import {defineField, defineType} from 'sanity'
import {regex} from 'sanity-advanced-validators'

/*
NOTE: the fields `url`, `destination`, and `redirectType` are *required*.
`destination` must be populated with the document types that should support redirects.
*/

export const sampleRedirectSchema = defineType({
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
              'Please enter a valid URL path, not including the domain.',
            ),
          ),
    }),
    defineField({
      name: 'destination',
      type: 'reference',
      // IMPORTANT: replace below with your document types
      to: [{type: 'page'}, {type: 'post'}, {type: 'event'}],
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
      destination: 'destination.title',
      redirectType: 'redirectType',
    },
    prepare: ({title, redirectType, destination}) => ({
      title,
      subtitle: `${redirectType.toLowerCase()} -> “${destination}”`,
    }),
  },
})
