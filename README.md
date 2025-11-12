# sanity-plugin-sanity-next-redirects

If you’ve ever dealt with an “SEO guy”, you know they are _very_ interested in your redirects table. And if you are using NextJS, this means it’s hard-coded, so hands-off to them.

This plugin…

- creates a new `Redirects` document type in Sanity
- which your SEO guy can safely\* use to create redirects
- and when your users change slugs on documents, they'll be given a popup asking if a redirect should be _automatically generated_
- and some potentially cool helpers for your `sitemap.xml` and `rss.xml` feed too!

Throughout this file, we’ll be using the example of a schema that consists of:

- a `page` schema, representing pages like `/home`, `/about`, and `/contact`. All of these pages are managed by `/src/app/[slug]/route.tsx` in NextJS.
- a `post` schema, representing pages like `/post/some-blog-topic`. They’re in `/src/app/post/[slug]/route.tsx`.
- an `event` schema, representing pages like `/event/2025/11/11/sanity-plugin-next-redirects-debut`. All of these pages are managed by `/src/app/event/[yyyy]/[mm]/[dd]/[slug]/route.tsx`.

* I feel compelled to note that a site can very easily have its SEO royally donked up by careless redirects. Make sure you trust anyone who has access to this.

## Installation

### Add Redirects document type to your schema.

You will need to add a document type to track your individual redirects to your schema.

This plugin includes a ready-to-use redirect schema generator. Just feed it the names of the documents you’d like this cover to track, and it will feed a new schema definition into Sanity.

```typescript
// schema.ts
import {type SchemaTypeDefinition} from 'sanity'
import {createRedirectSchema} from 'sanity-plugin-sanity-next-redirects'
import {pageSchema, postSchema, eventSchema} from 'path/to/schemas'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [pageSchema, postSchema, eventSchema, createRedirectSchema(['page', 'post', 'event'])],
}
```

If you need more control over the schema design, just copy `sampleRedirectSchema.ts` into your own schema folder, edit it accordingly, and insert that instead. Also see [Custom document titles]() below if your schema needs additional customization.

```typescript
import {type SchemaTypeDefinition} from 'sanity'
import {pageSchema, postSchema, eventSchema, redirectSchema} from 'path/to/schemas'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [pageSchema, postSchema, eventSchema, redirectSchema],
}
```

### Create resolvers.

For each document type, you'll need a function that resolves the document type to where it renders in your NextJS app.

For example, you might have a path of `/app/[slug]` for “page” documents like `/about`, and `/app/post/[slug]` for blog posts. Or for an extreme example, `/app/event/[yyyy]/[mm]/[dd]/[slug]` for events that include a date in the path.

(Note: if you have already have functions that map document types to paths for your sitemap or other purposes, re-use ’em! If not, see `sitemap` section below.)

```typescript
// resolvers.ts

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
```

### Add the plugin and resolvers to Sanity config

```typescript
// sanity.config.ts
import {sanityNextRedirects} from 'sanity-plugin-sanity-next-redirects'
import {resolvePage, resolvePost, resolveEvent} from 'path/to/resolvers.ts'

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      resolvers: {
        // each key must be the exact name of a document type in your schema
        page: resolvePage,
        post: resolvePost,
        event: resolveEvent,
      },
    }),
  ],
})
```

### And finally, add dynamic redirects to NextJS config

```typescript
// next.config.ts
import {resolvePage, resolvePost, resolveEvent} from 'path/to/resolvers'
import {client} from 'path/to/sanity/client'

const nextConfig = {
  // …
  async redirects() {
    const data = await client.fetch(redirectQuery)

    const dynamicRedirects = data.map((doc) => {
      let destination: string = ''
      switch (doc.destination._type) {
        case 'page':
          destination = resolvePage(doc)
          break
        case 'post':
          destination = resolvePost(doc)
          break
        case 'event':
          destination = resolveEvent(doc)
          break
      }
      return {
        source: doc.url,
        destination,
        permanent: doc.redirectType === 'PERMANENT',
      }
    })

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

Now your SEO guy can manage these in Sanity. It's as easy as creating a path like `/about-us`, then picking the `About` document from Sanity. If `About`’s slug ever changes, the redirect will keep up dynamically, because it points at the document, not the document slug.

### Updating pages

The real power of this comes with edits to exist pages. Let’s say one of your writers published an article at `/post/labubus-ate-my-daughter`, and later the path gets changed to `/post/rescuing-my-daughter-from-the-cult-of-labubu`. (That’s a real example, by the way; [_The New York Times_ does this every day.](https://x.com/nyt_diff/status/1982455495848833122))

When the editor publishes the change, a dialog box will pop up asking if they’d like to automatically create a redirect from the old URL to the new one. It includes a note on how old the document is — if it’s less than X hours old and you have a low-traffic site, you might want to skip the redirect, since it probably isn’t indexed by Google yet and it’s nice to keep the redirect table clean.

But if you’re running a high-traffic site, that’s already gathering links on X the Everything App™ and is aggressively indexed by search engines, then getting an instant redirect for a slug change is a pretty big deal!

And (your SEO guy will love this), the redirects are dynamic — they point to the document, not the old slug. If an article changes from `labubus-ate-my-daughter` to `rescuing-my-daughter-from-labubus` to `i-fed-my-daughter-to-labubus` to `i-replaced-my-family-with-labubus`, each redirect will point to the article’s _latest, current slug_, not hop down the history from one change to the next.

## Bonus — lets DRY your sitemap!

If you were smart about your `sitemap.ts` file, you might _already have_ resolver functions. If not, let’s recycle the ones you just built:

```typescript
// src/app/sitemap.ts
import {resolvePage, resolvePost, resolveEvent} from 'path/to/resolvers.ts'
import {pageIndexQuery, postIndexQuery, eventIndexQuery} from 'path/to/sanity/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pagesData = await client.fetch(pageIndexQuery)
  const pages = pagesData.map((doc) => ({
    url: resolvePage(doc),
    lastModified: page._updatedAt,
    priority: 1.0,
  }))

  const postsData = await client.fetch(postIndexQuery)
  const posts = postsData.map((doc) => ({
    url: resolvePost(doc),
    lastModified: page._updatedAt,
    priority: 0.7,
  }))

  const eventsData = await client.fetch<Sanity.EventIndexQueryResult>(eventIndexQuery)
  const events = eventsData.posts.map((doc) => {
    return {
      url: resolveEvent(doc),
      lastModified: post._updatedAt,
      priority: 0.3,
    }
  })

  return [...pages, ...posts, ...events]
}
```

These could be used for an RSS feed too!

## Usage

// studio walkthrough

## Options and Customization

### Custom document titles

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
  ],
}
```

