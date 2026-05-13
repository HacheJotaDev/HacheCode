import { createServer } from 'http';
import { readFileSync } from 'fs';

// Load Z.ai config
let config;
const configPaths = [
  '/etc/.z-ai-config',
  '/home/z/.z-ai-config',
  process.cwd() + '/.z-ai-config',
];
for (const p of configPaths) {
  try { config = JSON.parse(readFileSync(p, 'utf-8')); break; }
  catch { /* try next */ }
}
if (!config) { console.error('No .z-ai-config found!'); process.exit(1); }

const SYSTEM_PROMPT = `Eres Hache Code, un asistente de programación agéntico avanzado. Ayudas a desarrolladores a escribir, depurar y entender código.

Comportamientos clave:
- Responde en ESPAÑOL siempre
- Sé conciso y técnico, pero explicativo cuando sea necesario
- Formatea código con bloques markdown incluyendo identificadores de lenguaje
- Cuando sugieras cambios en archivos, muestra el código exacto con syntax highlighting
- Divide tareas complejas en pasos claros y numerados
- Explica tu razonamiento brevemente antes de sugerir código
- Cuando generes código, inclúyelo siempre en bloques de código markdown con el lenguaje especificado
- Si el usuario pide crear algo, genera el código completo y funcional

Tus respuestas deben ser útiles, precisas y formateadas para máxima legibilidad.`;

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    // Read request body
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const { messages, model = 'glm-4-plus', stream: clientStream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Messages required' }));
      return;
    }

    // Build API messages with system prompt
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
    ];

    // Call Z.ai internal API
    const apiUrl = `${config.baseUrl}/chat/completions`;
    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z',
    };
    if (config.chatId) apiHeaders['X-Chat-Id'] = config.chatId;
    if (config.userId) apiHeaders['X-User-Id'] = config.userId;
    if (config.token) apiHeaders['X-Token'] = config.token;

    // If client requests non-streaming, call API non-streaming and return JSON
    if (!clientStream) {
      console.log('[Proxy] Non-streaming request');
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ model, messages: apiMessages, stream: false }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => 'Unknown error');
        console.error('[Proxy] API error:', apiResponse.status, errorText);
        res.writeHead(apiResponse.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `API error: ${apiResponse.status}` }));
        return;
      }

      const data = await apiResponse.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // Streaming mode - call API with stream=true
    console.log('[Proxy] Streaming request');
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ model, messages: apiMessages, stream: true }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => 'Unknown error');
      console.error('[Proxy] API error:', apiResponse.status, errorText);
      res.writeHead(apiResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `API error: ${apiResponse.status}` }));
      return;
    }

    // Stream the response, converting OpenAI SSE format to our custom SSE format
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            totalContent += delta;
            res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
          }
          if (json.usage) {
            promptTokens = json.usage.prompt_tokens || 0;
            completionTokens = json.usage.completion_tokens || 0;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // Send done event
    res.write(`data: ${JSON.stringify({
      type: 'done',
      content: totalContent,
      usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      model,
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('[Proxy] Error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hache Code Proxy] Running on port ${PORT}`);
  console.log(`[Hache Code Proxy] Z.ai API: ${config.baseUrl}`);
});
