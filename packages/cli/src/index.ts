import { Command } from "commander";
import pc from "picocolors";
import figlet from "figlet";
import { registerSetupCommand } from "./commands/setup.js";
import { registerKnowledgeCommands } from "./commands/knowledge.js";
import { maybeShowUpgradeNotice, registerUpgradeCommand } from "./commands/upgrade.js";
import { setMcpBaseUrl } from "./setup/http-agents.js";
import { setBaseUrl } from "./utils/knowledge-api.js";
import { VERSION } from "./constants.js";

const brand = {
  primary: pc.green,
  dim: pc.dim,
};

const program = new Command();

program
  .name("grtl")
  .description("GenRTL CLI - Search RTL engineering knowledge and configure GenRTL")
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
  ${brand.dim("# Configure GenRTL for your coding agent")}
  ${brand.primary("GRTL_API_KEY=your_key npx grtl setup --cursor")}
  ${brand.primary("GRTL_API_KEY=your_key npx grtl setup --codex --project")}

  ${brand.dim("# Search the same four tools exposed by the GenRTL MCP server")}
  ${brand.primary('npx grtl knowledge-search "AXI stream backpressure design"')}
  ${brand.primary('npx grtl spec2rtl-search "Generate an APB register block"')}
  ${brand.primary('npx grtl verification-search "Verify an async FIFO"')}
  ${brand.primary('npx grtl debug-search "Explain this Vivado CDC warning"')}
`
  );

registerSetupCommand(program);
registerKnowledgeCommands(program);
registerUpgradeCommand(program);

program.action(() => {
  console.log("");
  const banner = figlet.textSync("GenRTL", { font: "ANSI Shadow" });
  console.log(brand.primary(banner));
  console.log(brand.dim("  RTL engineering knowledge for AI coding agents"));
  console.log("");

  console.log("  Quick start:");
  console.log(`    ${brand.primary("npx grtl setup")}`);
  console.log(`    ${brand.primary('npx grtl knowledge-search "your RTL question"')}`);
  console.log("");

  console.log(`  Run ${brand.primary("npx grtl --help")} for all commands and options`);
  console.log("");
});

await program.parseAsync();
