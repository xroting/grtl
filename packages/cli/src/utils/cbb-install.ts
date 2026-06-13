import { createHash, randomUUID } from "crypto";
import { createWriteStream } from "fs";
import {
  access,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import yauzl, { type Entry, type ZipFile } from "yauzl";

import type { CbbAcquireResponse } from "../types.js";

const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 128 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 200;
const MAX_ZIP_ENTRIES = 10_000;

interface CbbLockEntry {
  version: string;
  target: string;
  sha256: string;
  file_size: number;
  receipt_id: string;
  installed_at: string;
}

interface CbbLockfile {
  schema_version: 1;
  packages: Record<string, CbbLockEntry>;
}

export interface CbbInstallPlan {
  projectRoot: string;
  targetDir: string;
  targetPath: string;
  workspaceId: string;
  jobId: string;
  idempotencyKey: string;
}

export interface CbbInstallResult {
  cbb_id: string;
  version: string;
  target: string;
  target_path: string;
  sha256: string;
  file_size: number;
  receipt_id: string;
  trace_id: string;
}

function pathExists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  );
}

function safePathPart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_");
}

export function parseCbbSpec(spec: string): { cbbId: string; version: string } {
  const separator = spec.lastIndexOf("@");
  if (separator <= 0 || separator === spec.length - 1) {
    throw new Error("CBB must use the form <cbb_id>@<version>.");
  }
  const cbbId = spec.slice(0, separator).trim();
  const version = spec.slice(separator + 1).trim();
  if (!cbbId || !version) {
    throw new Error("CBB must use the form <cbb_id>@<version>.");
  }
  return { cbbId, version };
}

export function defaultCbbTarget(cbbId: string, version: string): string {
  return `rtl/cbb/${safePathPart(cbbId)}_${safePathPart(version)}`;
}

export function normalizeRelativeTarget(value: string): string {
  const slashPath = value.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (
    !slashPath ||
    slashPath.includes("\0") ||
    slashPath.startsWith("/") ||
    /^[A-Za-z]:/.test(slashPath)
  ) {
    throw new Error("Target must be a non-empty project-relative path.");
  }

  const parts = slashPath.split("/").filter((part) => part && part !== ".");
  if (
    parts.length === 0 ||
    parts.some(
      (part) =>
        part === ".." ||
        part.length > 255 ||
        part.includes(":") ||
        part.endsWith(".") ||
        part.endsWith(" ") ||
        windowsReservedName(part)
    )
  ) {
    throw new Error("Target must not escape the project directory.");
  }
  return parts.join("/");
}

function resolveProjectTarget(projectRoot: string, targetDir: string): string {
  const targetPath = resolve(projectRoot, ...targetDir.split("/"));
  const relativePath = relative(projectRoot, targetPath);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error("Target must resolve inside the project directory.");
  }
  return targetPath;
}

async function readLockfile(projectRoot: string): Promise<CbbLockfile> {
  const lockPath = join(projectRoot, ".genrtl", "cbb-lock.json");
  if (!(await pathExists(lockPath))) {
    return { schema_version: 1, packages: {} };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    throw new Error(`Invalid CBB lockfile: ${lockPath}`);
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { schema_version?: unknown }).schema_version !== 1 ||
    !(parsed as { packages?: unknown }).packages ||
    typeof (parsed as { packages?: unknown }).packages !== "object"
  ) {
    throw new Error(`Unsupported CBB lockfile format: ${lockPath}`);
  }
  return parsed as CbbLockfile;
}

export async function prepareCbbInstall(
  projectRootInput: string,
  targetInput: string,
  cbbId: string,
  version: string,
  force: boolean
): Promise<CbbInstallPlan> {
  const projectRoot = await realpath(resolve(projectRootInput));
  const targetDir = normalizeRelativeTarget(targetInput);
  const targetPath = resolveProjectTarget(projectRoot, targetDir);
  if (!force && (await pathExists(targetPath))) {
    throw new Error(`Target already exists: ${targetPath}. Use --force to replace it.`);
  }

  await readLockfile(projectRoot);
  const projectHash = createHash("sha256").update(projectRoot).digest("hex");
  const operationHash = createHash("sha256")
    .update(`${projectRoot}\0${targetDir}\0${cbbId}\0${version}`)
    .digest("hex");

  return {
    projectRoot,
    targetDir,
    targetPath,
    workspaceId: `cli:${projectHash.slice(0, 40)}`,
    jobId: `cbb-install:${safePathPart(cbbId)}@${safePathPart(version)}:${operationHash.slice(0, 16)}`,
    idempotencyKey: `grtl-cbb-install:${operationHash}`,
  };
}

