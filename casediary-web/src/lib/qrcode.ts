import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a PNG Data URL for a given string (token or URL).
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options.width || 320,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.color?.dark || "#0f172a", // Dark courtroom slate
      light: options.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates an SVG string for scalable, ultra-crisp vector rendering.
 */
export async function generateQRCodeSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: options.width || 320,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.color?.dark || "#0f172a",
      light: options.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
