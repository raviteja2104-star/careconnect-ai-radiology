import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { name: 'Patient Management API', version: 'v1', endpoint: '/api/patients', format: 'REST / FHIR' },
      { name: 'EMR & Clinical Records API', version: 'v1', endpoint: '/api/emr', format: 'REST / GraphQL' },
      { name: 'Prescription & Pharmacy API', version: 'v1', endpoint: '/api/prescriptions', format: 'REST' },
      { name: 'Laboratory Information API', version: 'v1', endpoint: '/api/lab-orders', format: 'REST / HL7' },
      { name: 'Radiology PACS DICOM API', version: 'v1', endpoint: '/api/radiology', format: 'REST / DICOMweb' }
    ]
  });
}
