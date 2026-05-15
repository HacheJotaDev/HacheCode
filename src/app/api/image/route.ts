export const maxDuration = 120;
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// JWT token generation (same as chat route)
// ─────────────────────────────────────────────
function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateJWT(apiKey: string): string {
  const parts = apiKey.split(".");
  if (parts.length !== 2) {
    return apiKey;
  }

  const [id, secret] = parts;
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "HS256", sign_type: "SIGN" }));
  const payload = base64url(
    JSON.stringify({ api_key: id, exp: now + 3600, timestamp: now })
  );

  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, size = "1024x1024" } = body;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Se requiere un prompt para generar la imagen" },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = [
      "1024x1024",
      "768x1344",
      "864x1152",
      "1344x768",
      "1152x864",
      "1440x720",
      "720x1440",
    ];

    const imageGenSize = validSizes.includes(size) ? size : "1024x1024";

    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;

    if (!baseUrl) {
      return Response.json(
        { error: "API_BASE_URL no configurado" },
        { status: 500 }
      );
    }

    // Call image generation endpoint
    const url = `${baseUrl.replace(/\/+$/, "")}/images/generations`;

    console.log("[Image] Generating:", prompt.slice(0, 80), "size:", imageGenSize);

    // Generate JWT token if API key is in id.secret format
    const authToken = apiKey ? generateJWT(apiKey) : "";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        model: "cogview-4",
        prompt,
        size: imageGenSize,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[Image] Generation failed:", response.status, errorText);
      return Response.json(
        { error: `Error generando imagen (${response.status}): ${errorText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Image] Generation complete");

    return Response.json(data);
  } catch (error) {
    console.error("[Image] API error:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return Response.json(
      { error: `Error al generar imagen: ${message}` },
      { status: 500 }
    );
  }
}
