import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

export const SERVER_VERSION: string = pkg.version;

const GENRTL_BASE_URL = "https://genrtl.com";
const MCP_RESOURCE_URL = "https://mcp.genrtl.com";

export const CLERK_DOMAIN = "clerk.genrtl.com";
export const GENRTL_API_BASE_URL = process.env.GENRTL_API_URL || `${GENRTL_BASE_URL}/api`;
export const RESOURCE_URL = process.env.RESOURCE_URL || MCP_RESOURCE_URL;
export const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || GENRTL_BASE_URL;
export const OPENAI_APPS_CHALLENGE_TOKEN = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
