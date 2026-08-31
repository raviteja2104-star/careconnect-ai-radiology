const { v4: uuidv4 } = require('uuid');

class PatientMapper {
  /**
   * Converts CareConnect internal Patient model to FHIR R4 Patient Resource
   * @param {Object} internalPatient 
   * @returns {Object} FHIR R4 Patient
   */
  static toFHIR(internalPatient) {
    if (!internalPatient) return null;

    const fhirPatient = {
      resourceType: "Patient",
      id: internalPatient._id,
      text: {
        status: "generated",
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${internalPatient.name}</div>`
      },
      identifier: [
        {
          use: "usual",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR",
                display: "Medical record number"
              }
            ]
          },
          system: "https://careconnect.local/patients",
          value: internalPatient._id
        }
      ],
      name: [
        {
          use: "official",
          text: internalPatient.name,
          // Simple heuristic for demo, ideally we have firstName, lastName in DB
          given: [internalPatient.name.split(' ')[0]],
          family: internalPatient.name.split(' ').slice(1).join(' ') || undefined
        }
      ],
      gender: this._mapGender(internalPatient.gender),
      birthDate: internalPatient.dob, // Expects YYYY-MM-DD
      telecom: []
    };

    if (internalPatient.contact?.phone) {
      fhirPatient.telecom.push({
        system: "phone",
        value: internalPatient.contact.phone,
        use: "mobile"
      });
    }

    if (internalPatient.contact?.email) {
      fhirPatient.telecom.push({
        system: "email",
        value: internalPatient.contact.email,
        use: "home"
      });
    }

    return fhirPatient;
  }

  /**
   * Translates internal M/F/O to FHIR administrative gender
   */
  static _mapGender(internalGender) {
    const map = {
      'M': 'male',
      'F': 'female',
      'O': 'other'
    };
    return map[internalGender] || 'unknown';
  }
}

class PractitionerMapper {
  static toFHIR(internalDoctor) {
    if (!internalDoctor) return null;
    return {
      resourceType: "Practitioner",
      id: internalDoctor._id,
      identifier: [
        {
          system: "https://nmc.org.in/doctor-registry", // National Medical Commission
          value: internalDoctor.licenseNumber || "UNKNOWN-LICENSE"
        }
      ],
      name: [
        {
          use: "official",
          text: internalDoctor.name,
          prefix: ["Dr."]
        }
      ],
      qualification: [
        {
          code: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0360",
                code: "MD",
                display: "Doctor of Medicine"
              }
            ],
            text: internalDoctor.specialty || "General Medicine"
          }
        }
      ]
    };
  }
}

class EncounterMapper {
  static toFHIR(internalEncounter, patientId, practitionerId) {
    if (!internalEncounter) return null;
    
    // Map internal status to FHIR status
    const statusMap = {
      'SCHEDULED': 'planned',
      'IN_PROGRESS': 'in-progress',
      'COMPLETED': 'finished',
      'CANCELLED': 'cancelled'
    };
    
    const fhirStatus = statusMap[internalEncounter.status] || 'unknown';

    return {
      resourceType: "Encounter",
      id: internalEncounter._id,
      status: fhirStatus,
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: internalEncounter.type === 'TELEMEDICINE' ? 'VR' : 'AMB',
        display: internalEncounter.type === 'TELEMEDICINE' ? 'virtual' : 'ambulatory'
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${practitionerId}`
          }
        }
      ],
      period: {
        start: internalEncounter.startTime,
        end: internalEncounter.endTime
      }
    };
  }
}

class ConditionMapper {
  static toFHIR(internalDiagnosis, patientId, encounterId) {
    if (!internalDiagnosis) return null;
    
    return {
      resourceType: "Condition",
      id: internalDiagnosis._id,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active"
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "encounter-diagnosis",
              display: "Encounter Diagnosis"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: internalDiagnosis.icd10Code || "UNKNOWN",
            display: internalDiagnosis.name
          }
        ],
        text: internalDiagnosis.name
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      encounter: {
        reference: `Encounter/${encounterId}`
      },
      recordedDate: internalDiagnosis.dateRecorded
    };
  }
}

class MedicationRequestMapper {
  static toFHIR(internalPrescription, patientId, encounterId, practitionerId) {
    if (!internalPrescription) return null;
    
    return {
      resourceType: "MedicationRequest",
      id: internalPrescription._id,
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        text: internalPrescription.medicationName
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      encounter: {
        reference: `Encounter/${encounterId}`
      },
      requester: {
        reference: `Practitioner/${practitionerId}`
      },
      dosageInstruction: [
        {
          text: internalPrescription.dosage,
          timing: {
            repeat: {
              frequency: internalPrescription.frequencyPerDay,
              period: 1,
              periodUnit: "d"
            }
          }
        }
      ],
      dispenseRequest: {
        expectedSupplyDuration: {
          value: internalPrescription.durationDays,
          unit: "days",
          system: "http://unitsofmeasure.org",
          code: "d"
        }
      }
    };
  }
}

module.exports = { 
  PatientMapper, 
  PractitionerMapper, 
  EncounterMapper,
  ConditionMapper,
  MedicationRequestMapper
};