If you’re using `page.name`, `post.title`, and `event.eventName` to title your documents… we need to have a talk about polymorphism. But in the meantime, copy `sampleRedirectSchema.ts` instead of using the `createRedirectSchema()` as per above, and then…

```typescript
// … at the end of redirectSchema.ts

export const mySillyRedirectSchema = defineType({
  // …
  preview: {
    select: {
      title: 'url',
      redirectType: 'redirectType',
      pageTitle: `destination.name`,
      posTitle: `destination.title`,
      eventTitle: `destination.eventName`,
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

// schema.ts
import {pageSchema, postSchema, eventSchema, mySillyRedirectSchema} from 'path/to/schema/files'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [pageSchema, postSchema, eventSchema, mySillyRedirectSchema],
}
```

### Sanity API version

You can feed a custom Sanity API version to the Sanity Client in the Studio tool.

```typescript
// sanity.config.ts

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      resolvers: {
        /* … */
      },
      apiVersion: '2025-11-11',
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
      resolvers: {
        /* … */
      },
      toastMessage: {
        title: 'Your redirect won’t go live until the site is deployed.',
        duration: 10000,
      },
    }),
  ],
})
```

### Custom Dialog Box

You can replace the popup dialog box with your own React component with custom verbiage and options.

For example, you might want to change or remove my "This document is under a day old…" warning, or add a `TEMPORARY/PERMANENT` switch. Make a copy of `DefaultDialogBox.tsx` called `CustomRedirectDialogBox.tsx`…

```typescript
// CustomRedirectDialog.tsx
import {SELECT} from '@sanity/ui'
import {type RedirecTypeEnum} from 'sanity-plugin-next-redirects'

export const CustomRedirectDialog = ({
  timeSinceCreated,
  redirectPath,
  destinationPath,
  redirectType, // uncomment
  setRedirectType, // uncomment
  // ...
}: DialogBoxProps): React.ReactElement => {
  return (
    <Card padding={4}>
        {/* … replace this line: */}
          {/* redirect type toggle? */}
        {/* with this… */}
        <Label size={1} >Redirect type</Label>
        <Flex>
          <Radio
            checked={redirectType === 'PERMANENT'}
            value="PERMANENT"
            onChange={(e) => setRedirectType(e.target.value)}
          >Permanent</Radio>
          <Radio
            checked={redirectType === 'TEMPORARY'}
            value="TEMPORARY"
            onChange={(e) => setRedirectType(e.target.value)}
          >Permanent</Radio>
        </Flex>
      {/* … */}
    </Card>
  )
}

// sanity.config.ts
import {CustomRedirectDialog} from 'path/to/component'

export default defineConfig({
  plugins: [
    sanityNextRedirects({
      resolvers: { /* … */ },
      DialogBox: CustomRedirectDialog,
    }),
  ],
})
```

### Custom Redirect document name

If you need to call your Sanity “redirect” schema document name something else, feed that name here.

```typescript
export default defineConfig({
  plugins: [
    sanityNextRedirects({
      resolvers: {
        /* … */
      },
      sanityRedirectDocumentName: 'redirects',
    }),
  ],
})
```

##

This is a relatively young plugin, and I've only used it with a couple projects. If you have any issues or ideas, please leave a note in the Github Issues.

## Future improvements

I think the "this document is X old" needs to be a lot smarter, and have a configurable time limit option.
