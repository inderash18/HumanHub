"""Versioned Decision Policy & Evidence Synthesis Engine.

POLICY RULES:
1. Gemini detector = Sole Authoritative Signal for Blocking.
2. All other detectors (C2PA, Content Credentials, EXIF/XMP metadata, UnivFD, local forensics) = Advisory Only.
3. Publication is BLOCKED ONLY when Gemini detector returns AI_GENERATED or LIKELY_AI_GENERATED.
4. All non-Gemini signals, missing Gemini configuration, timeouts, or inconclusive results allow publishing (ALLOWED).
5. All C2PA, metadata, and pixel detector evidence is stored in MongoDB for transparency and admin inspection.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from detectors.base import DetectorResult
from detectors.google_synthid import GoogleAiDetectionResult
from detectors.gemini_detector import GeminiDetectionResult
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
    outcome: str  # GOOGLE_AI_ORIGIN_DOCUMENTED | GOOGLE_AI_EDITING_DOCUMENTED | AI_ORIGIN_DOCUMENTED | AI_EDITING_DOCUMENTED | LIKELY_AI_GENERATED | NO_STRONG_AI_SIGNALS | LIKELY_AUTHENTIC | INCONCLUSIVE | CHECK_UNAVAILABLE
    publication_decision: str  # ALLOWED | BLOCKED | HELD_FOR_REVIEW | PENDING
    decision_reason: str
    google_ai_detection: GoogleAiDetectionResult
    gemini_detection: Optional[GeminiDetectionResult] = None
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
        detector: DetectorResult,
        google_detection: GoogleAiDetectionResult,
        gemini_detection: Optional[GeminiDetectionResult] = None
    ) -> AnalysisReport:
        points: List[str] = []
        limitations = [
            "Gemini automatic verification is the authoritative gate for publication decisions.",
            "C2PA Content Credentials, metadata, and pixel forensics provide advisory evidence only."
        ]

        if gemini_detection is None:
            gemini_detection = GeminiDetectionResult()

        # Collect advisory provenance and metadata evidence points
        if provenance.status in ("VALID_TRUSTED", "VALID_UNTRUSTED_SIGNER") and provenance.manifest_present:
            if provenance.is_google_ai_origin_asserted or provenance.is_ai_origin_asserted:
                tools_str = ', '.join(provenance.google_tools_mentioned or provenance.ai_tools_mentioned) or 'Generative Tool'
                points.append(f"Content Credentials show AI creation metadata ({tools_str}) — stored as advisory evidence.")
            if provenance.is_camera_capture_asserted:
                points.append(f"Hardware Content Credentials verify physical camera sensor origin ({provenance.signer_name or 'Camera'}).")

        if metadata.is_google_ai_metadata_detected or metadata.has_ai_generation_parameters:
            points.append(f"Metadata indicators detected ({metadata.ai_generation_software_detected or 'AI Parameters'}) — stored as advisory evidence.")

        if detector.status == "COMPLETED" and detector.raw_score is not None:
            points.append(f"UniversalFakeDetect statistical feature score: {detector.raw_score:.2f} (advisory).")

        # =========================================================================
        # 1. AUTHORITATIVE RULE: Only Gemini AI detector can block
        # =========================================================================
        if gemini_detection.status == "COMPLETED":
            if gemini_detection.label in ("AI_GENERATED", "LIKELY_AI_GENERATED"):
                points.insert(0, f"Gemini vision verification: {gemini_detection.label} ({gemini_detection.explanation or 'AI patterns confirmed'}).")
                return AnalysisReport(
                    outcome="LIKELY_AI_GENERATED",
                    publication_decision="BLOCKED",
                    decision_reason="Gemini detected this image as AI-generated. Publishing is blocked.",
                    google_ai_detection=google_detection,
                    gemini_detection=gemini_detection,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="Gemini detected likely AI-generated image",
                        badge_variant="warning",
                        primary_explanation="Gemini detected this image as AI-generated. Publishing is blocked.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=False
                    )
                )
            elif gemini_detection.label == "LIKELY_AUTHENTIC":
                points.insert(0, "Gemini vision verification: Authenticated human / real media.")
                return AnalysisReport(
                    outcome="LIKELY_AUTHENTIC",
                    publication_decision="ALLOWED",
                    decision_reason="Gemini verified media as authentic. Approved for publishing.",
                    google_ai_detection=google_detection,
                    gemini_detection=gemini_detection,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="Likely real image",
                        badge_variant="verified",
                        primary_explanation="Gemini automatic verification confirmed authentic image characteristics.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=provenance.is_camera_capture_asserted
                    )
                )

        # =========================================================================
        # 2. ALL OTHER CASES: Always ALLOW publication with advisory badges
        # =========================================================================
        # Check if C2PA or Metadata contains AI provenance to show advisory info badge
        has_ai_provenance = (
            provenance.manifest_present and (provenance.is_google_ai_origin_asserted or provenance.is_ai_origin_asserted)
        ) or metadata.is_google_ai_metadata_detected

        if has_ai_provenance:
            outcome = "AI_ORIGIN_DOCUMENTED" if not provenance.is_google_ai_origin_asserted else "GOOGLE_AI_ORIGIN_DOCUMENTED"
            badge_label = "Content Credentials detected AI provenance"
            badge_variant = "info"
            primary_exp = "Content Credentials detected AI provenance (advisory only). Post publishing is allowed."
            dec_reason = "Advisory AI provenance documented. Approved for publishing."
        elif provenance.is_camera_capture_asserted:
            outcome = "NO_STRONG_AI_SIGNALS"
            badge_label = "Camera capture documented"
            badge_variant = "verified"
            primary_exp = "Hardware Content Credentials verify this image originated from a physical camera sensor."
            dec_reason = "Camera capture authenticated. Approved for publishing."
        elif detector.status == "COMPLETED" and detector.raw_score is not None and detector.raw_score <= self.low_threshold:
            outcome = "LIKELY_AUTHENTIC"
            badge_label = "Likely real image"
            badge_variant = "verified"
            primary_exp = "Pixel feature analysis found no strong indicators of generative AI synthesis."
            dec_reason = "Low synthetic score and no authoritative AI verdict. Approved for publishing."
        elif gemini_detection.status in ("NOT_CONFIGURED", "UNAVAILABLE", "FAILED"):
            outcome = "NO_STRONG_AI_SIGNALS"
            badge_label = "Gemini verification unavailable, post allowed"
            badge_variant = "neutral"
            primary_exp = "Gemini verification was not performed or unavailable. Post publishing is allowed."
            dec_reason = "Gemini verification unavailable, post allowed."
        else:
            outcome = "NO_STRONG_AI_SIGNALS"
            badge_label = "Likely real image"
            badge_variant = "verified"
            primary_exp = "No authoritative AI generation detected. Approved for publishing."
            dec_reason = "Approved for publishing."

        return AnalysisReport(
            outcome=outcome,
            publication_decision="ALLOWED",
            decision_reason=dec_reason,
            google_ai_detection=google_detection,
            gemini_detection=gemini_detection,
            provenance=provenance,
            metadata=metadata,
            detector=detector,
            evidence=EvidenceSummary(
                badge_label=badge_label,
                badge_variant=badge_variant,
                primary_explanation=primary_exp,
                detailed_points=points,
                limitations=limitations,
                camera_origin_verified=provenance.is_camera_capture_asserted
            )
        )
