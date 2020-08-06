/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import PojoRouter, {
  PojoRouterProps,
  useCurrentPath,
  useCurrentMatch,
  useMatches,
  useOutboundRoute,
} from '../index';

describe('PojoRouter', () => {
  let createWrapper: (
    props: Omit<PojoRouterProps, 'children'>,
  ) => ({ children }: { children: React.ReactChild }) => React.ReactElement;
  const namedPaths = {
    page1: '/page1',
    page2: { path: '/page2', sensitive: true },
    page3: { path: '/page3/:id' },
  };

  const routes = [
    ['page1', { abc: 123 }],
    ['page2', { abc: 456 }],
    ['page3', { abc: 789 }],
    ['/page4', { abc: 0 }],
  ] as const;
  const notFound = { nothing: true };

  beforeEach(() => {
    createWrapper = (props: Omit<PojoRouterProps, 'children'>) => ({
      children,
    }: {
      children: React.ReactChild;
    }) => <PojoRouter {...props}>{children}</PojoRouter>;
  });

  it('should get current path', () => {
    const { result } = renderHook(() => useCurrentPath(), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: 'page3',
        notFound,
      }),
    });
    expect(result.current).toEqual('page3');
  });

  it('should get current match', () => {
    const { result } = renderHook(() => useCurrentMatch(), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: '/page3/123',
        notFound,
      }),
    });
    expect(result.current).toEqual({ abc: 789, id: '123' });

    const { result: nonNamedPath } = renderHook(() => useCurrentMatch(), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: '/page4',
        notFound,
      }),
    });
    expect(nonNamedPath.current).toEqual({ abc: 0 });

    const { result: noResult } = renderHook(() => useCurrentMatch(), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: '/undefined',
        notFound,
      }),
    });
    expect(noResult.current).toEqual(notFound);
  });

  it('should get all matches', () => {
    const newNamedPaths = {
      page1: { path: '/page2' },
      page2: { path: '/page2', sensitive: true },
      page3: { path: '/page3/:id' },
    };
    const { result } = renderHook(() => useMatches('/page2'), {
      wrapper: createWrapper({
        namedPaths: newNamedPaths,
        routes,
        currentPath: '/page3/123',
        notFound,
      }),
    });
    expect(result.current).toEqual([{ abc: 123 }, { abc: 456 }]);
  });

  it('changing the routes should reset the cache', () => {
    const newNamedPaths = {
      page1: { path: '/page2' },
      page2: { path: '/page2', sensitive: true },
      page3: { path: '/page3/:id' },
    };
    const wrapper = (props: PojoRouterProps) => {
      return <PojoRouter {...props} />;
    };

    const { result, rerender } = renderHook(() => useMatches('/page2'), {
      // @ts-ignore wrapper passes in React.ReactNode but pojo router expects
      // React.ReactChild
      wrapper: wrapper,
      initialProps: {
        namedPaths,
        routes,
        currentPath: '/page1',
        notFound,
      } as Omit<PojoRouterProps, 'children'>,
    });

    expect(result.current).toEqual([{ abc: 456 }]);
    rerender({
      namedPaths: newNamedPaths,
      routes,
      currentPath: '/page/123',
      notFound,
    });
    expect(result.current).toEqual([{ abc: 123 }, { abc: 456 }]);
  });

  it('gets outbound route', () => {
    const { result } = renderHook(() => useOutboundRoute('page3'), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: 'page3',
        notFound,
      }),
    });
    expect(result.current({ id: '123' })).toEqual('/page3/123');
    const { result: newResult } = renderHook(() => useOutboundRoute('page2'), {
      wrapper: createWrapper({
        namedPaths,
        routes,
        currentPath: 'page3',
        notFound,
      }),
    });
    expect(newResult.current()).toEqual('/page2');
  });
});
