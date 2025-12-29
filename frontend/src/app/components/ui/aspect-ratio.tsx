"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

function AspectRatio(
  props: React.ComponentProps<typeof AspectRatioPrimitive.Root>
) {
  return <AspectRatioPrimitive.Root {...props} data-slot="aspect-ratio" />;
}

export { AspectRatio };
