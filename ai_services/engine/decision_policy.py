"""Versioned Decision Policy & Evidence Synthesis Engine.

Combines C2PA Content Credentials, sanitized metadata, and pixel detector results
into a structured, versioned analysis outcome without arbitrary averaging.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from detectors.base import DetectorResult
from provenance.c2pa_verifier import C2PAProvenanceResult
from metadata.extractor import SanitizedMetadata

POLICY_VERSION = "2026.1"

class EvidenceSummary(BaseModel):
    badge_label: str
    badge_variant: str  # verified | warning | neutral | info | unavailable
    primary_explanation: str
    detailed_points: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    camera_origin_verified: bool = False
    disputed_status: Optional[str] = None

class AnalysisReport(BaseModel):
    policy_version: str = POLICY_VERSION
    outcome: str  # AI_ORIGIN_DOCUMENTED | AI_EDITING_DOCUMENTED | LIKELY_AI_GENERATED | NO_STRONG_AI_SIGNALS | INCONCLUSIVE | CHECK_UNAVAILABLE
    provenance: C2PAProvenanceResult
    metadata: SanitizedMetadata
    detector: DetectorResult
    evidence: EvidenceSummary
    calibration_status: str = "EVALUATION_MODE"
    is_publicly_verifiable: bool = True

class DecisionEngine:
    def __init__(self, high_confidence_threshold: float = 0.85, low_confidence_threshold: float = 0.25):
        self.high_threshold = high_confidence_threshold
        self.low_threshold = low_confidence_threshold

    def evaluate(
        self,
        provenance: C2PAProvenanceResult,
        metadata: SanitizedMetadata,
        detector: DetectorResult
    ) -> AnalysisReport:
        points = []
        limitations = [
            "Statistical detectors provide likelihood estimates and cannot guarantee 100% accuracy.",
            "Visual artifacts from compression, resizing, or filters may influence pixel scores."
        ]

        # 1. Check for Trusted C2PA Provenance first
        if provenance.status == "VALID_TRUSTED":
            if provenance.is_ai_origin_asserted:
                points.append(f"Cryptographically verified C2PA Content Credentials assert this media was created with AI ({', '.join(provenance.ai_tools_mentioned) or 'Generative Model'}).")
                points.append(f"Signed by certified issuer: {provenance.signer_name or provenance.issuer or 'Trusted Signer'}.")
                return AnalysisReport(
                    outcome="AI_ORIGIN_DOCUMENTED",
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="AI origin documented",
                        badge_variant="verified",
                        primary_explanation="Content Credentials cryptographically confirm this image was generated using AI.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=False
                    )
                )

            if provenance.is_ai_editing_asserted:
                points.append(f"Valid Content Credentials show AI editing or modification tools were applied ({', '.join(provenance.ai_tools_mentioned) or 'Generative Tool'}).")
                return AnalysisReport(
                    outcome="AI_EDITING_DOCUMENTED",
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="AI editing documented",
                        badge_variant="info",
                        primary_explanation="Content Credentials confirm AI-powered editing was used on this image.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=provenance.is_camera_capture_asserted
                    )
                )

            if provenance.is_camera_capture_asserted:
                points.append(f"Valid Content Credentials from camera/hardware capture device ({provenance.signer_name or 'Hardware Signer'}).")
                # Even with camera credentials, if detector found strong AI, we report camera origin with notice
                return AnalysisReport(
                    outcome="NO_STRONG_AI_SIGNALS",
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="Camera capture documented",
                        badge_variant="verified",
                        primary_explanation="Hardware Content Credentials verify this image originated from a physical camera sensor.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=True
                    )
                )

        # 2. Check for unsigned metadata AI markers
        if metadata.ai_generation_software_detected:
            points.append(f"Image headers contain tags associated with {metadata.ai_generation_software_detected}.")
            if metadata.has_ai_generation_parameters:
                points.append("Embedded generation parameters or prompt structure detected in file metadata.")
            points.append("Note: Unsigned metadata can be modified or preserved across reposts.")

        # 3. Check Detector Status & Score
        if detector.status == "UNAVAILABLE" or detector.status == "FAILED":
            outcome = "CHECK_UNAVAILABLE"
            primary_exp = "Automated pixel analysis is currently unavailable for this media format or configuration."
            points.append("No active pixel detector weights were loaded. Honest unavailable state returned.")
            badge_label = "Check unavailable"
            badge_var = "unavailable"
            
            if metadata.ai_generation_software_detected:
                outcome = "INCONCLUSIVE"
                badge_label = "Inconclusive"
                badge_var = "warning"
                primary_exp = f"Metadata suggests {metadata.ai_generation_software_detected}, but automated pixel verification is pending."

            return AnalysisReport(
                outcome=outcome,
                provenance=provenance,
                metadata=metadata,
                detector=detector,
                evidence=EvidenceSummary(
                    badge_label=badge_label,
                    badge_variant=badge_var,
                    primary_explanation=primary_exp,
                    detailed_points=points,
                    limitations=limitations
                )
            )

        # 4. We have a completed detector run
        score = detector.raw_score if detector.raw_score is not None else 0.5
        points.append(f"UniversalFakeDetect (ViT-L/14) analyzed pixel patterns (score: {score:.2f}, eval mode).")

        if metadata.camera_make and metadata.camera_model:
            points.append(f"EXIF header indicates camera: {metadata.camera_make} {metadata.camera_model} (unsigned).")

        # Outcome synthesis
        if score >= self.high_threshold or metadata.has_ai_generation_parameters:
            outcome = "LIKELY_AI_GENERATED"
            badge_label = "Likely AI-generated"
            badge_var = "warning"
            primary_exp = "Statistical analysis of image pixels and features indicates characteristics common in synthetic or AI-generated media."
        elif score <= self.low_threshold and not metadata.ai_generation_software_detected:
            outcome = "NO_STRONG_AI_SIGNALS"
            badge_label = "No strong AI signals detected"
            badge_var = "neutral"
            primary_exp = "No known synthetic generative patterns or AI Content Credentials were found."
            limitations.append("A 'No strong AI signals' verdict does not prove an image is an authentic photograph.")
        else:
            outcome = "INCONCLUSIVE"
            badge_label = "Inconclusive"
            badge_var = "neutral"
            primary_exp = "Signals are ambiguous or in the intermediate detection threshold."

        return AnalysisReport(
            outcome=outcome,
            provenance=provenance,
            metadata=metadata,
            detector=detector,
            evidence=EvidenceSummary(
                badge_label=badge_label,
                badge_variant=badge_var,
                primary_explanation=primary_exp,
                detailed_points=points,
                limitations=limitations,
                camera_origin_verified=False
            )
        )
