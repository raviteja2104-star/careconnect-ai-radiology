const { PatientMapper } = require('./mapper');

describe('FHIR Mapper Strategy', () => {
  it('should map internal Patient schema to FHIR R4 Patient Resource', () => {
    const internalPatient = {
      _id: 'PT-998877',
      name: 'Ravi Teja',
      gender: 'M',
      dob: '1985-12-01',
      contact: {
        phone: '+919876543210',
        email: 'ravi.t@example.com'
      }
    };

    const fhirResource = PatientMapper.toFHIR(internalPatient);

    expect(fhirResource.resourceType).toBe('Patient');
    expect(fhirResource.id).toBe('PT-998877');
    expect(fhirResource.gender).toBe('male');
    expect(fhirResource.birthDate).toBe('1985-12-01');
    
    // Check identifiers
    const systemId = fhirResource.identifier.find(id => id.system === 'https://careconnect.local/patients');
    expect(systemId.value).toBe('PT-998877');

    // Check telecom
    const phone = fhirResource.telecom.find(t => t.system === 'phone');
    expect(phone.value).toBe('+919876543210');
  });

  it('should handle missing contact fields gracefully', () => {
    const internalPatient = {
      _id: 'PT-111222',
      name: 'Jane Doe',
      gender: 'F',
      dob: '1992-03-14'
    };

    const fhirResource = PatientMapper.toFHIR(internalPatient);
    expect(fhirResource.telecom.length).toBe(0);
  });
});
