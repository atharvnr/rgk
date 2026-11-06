import { useCallback } from "react";
import { useRouter, type Href } from "expo-router";

/**
 * Back handler for detail screens: pops when there is history, otherwise
 * (deep link, page refresh on web) navigates to `fallback`.
 */
export function useBackTo(fallback: Href) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.navigate(fallback);
    }
  }, [router, fallback]);
}
