import React, { useCallback, useEffect, useRef } from "react";

function useLazyRef<E>(setter: () => E) {
  const ref = useRef<E | undefined>(undefined);

  if (ref.current === undefined) {
    ref.current = setter();
  }

  return ref;
}

function useIntersectionObserver(onIntersection: VoidFunction) {
  const onIntersectionRef = useRef(onIntersection);

  useEffect(() => {
    onIntersectionRef.current = onIntersection;
  }, [onIntersection]);

  const cleanupRef = React.useRef<VoidFunction | undefined>(undefined);

  const lazyObserver = useLazyRef(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !onIntersectionRef.current) return;
      onIntersectionRef.current();
    });

    return observer;
  });

  const handleRef = useCallback(
    (instance: HTMLDivElement | null) => {
      if (!lazyObserver.current) return;

      if (!instance) {
        if (!cleanupRef.current) return;
        return cleanupRef.current();
      }

      cleanupRef.current = () => lazyObserver.current?.unobserve(instance);
      lazyObserver.current.observe(instance);
    },
    [lazyObserver]
  );

  React.useEffect(() => {
    return () => lazyObserver.current?.disconnect();
  }, [lazyObserver]);

  return handleRef;
}

export { useIntersectionObserver };
