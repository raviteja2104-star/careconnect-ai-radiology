// Mock Master Drug Catalog (Simulating RxNorm / ATC / SNOMED CT)
// In a real production system, this would connect to a FHIR terminology service.

export interface DrugRecord {
  id: string; // RxCUI or internal ID
  brandName: string;
  genericName: string;
  strength: string;
  form: string;
  manufacturer: string;
  route: string;
  atcCode?: string;
  schedule?: string; // H, H1, X (Controlled substance)
  requiresColdChain: boolean;
  basePrice: number;
  hsnCode?: string;
  gstRate: number;
}

const MASTER_DRUG_DATABASE: DrugRecord[] = [
  { id: "RX-001", brandName: "Augmentin", genericName: "Amoxicillin / Clavulanate", strength: "625mg", form: "Tablet", manufacturer: "GSK", route: "Oral", atcCode: "J01CR02", schedule: "H1", requiresColdChain: false, basePrice: 180, hsnCode: "30049099", gstRate: 12 },
  { id: "RX-002", brandName: "Lantus", genericName: "Insulin Glargine", strength: "100IU/ml", form: "Injection", manufacturer: "Sanofi", route: "Subcutaneous", atcCode: "A10AE04", schedule: "H", requiresColdChain: true, basePrice: 540, hsnCode: "30043110", gstRate: 5 },
  { id: "RX-003", brandName: "Telma", genericName: "Telmisartan", strength: "40mg", form: "Tablet", manufacturer: "Glenmark", route: "Oral", atcCode: "C09CA07", schedule: "H", requiresColdChain: false, basePrice: 85, hsnCode: "30049099", gstRate: 12 },
  { id: "RX-004", brandName: "Pan", genericName: "Pantoprazole", strength: "40mg", form: "Tablet", manufacturer: "Alkem", route: "Oral", atcCode: "A02BC02", schedule: "H", requiresColdChain: false, basePrice: 65, hsnCode: "30049099", gstRate: 12 },
  { id: "RX-005", brandName: "Calpol", genericName: "Paracetamol", strength: "500mg", form: "Tablet", manufacturer: "GSK", route: "Oral", atcCode: "N02BE01", requiresColdChain: false, basePrice: 15, hsnCode: "30049099", gstRate: 12 },
  { id: "RX-006", brandName: "Morphine", genericName: "Morphine Sulfate", strength: "10mg", form: "Injection", manufacturer: "Rusan", route: "IV", atcCode: "N02AA01", schedule: "X", requiresColdChain: false, basePrice: 25, hsnCode: "30049099", gstRate: 12 },
];

export const DrugService = {
  searchDrugs: (query: string): DrugRecord[] => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return MASTER_DRUG_DATABASE.filter(d => 
      d.brandName.toLowerCase().includes(lowerQuery) || 
      d.genericName.toLowerCase().includes(lowerQuery)
    );
  },

  getDrugById: (id: string): DrugRecord | undefined => {
    return MASTER_DRUG_DATABASE.find(d => d.id === id);
  },

  getAllDrugs: (): DrugRecord[] => {
    return MASTER_DRUG_DATABASE;
  },

  validateInteraction: (drugIds: string[]): { hasInteraction: boolean, warning?: string } => {
    // Mock interaction check
    if (drugIds.includes("RX-003") && drugIds.includes("RX-004")) {
      return { hasInteraction: true, warning: "Monitor renal function when combining Telmisartan and Pantoprazole." };
    }
    return { hasInteraction: false };
  }
};
