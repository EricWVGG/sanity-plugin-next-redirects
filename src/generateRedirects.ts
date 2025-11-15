import {SanityClient} from 'next-sanity'
import type {PathResolvers} from './types'
import {redirectQuery as defaultRedirectQuery} from './redirectQuery'

type Redirect = {source: string; destination: string; permanent: boolean}

export const generateRedirects = async (
  client: SanityClient,
  pathResolvers: PathResolvers,
  customRedirectQuery?: string
): Promise<Array<Redirect>> => {
  const data = await client.fetch(customRedirectQuery ?? defaultRedirectQuery)
  return data.reduce((acc: Array<Redirect>, doc: any) => {
    const destination = pathResolvers.hasOwnProperty(doc.destination._type)
      ? pathResolvers[doc.destination._type](doc)
      : null
    return [
      ...acc,
      {
        source: doc.url,
        destination,
        permanent: doc.redirectType === 'PERMANENT',
      },
    ]
  }, [])
}
