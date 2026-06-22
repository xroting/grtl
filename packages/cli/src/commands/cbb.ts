import { Command } from "commander";
import ora from "ora";
import pc from "picocolors";

import type { CbbAcquireInput, CbbAcquireResponse } from "../types.js";
import {
  defaultCbbTarget,
  installCbbArtifact,
  parseCbbSpec,
  prepareCbbInstall,
} from "../utils/cbb-install.js";
import { callGenrtlMcpTool } from "../utils/knowledge-api.js";
import { log } from "../utils/logger.js";
import { trackEvent } from "../utils/tracking.js";

interface CbbInstallOptions {
  target?: string;
  projectRoot?: string;
  force?: boolean;
  json?: boolean;
}

async function installCbb(spec: string, options: CbbInstallOptions): Promise<void> {
  trackEvent("command", { name: "cbb-install" });
  const spinner =
    process.stdout.isTTY && !options.json ? ora("Preparing CBB installation...").start() : null;

  try {
    const { cbbId, version } = parseCbbSpec(spec);
    const target = options.target || defaultCbbTarget(cbbId, version);
    const plan = await prepareCbbInstall(
      options.projectRoot || process.cwd(),
      target,
      cbbId,
      version,
      options.force || false
    );

    spinner && (spinner.text = "Acquiring CBB artifact...");
    const acquireInput: CbbAcquireInput = {
      cbb_id: cbbId,
      version,
      target_dir: plan.targetDir,
      workspace_id: plan.workspaceId,
      job_id: plan.jobId,
      idempotency_key: plan.idempotencyKey,
    };
    const descriptor = await callGenrtlMcpTool<CbbAcquireResponse>(
      "genrtl_cbb_acquire",
      acquireInput
    );
    if (descriptor.cbb_id !== cbbId || descriptor.version !== version) {
      throw new Error("GenRTL returned a CBB artifact that does not match the request.");
    }

    spinner && (spinner.text = "Downloading and verifying CBB artifact...");
    const result = await installCbbArtifact(descriptor, plan, options.force || false);
    spinner?.succeed(`Installed ${cbbId}@${version}`);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    log.blank();
    log.success(`Installed ${pc.bold(`${cbbId}@${version}`)}`);
    log.item(`Target: ${result.target_path}`);
    log.item(`SHA256: ${result.sha256}`);
    log.item(`Lockfile: ${plan.projectRoot}/.genrtl/cbb-lock.json`);
    log.blank();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spinner?.fail(message);
    if (!spinner) log.error(message);
    process.exitCode = 1;
  }
}

export function registerCbbCommands(program: Command): void {
  const cbb = program.command("cbb").description("Install reusable RTL CBBs");

  cbb
    .command("install")
    .description("Acquire, verify, and install a CBB ZIP into the current project")
    .argument("<cbb>", "CBB coordinate in the form <cbb_id>@<version>")
    .option("-t, --target <dir>", "Project-relative target directory")
    .option("--project-root <dir>", "Project root (default: current directory)")
    .option("-f, --force", "Replace an existing target after successful verification")
    .option("--json", "Output the installation result as JSON")
    .action(async (spec: string, options: CbbInstallOptions) => {
      await installCbb(spec, options);
    });
}
