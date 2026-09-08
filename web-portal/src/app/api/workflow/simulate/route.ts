export async function POST() {
  return Response.json(
    { success: false, message: 'Workflow simulation API is not implemented. Configure workflow simulation via your BPM infrastructure console.' },
    { status: 501 }
  );
}
