export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "Hache IA",
    version: "2.0.0",
    timestamp: Date.now(),
  });
}
