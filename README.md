# todo

- usage without redirects dialog
- describe installation with custom redirect table
- combine pathResolver and titleResolver? would let us ditch `documentTitleKey `
- instructions to hide Redirects table from structureTOol
- more "document is X old" options

# sanity-plugin-next-redirects

If you’ve ever dealt with an “SEO guy”, you know they are _very_ interested in your redirects table. And if you are using NextJS, this means it’s in your codebase, so it’s hands-off to them.

This plugin…

- creates a new `Redirects` document type in Sanity
- which your SEO guy can “safely” use to create redirects
- and when your users change slugs on documents, they’ll be given a popup asking if a redirect should be automatically generated
- and incidentally produces some cool helpers for your `sitemap.xml` and `rss.xml` feed too

* A site can, of course, get donked up by careless redirects. Make sure you trust anyone who has access to this.

## Installation

### Package and dependencies

`npm add sanity-plugin-next-redirects @sanity/ui @sanity/icons`

### Create path resolvers.

For each document type, you’ll need a function that resolves the document type to where it renders in your NextJS app.

For example, you might have…

- “page” documents handled by `/app/[slug]`, for page like `/about` or `/contact`
- "event" documents handled by `/app/event/[yyyy]/[mm]/[dd]/[slug]`, for listings like `/event/2025/11/28/black-friday-sale-on-labubus`
- blog "post" documents handled by `/app/post/[slug]`, for posts like `/post/i-bought-my-daughter-a-labubu`

Note: if you have already have functions that map document types to paths for your sitemap or other purposes, re-use ’em! If not, see `sitemap` section below.

```typescript
// pathResolvers.ts
import {PathResolvers} from 'sanity-plugin-next-redirects'

export const resolvePost = (doc: Sanity.PostQueryResult | Sanity.Post) =>
  `/post/${doc.slug.current}`
export const resolvePage = (doc: Sanity.PageQueryResult | Sanity.Page) =>
  ['index', 'home'].includes(doc.slug.current) ? '/' : `/${doc.slug.current}`
export const resolveEvent = (doc: Sanity.EventQueryResult | Sanity.Event) => {
  var dateArray = doc.publishDate.split('-') || ['1969', '01', '01']
  var year = dateArray[0]
  var month = dateArray[1]
  var day = dateArray[2]
  return `/event/${year}/${month}/${day}/${doc.slug?.current}`
}

const pathResolvers: PathResolvers = {
  // each key must be the exact name of a document type in your schema
  page: resolvePage,
  post: resolvePost,
  event: resolveEvent,
}

export default pathResolvers
```

### Add the plugin and pathResolvers to Sanity config.

```typescript
// sanity.config.ts
import {sanityNextRedirects} from 'sanity-plugin-next-redirects'
import pathResolvers from 'path/to/pathResolvers'

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      pathResolvers,
    }),
  ],
})
```

### And finally, add dynamic redirects to NextJS config.

```typescript
// next.config.ts
import {client} from './src/sanity/lib/client'
import {generateRedirects} from 'sanity-plugin-next-redirects'
import pathResolvers from './src/sanity/lib/pathResolvers'

export default {
  // …
  async redirects() {
    const dynamicRedirects = await generateRedirects(client, pathResolvers)
    return [
      // hard-coded redirects here…
      ...dynamicRedirects,
      // … or here
    ]
  },
}
```

## Usage

### Redirects table

Let’s say this is a rebuild of an old website. Previously you might redirect a page like `/about-us` to `/about` in your `next.config.ts` file:

```typescript
// next.config.ts

const nextConfig = {
  async headers() {
    return [
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
    ]
  },
}
```

Now your SEO guy can manage these in Sanity. It's as easy…

1. create a new redirect
2. give it the URL `/about-us`
3. pick the `About` document from Sanity

If `About`’s slug ever changes, the redirect will keep up dynamically — because it points to the document, not the document slug.

### Automatically add redirects for changed slugs

