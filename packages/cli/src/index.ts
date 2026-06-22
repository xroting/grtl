import { Command } from "commander";
import pc from "picocolors";
import figlet from "figlet";
import { registerSetupCommand } from "./commands/setup.js";
import { registerCbbCommands } from "./commands/cbb.js";
import { maybeShowUpgradeNotice, registerUpgradeCommand } from "./commands/upgrade.js";
import { setMcpBaseUrl } from "./setup/agents.js";
import { setBaseUrl } from "./utils/knowledge-api.js";
import { VERSION } from "./constants.js";

const brand = {
  primary: pc.green,
  dim: pc.dim,
};

const program = new Command();

program
  .name("grtl")
  .description("GenRTL CLI - Configure GenRTL and install reusable RTL CBBs")
  .version(VERSION)
  .option("--base-url <url>")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.baseUrl) {
      setBaseUrl(opts.baseUrl);
      setMcpBaseUrl(opts.baseUrl);
    }
  })
  .hook("preAction", async (_thisCommand, actionCommand) => {
    await maybeShowUpgradeNotice({
      actionName: actionCommand.name(),
      argv: process.argv,
    });
  })
  .addHelpText(
    "after",
    `
Examples:
  ${brand.dim("# Configure GenRTL MCP for your coding agent")}
  ${brand.primary("GRTL_API_KEY=your_key npx @genrtl/grtl setup --mcp --codex --project")}

  ${brand.dim("# Acquire and install a reusable RTL CBB")}
  ${brand.primary("npx @genrtl/grtl cbb install cbb_uart@1.2.0")}
`
  );

registerSetupCommand(program);
registerCbbCommands(program);
registerUpgradeCommand(program);

program.action(() => {
  console.log("");
  const banner = figlet.textSync("GenRTL", { font: "ANSI Shadow" });
  console.log(brand.primary(banner));
  console.log(brand.dim("  Configure GenRTL MCP and install reusable RTL CBBs"));
  console.log("");

  console.log("  Quick start:");
  console.log(`    ${brand.primary("npx @genrtl/grtl setup --mcp")}`);
  console.log(`    ${brand.primary("npx @genrtl/grtl cbb install cbb_uart@1.2.0")}`);
  console.log("");

  console.log(`  Run ${brand.primary("npx @genrtl/grtl --help")} for all commands and options`);
  console.log("");
});

await program.parseAsync();
