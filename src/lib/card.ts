// Cosmetic "bank card" number for the profile screen — not a real card network.
// The Telegram id is embedded directly (zero-padded) so admins can look a user
// up by card number with no extra DB column: strip the prefix and check digit,
// parse the id back out, verify the Luhn check digit matches.
const CARD_PREFIX = "8600";
const ID_LENGTH = 11; // headroom above today's ~10-digit Telegram ids

function luhnCheckDigit(payload: string): string {
  let sum = 0;
  let alternate = true; // the digit immediately left of the check digit is doubled
  for (let i = payload.length - 1; i >= 0; i--) {
    let n = Number(payload[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return String((10 - (sum % 10)) % 10);
}

export function getCardNumber(telegramId: string): string {
  const idDigits = telegramId.replace(/\D/g, "").padStart(ID_LENGTH, "0").slice(-ID_LENGTH);
  const payload = CARD_PREFIX + idDigits;
  return payload + luhnCheckDigit(payload);
}

export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Reverses getCardNumber(). Returns null if the number isn't a validly-formed card. */
export function resolveTelegramIdFromCardNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== CARD_PREFIX.length + ID_LENGTH + 1) return null;
  if (!digits.startsWith(CARD_PREFIX)) return null;

  const payload = digits.slice(0, -1);
  const checkDigit = digits.slice(-1);
  if (luhnCheckDigit(payload) !== checkDigit) return null;

  const idDigits = digits.slice(CARD_PREFIX.length, CARD_PREFIX.length + ID_LENGTH);
  const telegramId = idDigits.replace(/^0+/, "");
  return telegramId || "0";
}
