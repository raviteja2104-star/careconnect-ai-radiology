const fs = require('fs');
const path = 'C:/Users/Ravi Teja/.gemini/antigravity/brain/2399b550-7342-4cb0-b1cd-bb8a43053f34/schema.prisma.md';
let content = fs.readFileSync(path, 'utf8');
const consolidationModels = `
// =============================================================================
// PHASE 5: ENTERPRISE PLATFORM CONSOLIDATION
// =============================================================================

// -----------------------------------------------------------------------------
// MASTER DATA MANAGEMENT (MDM) LAYER
// -----------------------------------------------------------------------------

model MasterLocation {
  id          String   @id @default(uuid())
  code        String   @unique // e.g., 'ICU-B1'
  name        String
  type        String   // Facility, Building, Floor, Wing, Ward, Room, Bed
  parentId    String?
  parent      MasterLocation? @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    MasterLocation[] @relation("LocationHierarchy")
  status      String   // Active, Inactive, Maintenance
}

model MasterTerminology {
  id          String   @id @default(uuid())
  system      String   // ICD-10, SNOMED, CPT, LOINC
  code        String
  display     String
  definition  String?
  version     String?
  @@unique([system, code])
}

model MasterMedication {
  id          String   @id @default(uuid())
  rxnormCode  String?
  genericName String
  brandName   String?
  form        String   // Tablet, Injection, Syrup
  strength    String
  route       String   // PO, IV, IM
  isHighAlert Boolean  @default(false)
}

// -----------------------------------------------------------------------------
// WORKFLOW & TASK ORCHESTRATION ENGINE
// -----------------------------------------------------------------------------

model WorkflowDefinition {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., 'DISCHARGE_PROCESS'
  description String?
  version     Int      @default(1)
  states      Json     // DAG of allowed states and transitions
  tasks       WorkflowTaskDefinition[]
}

model WorkflowTaskDefinition {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    WorkflowDefinition @relation(fields: [workflowId], references: [id])
  name        String   // e.g., 'PHARMACY_CLEARANCE'
  assigneeRole String  // e.g., 'PHARMACIST'
  requiresApproval Boolean @default(false)
}

model WorkflowInstance {
  id          String   @id @default(uuid())
  workflowId  String
  currentState String
  targetEntity String  // e.g., 'Patient', 'Encounter'
  targetId    String
  status      String   // Active, Completed, Cancelled
  startedAt   DateTime @default(now())
  completedAt DateTime?
  tasks       WorkflowTaskInstance[]
}

model WorkflowTaskInstance {
  id          String   @id @default(uuid())
  instanceId  String
  instance    WorkflowInstance @relation(fields: [instanceId], references: [id])
  name        String
  status      String   // Pending, InProgress, Completed, Blocked
  assignedTo  String?  // UserId
  completedAt DateTime?
  notes       String?
}
`;
content = content.replace('```\n', consolidationModels + '```\n');
fs.writeFileSync(path, content, 'utf8');
console.log("Appended MDM and Workflow models to schema.prisma.md");