async function writeAll(file: Awaited<ReturnType<typeof open>>, chunk: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < chunk.byteLength) {
    const { bytesWritten } = await file.write(chunk, offset, chunk.byteLength - offset, null);
    if (bytesWritten <= 0) throw new Error("Failed to write downloaded artifact.");
    offset += bytesWritten;
  }
}

async function downloadArtifact(
  descriptor: CbbAcquireResponse,
  archivePath: string
): Promise<void> {
  if (
    !Number.isSafeInteger(descriptor.file_size) ||
    descriptor.file_size <= 0 ||
    descriptor.file_size > MAX_ARCHIVE_BYTES
  ) {
    throw new Error("CBB archive size is invalid or exceeds the 512 MiB limit.");
  }
  if (!/^[a-fA-F0-9]{64}$/.test(descriptor.sha256)) {
    throw new Error("CBB archive SHA256 is invalid.");
  }

  const response = await fetch(descriptor.artifact_url, {
    redirect: "follow",
    headers: { Accept: "application/zip, application/octet-stream" },
  });
  if (!response.ok || !response.body) {
    const message = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(
      `CBB download failed with HTTP ${response.status}${message ? `: ${message}` : ""}`
    );
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_ARCHIVE_BYTES) {
    throw new Error("CBB download exceeds the 512 MiB limit.");
  }

  const hash = createHash("sha256");
  const file = await open(archivePath, "wx");
  let downloaded = 0;
  try {
    const reader = response.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      downloaded += value.byteLength;
      if (downloaded > MAX_ARCHIVE_BYTES || downloaded > descriptor.file_size) {
        await reader.cancel();
        throw new Error("CBB download exceeded the declared archive size.");
      }
      hash.update(value);
      await writeAll(file, value);
    }
  } finally {
    await file.close();
  }

  if (downloaded !== descriptor.file_size) {
    throw new Error(
      `CBB archive size mismatch: expected ${descriptor.file_size}, received ${downloaded}.`
    );
  }
  const actualSha256 = hash.digest("hex");
  if (actualSha256 !== descriptor.sha256.toLowerCase()) {
    throw new Error("CBB archive SHA256 verification failed.");
  }
}

function windowsReservedName(part: string): boolean {
  const stem = part.split(".")[0].toUpperCase();
  return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(stem);
}

export function validateZipEntryPath(entryName: string): string {
  const slashPath = entryName.replace(/\\/g, "/");
  if (
    !slashPath ||
    slashPath.includes("\0") ||
    slashPath.startsWith("/") ||
    /^[A-Za-z]:/.test(slashPath) ||
    slashPath.length > 4096
  ) {
    throw new Error(`Unsafe ZIP entry path: ${entryName}`);
  }

  const directory = slashPath.endsWith("/");
  const parts = slashPath.split("/").filter(Boolean);
  if (
    parts.length === 0 ||
    parts.some(
      (part) =>
        part === "." ||
        part === ".." ||
        part.length > 255 ||
        part.includes(":") ||
        part.endsWith(".") ||
        part.endsWith(" ") ||
        windowsReservedName(part)
    )
  ) {
    throw new Error(`Unsafe ZIP entry path: ${entryName}`);
  }
  return `${parts.join("/")}${directory ? "/" : ""}`;
}

function openZip(path: string): Promise<ZipFile> {
  return new Promise((resolvePromise, reject) => {
    yauzl.open(path, { lazyEntries: true, autoClose: true }, (error, zipFile) => {
      if (error || !zipFile) reject(error || new Error("Unable to open ZIP archive."));
      else resolvePromise(zipFile);
    });
  });
}

function entryFileType(entry: Entry): number {
  return (entry.externalFileAttributes >>> 16) & 0o170000;
}

