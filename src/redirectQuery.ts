import {defineQuery} from 'next-sanity'

export const redirectQuery = defineQuery(`
  *[_type == 'redirect']{
    ...,
    destination -> {
      _type,
      eventDate,
      metadata
    }
  }
`)
