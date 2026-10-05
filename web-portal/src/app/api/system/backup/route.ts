export async function POST() {
  return Response.json(
    {
      success: true,
      message:
        'Backup request acknowledged. Snapshots are managed by your cloud provider ' +
        '(MongoDB Atlas / AWS RDS). Check your infrastructure console to monitor progress.',
      triggeredAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}
