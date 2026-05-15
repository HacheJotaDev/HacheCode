# Hache Code

Asistente de programación con IA en tu navegador. Escribe, depura y entiende código con Hache Code.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)

## Descripción

Hache Code es un asistente de programación agéntico avanzado que funciona directamente en tu navegador. Construido con Next.js 16, TypeScript y Tailwind CSS, ofrece una interfaz moderna y responsiva para interactuar con modelos de IA.

### Características

- **Chat con IA** — Interacción en tiempo real con modelos de lenguaje avanzados
- **Syntax highlighting** — Resaltado de código en múltiples lenguajes
- **Soporte Markdown** — Renderizado completo con tablas, listas y enlaces
- **Detección de herramientas** — Reconoce operaciones de archivos y comandos en las respuestas
- **Tema oscuro/claro** — Cambio de tema con next-themes
- **Selector de modelos** — Elige entre diferentes modelos de IA
- **Panel de contexto** — Visualiza archivos y uso de tokens
- **Interfaz responsiva** — Diseñado para desktop y móvil
- **Respuestas en español** — Optimizado para desarrolladores hispanohablantes

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Estado**: Zustand
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Markdown**: react-markdown + remark-gfm
- **Código**: react-syntax-highlighter
- **Temas**: next-themes

## Desarrollo Local

### Prerrequisitos

- Node.js 18+
- bun, npm o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/HacheJotaDev/HacheCode.git
cd HacheCode

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus valores
```

### Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
ZAI_BASE_URL=https://your-api-url/v1
ZAI_API_KEY=your-api-key
ZAI_CHAT_ID=your-chat-id      # Opcional
ZAI_USER_ID=your-user-id      # Opcional
```

### Ejecutar

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Despliegue en Vercel

### 1. Conectar repositorio

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"**
3. Importa el repositorio `HacheJotaDev/HacheCode`
4. Vercel detectará automáticamente que es un proyecto Next.js

### 2. Configurar variables de entorno

En la configuración del proyecto en Vercel, añade las siguientes **Environment Variables**:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `ZAI_BASE_URL` | URL base de la API de IA (incluye `/v1`) | ✅ Sí |
| `ZAI_API_KEY` | Clave de API para autenticación | ✅ Sí |
| `ZAI_CHAT_ID` | ID de chat persistente | ❌ No |
| `ZAI_USER_ID` | ID de usuario | ❌ No |

### 3. Desplegar

1. Haz clic en **"Deploy"**
2. Vercel construirá y desplegará automáticamente
3. Cada push a `main` desplegará una nueva versión

### Configuración de Vercel recomendada

- **Framework Preset**: Next.js (auto-detectado)
- **Build Command**: `next build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Node.js Version**: 18.x o superior
- **Max Duration**: La API está configurada con `maxDuration = 300` (5 minutos)

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # API de chat con IA
│   │   └── health/route.ts    # Health check endpoint
│   ├── globals.css             # Estilos globales y tema
│   ├── layout.tsx              # Layout raíz con tema
│   └── page.tsx                # Página principal
├── components/
│   ├── chat/                   # Componentes del chat
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ToolCallBlock.tsx
│   │   └── TypingIndicator.tsx
│   ├── panels/                 # Paneles laterales
│   │   └── ContextPanel.tsx
│   ├── sidebar/                # Barra lateral
│   │   └── Sidebar.tsx
│   └── ui/                     # Componentes shadcn/ui
├── hooks/                      # Custom hooks
├── lib/                        # Utilidades
└── store/
    └── chat-store.ts           # Estado global (Zustand)
```

## API

### POST `/api/chat`

Envía mensajes al modelo de IA y recibe una respuesta.

**Request:**

```json
{
  "messages": [
    { "role": "user", "content": "Ayúdame a crear un endpoint REST" }
  ],
  "model": "claude-sonnet-4"
}
```

**Response:**

```json
{
  "content": "Aquí tienes un ejemplo de endpoint REST...",
  "model": "claude-sonnet-4",
  "usage": {
    "promptTokens": 42,
    "completionTokens": 128,
    "totalTokens": 170
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": 1715673600000
}
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Construir para producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificar código con ESLint |

## Licencia

MIT © HacheJotaDev
