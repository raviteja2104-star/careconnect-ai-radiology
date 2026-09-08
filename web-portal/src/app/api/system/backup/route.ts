export async function POST() {
  return Response.json(
    { success: false, message: 'System backup API not implemented. Configure backup via your MongoDB Atlas or infrastructure console.' },
    { status: 501 }
  );
}
