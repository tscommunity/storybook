import React, { FunctionComponent, useMemo, useState, useRef, useCallback } from 'react';
import { useStorybookApi } from '@storybook/api';
import { styled } from '@storybook/theming';
import { transparentize } from 'polished';

import { AuthBlock, ErrorBlock, LoaderBlock, EmptyBlock } from './RefBlocks';
import { getStateType, RefType } from './RefHelpers';
import { RefIndicator } from './RefIndicator';
import Tree from './Tree';
import { CollapseIcon } from './TreeNode';
import { Selection } from './types';

export interface RefProps {
  selectedId: string | null;
  highlightedId: string | null;
  setHighlighted: (selection: Selection) => void;
}

const Wrapper = styled.div<{ isMain: boolean }>(({ isMain }) => ({
  position: 'relative',
  marginLeft: -20,
  marginRight: -20,
  marginTop: isMain ? undefined : 0,
}));

const RefHead = styled.div(({ theme }) => ({
  fontWeight: theme.typography.weight.black,
  fontSize: theme.typography.size.s2 - 1,

  // Similar to ListItem.tsx
  textDecoration: 'none',
  lineHeight: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'transparent',

  width: '100%',
  marginTop: 20,
  paddingTop: 16,
  borderTop: `1px solid ${theme.appBorderColor}`,

  color:
    theme.base === 'light' ? theme.color.defaultText : transparentize(0.2, theme.color.defaultText),
}));

const RefTitle = styled.span(({ theme }) => ({
  display: 'block',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  overflow: 'hidden',
  marginLeft: 2,
}));

const CollapseButton = styled.button(({ theme }) => ({
  // Reset button
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 26,
  outline: 'none',
  boxSizing: 'content-box',
  cursor: 'pointer',
  position: 'relative',
  textAlign: 'left',
  lineHeight: 'normal',
  font: 'inherit',
  color: 'inherit',

  display: 'flex',
  padding: 3,
  paddingLeft: 1,
  paddingRight: 12,
  margin: 0,
  marginLeft: -20,
  overflow: 'hidden',

  'span:first-of-type': {
    marginTop: 5,
  },

  '&:focus': {
    borderColor: theme.color.secondary,
    'span:first-of-type': {
      borderLeftColor: theme.color.secondary,
    },
  },
}));

export const Ref: FunctionComponent<RefType & RefProps> = React.memo((props) => {
  const api = useStorybookApi();
  const {
    stories,
    id: refId,
    title = refId,
    selectedId,
    highlightedId,
    setHighlighted,
    loginUrl,
    type,
    ready,
    error,
  } = props;
  const length = useMemo(() => (stories ? Object.keys(stories).length : 0), [stories]);
  const indicatorRef = useRef<HTMLElement>(null);

  const isMain = refId === 'storybook_internal';

  const isLoadingMain = !ready && isMain;
  const isLoadingInjected = type === 'auto-inject' && !ready;

  const isLoading = isLoadingMain || isLoadingInjected || type === 'unknown';
  const isError = !!error;
  const isEmpty = !isLoading && length === 0;
  const isAuthRequired = !!loginUrl && length === 0;

  const state = getStateType(isLoading, isAuthRequired, isError, isEmpty);
  const [isExpanded, setExpanded] = useState<boolean>(true);
  const handleClick = useCallback(() => setExpanded((value) => !value), [setExpanded]);

  const setHighlightedId = useCallback((storyId: string) => setHighlighted({ storyId, refId }), [
    setHighlighted,
  ]);

  const onSelectId = useCallback(
    (id: string) => api.selectStory(id, undefined, { ref: !isMain && refId }),
    [api, isMain, refId]
  );
  return (
    <>
      {isMain || (
        <RefHead
          aria-label={`${isExpanded ? 'Hide' : 'Show'} ${title} stories`}
          aria-expanded={isExpanded}
        >
          <CollapseButton onClick={handleClick}>
            <CollapseIcon isExpanded={isExpanded} />
            <RefTitle title={title}>{title}</RefTitle>
          </CollapseButton>
          <RefIndicator {...props} state={state} ref={indicatorRef} />
        </RefHead>
      )}
      {isExpanded && (
        <Wrapper data-title={title} isMain={isMain}>
          {state === 'auth' && <AuthBlock id={refId} loginUrl={loginUrl} />}
          {state === 'error' && <ErrorBlock error={error} />}
          {state === 'loading' && <LoaderBlock isMain={isMain} />}
          {state === 'empty' && <EmptyBlock isMain={isMain} />}
          {state === 'ready' && (
            <Tree
              isMain={isMain}
              refId={refId}
              data={stories}
              selectedId={selectedId}
              onSelectId={onSelectId}
              highlightedId={highlightedId}
              setHighlightedId={setHighlightedId}
            />
          )}
        </Wrapper>
      )}
    </>
  );
});
