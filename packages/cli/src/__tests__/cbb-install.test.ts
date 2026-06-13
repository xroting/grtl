import { createHash } from "crypto";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, test } from "vitest";

import type { CbbAcquireResponse } from "../types.js";
import {
  defaultCbbTarget,
  installCbbArtifact,
  normalizeRelativeTarget,
  parseCbbSpec,
  prepareCbbInstall,
  validateZipEntryPath,
} from "../utils/cbb-install.js";

const CBB_ZIP_BASE64 =
  "UEsDBBQAAAAIAOywzFy6dKfwEwAAABUAAAAKAAAAcnRsXHRvcC5zdsvNTynNSVUoyS+wVkjNS8kFcwFQSwMEFAAAAAgA7LDMXPyKcw8mAAAAJQAAAAgAAABjYmIuanNvbqtWykxRslJKSc3N101MSUktUtJRKkstKs7MzwMKG+oZ6Rkr1QIAUEsBAhQAFAAAAAgA7LDMXLp0p/ATAAAAFQAAAAoAAAAAAAAAAAAAAAAAAAAAAHJ0bFx0b3Auc3ZQSwECFAAUAAAACADssMxc/IpzDyYAAAAlAAAACAAAAAAAAAAAAAAAAAA7AAAAY2JiLmpzb25QSwUGAAAAAAIAAgBuAAAAhwAAAAAA";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("CBB install coordinates and paths", () => {
  test("parses exact CBB coordinates and derives a safe default target", () => {
    expect(parseCbbSpec("demo-adder@1.2.3")).toEqual({
      cbbId: "demo-adder",
      version: "1.2.3",
    });
    expect(defaultCbbTarget("demo/adder", "1.2.3+rtl")).toBe("rtl/cbb/demo_adder_1.2.3_rtl");
    expect(() => parseCbbSpec("demo-adder")).toThrow("<cbb_id>@<version>");
  });

  test("rejects target and ZIP paths that can escape or break Windows projects", () => {
    expect(normalizeRelativeTarget("./rtl/cbb/demo")).toBe("rtl/cbb/demo");
    expect(() => normalizeRelativeTarget("../outside")).toThrow();
    expect(() => normalizeRelativeTarget("C:\\outside")).toThrow();
    expect(() => normalizeRelativeTarget("rtl/CON")).toThrow();
    expect(() => normalizeRelativeTarget("rtl/demo:stream")).toThrow();

    expect(validateZipEntryPath("rtl\\top.sv")).toBe("rtl/top.sv");
    expect(() => validateZipEntryPath("../top.sv")).toThrow();
    expect(() => validateZipEntryPath("/absolute/top.sv")).toThrow();
    expect(() => validateZipEntryPath("rtl/CON.sv")).toThrow();
    expect(() => validateZipEntryPath("rtl/top.sv:stream")).toThrow();
  });
});

describe("CBB artifact installation", () => {
  test("verifies, extracts, validates, and locks an acquired ZIP", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "grtl-cbb-test-"));
    tempDirs.push(projectRoot);
    const archive = Buffer.from(CBB_ZIP_BASE64, "base64");
    const sha256 = createHash("sha256").update(archive).digest("hex");
    const plan = await prepareCbbInstall(
      projectRoot,
      "rtl/vendor/demo-adder",
      "demo-adder",
      "1.2.3",
      false
    );
    const descriptor: CbbAcquireResponse = {
      cbb_id: "demo-adder",
      version: "1.2.3",
      artifact_url: `data:application/zip;base64,${CBB_ZIP_BASE64}`,
      sha256,
      file_size: archive.byteLength,
      format: "zip",
      expires_in: 300,
      expires_at: new Date(Date.now() + 300_000).toISOString(),
      suggested_target: plan.targetDir,
      receipt_id: "receipt-test",
      trace_id: "trace-test",
      manifest_summary: "demo-adder 1.2.3",
    };

    const result = await installCbbArtifact(descriptor, plan, false);

    expect(result.target).toBe("rtl/vendor/demo-adder");
    expect(await readFile(join(plan.targetPath, "rtl", "top.sv"), "utf8")).toBe(
      "module top; endmodule"
    );
    const lockfile = JSON.parse(
      await readFile(join(projectRoot, ".genrtl", "cbb-lock.json"), "utf8")
    ) as {
      schema_version: number;
      packages: Record<string, { version: string; target: string; sha256: string }>;
    };
    expect(lockfile.schema_version).toBe(1);
    expect(lockfile.packages["demo-adder"]).toMatchObject({
      version: "1.2.3",
      target: "rtl/vendor/demo-adder",
      sha256,
    });
  });

  test("rejects an artifact whose declared digest is incorrect", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "grtl-cbb-test-"));
    tempDirs.push(projectRoot);
    const archive = Buffer.from(CBB_ZIP_BASE64, "base64");
    const plan = await prepareCbbInstall(
      projectRoot,
      "rtl/vendor/demo-adder",
      "demo-adder",
      "1.2.3",
      false
    );

    await expect(
      installCbbArtifact(
        {
          cbb_id: "demo-adder",
          version: "1.2.3",
          artifact_url: `data:application/zip;base64,${CBB_ZIP_BASE64}`,
          sha256: "0".repeat(64),
          file_size: archive.byteLength,
          format: "zip",
          expires_in: 300,
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          suggested_target: plan.targetDir,
          receipt_id: "receipt-test",
          trace_id: "trace-test",
          manifest_summary: "demo-adder 1.2.3",
        },
        plan,
        false
      )
    ).rejects.toThrow("SHA256 verification failed");
  });
});
