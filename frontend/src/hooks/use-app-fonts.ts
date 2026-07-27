import { useFonts } from "expo-font";

const REPO =
  "https://raw.githubusercontent.com/tokotype/PlusJakartaSans/master/fonts/ttf";

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    Jakarta: `${REPO}/PlusJakartaSans-Regular.ttf`,
    JakartaMedium: `${REPO}/PlusJakartaSans-Medium.ttf`,
    JakartaBold: `${REPO}/PlusJakartaSans-Bold.ttf`,
    JakartaExtraBold: `${REPO}/PlusJakartaSans-ExtraBold.ttf`,
  });