function extractEntry(
  zipFile: ZipFile,
  entry: Entry,
  outputPath: string,
  extractedBytes: { value: number }
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error || new Error(`Unable to read ZIP entry: ${entry.fileName}`));
        return;
      }

      let entryBytes = 0;
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          entryBytes += chunk.length;
          extractedBytes.value += chunk.length;
          if (entryBytes > MAX_ENTRY_BYTES || extractedBytes.value > MAX_EXTRACTED_BYTES) {
            callback(new Error("CBB archive exceeds safe extraction limits."));
            return;
          }
          callback(null, chunk);
        },
      });

      pipeline(stream, limiter, createWriteStream(outputPath, { flags: "wx", mode: 0o644 })).then(
        () => {
          if (entryBytes !== entry.uncompressedSize) {
            reject(new Error(`ZIP entry size mismatch: ${entry.fileName}`));
          } else {
            resolvePromise();
          }
        },
        reject
      );
    });
  });
}

export async function extractZipSafely(archivePath: string, destination: string): Promise<void> {
  const zipFile = await openZip(archivePath);
  if (zipFile.entryCount > MAX_ZIP_ENTRIES) {
    zipFile.close();
    throw new Error(`CBB archive contains more than ${MAX_ZIP_ENTRIES} entries.`);
  }

  await mkdir(destination, { recursive: true });
  const destinationRoot = `${resolve(destination)}${sep}`;
  const seenPaths = new Set<string>();
  const extractedBytes = { value: 0 };

  await new Promise<void>((resolvePromise, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      zipFile.close();
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    zipFile.on("error", fail);
    zipFile.on("end", () => {
      if (settled) return;
      settled = true;
      resolvePromise();
    });
    zipFile.on("entry", (entry) => {
      void (async () => {
        if ((entry.generalPurposeBitFlag & 0x1) !== 0) {
          throw new Error(`Encrypted ZIP entries are not supported: ${entry.fileName}`);
        }

        const normalizedName = validateZipEntryPath(entry.fileName);
        const collisionKey = normalizedName.toLowerCase();
        if (seenPaths.has(collisionKey)) {
          throw new Error(`Duplicate ZIP entry path: ${entry.fileName}`);
        }
        seenPaths.add(collisionKey);

        if (
          entry.uncompressedSize > MAX_ENTRY_BYTES ||
          extractedBytes.value + entry.uncompressedSize > MAX_EXTRACTED_BYTES
        ) {
          throw new Error("CBB archive exceeds safe extraction limits.");
        }
        if (
          entry.compressedSize > 0 &&
          entry.uncompressedSize > 1024 * 1024 &&
          entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO
        ) {
          throw new Error(`Suspicious ZIP compression ratio: ${entry.fileName}`);
        }

        const fileType = entryFileType(entry);
        if (fileType === 0o120000) {
          throw new Error(`Symbolic links are not allowed in CBB archives: ${entry.fileName}`);
        }
        const isDirectory = normalizedName.endsWith("/") || fileType === 0o040000;
        if (fileType !== 0 && fileType !== 0o040000 && fileType !== 0o100000) {
          throw new Error(`Special files are not allowed in CBB archives: ${entry.fileName}`);
        }

        const outputPath = resolve(destination, ...normalizedName.split("/").filter(Boolean));
        if (!outputPath.startsWith(destinationRoot)) {
          throw new Error(`ZIP entry escapes the target directory: ${entry.fileName}`);
        }

        if (isDirectory) {
          await mkdir(outputPath, { recursive: true });
        } else {
          await mkdir(dirname(outputPath), { recursive: true });
          await extractEntry(zipFile, entry, outputPath, extractedBytes);
        }
        zipFile.readEntry();
      })().catch(fail);
    });

    zipFile.readEntry();
  });
}

