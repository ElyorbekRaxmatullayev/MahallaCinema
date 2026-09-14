import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "mc_session";
const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

function getBotToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN is not set");
  return token;
}

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || getBotToken();
}

export interface TelegramUserData {
  id: string;
  firstName?: string;
  photoUrl?: string;
}

/**
 * Verifies Telegram WebApp `initData` per Telegram's documented algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string): TelegramUserData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const authDate = params.get("auth_date");
    if (authDate) {
      const ageSeconds = Date.now() / 1000 - Number(authDate);
      if (ageSeconds > INIT_DATA_MAX_AGE_SECONDS) return null;
    }

    const dataCheckString = Array.from(params.keys())
      .sort()
      .map((key) => `${key}=${params.get(key)}`)
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(getBotToken()).digest();
    const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    const computedBuf = Buffer.from(computedHash);
    const hashBuf = Buffer.from(hash);
    if (computedBuf.length !== hashBuf.length || !crypto.timingSafeEqual(computedBuf, hashBuf)) {
      return null;
    }

    const userJson = params.get("user");
    if (!userJson) return null;
    const user = JSON.parse(userJson);

    return {
      id: String(user.id),
      firstName: user.first_name,
      photoUrl: user.photo_url,
    };
  } catch {
    return null;
  }
}

let adminIdsCache: Set<string> | null = null;

export function isAdminTelegramId(id: string): boolean {
  if (!adminIdsCache) {
    adminIdsCache = new Set(
      (process.env.ADMIN_TELEGRAM_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }
  return adminIdsCache.has(id);
}

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  return value;
}

/** Sets the signed session cookie. Must be called from a Server Function (Server Action), not during render. */
export async function createSessionCookie(telegramId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(telegramId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function resolveTelegramIdFromSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return unsign(raw);
}

/**
 * Resolves the current Telegram user from the signed session cookie set by
 * `verifyAndLogin`. Outside of Telegram (no cookie yet) and only outside of
 * production, falls back to DEV_FAKE_TELEGRAM_ID so `npm run dev` still works
 * in a normal browser.
 */
export async function getCurrentUser() {
  let telegramId = await resolveTelegramIdFromSession();

  if (!telegramId && process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_TELEGRAM_ID) {
    telegramId = process.env.DEV_FAKE_TELEGRAM_ID;
  }

  if (!telegramId) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (user) return user;

  // Dev fallback: auto-create the seeded fake user on first read, mirroring
  // what verifyAndLogin does for real Telegram sessions.
  if (process.env.NODE_ENV !== "production" && telegramId === process.env.DEV_FAKE_TELEGRAM_ID) {
    return prisma.user.create({ data: { telegramId, firstName: "Dev User" } });
  }

  return null;
}

/** Returns the current user if they're an admin, otherwise null. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminTelegramId(user.telegramId)) return null;
  return user;
}
