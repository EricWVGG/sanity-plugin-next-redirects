import {defineQuery} from 'next-sanity'

/**
 * A groq query that gathers existing redirects.
 * @public
 */

export const redirectQuery = defineQuery(`
  *[_type == 'redirect']{
    ...,
    destination -> {
      _type,
      slug
    }
  }
`)
