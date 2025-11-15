import {Button, TextInput, Label, Card, Stack, Flex, Text, Heading} from '@sanity/ui'
import {CloseIcon, PublishIcon} from '@sanity/icons'
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
  const ONE_HOUR = 3600000 // milliseconds

  return (
    <Card padding={4}>
      <Stack space={[4, 6, 4, 4]}>
        {!timeSinceCreated ? null : timeSinceCreated && timeSinceCreated < ONE_HOUR ? (
          <>
            <Heading>This document is under a day old.</Heading>
            <Text>.</Text>
          </>
        ) : (
          <Stack space={4}>
            <Heading>
              This document is {Math.ceil(timeSinceCreated / ONE_HOUR)}{' '}
              {pluralize('hour', Math.ceil(timeSinceCreated / ONE_HOUR))} old.
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
          <Card>
            <Button
              type="button"
              onClick={closeDialogBox}
              fontSize={1}
              padding={[3]}
              mode="ghost"
              text="cancel"
              icon={CloseIcon}
              tone="critical"
            />
          </Card>
          <div style={{flexGrow: 1}} />
          <Card>
            <Button
              type="button"
              onClick={publishNow}
              fontSize={1}
              padding={[3]}
              tone="caution"
              text="just Publish"
              icon={PublishIcon}
            />
          </Card>
          <Card>
            <Button
              type="button"
              onClick={createRedirectAndPublish}
              fontSize={1}
              padding={[3]}
              tone="default"
              text="Publish & Redirect"
              icon={PublishIcon}
            />
          </Card>
        </Flex>
      </Stack>
    </Card>
  )
}
