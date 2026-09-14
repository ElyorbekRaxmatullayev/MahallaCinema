import QRCode from "qrcode";

const QR_OPTIONS = { margin: 1, width: 240 };

/** Web display variant, encoding the Booking.id directly (matches admin scanner's decode). */
export function getQrDataUrl(bookingId: string): Promise<string> {
  return QRCode.toDataURL(bookingId, QR_OPTIONS);
}

/** Bot-send variant — raw PNG bytes for grammy's InputFile. */
export function getQrBuffer(bookingId: string): Promise<Buffer> {
  return QRCode.toBuffer(bookingId, QR_OPTIONS);
}
