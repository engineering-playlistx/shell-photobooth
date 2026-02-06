import path from "node:path";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { app } from "electron";

export function savePhotoFileToFilesystem(
  base64Data: string,
  fileName: string,
): string {
  const userDataPath = app.getPath("userData");
  const photosDir = path.join(userDataPath, "photos");

  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true });
  }

  const filePath = path.join(photosDir, fileName);

  const base64Match = base64Data.match(
    /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
  );

  if (!base64Match) {
    throw new Error("Invalid base64 image format");
  }

  const base64String = base64Match[2];
  const buffer = Buffer.from(base64String, "base64");

  writeFileSync(filePath, buffer);

  return filePath;
}