The real power of this comes with edits to existing pages. Let’s say one of your writers published an article at `/post/labubus-ate-my-daughter`, and later the path gets changed to `/post/rescuing-my-daughter-from-the-cult-of-labubu`. (That’s a real example, by the way; [_The New York Times_ does this every day.](https://x.com/nyt_diff/status/1982455495848833122))

When the editor publishes the change, a dialog box will pop up asking if they’d like to automatically create a redirect from the old URL to the new one. It includes a note on how old the document is — if it’s less than X hours old and you have a low-traffic site, you might want to skip the redirect, since it probably isn’t indexed by Google yet and it’s nice to keep the redirect table clean.

But if you’re running a high-traffic site, that’s already gathering links on X the Everything App™ and is aggressively indexed by search engines, then getting an instant redirect for a slug change is a pretty big deal!

And (your SEO guy will love this), the redirects are dynamic — they point to the document, not the old slug. If an article changes from `labubus-ate-my-daughter` to `i-fed-my-daughter-to-labubus` to `i-am-now-a-labubu`, each redirect will point directly to the article’s _current slug_, not hop up the history from one change to the next.

## Bonus — lets DRY out that sitemap

If you were smart about your `sitemap.ts` file, you might have re-used resolver functions you already wrote. If not, let’s recycle the ones you just built.

Also: you could add `defineField({ name: 'priority', type: 'number' }) to your document schemas, if you'd like to manage that in Sanity as well.

```typescript
// src/app/sitemap.ts
import {pageIndexQuery, postIndexQuery, eventIndexQuery} from 'path/to/sanity/queries'
import {pathResolvers} from 'path/to/pathResolvers.ts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pagesData = await client.fetch(pageIndexQuery)
  const pages = pagesData.map((doc) => ({
    url: pathResolvers['page'](doc),
    lastModified: doc._updatedAt,
    priority: doc.priority,
  }))

  const postsData = await client.fetch(postIndexQuery)
  const posts = postsData.map((doc) => ({
    url: pathResolvers['post'](doc),
    lastModified: doc._updatedAt,
    priority: doc.priority,
  }))

  const eventsData = await client.fetch<Sanity.EventIndexQueryResult>(eventIndexQuery)
  const events = eventsData.posts.map((doc) => {
    return {
      url: pathResolvers['event'](doc),
      lastModified: doc._updatedAt,
      priority: doc.priority,
    }
  })

  return [...pages, ...posts, ...events]
}
```

These could be used for an RSS feed too!

## Options and Customization

### Document titles

If your schema documents use a field other than `title` to denote their titles (like `name`), feed that key to the `redirect` document schema.

```typescript
// schema.ts
import {pageSchema, postSchema, eventSchema} from 'path/to/schema/files'
import {createRedirectSchema} from 'sanity-next-redirects'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    pageSchema,
    postSchema,
    eventSchema,
    createRedirectSchema(['page', 'post', 'event'], 'name'),
    // … you can use nested objects, too
    createRedirectSchema(['page', 'post', 'event'], 'metadata.name'),
  ],
}
```

### Custom Redirect schema

If you need more control over the schema design, copy `sampleRedirectSchema.ts` into your own schema folder, edit it accordingly, and include that in the options.

You can add whatever additional fields, customize descriptions, and present instructions however you like, but the `url`, `destination`, and `redirectType` fields are required by this plugin’s tooling.

If you change the _name_ of the table (from `redirect` to `redirects` or `httpRedirects` or whatever), you’ll need to provide that as well.

```typescript
// sanity.config.ts
import {customRedirectSchema} from 'path/to/schema/files'

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      pathResolvers,
      customRedirectSchema,
      redirectDocumentName: 'redirects',
    }),
  ],
})
```

Use this same method if you’re using different fields like `page.name`, `post.title`, and `event.eventName` across your various documents.

```typescript
// your copy of sampleRedirectSchema.ts

export const customRedirectSchema = defineType({
  // …
  fields: [
    /…
    defineField({
      name: 'destination',
      type: 'reference',
      // IMPORTANT: REPLACE WITH YOUR SCHEMA DOCUMENT TYPES
      to: [{type: 'page'}, {type: 'post'}, {type: 'event'}],
      // ^ THERE
      validation: (rule) => rule.required(),
    }),
    // …
  ],
  preview: {
    select: {
      title: 'url',
      redirectType: 'redirectType',
      // SELECT VARIOUS DOCUMENT TITLES HERE
      pageTitle: `destination.name`,
      posTitle: `destination.title`,
      eventTitle: `destination.eventName`,
      // ^ THERE
      slug: 'slug.current',
    },
    prepare: ({title, redirectType, pageTitle, posTitle, eventTitle, slug}) => {
      const destination = pageTitle ?? posTitle ?? eventTitle ?? slug
      return {
        title,
        subtitle: `${redirectType.toLowerCase()} -> “${destination}”`,
      }
    },
  },
})
```

### Sanity API version

The popup uses the Sanity Client to create the automatic redirects. If you want to use a specific Sanity API version, feed it here.

```typescript
// sanity.config.ts

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      pathResolvers,
      apiVersion: '2025-11-11',
      // or…
      apiVersion: process.env.SANITY_API_VERSION,
    }),
  ],
})
```

### Custom Toast Message

You can pop up a "toast" message when a redirect is made. I like to remind users that a redirect won’t be active until the next site deployment, for example.

```typescript
// sanity.config.ts

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      pathResolvers,
      toastMessage: {
        title: 'Your redirect won’t go live until the site is deployed.',
        duration: 10000,
      },
    }),
  ],
})
```

### Custom Dialog Box

You can replace the popup dialog box with your own React component and custom verbiage and options.

Make a copy of `DefaultDialogBox.tsx` from this repo, call it `CustomRedirectDialogBox.tsx`, rewrite however you like, and feed it to the options.

```
// sanity.config.ts
import {CustomRedirectDialog} from 'path/to/component'

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      pathResolvers,
      dialogBoxComponent: CustomRedirectDialog,
    }),
  ],
})
```

##

This is a relatively young plugin, and I've only used it with a couple projects. If you have any issues or ideas, please leave a note in the Github Issues.

## Future improvements

I think the "this document is X old" needs to be a lot smarter, and have a configurable time limit option.
