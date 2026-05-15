export const maxDuration = 120;
export const dynamic = "force-dynamic";

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

    // Call the proxy's image generation endpoint
    const url = `${baseUrl.replace(/\/+$/, "")}/images/generations`;

    console.log("[Image] Generating:", prompt.slice(0, 80), "size:", imageGenSize);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
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
