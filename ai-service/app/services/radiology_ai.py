import random
import time
from typing import Dict, List, Any


class RadiologyAIService:
    """
    AI Radiology Analysis Engine.
    
    In production, this would integrate with trained ML models (e.g., TensorFlow, PyTorch)
    for actual medical image analysis. For this MVP, we simulate realistic AI analysis
    with rule-based logic and randomized findings.
    """

    MODEL_VERSION = "1.0.0-mvp"

    # Comprehensive finding databases for realistic simulation
    XRAY_FINDINGS = {
        "chest": {
            "normal": {
                "findings": "PA and lateral chest radiograph demonstrates clear lung fields bilaterally. "
                           "No focal consolidation, pleural effusion, or pneumothorax identified. "
                           "Cardiac silhouette is within normal limits. Mediastinal contours are normal. "
                           "No acute osseous abnormalities. Visualized soft tissues are unremarkable.",
                "risk": "low",
                "issues": []
            },
            "fracture": {
                "findings": "Chest radiograph reveals a non-displaced fracture of the left 7th rib laterally. "
                           "No associated hemothorax or pneumothorax. Lung fields are otherwise clear. "
                           "Heart size is normal. No mediastinal widening.",
                "risk": "medium",
                "issues": [
                    {"name": "Rib Fracture", "probability": 0.89, "description": "Non-displaced fracture of left 7th rib", "location": "Left lateral chest wall"},
                    {"name": "Soft tissue swelling", "probability": 0.72, "description": "Adjacent soft tissue edema noted", "location": "Left chest wall"}
                ]
            },
            "pneumonia": {
                "findings": "Chest radiograph demonstrates right lower lobe consolidation with air bronchograms. "
                           "There is associated right-sided pleural effusion (small). Left lung is clear. "
                           "Cardiac silhouette appears mildly enlarged. No pneumothorax.",
                "risk": "high",
                "issues": [
                    {"name": "Right lower lobe pneumonia", "probability": 0.93, "description": "Consolidation with air bronchograms consistent with bacterial pneumonia", "location": "Right lower lobe"},
                    {"name": "Pleural effusion", "probability": 0.78, "description": "Small right-sided pleural effusion", "location": "Right costophrenic angle"},
                    {"name": "Cardiomegaly", "probability": 0.45, "description": "Borderline cardiac enlargement", "location": "Cardiac silhouette"}
                ]
            }
        },
        "hand": {
            "normal": {
                "findings": "AP and oblique radiographs of the hand demonstrate normal alignment and bone density. "
                           "No fracture or dislocation identified. Joint spaces are maintained. "
                           "Soft tissues are unremarkable.",
                "risk": "low",
                "issues": []
            },
            "fracture": {
                "findings": "Radiograph reveals a comminuted fracture of the 5th metacarpal neck (boxer's fracture) "
                           "with approximately 30 degrees of palmar angulation. No other fractures identified. "
                           "Mild soft tissue swelling over the ulnar aspect of the hand.",
                "risk": "medium",
                "issues": [
                    {"name": "Metacarpal fracture", "probability": 0.95, "description": "Comminuted fracture of 5th metacarpal neck with 30° angulation", "location": "Right 5th metacarpal"},
                    {"name": "Soft tissue swelling", "probability": 0.88, "description": "Adjacent soft tissue edema", "location": "Ulnar aspect of hand"}
                ]
            }
        },
        "spine": {
            "normal": {
                "findings": "Lateral cervical spine radiograph demonstrates normal cervical lordosis. "
                           "Vertebral body heights are maintained. No fractures or listhesis identified. "
                           "Disc spaces appear preserved. Prevertebral soft tissues are normal.",
                "risk": "low",
                "issues": []
            },
            "fracture": {
                "findings": "Compression fracture identified at L1 vertebral body with approximately 25% loss of "
                           "anterior height. No retropulsion of fragments into the spinal canal on lateral view. "
                           "Remaining vertebral bodies are intact.",
                "risk": "high",
                "issues": [
                    {"name": "Compression fracture", "probability": 0.91, "description": "L1 vertebral body compression fracture with 25% height loss", "location": "L1 vertebra"},
                    {"name": "Possible osteoporosis", "probability": 0.55, "description": "Diffuse osteopenia suggesting underlying osteoporosis", "location": "Lumbar spine"}
                ]
            }
        }
    }

    CT_FINDINGS = {
        "head": {
            "normal": {
                "findings": "Non-contrast CT of the head demonstrates normal brain parenchyma without evidence of "
                           "acute intracranial hemorrhage, mass effect, or midline shift. Ventricles are normal in "
                           "size and configuration. Gray-white matter differentiation is preserved. "
                           "Visualized orbits, paranasal sinuses, and mastoid air cells are clear.",
                "risk": "low",
                "issues": []
            },
            "bleeding": {
                "findings": "CT head without contrast reveals a 3cm acute subdural hematoma along the right "
                           "cerebral convexity with associated 4mm leftward midline shift. There is effacement "
                           "of the right lateral ventricle. No skull fracture identified. "
                           "Left hemisphere appears unremarkable.",
                "risk": "critical",
                "issues": [
                    {"name": "Acute subdural hematoma", "probability": 0.96, "description": "3cm right convexity subdural hematoma", "location": "Right cerebral hemisphere"},
                    {"name": "Midline shift", "probability": 0.94, "description": "4mm leftward midline shift with mass effect", "location": "Midline structures"},
                    {"name": "Ventricular effacement", "probability": 0.88, "description": "Compression of right lateral ventricle", "location": "Right lateral ventricle"}
                ]
            }
        },
        "abdomen": {
            "normal": {
                "findings": "CT abdomen and pelvis with contrast demonstrates normal liver, spleen, kidneys, and "
                           "pancreas without focal lesions. No free fluid or free air. Bowel loops are normal "
                           "in caliber without obstruction. No pathologically enlarged lymph nodes. "
                           "Abdominal aorta is normal in caliber.",
                "risk": "low",
                "issues": []
            },
            "bleeding": {
                "findings": "Contrast-enhanced CT abdomen reveals active extravasation of contrast in the "
                           "perihepatic region suggesting active hemorrhage. Moderate hemoperitoneum is present "
                           "in the Morison's pouch and pelvis. Liver laceration grade III identified in segments "
                           "VI-VII. Spleen and kidneys appear intact.",
                "risk": "critical",
                "issues": [
                    {"name": "Active hemorrhage", "probability": 0.94, "description": "Active contrast extravasation indicating ongoing bleeding", "location": "Perihepatic region"},
                    {"name": "Liver laceration", "probability": 0.91, "description": "Grade III hepatic laceration", "location": "Liver segments VI-VII"},
                    {"name": "Hemoperitoneum", "probability": 0.89, "description": "Moderate free blood in peritoneal cavity", "location": "Morison's pouch, pelvis"}
                ]
            }
        },
        "chest": {
            "normal": {
                "findings": "CT chest with contrast demonstrates clear lung fields without consolidation, "
                           "ground-glass opacity, or pleural effusion. Mediastinal and hilar lymph nodes "
                           "are within normal size limits. Heart and great vessels are unremarkable. "
                           "No pulmonary embolism identified.",
                "risk": "low",
                "issues": []
            },
            "bleeding": {
                "findings": "CT angiography reveals filling defects within the right main pulmonary artery "
                           "and segmental branches of the right lower lobe, consistent with acute pulmonary "
                           "embolism. Right heart strain evidenced by RV/LV ratio > 1.0. "
                           "Small bilateral pleural effusions noted.",
                "risk": "critical",
                "issues": [
                    {"name": "Pulmonary embolism", "probability": 0.95, "description": "Acute PE in right main and segmental pulmonary arteries", "location": "Right pulmonary artery"},
                    {"name": "Right heart strain", "probability": 0.82, "description": "Elevated RV/LV ratio indicating right ventricular strain", "location": "Right ventricle"},
                    {"name": "Bilateral pleural effusions", "probability": 0.75, "description": "Small bilateral effusions", "location": "Bilateral pleural spaces"}
                ]
            }
        }
    }

    MRI_FINDINGS = {
        "brain": {
            "normal": {
                "findings": "MRI of the brain with and without gadolinium demonstrates normal brain parenchyma. "
                           "No abnormal signal intensity or enhancing lesions identified. Ventricles are "
                           "symmetric and normal in size. No extra-axial collection. Flow voids in major "
                           "intracranial vessels are preserved.",
                "risk": "low",
                "issues": []
            },
            "abnormal": {
                "findings": "MRI brain reveals a 2.5cm ring-enhancing lesion in the left temporal lobe with "
                           "surrounding vasogenic edema. There is mild mass effect with partial effacement "
                           "of the left temporal horn. DWI shows restricted diffusion centrally. "
                           "MR spectroscopy recommended for further characterization.",
                "risk": "high",
                "issues": [
                    {"name": "Ring-enhancing lesion", "probability": 0.88, "description": "2.5cm enhancing mass with central necrosis", "location": "Left temporal lobe"},
                    {"name": "Vasogenic edema", "probability": 0.85, "description": "Surrounding white matter edema", "location": "Left temporal lobe"},
                    {"name": "Mass effect", "probability": 0.72, "description": "Partial effacement of left temporal horn", "location": "Left temporal horn"}
                ]
            }
        },
        "knee": {
            "normal": {
                "findings": "MRI of the knee demonstrates intact anterior and posterior cruciate ligaments. "
                           "Medial and lateral menisci are intact without tear. Collateral ligaments are normal. "
                           "Articular cartilage is preserved. No joint effusion or bone marrow edema.",
                "risk": "low",
                "issues": []
            },
            "abnormal": {
                "findings": "MRI reveals a complex tear of the medial meniscus involving the posterior horn "
                           "extending to the body. Grade 2 signal change in the ACL suggesting partial tear. "
                           "Moderate joint effusion present. Bone bruise noted in the lateral tibial plateau.",
                "risk": "medium",
                "issues": [
                    {"name": "Medial meniscus tear", "probability": 0.92, "description": "Complex tear of posterior horn and body", "location": "Medial meniscus"},
                    {"name": "Partial ACL tear", "probability": 0.68, "description": "Grade 2 signal abnormality in ACL fibers", "location": "Anterior cruciate ligament"},
                    {"name": "Bone bruise", "probability": 0.81, "description": "Marrow edema in lateral tibial plateau", "location": "Lateral tibial plateau"}
                ]
            }
        },
        "spine": {
            "normal": {
                "findings": "MRI of the lumbar spine demonstrates normal vertebral body heights and signal "
                           "intensity. Intervertebral discs show normal hydration. Spinal canal and neural "
                           "foramina are patent. Conus medullaris terminates at normal level. "
                           "Paraspinal soft tissues are unremarkable.",
                "risk": "low",
                "issues": []
            },
            "abnormal": {
                "findings": "MRI lumbar spine reveals a large left paracentral disc herniation at L4-L5 causing "
                           "severe stenosis of the left lateral recess and compression of the traversing L5 "
                           "nerve root. Mild disc bulge at L3-L4 without significant stenosis. "
                           "Degenerative facet changes at L4-L5 and L5-S1.",
                "risk": "medium",
                "issues": [
                    {"name": "Disc herniation", "probability": 0.94, "description": "Large left paracentral disc extrusion", "location": "L4-L5"},
                    {"name": "Nerve root compression", "probability": 0.89, "description": "Compression of left L5 nerve root", "location": "Left lateral recess L4-L5"},
                    {"name": "Degenerative changes", "probability": 0.76, "description": "Facet arthropathy at multiple levels", "location": "L4-L5, L5-S1"}
                ]
            }
        }
    }

    @classmethod
    def analyze_scan(cls, scan_type: str, body_part: str, clinical_notes: str = None) -> Dict[str, Any]:
        """
        Simulate AI analysis of a medical scan.
        In production, this would run the actual ML model inference.
        """
        # Simulate processing time
        time.sleep(random.uniform(0.5, 2.0))

        body_part_lower = body_part.lower()

        # Determine finding type based on clinical notes and randomization
        is_abnormal = cls._should_find_abnormality(clinical_notes, body_part_lower)

        if scan_type == "XRAY":
            return cls._analyze_xray(body_part_lower, is_abnormal)
        elif scan_type == "CT":
            return cls._analyze_ct(body_part_lower, is_abnormal)
        elif scan_type == "MRI":
            return cls._analyze_mri(body_part_lower, is_abnormal)
        else:
            return cls._generate_generic_finding(scan_type, body_part_lower, is_abnormal)

    @classmethod
    def _should_find_abnormality(cls, clinical_notes: str = None, body_part: str = "") -> bool:
        """Determine if the analysis should find an abnormality based on context."""
        if clinical_notes:
            alert_keywords = ["pain", "fracture", "bleeding", "swelling", "trauma",
                            "accident", "fall", "injury", "mass", "lump", "emergency"]
            if any(kw in clinical_notes.lower() for kw in alert_keywords):
                return random.random() < 0.75  # 75% chance of finding something
        return random.random() < 0.35  # 35% chance for random scans

    @classmethod
    def _analyze_xray(cls, body_part: str, is_abnormal: bool) -> Dict[str, Any]:
        findings_db = cls.XRAY_FINDINGS
        # Map body part to closest match
        matched_part = cls._match_body_part(body_part, findings_db.keys())
        part_data = findings_db.get(matched_part, findings_db.get("chest"))

        if is_abnormal:
            # Pick an abnormal finding (fracture, pneumonia, etc.)
            abnormal_keys = [k for k in part_data.keys() if k != "normal"]
            finding_type = random.choice(abnormal_keys) if abnormal_keys else "normal"
        else:
            finding_type = "normal"

        finding = part_data[finding_type]
        confidence = random.uniform(0.82, 0.97) if is_abnormal else random.uniform(0.88, 0.99)

        return {
            "findings": finding["findings"],
            "riskLevel": finding["risk"],
            "confidence": round(confidence, 2),
            "detectedIssues": finding["issues"],
            "recommendations": cls._get_recommendations(finding["risk"], "XRAY"),
            "modelVersion": cls.MODEL_VERSION,
            "analysisType": "X-Ray Analysis",
            "bodyPartAnalyzed": matched_part
        }

    @classmethod
    def _analyze_ct(cls, body_part: str, is_abnormal: bool) -> Dict[str, Any]:
        findings_db = cls.CT_FINDINGS
        matched_part = cls._match_body_part(body_part, findings_db.keys())
        part_data = findings_db.get(matched_part, findings_db.get("head"))

        if is_abnormal:
            abnormal_keys = [k for k in part_data.keys() if k != "normal"]
            finding_type = random.choice(abnormal_keys) if abnormal_keys else "normal"
        else:
            finding_type = "normal"

        finding = part_data[finding_type]
        confidence = random.uniform(0.85, 0.98) if is_abnormal else random.uniform(0.90, 0.99)

        return {
            "findings": finding["findings"],
            "riskLevel": finding["risk"],
            "confidence": round(confidence, 2),
            "detectedIssues": finding["issues"],
            "recommendations": cls._get_recommendations(finding["risk"], "CT"),
            "modelVersion": cls.MODEL_VERSION,
            "analysisType": "CT Scan Analysis",
            "bodyPartAnalyzed": matched_part
        }

    @classmethod
    def _analyze_mri(cls, body_part: str, is_abnormal: bool) -> Dict[str, Any]:
        findings_db = cls.MRI_FINDINGS
        matched_part = cls._match_body_part(body_part, findings_db.keys())
        part_data = findings_db.get(matched_part, findings_db.get("brain"))

        if is_abnormal:
            abnormal_keys = [k for k in part_data.keys() if k != "normal"]
            finding_type = random.choice(abnormal_keys) if abnormal_keys else "normal"
        else:
            finding_type = "normal"

        finding = part_data[finding_type]
        confidence = random.uniform(0.83, 0.96) if is_abnormal else random.uniform(0.89, 0.99)

        return {
            "findings": finding["findings"],
            "riskLevel": finding["risk"],
            "confidence": round(confidence, 2),
            "detectedIssues": finding["issues"],
            "recommendations": cls._get_recommendations(finding["risk"], "MRI"),
            "modelVersion": cls.MODEL_VERSION,
            "analysisType": "MRI Analysis",
            "bodyPartAnalyzed": matched_part
        }

    @classmethod
    def _generate_generic_finding(cls, scan_type: str, body_part: str, is_abnormal: bool) -> Dict[str, Any]:
        if is_abnormal:
            return {
                "findings": f"{scan_type} scan of {body_part}: Abnormal findings detected. "
                           f"Further clinical correlation and specialist review recommended.",
                "riskLevel": "medium",
                "confidence": round(random.uniform(0.70, 0.85), 2),
                "detectedIssues": [
                    {"name": "Abnormal finding", "probability": 0.65, "description": "Requires specialist review", "location": body_part}
                ],
                "recommendations": ["Specialist consultation recommended", "Follow-up imaging may be needed"],
                "modelVersion": cls.MODEL_VERSION,
                "analysisType": f"{scan_type} Analysis",
                "bodyPartAnalyzed": body_part
            }
        return {
            "findings": f"{scan_type} scan of {body_part}: No significant abnormalities detected. "
                       f"All structures within normal limits.",
            "riskLevel": "low",
            "confidence": round(random.uniform(0.85, 0.95), 2),
            "detectedIssues": [],
            "recommendations": ["No immediate follow-up required"],
            "modelVersion": cls.MODEL_VERSION,
            "analysisType": f"{scan_type} Analysis",
            "bodyPartAnalyzed": body_part
        }

    @staticmethod
    def _match_body_part(body_part: str, available_parts) -> str:
        """Find the closest matching body part from available options."""
        available = list(available_parts)
        body_part_lower = body_part.lower()

        # Direct match
        if body_part_lower in available:
            return body_part_lower

        # Partial match
        for part in available:
            if part in body_part_lower or body_part_lower in part:
                return part

        # Mapping common terms
        mappings = {
            "skull": "head", "cranial": "head", "brain": "head", "cerebral": "head",
            "thorax": "chest", "lung": "chest", "pulmonary": "chest", "cardiac": "chest",
            "lumbar": "spine", "cervical": "spine", "thoracic": "spine", "back": "spine",
            "wrist": "hand", "finger": "hand", "palm": "hand",
            "stomach": "abdomen", "liver": "abdomen", "kidney": "abdomen", "pelvis": "abdomen",
            "leg": "knee", "femur": "knee", "tibia": "knee",
        }

        for term, mapped in mappings.items():
            if term in body_part_lower and mapped in available:
                return mapped

        return available[0] if available else body_part_lower

    @staticmethod
    def _get_recommendations(risk_level: str, scan_type: str) -> List[str]:
        base_recs = {
            "low": [
                "No urgent follow-up required",
                "Continue routine screening as recommended",
                "Clinical correlation advised",
            ],
            "medium": [
                "Follow-up imaging recommended in 4-6 weeks",
                "Clinical correlation with symptoms advised",
                "Consider specialist referral if symptoms persist",
                "Pain management as needed",
            ],
            "high": [
                "Urgent clinical review recommended",
                "Specialist consultation advised within 48 hours",
                "Consider admission for further workup",
                "Additional imaging may be indicated",
                "Follow-up with treating physician immediately",
            ],
            "critical": [
                "URGENT: Immediate medical attention required",
                "Contact on-call specialist immediately",
                "Consider emergency surgical consultation",
                "Continuous monitoring recommended",
                "Transfer to higher care facility if needed",
            ],
        }
        return base_recs.get(risk_level, base_recs["low"])
