import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { logger } from '../lib/logger';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  logLabel?: string;
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  logLabel = 'content',
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPullingRef = useRef(false);
  const currentPullDistanceRef = useRef(0);
  const scrollTopAtStartRef = useRef(0);
  const documentScrollTopAtStartRef = useRef(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !enabled) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      logger.error(`Error refreshing ${logLabel}:`, error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
      }, 300);
    }
  }, [enabled, isRefreshing, logLabel, onRefresh]);

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) {
      return;
    }

    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    const getDocumentScrollTop = () =>
      document.scrollingElement?.scrollTop ?? document.documentElement.scrollTop ?? 0;

    const isAtTop = () => {
      const scrollTop = mainContainer.scrollTop;
      const documentScrollTop = getDocumentScrollTop();
      return scrollTop <= 2 && documentScrollTop <= 2;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = mainContainer.scrollTop;
      const documentScrollTop = getDocumentScrollTop();
      if (isAtTop() && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        scrollTopAtStartRef.current = scrollTop;
        documentScrollTopAtStartRef.current = documentScrollTop;
        isPullingRef.current = true;
        currentPullDistanceRef.current = 0;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const scrollTop = mainContainer.scrollTop;
      const documentScrollTop = getDocumentScrollTop();
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      if (
        scrollTop > scrollTopAtStartRef.current ||
        scrollTop > 2 ||
        documentScrollTop > documentScrollTopAtStartRef.current ||
        documentScrollTop > 2
      ) {
        isPullingRef.current = false;
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
        return;
      }

      if (isAtTop() && deltaY > 0) {
        const distance = deltaY;
        currentPullDistanceRef.current = distance;

        if (distance > 10) {
          e.preventDefault();
        }
        setPullDistance(Math.min(distance, 120));
      } else if (deltaY <= 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
        currentPullDistanceRef.current = 0;
      }
    };

    const handleTouchEnd = () => {
      const finalDistance = currentPullDistanceRef.current;
      const scrollTop = mainContainer.scrollTop;
      const documentScrollTop = getDocumentScrollTop();

      if (
        isPullingRef.current &&
        scrollTop <= 2 &&
        documentScrollTop <= 2 &&
        finalDistance >= 80 &&
        !isRefreshing
      ) {
        handleRefresh();
      }

      isPullingRef.current = false;
      setPullDistance(0);
      currentPullDistanceRef.current = 0;
      scrollTopAtStartRef.current = 0;
      documentScrollTopAtStartRef.current = 0;
    };

    mainContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    mainContainer.addEventListener('touchend', handleTouchEnd);
    mainContainer.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      mainContainer.removeEventListener('touchstart', handleTouchStart);
      mainContainer.removeEventListener('touchmove', handleTouchMove);
      mainContainer.removeEventListener('touchend', handleTouchEnd);
      mainContainer.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, handleRefresh, isRefreshing]);

  return { pullDistance, isRefreshing };
}
