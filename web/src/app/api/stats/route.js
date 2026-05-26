import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ total: 15, last_generated: new Date().toISOString() });
    }

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        MAX(created_at) as last_generated
      FROM checkout_logs
    `;

    return Response.json(stats[0] || { total: 0, last_generated: null });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json({ total: 0, last_generated: null });
  }
}
