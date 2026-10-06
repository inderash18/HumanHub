"""Versioned Decision Policy & Evidence Synthesis Engine.

Combines C2PA Content Credentials, sanitized metadata, and pixel detector results
into a structured, versioned analysis outcome without arbitrary averaging.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from detectors.base import DetectorResult
from provenance.c2pa_verifier import C2PAProvenanceResult
from metadata.extractor import SanitizedMetadata

POLICY_VERSION = "2026.2"

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
    calibration_status: str = "CALIBRATED_PROVISIONAL"
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
        points: List[str] = []
        limitations = [
            "This automated check can make mistakes.",
            "Statistical detectors provide likelihood estimates and cannot guarantee 100% accuracy.",
            "Ordinary editing, compression, HDR, or portrait modes may influence feature statistics."
        ]

        # 1. Evaluate Authenticated Cryptographic C2PA Provenance
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
                points.append(f"Valid Content Credentials show generative AI editing was applied ({', '.join(provenance.ai_tools_mentioned) or 'Generative Tool'}).")
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
                points.append(f"Valid Content Credentials from hardware capture device ({provenance.signer_name or 'Hardware Signer'}).")
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

        # Note neutral metadata status
        if metadata.camera_make and metadata.camera_model:
            points.append(f"EXIF header indicates camera: {metadata.camera_make} {metadata.camera_model} (unsigned metadata).")
        elif not metadata.has_exif:
            points.append("No EXIF metadata present (neutral evidence).")

        if metadata.software:
            points.append(f"Creation software reported: {metadata.software} (unsigned).")

        # 2. Check Detector Execution Status
        if detector.status in ("UNAVAILABLE", "FAILED"):
            # Never synthesize an AI verdict when the detector is unavailable or failed
            outcome = "CHECK_UNAVAILABLE"
            primary_exp = "Automated pixel analysis is currently unavailable for this media format or configuration."
            points.append("Pixel detector is unavailable. Honest abstention returned without AI classification.")
            badge_label = "Image check unavailable"
            badge_var = "unavailable"

            # If explicit generation prompt parameters are present in unsigned metadata without active detector
            if metadata.has_ai_generation_parameters:
                outcome = "INCONCLUSIVE"
                badge_label = "Could not determine"
                badge_var = "neutral"
                primary_exp = "Unsigned header tags suggest generative parameters, but automated pixel model verification is unavailable."

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

        # 3. Detector Completed: Apply Uncertainty Thresholds
        score = detector.raw_score if detector.raw_score is not None else 0.5
        points.append(f"UniversalFakeDetect analyzed pixel patterns (score: {score:.2f}, eval mode).")

        if score >= self.high_threshold:
            outcome = "LIKELY_AI_GENERATED"
            badge_label = "Likely AI-generated"
            badge_var = "warning"
            primary_exp = "Statistical analysis of image features indicates characteristics common in synthetic or AI-generated media."
        elif score <= self.low_threshold and not metadata.has_ai_generation_parameters:
            outcome = "NO_STRONG_AI_SIGNALS"
            badge_label = "Likely authentic"
            badge_var = "neutral"
            primary_exp = "Pixel feature analysis and metadata inspection found no indicators of generative AI synthesis."
            limitations.append("A 'Likely authentic' verdict does not guarantee an image is an original photograph.")
        else:
            outcome = "INCONCLUSIVE"
            badge_label = "Could not determine"
            badge_var = "neutral"
            primary_exp = "Evidence is intermediate or ambiguous. This automated check abstains from making a definitive determination."

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
