const fs = require('fs');
const path = 'C:/Users/Ravi Teja/.gemini/antigravity/brain/2399b550-7342-4cb0-b1cd-bb8a43053f34/schema.prisma.md';
let content = fs.readFileSync(path, 'utf8');
const emsModels = `
// -----------------------------------------------------------------------------
// AMBULANCE & EMS
// -----------------------------------------------------------------------------

model Ambulance {
  id          String   @id @default(uuid())
  vehicleId   String   @unique
  type        String   // ALS, BLS, Neonatal, Air
  status      String   // Available, Dispatched, On Scene, Transporting, Out of Service
  currentLat  Float?
  currentLng  Float?
  incidents   DispatchIncident[]
}

model EmergencyCall {
  id          String   @id @default(uuid())
  callerName  String?
  callerPhone String
  location    String
  chiefComplaint String
  priority    String   // Code 1, 2, 3
  receivedAt  DateTime @default(now())
  incident    DispatchIncident?
}

model DispatchIncident {
  id          String   @id @default(uuid())
  callId      String   @unique
  call        EmergencyCall @relation(fields: [callId], references: [id])
  ambulanceId String?
  ambulance   Ambulance? @relation(fields: [ambulanceId], references: [id])
  status      String   // Pending, Dispatched, On Scene, En Route to Hospital, Completed
  dispatchedAt DateTime?
  onSceneAt   DateTime?
  transportingAt DateTime?
  completedAt DateTime?
  destinationHospital String?
}

model IncidentAssessment {
  id          String   @id @default(uuid())
  incidentId  String   @unique
  gcs         Int?
  bpSystolic  Int?
  bpDiastolic Int?
  heartRate   Int?
  respRate    Int?
  spO2        Int?
  interventions String?
  notes       String?
}

model HospitalHandover {
  id          String   @id @default(uuid())
  incidentId  String   @unique
  handedOverTo String  // Staff name/ID in ED
  handoverTime DateTime @default(now())
  digitalSignature String?
  summary     String
}
`;
content = content.replace('```\n', emsModels + '```\n');
fs.writeFileSync(path, content, 'utf8');
console.log("Appended EMS models to schema.prisma.md");
