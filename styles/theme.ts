import { colors as appColors } from "./colors";

export const colors = {
  ...appColors,
  primary: appColors.blue,
  secondary: appColors.gray,
  accent: appColors.cyan,
  background: appColors.white,
  text: appColors.black,
  textSecondary: appColors.gray,
  button: appColors.blue,
  error: appColors.red,
  success: appColors.green,
  status: {
    open: appColors.green,
    inProgress: appColors.cyan,
    closed: appColors.red,
    onHold: appColors.yellow,
    appealed: appColors.cyan,
  },
};

export const fontSizes = {
  headingXL: 32,
  heading: 24,
  title: 20,
  body: 16,
  caption: 12,
};

export const fontStyles = {
  regular: "Roboto-Regular",
  semiBold: "Roboto-Regular",
  bold: "Roboto-Bold",
  italic: "Roboto-Italic",
};

export const theme = {
  colors,
  fontSizes,
  fontStyles,
};
