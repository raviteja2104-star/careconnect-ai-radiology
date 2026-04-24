import random
from typing import Dict, List, Any, Optional


class SymptomCheckerService:
    """
    AI-powered symptom checking engine.
    
    In production, this would integrate with medical NLP models and clinical
    decision support systems. For MVP, we use a comprehensive rule-based
    knowledge base for symptom-to-condition mapping.
    """

    # Comprehensive symptom-condition knowledge base
    SYMPTOM_DATABASE = {
        "headache": {
            "conditions": [
                {"name": "Tension Headache", "probability": 0.55, "description": "Most common type, often stress-related. Band-like pressure around head."},
                {"name": "Migraine", "probability": 0.25, "description": "Neurological condition with intense throbbing, often unilateral. May include aura."},
                {"name": "Sinusitis", "probability": 0.10, "description": "Inflammation of paranasal sinuses causing facial pain and pressure."},
                {"name": "Cluster Headache", "probability": 0.05, "description": "Severe unilateral pain, often around the eye. Occurs in clusters."},
                {"name": "Hypertension", "probability": 0.05, "description": "Elevated blood pressure can cause headaches, especially occipital."}
            ],
            "severity_weight": 0.3
        },
        "fever": {
            "conditions": [
                {"name": "Viral Infection", "probability": 0.45, "description": "Common viral illness (flu, cold). Usually self-limiting."},
                {"name": "Bacterial Infection", "probability": 0.25, "description": "May require antibiotic treatment. Monitor closely."},
                {"name": "COVID-19", "probability": 0.15, "description": "SARS-CoV-2 infection. Testing recommended."},
                {"name": "Dengue Fever", "probability": 0.10, "description": "Vector-borne viral illness. Watch for warning signs."},
                {"name": "Typhoid Fever", "probability": 0.05, "description": "Bacterial infection from contaminated food/water."}
            ],
            "severity_weight": 0.5
        },
        "chest pain": {
            "conditions": [
                {"name": "Costochondritis", "probability": 0.30, "description": "Inflammation of rib-sternum cartilage. Sharp, localized pain."},
                {"name": "GERD / Acid Reflux", "probability": 0.25, "description": "Gastric acid irritation causing burning chest sensation."},
                {"name": "Anxiety / Panic Attack", "probability": 0.20, "description": "Can mimic cardiac symptoms with chest tightness."},
                {"name": "Angina Pectoris", "probability": 0.15, "description": "Reduced blood flow to heart muscle. Requires cardiac evaluation."},
                {"name": "Myocardial Infarction", "probability": 0.10, "description": "Heart attack. EMERGENCY - seek immediate medical attention."}
            ],
            "severity_weight": 0.9
        },
        "cough": {
            "conditions": [
                {"name": "Upper Respiratory Infection", "probability": 0.40, "description": "Common cold or flu causing cough reflex."},
                {"name": "Allergic Rhinitis", "probability": 0.25, "description": "Post-nasal drip from allergies triggering cough."},
                {"name": "Bronchitis", "probability": 0.20, "description": "Inflammation of bronchial tubes. May be acute or chronic."},
                {"name": "Asthma", "probability": 0.10, "description": "Chronic airway inflammation causing cough, wheezing."},
                {"name": "Pneumonia", "probability": 0.05, "description": "Lung infection requiring antibiotic treatment."}
            ],
            "severity_weight": 0.4
        },
        "abdominal pain": {
            "conditions": [
                {"name": "Gastritis", "probability": 0.30, "description": "Inflammation of stomach lining causing upper abdominal pain."},
                {"name": "Irritable Bowel Syndrome", "probability": 0.25, "description": "Functional GI disorder with cramping and altered bowel habits."},
                {"name": "Food Poisoning", "probability": 0.20, "description": "Bacterial contamination causing acute GI symptoms."},
                {"name": "Appendicitis", "probability": 0.15, "description": "Inflammation of appendix. Right lower quadrant pain. May need surgery."},
                {"name": "Gallstones", "probability": 0.10, "description": "Gallbladder stones causing right upper quadrant pain."}
            ],
            "severity_weight": 0.6
        },
        "back pain": {
            "conditions": [
                {"name": "Muscle Strain", "probability": 0.45, "description": "Overuse or improper lifting causing muscle/ligament strain."},
                {"name": "Disc Herniation", "probability": 0.20, "description": "Intervertebral disc protrusion compressing nerve roots."},
                {"name": "Spinal Stenosis", "probability": 0.15, "description": "Narrowing of spinal canal causing nerve compression."},
                {"name": "Osteoarthritis", "probability": 0.15, "description": "Degenerative joint disease of the spine."},
                {"name": "Kidney Stone", "probability": 0.05, "description": "Renal calculi causing flank pain radiating to back."}
            ],
            "severity_weight": 0.4
        },
        "shortness of breath": {
            "conditions": [
                {"name": "Anxiety", "probability": 0.30, "description": "Hyperventilation from anxiety or panic disorder."},
                {"name": "Asthma", "probability": 0.25, "description": "Bronchospasm causing airway obstruction. Use rescue inhaler."},
                {"name": "Heart Failure", "probability": 0.15, "description": "Fluid buildup in lungs from cardiac dysfunction."},
                {"name": "Pulmonary Embolism", "probability": 0.10, "description": "Blood clot in lung. EMERGENCY if sudden onset."},
                {"name": "COPD Exacerbation", "probability": 0.10, "description": "Worsening of chronic obstructive pulmonary disease."},
                {"name": "Anemia", "probability": 0.10, "description": "Low hemoglobin reducing oxygen carrying capacity."}
            ],
            "severity_weight": 0.8
        },
        "dizziness": {
            "conditions": [
                {"name": "Benign Positional Vertigo", "probability": 0.35, "description": "Inner ear crystal displacement causing positional dizziness."},
                {"name": "Dehydration", "probability": 0.25, "description": "Inadequate fluid intake causing lightheadedness."},
                {"name": "Low Blood Pressure", "probability": 0.20, "description": "Orthostatic hypotension on standing."},
                {"name": "Inner Ear Infection", "probability": 0.15, "description": "Labyrinthitis or vestibular neuritis."},
                {"name": "Anemia", "probability": 0.05, "description": "Low hemoglobin causing reduced oxygenation."}
            ],
            "severity_weight": 0.5
        },
        "joint pain": {
            "conditions": [
                {"name": "Osteoarthritis", "probability": 0.35, "description": "Degenerative wear-and-tear of joint cartilage."},
                {"name": "Rheumatoid Arthritis", "probability": 0.20, "description": "Autoimmune inflammatory joint disease."},
                {"name": "Gout", "probability": 0.20, "description": "Uric acid crystal deposition in joints."},
                {"name": "Tendinitis", "probability": 0.15, "description": "Inflammation of tendon from overuse."},
                {"name": "Viral Arthritis", "probability": 0.10, "description": "Joint inflammation following viral infection."}
            ],
            "severity_weight": 0.3
        },
        "fatigue": {
            "conditions": [
                {"name": "Sleep Deprivation", "probability": 0.30, "description": "Inadequate sleep quality or quantity."},
                {"name": "Iron Deficiency Anemia", "probability": 0.20, "description": "Low iron stores affecting energy levels."},
                {"name": "Hypothyroidism", "probability": 0.15, "description": "Underactive thyroid reducing metabolism."},
                {"name": "Depression", "probability": 0.20, "description": "Mental health condition causing persistent fatigue."},
                {"name": "Chronic Fatigue Syndrome", "probability": 0.10, "description": "Persistent unexplained fatigue lasting > 6 months."},
                {"name": "Diabetes", "probability": 0.05, "description": "Uncontrolled blood sugar causing energy depletion."}
            ],
            "severity_weight": 0.3
        },
        "skin rash": {
            "conditions": [
                {"name": "Contact Dermatitis", "probability": 0.30, "description": "Allergic or irritant skin reaction."},
                {"name": "Eczema", "probability": 0.25, "description": "Chronic inflammatory skin condition."},
                {"name": "Fungal Infection", "probability": 0.20, "description": "Dermatophyte infection (ringworm, tinea)."},
                {"name": "Psoriasis", "probability": 0.15, "description": "Autoimmune skin condition with scaly patches."},
                {"name": "Drug Reaction", "probability": 0.10, "description": "Medication-induced skin eruption."}
            ],
            "severity_weight": 0.3
        },
        "nausea": {
            "conditions": [
                {"name": "Gastroenteritis", "probability": 0.35, "description": "Stomach flu from viral or bacterial infection."},
                {"name": "Food Intolerance", "probability": 0.25, "description": "Adverse reaction to certain foods."},
                {"name": "Motion Sickness", "probability": 0.15, "description": "Vestibular response to motion."},
                {"name": "Pregnancy", "probability": 0.10, "description": "Morning sickness in early pregnancy."},
                {"name": "Medication Side Effect", "probability": 0.15, "description": "Common adverse effect of many medications."}
            ],
            "severity_weight": 0.4
        }
    }

    @classmethod
    def analyze_symptoms(
        cls,
        symptoms: List[str],
        duration: Optional[str] = None,
        severity: Optional[str] = "mild",
        age: Optional[int] = None,
        gender: Optional[str] = None,
        additional_info: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze symptoms and return possible conditions with recommendations."""

        all_conditions = []
        max_severity_weight = 0

        for symptom in symptoms:
            symptom_lower = symptom.lower().strip()
            matched = cls._match_symptom(symptom_lower)

            if matched:
                symptom_data = cls.SYMPTOM_DATABASE[matched]
                for condition in symptom_data["conditions"]:
                    # Adjust probability based on number of matching symptoms
                    adjusted_prob = condition["probability"]
                    all_conditions.append({
                        "name": condition["name"],
                        "probability": round(adjusted_prob, 2),
                        "description": condition["description"]
                    })
                max_severity_weight = max(max_severity_weight, symptom_data["severity_weight"])

        # Deduplicate and aggregate conditions
        condition_map = {}
        for c in all_conditions:
            if c["name"] in condition_map:
                # Increase probability for conditions appearing from multiple symptoms
                condition_map[c["name"]]["probability"] = min(
                    0.95,
                    round(condition_map[c["name"]]["probability"] + c["probability"] * 0.3, 2)
                )
            else:
                condition_map[c["name"]] = c

        # Sort by probability
        sorted_conditions = sorted(
            condition_map.values(),
            key=lambda x: x["probability"],
            reverse=True
        )[:5]  # Top 5

        # If no conditions matched, provide generic response
        if not sorted_conditions:
            sorted_conditions = [
                {"name": "General Discomfort", "probability": 0.50, "description": "Symptoms require clinical evaluation by a physician."},
                {"name": "Stress-related Symptoms", "probability": 0.30, "description": "Physical symptoms may be related to stress or anxiety."},
            ]

        # Determine urgency
        urgency = cls._determine_urgency(severity, max_severity_weight, sorted_conditions)

        # Age-adjusted recommendations
        recommendations = cls._get_recommendations(urgency, severity, age, symptoms)

        return {
            "possibleConditions": sorted_conditions,
            "severity": severity or "mild",
            "urgencyLevel": urgency,
            "shouldSeeDoctor": urgency in ["medium", "high", "emergency"],
            "recommendations": recommendations,
            "disclaimer": "⚠️ This AI analysis is for informational purposes only. It does not constitute medical advice "
                         "and should not replace professional medical consultation. Always seek the advice of a qualified "
                         "healthcare provider for any medical condition."
        }

    @classmethod
    def _match_symptom(cls, symptom: str) -> Optional[str]:
        """Match input symptom to knowledge base entry."""
        # Direct match
        if symptom in cls.SYMPTOM_DATABASE:
            return symptom

        # Partial/fuzzy match
        mappings = {
            "head": "headache", "migraine": "headache", "head pain": "headache",
            "temperature": "fever", "high temp": "fever", "hot": "fever",
            "chest": "chest pain", "heart pain": "chest pain", "chest tightness": "chest pain",
            "coughing": "cough", "dry cough": "cough", "wet cough": "cough",
            "stomach": "abdominal pain", "tummy": "abdominal pain", "belly": "abdominal pain",
            "lower back": "back pain", "upper back": "back pain", "spine": "back pain",
            "breathing": "shortness of breath", "breathless": "shortness of breath", "dyspnea": "shortness of breath",
            "dizzy": "dizziness", "vertigo": "dizziness", "lightheaded": "dizziness",
            "joint": "joint pain", "knee pain": "joint pain", "hip pain": "joint pain",
            "tired": "fatigue", "exhausted": "fatigue", "no energy": "fatigue", "weakness": "fatigue",
            "rash": "skin rash", "itching": "skin rash", "hives": "skin rash",
            "vomiting": "nausea", "feeling sick": "nausea", "throwing up": "nausea",
        }

        for term, mapped in mappings.items():
            if term in symptom:
                return mapped

        return None

    @classmethod
    def _determine_urgency(cls, severity: str, weight: float, conditions: List[Dict]) -> str:
        emergency_conditions = [
            "Myocardial Infarction", "Pulmonary Embolism", "Stroke",
            "Anaphylaxis", "Acute Abdomen"
        ]

        for c in conditions:
            if c["name"] in emergency_conditions and c["probability"] > 0.1:
                return "emergency"

        if severity == "severe" or weight >= 0.8:
            return "high"
        elif severity == "moderate" or weight >= 0.5:
            return "medium"
        return "low"

    @classmethod
    def _get_recommendations(
        cls, urgency: str, severity: str, age: Optional[int], symptoms: List[str]
    ) -> List[str]:
        recs = []

        if urgency == "emergency":
            recs.extend([
                "🚨 SEEK IMMEDIATE MEDICAL ATTENTION",
                "Call emergency services (112) or visit the nearest emergency room",
                "Do not drive yourself - have someone take you or call an ambulance",
            ])
        elif urgency == "high":
            recs.extend([
                "Consult a doctor within 24 hours",
                "If symptoms worsen, visit the emergency room immediately",
                "Keep track of all symptoms and any medications taken",
            ])
        elif urgency == "medium":
            recs.extend([
                "Schedule a consultation with a doctor within 2-3 days",
                "Monitor your symptoms and note any changes",
                "Take over-the-counter remedies as appropriate",
            ])
        else:
            recs.extend([
                "Monitor your symptoms for the next 48-72 hours",
                "Stay hydrated and get adequate rest",
                "Use appropriate home remedies if available",
            ])

        # General recommendations
        recs.append("Maintain a symptom diary for your doctor consultation")

        if age and age > 60:
            recs.append("Given your age, consider an earlier medical consultation")

        if age and age < 12:
            recs.append("For children, consult a pediatrician if symptoms persist beyond 24 hours")

        return recs
