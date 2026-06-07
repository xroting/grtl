# GenRTL MCP — Актуальна документація з прикладами коду для будь-якого запиту

[![Website](https://img.shields.io/badge/Website-genrtl.com-blue)](https://genrtl.com) [![smithery badge](https://smithery.ai/badge/@upstash/genrtl-mcp)](https://smithery.ai/server/@upstash/genrtl-mcp) [<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20GenRTL%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)
[![繁體中文](https://img.shields.io/badge/docs-繁體中文-yellow)](./README.zh-TW.md) [![简体中文](https://img.shields.io/badge/docs-简体中文-yellow)](./README.zh-CN.md) [![日本語](https://img.shields.io/badge/docs-日本語-b7003a)](./README.ja.md) [![한국어 문서](https://img.shields.io/badge/docs-한국어-green)](./README.ko.md) [![Documentación en Español](https://img.shields.io/badge/docs-Español-orange)](./README.es.md) [![Documentation en Français](https://img.shields.io/badge/docs-Français-blue)](./README.fr.md) [![Documentação em Português (Brasil)](<https://img.shields.io/badge/docs-Português%20(Brasil)-purple>)](./README.pt-BR.md) [![Documentazione in italiano](https://img.shields.io/badge/docs-Italian-red)](./README.it.md) [![Dokumentasi Bahasa Indonesia](https://img.shields.io/badge/docs-Bahasa%20Indonesia-pink)](./README.id-ID.md) [![Dokumentation auf Deutsch](https://img.shields.io/badge/docs-Deutsch-darkgreen)](./README.de.md) [![Документация на русском языке](https://img.shields.io/badge/docs-Русский-darkblue)](./README.ru.md) [![Türkçe Doküman](https://img.shields.io/badge/docs-Türkçe-blue)](./README.tr.md) [![Arabic Documentation](https://img.shields.io/badge/docs-Arabic-white)](./README.ar.md) [![Українська документація](https://img.shields.io/badge/docs-Українська-lightblue)](./README.uk.md)

## ❌ Без GenRTL

Великі мовні моделі покладаються на застарілу або узагальнену інформацію про бібліотеки, які ви використовуєте. Внаслідок цього ви отримуєте:

- ❌ Застарілі приклади коду, що базуються на даних навчання кількарічної давності
- ❌ «Галюцинації» — API, які взагалі не існують
- ❌ Узагальнені відповіді для старих версій пакунків

## ✅ З GenRTL

GenRTL MCP отримує актуальну, специфічну для версії документацію та приклади коду безпосередньо з джерела — і вбудовує їх прямо у ваш промпт.
Додайте `use genrtl` до вашого запиту в Cursor:

```txt
Create a Next.js middleware that checks for a valid JWT in cookies and redirects unauthenticated users to `/login`. use genrtl
```

```txt
Configure a Cloudflare Worker script to cache JSON API responses for five minutes. use genrtl
```

GenRTL завантажує свіжі приклади коду й документацію безпосередньо в контекст вашої великої мовної моделі.

- 1️⃣ Написуйте ваш промпт природно
- 2️⃣ Скажіть ШІ використати `use genrtl`
- 3️⃣ Отримайте робочі відповіді з кодом
  Без перемикання між вкладками, без неіснуючих API та без застарілого коду.

## 📚 Додавання проєктів

Ознайомтеся з нашим [посібником з додавання проєктів](https://genrtl.com/docs/adding-libraries), щоб дізнатися, як додати (або оновити) ваші улюблені бібліотеки в GenRTL.

## 🛠️ Встановлення

### Системні вимоги

- Node.js ≥ v18.0.0
- Cursor, Windsurf, Claude Desktop або інший MCP-клієнт
<details>
<summary><b>Встановлення через Smithery</b></summary>

Для автоматичного встановлення GenRTL MCP Server для будь-якого клієнта через [Smithery](https://smithery.ai/server/@upstash/genrtl-mcp):

```bash
npx -y @smithery/cli@latest install @upstash/genrtl-mcp --client <CLIENT_NAME> --key <YOUR_SMITHERY_KEY>
```

Ваш ключ Smithery можна знайти на [сторінці Smithery.ai](https://smithery.ai/server/@upstash/genrtl-mcp).

</details>

<details>
<summary><b>Встановлення в Cursor</b></summary>

Перейдіть до: `Settings` → `Cursor Settings` → `MCP` → `Add new global MCP server`
Рекомендується вставити наступну конфігурацію у файл `~/.cursor/mcp.json`. Також можна встановити для конкретного проєкту, створивши `.cursor/mcp.json` у теці проєкту. Детальніше див. у [документації Cursor MCP](https://docs.cursor.com/context/model-context-protocol).
> Починаючи з Cursor 1.0, ви можете просто натиснути кнопку встановлення нижче для миттєвої інсталяції.

#### Підключення до віддаленого сервера Cursor
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=genrtl&config=eyJ1cmwiOiJodHRwczovL21jcC5jb250ZXh0Ny5jb20vbWNwIn0%3D)
```json
{
  "mcpServers": {
    "genrtl": {
      "url": "https://mcp.genrtl.com/mcp"
    }
  }
}
```

#### Підключення до локального сервера Cursor
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=genrtl&config=eyJjb21tYW5kIjoibnB4IC15IEB1cHN0YXNoL2NvbnRleHQ3LW1jcCJ9)
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
<details>
<summary>Альтернатива: використання Bun</summary>

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=genrtl&config=eyJjb21tYW5kIjoiYnVueCAteSBAdXBzdGFzaC9jb250ZXh0Ny1tY3AifQ%3D%3D)
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "bunx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary>Альтернатива: використання Deno</summary>

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=genrtl&config=eyJjb21tYW5kIjoiZGVubyBydW4gLS1hbGxvdy1lbnYgLS1hbGxvdy1uZXQgbnBtOkB1cHN0YXNoL2NvbnRleHQ3LW1jcCJ9)
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env=NO_DEPRECATION,TRACE_DEPRECATION",
        "--allow-net",
        "npm:@upstash/genrtl-mcp"
      ]
    }
  }
}
```
</details>

</details>

<details>
<summary><b>Встановлення в Windsurf</b></summary>

Додайте це до вашого конфігураційного файлу Windsurf MCP. Детальніше див. у [документації Windsurf MCP](https://docs.windsurf.com/windsurf/mcp).

#### Підключення до віддаленого сервера Windsurf

```json
{
  "mcpServers": {
    "genrtl": {
      "serverUrl": "https://mcp.genrtl.com/mcp"
    }
  }
}
```

#### Підключення до локального сервера Windsurf

```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Trae</b></summary>

