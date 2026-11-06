import { useMemo, useState } from "react";

/**
 * Tracks pointer hover for a Pressable. On web, react-native-web fires
 * onHoverIn/onHoverOut for mouse pointers only, so touch devices never get a
 * sticky hover state. On native it only fires for a mouse or trackpad.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);

  const hoverProps = useMemo(
    () => ({
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    }),
    []
  );

  return { hovered, hoverProps };
}
