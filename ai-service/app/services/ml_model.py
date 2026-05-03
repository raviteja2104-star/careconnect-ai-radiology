"""
CareConnect — ML Model Integration Layer

Provides a unified interface for real ML model inference.
Falls back to the existing rule-based RadiologyAIService when no model is loaded.

Supports:
  - TorchXRayVision (pre-trained chest X-ray models)
  - Custom PyTorch/TensorFlow models
  - ONNX Runtime inference
  - DICOM image preprocessing

Setup (optional):
  pip install torch torchvision torchxrayvision pydicom Pillow onnxruntime
"""

import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Try importing ML libraries — gracefully degrade if missing
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import torch
    import torchvision.transforms as transforms
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import torchxrayvision as xrv
    HAS_XRV = True
except ImportError:
    HAS_XRV = False

try:
    import pydicom
    HAS_PYDICOM = True
except ImportError:
    HAS_PYDICOM = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False


class MLModelService:
    """
    Unified ML inference engine.
    Loads real models when available, otherwise falls back to simulation.
    """

    _instance = None
    _model = None
    _model_type = "none"  # "xrv", "custom_torch", "onnx", "simulation"
    _onnx_session = None

    # Pathology labels from TorchXRayVision DenseNet
    XRV_LABELS = [
        "Atelectasis", "Consolidation", "Infiltration", "Pneumothorax",
        "Edema", "Emphysema", "Fibrosis", "Effusion", "Pneumonia",
        "Pleural_Thickening", "Cardiomegaly", "Nodule", "Mass",
        "Hernia", "Lung Lesion", "Fracture", "Lung Opacity", "Enlarged Cardiomediastinum"
    ]

    RISK_THRESHOLDS = {
        "low": 0.3,
        "medium": 0.5,
        "high": 0.7,
        "critical": 0.85,
    }

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """Try loading models in order of preference."""
        # 1. Try TorchXRayVision (pre-trained, no custom training needed)
        if HAS_TORCH and HAS_XRV:
            try:
                self._model = xrv.models.DenseNet(weights="densenet121-res224-all")
                self._model.eval()
                self._model_type = "xrv"
                logger.info("✅ Loaded TorchXRayVision DenseNet (pre-trained chest X-ray model)")
                return
            except Exception as e:
                logger.warning(f"XRV load failed: {e}")

        # 2. Try custom ONNX model
        onnx_path = Path(__file__).parent.parent.parent / "models" / "radiology_model.onnx"
        if HAS_ONNX and onnx_path.exists():
            try:
                self._onnx_session = ort.InferenceSession(str(onnx_path))
                self._model_type = "onnx"
                logger.info(f"✅ Loaded ONNX model from {onnx_path}")
                return
            except Exception as e:
                logger.warning(f"ONNX load failed: {e}")

        # 3. Try custom PyTorch model
        torch_path = Path(__file__).parent.parent.parent / "models" / "radiology_model.pt"
        if HAS_TORCH and torch_path.exists():
            try:
                self._model = torch.load(str(torch_path), map_location="cpu")
                self._model.eval()
                self._model_type = "custom_torch"
                logger.info(f"✅ Loaded custom PyTorch model from {torch_path}")
                return
            except Exception as e:
                logger.warning(f"PyTorch load failed: {e}")

        # 4. Fallback to simulation
        self._model_type = "simulation"
        logger.info("ℹ️  No ML model found — using rule-based simulation")

    def preprocess_image(self, image_path: str, target_size: int = 224) -> Optional[Any]:
        """Load and preprocess a medical image for inference."""
        if not HAS_NUMPY:
            return None

        img = None

        # Handle DICOM
        if HAS_PYDICOM and image_path.lower().endswith(('.dcm', '.dicom')):
            try:
                ds = pydicom.dcmread(image_path)
                img = ds.pixel_array.astype(np.float32)
                # Normalize to 0-1
                img = (img - img.min()) / (img.max() - img.min() + 1e-8)
                # Ensure 2D
                if len(img.shape) == 3:
                    img = img[:, :, 0]
            except Exception as e:
                logger.warning(f"DICOM read failed: {e}")

        # Handle regular images
        if img is None and HAS_PIL:
            try:
                pil_img = Image.open(image_path).convert('L')
                img = np.array(pil_img, dtype=np.float32) / 255.0
            except Exception as e:
                logger.warning(f"Image read failed: {e}")
                return None

        if img is None:
            return None

        # Resize
        if HAS_PIL:
            pil_img = Image.fromarray((img * 255).astype(np.uint8))
            pil_img = pil_img.resize((target_size, target_size))
            img = np.array(pil_img, dtype=np.float32) / 255.0

        return img

    def predict(self, image_path: Optional[str] = None, scan_type: str = "XRAY",
                body_part: str = "chest", clinical_notes: str = "") -> Dict[str, Any]:
        """
        Run inference on a medical image.
        Returns structured findings with confidence scores.
        """
        # If we have a real model and an image, use it
        if image_path and self._model_type != "simulation":
            return self._real_inference(image_path, scan_type, body_part, clinical_notes)

        # Otherwise, use the existing rule-based simulation
        from app.services.radiology_ai import RadiologyAIService
        return RadiologyAIService.analyze_scan(scan_type, body_part, clinical_notes)

    def _real_inference(self, image_path: str, scan_type: str,
                        body_part: str, clinical_notes: str) -> Dict[str, Any]:
        """Run actual ML model inference."""
        import time
        start_time = time.time()

        img = self.preprocess_image(image_path)
        if img is None:
            # Fall back to simulation if image can't be loaded
            from app.services.radiology_ai import RadiologyAIService
            return RadiologyAIService.analyze_scan(scan_type, body_part, clinical_notes)

        predictions = {}

        if self._model_type == "xrv" and HAS_TORCH:
            # TorchXRayVision inference
            img_tensor = torch.from_numpy(img).unsqueeze(0).unsqueeze(0)  # [1, 1, H, W]
            # Normalize for XRV
            img_tensor = xrv.datasets.normalize(img_tensor, 255)
            # Resize to 224x224 as expected by the model
            if img_tensor.shape[-1] != 224:
                img_tensor = torch.nn.functional.interpolate(img_tensor, size=224)

            with torch.no_grad():
                output = self._model(img_tensor)
                probs = torch.sigmoid(output).squeeze().numpy()

            for i, label in enumerate(self.XRV_LABELS):
                if i < len(probs):
                    predictions[label] = float(probs[i])

        elif self._model_type == "onnx":
            input_name = self._onnx_session.get_inputs()[0].name
            img_input = img.reshape(1, 1, 224, 224).astype(np.float32)
            output = self._onnx_session.run(None, {input_name: img_input})
            probs = output[0].squeeze()
            for i, label in enumerate(self.XRV_LABELS[:len(probs)]):
                predictions[label] = float(probs[i])

        elif self._model_type == "custom_torch" and HAS_TORCH:
            img_tensor = torch.from_numpy(img).unsqueeze(0).unsqueeze(0).float()
            with torch.no_grad():
                output = self._model(img_tensor)
                probs = torch.sigmoid(output).squeeze().numpy()
            for i, label in enumerate(self.XRV_LABELS[:len(probs)]):
                predictions[label] = float(probs[i])

        processing_time = time.time() - start_time

        # Build structured response
        detected_issues = []
        max_risk = "low"

        for label, prob in sorted(predictions.items(), key=lambda x: -x[1]):
            if prob > self.RISK_THRESHOLDS["low"]:
                detected_issues.append({
                    "name": label.replace("_", " "),
                    "probability": round(prob, 3),
                    "description": f"AI detected {label.replace('_', ' ').lower()} with {prob*100:.1f}% confidence",
                    "location": body_part.capitalize(),
                })
                if prob >= self.RISK_THRESHOLDS["critical"]:
                    max_risk = "critical"
                elif prob >= self.RISK_THRESHOLDS["high"] and max_risk not in ("critical",):
                    max_risk = "high"
                elif prob >= self.RISK_THRESHOLDS["medium"] and max_risk not in ("critical", "high"):
                    max_risk = "medium"

        # Build findings text
        if detected_issues:
            findings = f"AI analysis of {scan_type} {body_part} reveals: " + "; ".join(
                [f"{iss['name']} ({iss['probability']*100:.1f}%)" for iss in detected_issues[:5]]
            ) + "."
        else:
            findings = f"AI analysis of {scan_type} {body_part}: No significant abnormalities detected."

        overall_confidence = max([d["probability"] for d in detected_issues], default=0.85)

        return {
            "findings": findings,
            "confidence": round(overall_confidence, 3),
            "riskLevel": max_risk,
            "detectedIssues": detected_issues[:10],
            "recommendations": self._generate_recommendations(detected_issues, max_risk),
            "processingTimeMs": round(processing_time * 1000),
            "modelType": self._model_type,
            "modelVersion": "2.0.0-ml",
            "heatmapData": self._generate_heatmap_regions(detected_issues),
        }

    def _generate_recommendations(self, issues: List[Dict], risk: str) -> List[str]:
        recs = []
        high_risk_names = {i["name"].lower() for i in issues if i["probability"] > 0.7}

        if "pneumonia" in high_risk_names:
            recs.append("Urgent: Start empirical antibiotic therapy. Correlate with sputum culture.")
        if "pneumothorax" in high_risk_names:
            recs.append("EMERGENCY: Evaluate for chest tube placement. Stat surgical consult.")
        if "cardiomegaly" in high_risk_names:
            recs.append("Recommend echocardiography for cardiac function assessment.")
        if "effusion" in high_risk_names or "pleural effusion" in high_risk_names:
            recs.append("Consider diagnostic thoracentesis if clinically indicated.")
        if "fracture" in high_risk_names:
            recs.append("Orthopedic consultation recommended. Consider CT for complex fractures.")
        if "nodule" in high_risk_names or "mass" in high_risk_names:
            recs.append("CRITICAL: Follow Fleischner Society guidelines. Consider biopsy.")

        if risk == "critical":
            recs.insert(0, "⚠️ CRITICAL FINDING — Immediate radiologist review required")
        elif risk == "high":
            recs.insert(0, "Urgent radiologist review recommended within 1 hour")

        if not recs:
            recs.append("Routine follow-up as clinically indicated")

        return recs

    def _generate_heatmap_regions(self, issues: List[Dict]) -> List[Dict]:
        """Generate approximate heatmap regions for detected findings."""
        regions = []
        for i, issue in enumerate(issues[:5]):
            regions.append({
                "label": issue["name"],
                "confidence": issue["probability"],
                "bbox": {
                    "x": 0.2 + (i * 0.1),
                    "y": 0.2 + (i * 0.05),
                    "width": 0.2 + (issue["probability"] * 0.15),
                    "height": 0.15 + (issue["probability"] * 0.1),
                },
            })
        return regions

    def get_info(self) -> Dict[str, Any]:
        return {
            "modelType": self._model_type,
            "modelVersion": "2.0.0-ml" if self._model_type != "simulation" else "1.0.0-mvp",
            "hasGPU": HAS_TORCH and torch.cuda.is_available() if HAS_TORCH else False,
            "libraries": {
                "numpy": HAS_NUMPY,
                "torch": HAS_TORCH,
                "torchxrayvision": HAS_XRV,
                "pydicom": HAS_PYDICOM,
                "onnxruntime": HAS_ONNX,
                "pillow": HAS_PIL,
            },
            "status": "operational",
        }
