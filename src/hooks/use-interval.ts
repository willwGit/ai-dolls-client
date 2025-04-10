import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * @see https://github.com/ton-connect/demo-dapp-with-react-ui/blob/c56c374be4449d33c7c5ab0122d372f01e777819/src/hooks/useInterval.ts
 */
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!delay && delay !== 0) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);
}

export default useInterval;