async function validatePackageManifest(
  stagingPath: string,
  cbbId: string,
  version: string
): Promise<void> {
  for (const filename of ["manifest.json", "cbb.json", "CBB.json"]) {
    const manifestPath = join(stagingPath, filename);
    if (!(await pathExists(manifestPath))) continue;

    let manifest: unknown;
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch {
      throw new Error(`Invalid package manifest: ${filename}`);
    }
    if (!manifest || typeof manifest !== "object") {
      throw new Error(`Invalid package manifest: ${filename}`);
    }
    const record = manifest as { id?: unknown; cbb_id?: unknown; version?: unknown };
    const manifestId =
      typeof record.id === "string"
        ? record.id
        : typeof record.cbb_id === "string"
          ? record.cbb_id
          : undefined;
    if (manifestId && manifestId !== cbbId) {
      throw new Error(`CBB manifest ID mismatch: expected ${cbbId}, found ${manifestId}.`);
    }
    if (typeof record.version === "string" && record.version !== version) {
      throw new Error(
        `CBB manifest version mismatch: expected ${version}, found ${record.version}.`
      );
    }
    return;
  }
}

async function writeLockfile(
  projectRoot: string,
  cbbId: string,
  entry: CbbLockEntry
): Promise<void> {
  const lockfile = await readLockfile(projectRoot);
  lockfile.packages[cbbId] = entry;

  const lockDir = join(projectRoot, ".genrtl");
  const lockPath = join(lockDir, "cbb-lock.json");
  const tempPath = join(lockDir, `.cbb-lock-${randomUUID()}.tmp`);
  const backupPath = join(lockDir, `.cbb-lock-${randomUUID()}.bak`);
  await mkdir(lockDir, { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(lockfile, null, 2)}\n`, "utf8");

  const hadLockfile = await pathExists(lockPath);
  try {
    if (hadLockfile) await rename(lockPath, backupPath);
    await rename(tempPath, lockPath);
    if (hadLockfile) await rm(backupPath, { force: true });
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    if (hadLockfile && (await pathExists(backupPath))) {
      await rename(backupPath, lockPath).catch(() => {});
    }
    throw error;
  }
}

export async function installCbbArtifact(
  descriptor: CbbAcquireResponse,
  plan: CbbInstallPlan,
  force: boolean
): Promise<CbbInstallResult> {
  if (descriptor.format !== "zip") {
    throw new Error(`Unsupported CBB artifact format: ${descriptor.format}`);
  }

  const targetParent = dirname(plan.targetPath);
  await mkdir(targetParent, { recursive: true });
  const tempRoot = await mkdtemp(join(targetParent, ".grtl-cbb-"));
  const archivePath = join(tempRoot, "artifact.zip");
  const stagingPath = join(tempRoot, "content");
  const backupPath = `${plan.targetPath}.grtl-backup-${randomUUID()}`;
  let backupCreated = false;
  let installed = false;

  try {
    await downloadArtifact(descriptor, archivePath);
    await extractZipSafely(archivePath, stagingPath);
    await validatePackageManifest(stagingPath, descriptor.cbb_id, descriptor.version);

    if (await pathExists(plan.targetPath)) {
      if (!force) {
        throw new Error(`Target already exists: ${plan.targetPath}. Use --force to replace it.`);
      }
      await rename(plan.targetPath, backupPath);
      backupCreated = true;
    }

    await rename(stagingPath, plan.targetPath);
    installed = true;
    await writeLockfile(plan.projectRoot, descriptor.cbb_id, {
      version: descriptor.version,
      target: plan.targetDir,
      sha256: descriptor.sha256.toLowerCase(),
      file_size: descriptor.file_size,
      receipt_id: descriptor.receipt_id,
      installed_at: new Date().toISOString(),
    });

    if (backupCreated) {
      await rm(backupPath, { recursive: true, force: true }).catch(() => {});
    }

    return {
      cbb_id: descriptor.cbb_id,
      version: descriptor.version,
      target: plan.targetDir,
      target_path: plan.targetPath,
      sha256: descriptor.sha256.toLowerCase(),
      file_size: descriptor.file_size,
      receipt_id: descriptor.receipt_id,
      trace_id: descriptor.trace_id,
    };
  } catch (error) {
    if (installed) {
      await rm(plan.targetPath, { recursive: true, force: true }).catch(() => {});
    }
    if (backupCreated && (await pathExists(backupPath))) {
      await rename(backupPath, plan.targetPath).catch(() => {});
    }
    throw error;
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}
