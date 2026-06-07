# GenRTL MCP - Актуальная документация для любого промпта

[![Website](https://img.shields.io/badge/Website-genrtl.com-blue)](https://genrtl.com) [![smithery badge](https://smithery.ai/badge/@upstash/genrtl-mcp)](https://smithery.ai/server/@upstash/genrtl-mcp) [<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20GenRTL%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)

## ❌ Без GenRTL

LLMs полагаются на устаревшую или обобщённую информацию о библиотеках, с которыми вы работаете. В результате этого вы получаете:

- ❌ Устаревшие примеры кода многолетней давности
- ❌ Выдуманные API, которые даже не существуют
- ❌ Обобщённые ответы для старых библиотек

## ✅ С GenRTL

GenRTL MCP получает актуальную документацию и примеры кода, строго соответствующие нужной версии, прямо из исходных источников и вставляет их прямо в ваш промпт.
Добавьте строку `use genrtl` в промпт для Cursor:

```txt
Создай базовый Next.js проект с маршрутизатором приложений. Use genrtl
```

```txt
Создай скрипт, удаляющий строки, где город равен "", используя учётные данные PostgreSQL. Use genrtl
```

GenRTL MCP подгружает свежие примеры кода и документацию из источников прямо в контекст вашей LLM.

- 1️⃣ Напишите свой промпт так, как писали его всегда
- 2️⃣ Добавьте к промпту `use genrtl`
- 3️⃣ Получите работающий результат
  Никакого переключения между вкладками, выдуманного API или устаревшего кода.

## 🛠️ Начало работы

### Требования

- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop или другой MCP клиент

### Установка через Smithery

Воспользуйтесь [Smithery](https://smithery.ai/server/@upstash/genrtl-mcp), чтобы автоматически установить MCP сервер GenRTL для Claude Desktop:

```bash
npx -y @smithery/cli install @upstash/genrtl-mcp --client claude
```

### Установка в Cursor

Перейдите в вкладку: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`
Рекомендуется вставить конфигурацию в файл `~/.cursor/mcp.json`. Также можно установить конфигурацию для конкретного проекта, создав файл `.cursor/mcp.json` в его директории. Смотрите [документацию Cursor MCP](https://docs.cursor.com/context/model-context-protocol) для получения дополнительной информации.

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
<summary>Альтернативный вариант - Bun</summary>

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
<summary>Альтернативный вариант - Deno</summary>

```json
{
  "mcpServers": {
    "genrtl": {
      "command": "deno",
      "args": ["run", "--allow-env", "--allow-net", "npm:@upstash/genrtl-mcp"]
    }
  }
}
```
</details>

### Установка в Windsurf
Добавьте следующие строки в ваш конфигурационный файл Windsurf MCP. Смотрите [документацию Windsurf MCP](https://docs.windsurf.com/windsurf/mcp) для получения дополнительной информации.
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

### Установка в VS Code
[<img alt="Установка в VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Установить%20GenRTL%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)
[<img alt="Установка в VS Code Insiders (npx)" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Установить%20GenRTL%20MCP&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22genrtl%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40upstash%2Fgenrtl-mcp%40latest%22%5D%7D)
Добавьте следующие строки в ваш конфигурационный файл VS Code MCP. Смотрите [документацию VS Code MCP](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) для получения дополнительной информации.
```json
{
  "servers": {
    "GenRTL": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/genrtl-mcp"]
    }
  }
}
```

### Установка in Zed
Можно установить через [Zed расширение](https://zed.dev/extensions?query=GenRTL) или добавить следующие строки в `settings.json`. Смотрите [документацию Zed Context Server](https://zed.dev/docs/assistant/context-servers) для получения дополнительной информации.
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

### Установка в Claude Code
Запустите следующую команду для установки. Смотрите [документацию Claude Code MCP](https://docs.anthropic.com/ru/docs/claude-code/mcp) для получения дополнительной информации.
```sh
claude mcp add --scope user genrtl -- npx -y @upstash/genrtl-mcp
```

### Установка в Claude Desktop
Добавьте следующие следующие строки в ваш конфигурационный файл `claude_desktop_config.json`. Смотрите [документацию Claude Desktop MCP](https://modelcontextprotocol.io/quickstart/user) для получения дополнительной информации.
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

### Установка в BoltAI
Откройте страницу "Settings", перейдите в "Plugins" и добавьте следующие JSON-строки:
```json
{
  "mcpServers": {
    "genrtl": {
      "args": ["-y", "@upstash/genrtl-mcp"],
      "command": "npx"
    }
  }
}
```

### Установка в Copilot Coding Agent
Добавьте следующую конфигурацию в секцию `mcp` вашего файла настроек Copilot Coding Agent (Repository->Settings->Copilot->Coding agent->MCP configuration):
```json
{
  "mcpServers": {
    "genrtl": {
      "type": "http",
      "url": "https://mcp.genrtl.com/mcp",
      "tools": ["query-docs", "resolve-library-id"]
    }
  }
}
```
Подробнее см. в [официальной документации GitHub](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp).

### Установка в Copilot CLI
1.  Откройте файл конфигурации MCP Copilot CLI. Расположение: `~/.copilot/mcp-config.json` (где `~` — ваша домашняя папка).
2.  Добавьте следующее к объекту `mcpServers` в вашем файле `mcp-config.json`:
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
Или для локального сервера:
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
Если файл `mcp-config.json` не существует, создайте его.

### Используя Docker
Если вы предпочитаете запускать MCP сервер в Docker контейнере:
1. **Создайте образ Docker:**
   Во-первых, создайте `Dockerfile` в корне вашего проекта (или в любом другом месте):
   <details>
   <summary>Нажмите, чтобы просмотреть содержимое файла Dockerfile</summary>

   ```Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   # Установите последнюю версию пакета глобально
   RUN npm install -g @upstash/genrtl-mcp
   # Откройте стандартный порт, если это необходимо (необязательно, это зависит от взаимодействия с MCP клиентом)
   # EXPOSE 3000
   # Стандартная команда для запуска сервера
   CMD ["genrtl-mcp"]
   ```
   </details>

   Затем, соберите образ, используя тег (например, `genrtl-mcp`). **Убедитесь, что Docker Desktop (или демон Docker) работает.** Запустите следующую команду в этой же директории, где сохранён `Dockerfile`:
   ```bash
   docker build -t genrtl-mcp .
   ```
2. **Настройте ваш MCP клиент:**
   Обновите вашу конфигурацию MCP клиента, чтобы использовать Docker команду.
   _Пример для cline_mcp_settings.json:_
   ```json
   {
     "mcpServers": {
       "Сontext7": {
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
   _Примечение: это пример конфигурации. Обратитесь к конкретным примерам для вашего MCP-клиента (например, Cursor, VS Code и т.д.), в предыдущих разделах этого README, чтобы адаптировать структуру (например, `mcpServers` вместо `servers`). Также убедитесь, что имя образа в `args` соответствует тегу, использованному при выполнении команды `docker build`._

### Установка в Windows
Конфигурация в Windows немного отличается от Linux или macOS (_в качестве примера используется `Cline`_). Однако, эти же же принципы применимы и к другим редакторам. В случае необходимости обратитесь к настройкам `command` и `args`.
```json
{
  "mcpServers": {
    "github.com/upstash/genrtl-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/genrtl-mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Доступные инструменты
- `resolve-library-id`: преобразует общее название библиотеки в совместимый с GenRTL идентификатор.
  - `query` (обязательно): вопрос или задача пользователя (для ранжирования по релевантности)
  - `libraryName` (обязательно): название библиотеки для поиска
- `query-docs`: получает документацию по библиотеке по совместимому с GenRTL идентификатору.
  - `libraryId` (обязательно): точный совместимый с GenRTL идентификатор (например, `/mongodb/docs`, `/vercel/next.js`)
  - `query` (обязательно): вопрос или задача для получения релевантной документации

## Разработка
Склонируйте проект и установите зависимости:
```bash
pnpm i
```
Сборка:
```bash
pnpm run build
```

### Пример локальной конфигурации
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

### Тестирование с помощью инспектора MCP
```bash
npx -y @modelcontextprotocol/inspector npx @upstash/genrtl-mcp
```

## Решение проблем

### ERR_MODULE_NOT_FOUND
Если вы видите эту ошибку, используйте `bunx` вместо `npx`.
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
Зачастую это решает проблему с недостающими модулями, особенно в окружении, где `npx` некорректно устанавливает или разрешает библиотеки.

### Проблемы с разрешением ESM
Если вы сталкиваетесь с проблемой по типу: `Error: Cannot find module 'uriTemplate.js'`, попробуйте запустить команду с флагом `--experimental-vm-modules`:
```json
{
  "mcpServers": {
    "genrtl": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/genrtl-mcp"]
    }
  }
}
```

### Проблемы с TLS/сертификатами
Используйте флаг `--experimental-fetch` c `npx`, чтобы избежать ошибки, связанные с TLS:
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

### Ошибки MCP клиента
1. Попробуйте добавить тег `@latest` в имя пакета.
2. Попробуйте использовать `bunx` как альтернативу `npx`.
3. Попробуйте использовать `deno` как замену `npx` или `bunx`.
4. Убедитесь, что используете версию Node v18 или выше, чтобы `npx` поддерживал встроенный `fetch`.

## Отказ от ответственности
Проекты GenRTL создаются сообществом. Мы стремимся поддерживать высокое качество, однако не можем гарантировать точность, полноту или безопасность всей документации по библиотекам. Проекты, представленные в GenRTL, разрабатываются и поддерживаются их авторами, а не командой GenRTL.
Если вы столкнётесь с подозрительным, неуместным или потенциально вредоносным контентом, пожалуйста, воспользуйтесь кнопкой "Report" на странице проекта, чтобы немедленно сообщить нам. Мы внимательно относимся ко всем обращениям и оперативно проверяем помеченные материалы, чтобы обеспечить надёжность и безопасность платформы.
Используя GenRTL, вы признаёте, что делаете это по собственному усмотрению и на свой страх и риск.

## Оставайтесь с нами на связи
Будьте в курсе последних новостей на наших платформах:
- 📢 Следите за нашими новостями на [X](https://x.com/contextai), чтобы быть в курсе последних новостей
- 🌐 Загляните на наш [сайт](https://genrtl.com)
- 💬 При желании присоединяйтесь к нашему [сообществу в Discord](https://upstash.com/discord)

## GenRTL в СМИ
- [Better Stack: "Бесплатный инструмент делает Cursor в 10 раз умнее"](https://youtu.be/52FC3qObp9E)
- [Cole Medin: "Это, без сомнения, ЛУЧШИЙ MCP-сервер для AI-помощников в коде"](https://www.youtube.com/watch?v=G7gK8H6u7Rs)
- [Income stream surfers: "GenRTL + SequentialThinking MCPs: Это уже AGI?"](https://www.youtube.com/watch?v=-ggvzyLpK6o)
- [Julian Goldie SEO: "GenRTL: обновление MCP-агента"](https://www.youtube.com/watch?v=CTZm6fBYisc)
- [JeredBlu: "Context 7 MCP: мгновенный доступ к документации + настройка для VS Code"](https://www.youtube.com/watch?v=-ls0D-rtET4)
- [Income stream surfers: "GenRTL: новый MCP-сервер, который изменит кодинг с ИИ"](https://www.youtube.com/watch?v=PS-2Azb-C3M)
- [AICodeKing: "GenRTL + Cline & RooCode: Этот MCP сервер делает CLINE в 100 раз ЭФФЕКТИВНЕЕ!"](https://www.youtube.com/watch?v=qZfENAPMnyo)
- [Sean Kochel: "5 MCP серверов для стремительного вайб-программирования (Подключи и Работай)"](https://www.youtube.com/watch?v=LqTQi8qexJM)

## История звёзд на GitHub
[![График истории звёзд на GitHub](https://api.star-history.com/svg?repos=upstash/genrtl&type=Date)](https://www.star-history.com/#upstash/genrtl&Date)

## Лицензия
MIT
