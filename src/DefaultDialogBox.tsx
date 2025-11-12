'use client'

import {Button, TextInput, Label, Card, Stack, Flex, Text, Heading} from '@sanity/ui'
import type {DialogBoxProps} from './types'
import pluralize from 'pluralize-esm'

export const DefaultDialogBox = ({
  timeSinceCreated,
  redirectPath,
  destinationPath,
  // redirectType,
  // setRedirectType,
  closeDialogBox,
  publishNow,
  createRedirectAndPublish,
}: DialogBoxProps): React.ReactElement => {
  const ONE_DAY = 86400000 // milliseconds

  return (
    <Card padding={4}>
      <Stack space={[4, 6, 4, 4]}>
        {!timeSinceCreated ? null : timeSinceCreated && timeSinceCreated < ONE_DAY ? (
          <Heading>This document is under a day old and probably doesn’t need a redirect.</Heading>
        ) : (
          <Stack space={4}>
            <Heading>
              This document is {Math.ceil(timeSinceCreated / ONE_DAY)}{' '}
              {pluralize('day', Math.ceil(timeSinceCreated / ONE_DAY))} old.
            </Heading>
            <Text>
              If you think the document may have been indexed by search engines, or has been linked
              by an outside website, you should probably create a redirect.
            </Text>
          </Stack>
        )}

        <Label size={1}>redirect from…</Label>
        <TextInput type="text" value={redirectPath ?? ''} readOnly />

        <Label size={1}>to…</Label>
        <TextInput type="text" value={destinationPath ?? ''} readOnly />

        {/* redirect type toggle? */}

        <Flex justify="flex-end" style={{gap: '8px'}}>
          <Button type="button" onClick={closeDialogBox} tone="critical">
            cancel
          </Button>
          <div style={{flexGrow: 1}} />
          <Button type="button" onClick={publishNow} tone="default">
            just Publish
          </Button>
          <Button type="button" onClick={createRedirectAndPublish} tone="primary">
            Publish and create Redirect
          </Button>
        </Flex>
      </Stack>
    </Card>
  )
}
