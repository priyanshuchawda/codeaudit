export async function POST(request: Request) {
  const body = await request.json();
  console.log("provider error", body);
  const response = await fetch(body.url);
  return Response.json({ ok: true, response });
}