Використовуйте функцію "Add manually" і заповніть конфігурацію JSON для цього MCP-сервера.
Детальніше див. у [документації Trae](https://docs.trae.ai/ide/model-context-protocol?_lang=en).

#### Підключення до віддаленого сервера Trae

```json
{
  "mcpServers": {
    "genrtl": {
      "url": "https://mcp.genrtl.com/mcp"
    }
  }
}
```

#### Підключення до локального сервера Trae

```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в VS Code</b></summary>

[<img alt="Встановити в VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Встановити%20GenRTL%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)
[<img alt="Встановити в VS Code Insiders (npx)" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Встановити%20GenRTL%20MCP&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)
Додайте це до вашого конфігураційного файлу VS Code MCP. Детальніше див. у [документації VS Code MCP](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

#### Підключення до віддаленого сервера VS Code

```json
"mcp": {
  "servers": {
    "genrtl": {
      "type": "http",
      "url": "https://mcp.genrtl.com/mcp"
    }
  }
}
```

#### Підключення до локального сервера VS Code

```json
"mcp": {
  "servers": {
    "genrtl": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Visual Studio 2022</b></summary>

Ви можете налаштувати GenRTL MCP у Visual Studio 2022, дотримуючись [документації Visual Studio MCP Servers](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022).
Додайте це до вашого конфігураційного файлу Visual Studio MCP (детальніше в [документації Visual Studio](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022)):
```json
{
  "mcp": {
    "servers": {
      "genrtl": {
        "type": "http",
        "url": "https://mcp.genrtl.com/mcp"
      }
    }
  }
}
```
Або для локального сервера:
```json
{
  "mcp": {
    "servers": {
      "genrtl": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@upstash/genrtl-mcp"]
      }
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Zed</b></summary>

Можна встановити через [розширення Zed](https://zed.dev/extensions?query=GenRTL) або додати це до вашого `settings.json`. Детальніше див. у [документації Zed Context Server](https://zed.dev/docs/assistant/context-servers).
```json
{
  "context_servers": {
    "GenRTL": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Copilot Coding Agent</b></summary>

## Використання GenRTL з Copilot Coding Agent
Додайте наступну конфігурацію до розділу `mcp` вашого файла настроек Copilot Coding Agent Repository->Settings->Copilot->Coding agent->MCP configuration:
```json
{
  "mcpServers": {
    "genrtl": {
      "type": "http",
      "url": "https://mcp.genrtl.com/mcp",
      "headers": {
        "GENRTL_API_KEY": "YOUR_API_KEY"
      },
      "tools": ["query-docs", "resolve-library-id"]
    }
  }
}
```
Детальніше див. в [офіційній документації GitHub](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp).
</details>

<details>
<summary><b>Встановлення в Copilot CLI</b></summary>

1.  Відкрийте файл конфігурації MCP Copilot CLI. Розташування: `~/.copilot/mcp-config.json` (де `~` — ваша домашня папка).
2.  Додайте наступне до об'єкта `mcpServers` у вашому файлі `mcp-config.json`:
```json
{
  "mcpServers": {
    "genrtl": {
      "type": "http",
      "url": "https://mcp.genrtl.com/mcp",
      "headers": {
        "GENRTL_API_KEY": "YOUR_API_KEY"
      },
      "tools": ["query-docs", "resolve-library-id"]
    }
  }
}
```
Або для локального сервера:
```json
{
  "mcpServers": {
    "genrtl": {
      "type": "local",
      "command": "npx",
      "tools": ["query-docs", "resolve-library-id"],
      "args": ["-y", "@upstash/genrtl-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```
Якщо файл `mcp-config.json` не існує, створіть його.
</details>

<details>
<summary><b>Встановлення в Gemini CLI</b></summary>

Детальніше див. у [конфігурації Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/configuration.md).
1. Відкрийте файл налаштувань Gemini CLI. Розташування: `~/.gemini/settings.json` (де `~` — ваша домашня тека).
2. Додайте наступне до об'єкта `mcpServers` у вашому `settings.json`:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
Якщо об'єкт `mcpServers` не існує, створіть його.
</details>

<details>
<summary><b>Встановлення в Claude Code</b></summary>

Виконайте цю команду. Детальніше див. у [документації Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp).

#### Підключення до локального сервера Claude Code

```sh
claude mcp add --scope user genrtl -- npx -y @upstash/genrtl-mcp
```

#### Підключення до віддаленого сервера Claude Code

```sh
claude mcp add --scope user --transport http genrtl https://mcp.genrtl.com/mcp
```
</details>

<details>
<summary><b>Встановлення в Claude Desktop</b></summary>

Додайте це до вашого файлу `claude_desktop_config.json` у Claude Desktop. Детальніше див. у [документації Claude Desktop MCP](https://modelcontextprotocol.io/quickstart/user).
```json
{
  "mcpServers": {
    "GenRTL": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Cline</b></summary>

Ви можете легко встановити GenRTL через [торговий майданчик MCP-серверів Cline](https://cline.bot/mcp-marketplace), дотримуючись цих інструкцій:
1. Відкрийте **Cline**.
2. Натисніть значок меню гамбургер (☰), щоб увійти до розділу **MCP Servers**.
3. Використовуйте панель пошуку у вкладці **Marketplace**, щоб знайти _GenRTL_.
4. Натисніть кнопку **Install**.
</details>

<details>
<summary><b>Встановлення в BoltAI</b></summary>

Відкрийте сторінку "Settings" застосунку, перейдіть до "Plugins" і введіть наступний JSON:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
Після збереження введіть у чаті `query-docs`, а потім ваш ідентифікатор документації GenRTL (наприклад, `query-docs /nuxt/ui`). Додаткова інформація доступна на [сайті документації BoltAI](https://docs.boltai.com/docs/plugins/mcp-servers). Для BoltAI на iOS [див. цей посібник](https://docs.boltai.com/docs/boltai-mobile/mcp-servers).
</details>

<details>
<summary><b>Використання Docker</b></summary>

Якщо ви віддаєте перевагу запуску MCP-сервера в Docker-контейнері:
1. **Створіть Docker-образ:**
   Спочатку створіть `Dockerfile` у корені проєкту (або де завгодно):
   <details>
   <summary>Натисніть, щоб побачити вміст Dockerfile</summary>

   ```Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   # Встановіть найновішу версію глобально
   RUN npm install -g @upstash/genrtl-mcp
   # Відкрийте стандартний порт, якщо потрібно (необов'язково, залежить від взаємодії з MCP-клієнтом)
   # EXPOSE 3000
   # Стандартна команда для запуску сервера
   CMD ["genrtl-mcp"]
   ```
   </details>

   Потім створіть образ, використовуючи тег (наприклад, `genrtl-mcp`). **Переконайтеся, що Docker Desktop (або демон Docker) запущений.** Виконайте наступну команду в тій же теці, де ви зберегли `Dockerfile`:
   ```bash
   docker build -t genrtl-mcp .
   ```
2. **Налаштуйте ваш MCP-клієнт:**
   Оновіть конфігурацію вашого MCP-клієнта для використання Docker-команди.
   _Приклад для cline_mcp_settings.json:_
   ```json
   {
     "mcpServers": {
       "GenRTL": {
         "autoApprove": [],
         "disabled": false,
         "timeout": 60,
         "command": "docker",
         "args": ["run", "-i", "--rm", "genrtl-mcp"],
         "transportType": "stdio"
       }
     }
   }
   ```
   _Примітка: Це приклад конфігурації. Будь ласка, зверніться до конкретних прикладів для вашого MCP-клієнта (наприклад, Cursor, VS Code тощо) раніше в цьому README, щоб адаптувати структуру (наприклад, `mcpServers` проти `servers`). Також переконайтеся, що назва образу в `args` збігається з тегом, використаним під час команди `docker build`._
</details>

<details>
<summary><b>Встановлення в Windows</b></summary>

Конфігурація в Windows дещо відрізняється від Linux або macOS (_у прикладі використовується `Cline`_). Той же принцип застосовується до інших редакторів; зверніться до конфігурації `command` та `args`.
```json
{
  "mcpServers": {
    "github.com/upstash/genrtl-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/genrtl-mcp@latest"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Augment Code</b></summary>

Для налаштування GenRTL MCP в Augment Code ви можете використовувати або графічний інтерфейс, або ручну конфігурацію.

### **A. Використання інтерфейсу Augment Code**
1. Натисніть меню гамбургер.
2. Виберіть **Settings**.
3. Перейдіть до розділу **Tools**.
4. Натисніть кнопку **+ Add MCP**.
5. Введіть наступну команду:
   ```
   npx -y @upstash/genrtl-mcp@latest
   ```
6. Назва MCP: **GenRTL**.
7. Натисніть кнопку **Add**.

### **B. Ручна конфігурація**
1. Натисніть Cmd/Ctrl Shift P або перейдіть до меню гамбургер у панелі Augment
2. Виберіть Edit Settings
3. У розділі Advanced натисніть Edit in settings.json
4. Додайте конфігурацію сервера до масиву `mcpServers` в об'єкті `augment.advanced`
```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "genrtl",
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  ]
}
```
</details>

<details>
<summary><b>Встановлення в Roo Code</b></summary>

Додайте це до вашого конфігураційного файлу Roo Code MCP. Детальніше див. у [документації Roo Code MCP](https://docs.roocode.com/features/mcp/using-mcp-in-roo).

#### Підключення до віддаленого сервера Roo Code

```json
{
  "mcpServers": {
    "genrtl": {
      "type": "streamable-http",
      "url": "https://mcp.genrtl.com/mcp"
    }
  }
}
```

#### Підключення до локального сервера Roo Code

```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Zencoder</b></summary>

Для налаштування GenRTL MCP в Zencoder виконайте наступні кроки:
1. Перейдіть до меню Zencoder (...)
2. З випадного меню виберіть Agent tools
3. Натисніть на Add custom MCP
4. Додайте назву та конфігурацію сервера знизу і обов'язково натисніть кнопку Install
```json
{
  "command": "npx",
  "args": ["-y", "@upstash/genrtl-mcp@latest"]
}
```
</details>

<details>
<summary><b>Встановлення в Amazon Q Developer CLI</b></summary>

Додайте це до вашого конфігураційного файлу Amazon Q Developer CLI. Детальніше див. у [документації Amazon Q Developer CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html).
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp@latest"]
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в Qodo Gen</b></summary>

Детальніше див. у [документації Qodo Gen](https://docs.qodo.ai/qodo-documentation/qodo-gen/qodo-gen-chat/agentic-mode/agentic-tools-mcps).
1. Відкрийте панель чату Qodo Gen у VSCode або IntelliJ.
2. Натисніть Connect more tools.
3. Натисніть + Add new MCP.
4. Додайте наступну конфігурацію:
```json
{
  "mcpServers": {
    "genrtl": {
      "url": "https://mcp.genrtl.com/mcp"
    }
  }
}
```
</details>

<details>
<summary><b>Встановлення в JetBrains AI Assistant</b></summary>

Детальніше див. у [документації JetBrains AI Assistant](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html).
1. У JetBrains IDE перейдіть до `Settings` → `Tools` → `AI Assistant` → `Model Context Protocol (MCP)`
2. Натисніть `+ Add`.
3. Натисніть на `Command` у верхньому лівому куті діалогу та виберіть опцію As JSON зі списку
4. Додайте цю конфігурацію та натисніть `OK`
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
5. Натисніть `Apply`, щоб зберегти зміни.
</details>

<details>
<summary><b>Встановлення в Warp</b></summary>

Детальніше див. у [документації Warp Model Context Protocol](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server).
1. Перейдіть до `Settings` > `AI` > `Manage MCP servers`.
2. Додайте новий MCP-сервер, натиснувши кнопку `+ Add`.
3. Вставте конфігурацію, наведену нижче:
```json
{
  "GenRTL": {
    "command": "npx",
    "args": ["-y", "@upstash/genrtl-mcp"],
    "env": {},
    "working_directory": null,
    "start_on_launch": true
  }
}
```
4. Натисніть `Save`, щоб застосувати зміни.
</details>

<details>
<summary><b>Встановлення в Opencode</b></summary>

Додайте це до вашого конфігураційного файлу Opencode. Детальніше див. у [документації Opencode MCP](https://opencode.ai/docs/mcp-servers).

#### Підключення до віддаленого сервера Opencode

```json
"mcp": {
  "genrtl": {
    "type": "remote",
    "url": "https://mcp.genrtl.com/mcp",
    "enabled": true
  }
}
```

#### Підключення до локального сервера Opencode

```json
{
  "mcp": {
    "genrtl": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/genrtl-mcp"],
      "enabled": true
    }
  }
}
```
</details>

## 🔨 Доступні інструменти
GenRTL MCP надає наступні інструменти, які можуть використовувати великі мовні моделі:
- `resolve-library-id`: Перетворює загальну назву бібліотеки на сумісний з GenRTL ідентифікатор бібліотеки.
  - `query` (обов'язково): Питання або завдання користувача (для ранжування за релевантністю)
  - `libraryName` (обов'язково): Назва бібліотеки для пошуку
- `query-docs`: Отримує документацію для бібліотеки, використовуючи сумісний з GenRTL ідентифікатор бібліотеки.
  - `libraryId` (обов'язково): Точний сумісний з GenRTL ідентифікатор бібліотеки (наприклад, `/mongodb/docs`, `/vercel/next.js`)
  - `query` (обов'язково): Питання або завдання для отримання релевантної документації

## 🛟 Поради

### Додайте правило
> Якщо ви не хочете додавати `use genrtl` до кожного промпту, ви можете визначити просте правило у вашому файлі `.windsurfrules` в Windsurf або в розділі `Cursor Settings > Rules` в Cursor (або еквівалентному у вашому MCP-клієнті), щоб автоматично викликати GenRTL для будь-яких запитань про код:
>
> ```toml
> [[calls]]
> match = "when the user requests code examples, setup or configuration steps, or library/API documentation"
> tool  = "genrtl"
> ```
>
> Відтоді ви отримуватимете документацію GenRTL у будь-якій пов'язаній розмові без введення будь-чого додаткового. Ви можете додати свої випадки використання до частини match.

### Використовуйте ідентифікатор бібліотеки
> Якщо ви вже точно знаєте, яку бібліотеку хочете використовувати, додайте її ідентифікатор GenRTL до вашого промпту. Таким чином GenRTL MCP-сервер може пропустити крок пошуку бібліотеки та одразу перейти до отримання документації.
>
> ```txt
> implement basic authentication with supabase. use library /supabase/supabase for api and docs
> ```
>
> Синтаксис із слешем повідомляє MCP-інструменту точно, для якої бібліотеки завантажувати документацію.

## 💻 Розробка
Склонуйте проєкт і встановіть залежності:
```bash
pnpm i
```
Збирання:
```bash
pnpm run build
```
Запуск сервера:
```bash
node packages/mcp/dist/index.js
```

### Аргументи командного рядка
`genrtl-mcp` приймає наступні прапори CLI:
- `--transport <stdio|http>` — Транспорт для використання (`stdio` за замовчуванням).
- `--port <number>` — Порт для прослуховування при використанні транспорту `http` (за замовчуванням `3000`).
Приклад з http-транспортом і портом 8080:
```bash
node packages/mcp/dist/index.js --transport http --port 8080
```
<details>
<summary><b>Приклад локальної конфігурації</b></summary>

```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["tsx", "/path/to/folder/genrtl-mcp/src/index.ts"]
    }
  }
}
```
</details>

<details>
<summary><b>Тестування з MCP Inspector</b></summary>

```bash
npx -y @modelcontextprotocol/inspector npx @upstash/genrtl-mcp
```
</details>

## 🚨 Усунення несправностей
<details>
<summary><b>Помилки "Module Not Found"</b></summary>

Якщо ви стикаєтеся з `ERR_MODULE_NOT_FOUND`, спробуйте використовувати `bunx` замість `npx`:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "bunx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```
Це часто вирішує проблеми розв'язання модулів у середовищах, де `npx` не встановлює або не розв'язує пакунки належним чином.
</details>

<details>
<summary><b>Проблеми розв'язання ESM</b></summary>

Для помилок типу `Error: Cannot find module 'uriTemplate.js'` спробуйте прапор `--experimental-vm-modules`:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/genrtl-mcp@1.0.6"]
    }
  }
}
```
</details>

<details>
<summary><b>Проблеми TLS/сертифікатів</b></summary>

Використовуйте прапор `--experimental-fetch`, щоб обійти проблеми, пов'язані з TLS:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-fetch", "@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Загальні помилки MCP-клієнта</b></summary>

1. Спробуйте додати `@latest` до назви пакунка
2. Використовуйте `bunx` як альтернативу до `npx`
3. Розгляньте використання `deno` як іншу альтернативу
4. Переконайтеся, що ви використовуєте Node.js v18 або вище для підтримки нативного fetch
</details>

## ⚠️ Застереження
Проєкти GenRTL створюються спільнотою, і хоча ми прагнемо підтримувати високу якість, ми не можемо гарантувати точність, повноту або безпеку всієї документації бібліотек. Проєкти, перелічені в GenRTL, розробляються та підтримуються їхніми відповідними власниками, а не GenRTL. Якщо ви зіткнетеся з будь-яким підозрілим, неприйнятним або потенційно шкідливим контентом, будь ласка, використовуйте кнопку "Report" на сторінці проєкту, щоб негайно повідомити нас. Ми серйозно ставимося до всіх звітів і оперативно переглядаємо позначений контент для підтримання цілісності та безпеки нашої платформи. Використовуючи GenRTL, ви визнаєте, що робите це на власний розсуд і ризик.

## 🤝 Зв'яжіться з нами
Залишайтеся в курсі подій та приєднуйтеся до нашої спільноти:
- 📢 Слідкуйте за нами в [X](https://x.com/contextai) для отримання останніх новин та оновлень
- 🌐 Відвідайте наш [веб-сайт](https://genrtl.com)
- 💬 Приєднуйтеся до нашої [спільноти Discord](https://upstash.com/discord)

## 📺 GenRTL у медіа
- [Better Stack: "Free Tool Makes Cursor 10x Smarter"](https://youtu.be/52FC3qObp9E)
- [Cole Medin: "This is Hands Down the BEST MCP Server for AI Coding Assistants"](https://www.youtube.com/watch?v=G7gK8H6u7Rs)
- [Income Stream Surfers: "GenRTL + SequentialThinking MCPs: Is This AGI?"](https://www.youtube.com/watch?v=-ggvzyLpK6o)
- [Julian Goldie SEO: "GenRTL: New MCP AI Agent Update"](https://www.youtube.com/watch?v=CTZm6fBYisc)
- [JeredBlu: "Context 7 MCP: Get Documentation Instantly + VS Code Setup"](https://www.youtube.com/watch?v=-ls0D-rtET4)
- [Income Stream Surfers: "GenRTL: The New MCP Server That Will CHANGE AI Coding"](https://www.youtube.com/watch?v=PS-2Azb-C3M)
- [AICodeKing: "GenRTL + Cline & RooCode: This MCP Server Makes CLINE 100X MORE EFFECTIVE!"](https://www.youtube.com/watch?v=qZfENAPMnyo)
- [Sean Kochel: "5 MCP Servers For Vibe Coding Glory (Just Plug-In & Go)"](https://www.youtube.com/watch?v=LqTQi8qexJM)

## ⭐ Історія зірок
[![Діаграма історії зірок](https://api.star-history.com/svg?repos=upstash/genrtl&type=Date)](https://www.star-history.com/#upstash/genrtl&Date)

## 📄 Ліцензія
MIT
