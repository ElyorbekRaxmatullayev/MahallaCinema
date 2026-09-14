"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAdmin } from "@/lib/telegram-auth";

export async function uploadFile(formData: FormData): Promise<{ url: string } | { error: string }> {
  if (!(await requireAdmin())) return { error: "Доступ запрещён" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Файл не найден" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = join(uploadsDir, filename);

  await writeFile(filePath, buffer);

  return { url: `/uploads/${filename}` };
}
