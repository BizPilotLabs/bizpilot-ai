import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from "@/lib/design-tokens";
import { transition } from "@/lib/motion";

export const getSpacing = (token: keyof typeof spacingTokens): string => spacingTokens[token];
export const getRadius = (token: keyof typeof radiusTokens): string => radiusTokens[token];
export const getTypographyClass = (token: keyof typeof typographyTokens): string => typographyTokens[token];
export const getColorToken = (token: keyof typeof colorTokens): string => colorTokens[token];
export const getTransition = (): typeof transition => transition;

