export default async (request: Request): Promise<Response> => {
  return new Response("Hello from Penguin Bank MCP!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};