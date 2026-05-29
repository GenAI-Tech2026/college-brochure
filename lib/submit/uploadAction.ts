"use server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Receipt upload for /submit.
 *
 * Students attach proof (screenshots, photos, PDFs). Files are written under
 * /public/uploads/receipts and we return their public paths so the client can
 * carry them into submitTestimony. The paths persist on the submission and,
 * once published, onto the public review row.
 *
 * Local-disk storage (per project decision). NOTE: this does not persist on
 * serverless/Vercel deploys — swap the write for Vercel Blob if you deploy.
 */

const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB each
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

export type UploadResult =
  | { ok: true; paths: string[] }
  | { ok: false; reason: string };

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "receipts");
const PUBLIC_PREFIX = "/uploads/receipts";

export async function uploadReceipts(fd: FormData): Promise<UploadResult> {
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: true, paths: [] };
  if (files.length > MAX_FILES) {
    return { ok: false, reason: `Up to ${MAX_FILES} files at a time.` };
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error("[uploadReceipts] mkdir failed:", e);
    return { ok: false, reason: "Storage unavailable. Try again." };
  }

  const paths: string[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return { ok: false, reason: `"${file.name}" is over 8 MB.` };
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return { ok: false, reason: "Only images or PDFs are allowed." };
    }
    const name = `${randomBytes(12).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      await writeFile(join(UPLOAD_DIR, name), buf);
    } catch (e) {
      console.error("[uploadReceipts] write failed:", e);
      return { ok: false, reason: "Couldn’t save a file. Try again." };
    }
    paths.push(`${PUBLIC_PREFIX}/${name}`);
  }

  return { ok: true, paths };
}
