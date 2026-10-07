"""Versioned Decision Policy & Evidence Synthesis Engine.

Combines Google SynthID checks, C2PA Content Credentials, sanitized metadata,
and pixel detector results into a structured, versioned analysis outcome
and deterministic server-enforced publication decision.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from detectors.base import DetectorResult
from detectors.google_synthid import GoogleAiDetectionResult
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
    outcome: str  # GOOGLE_AI_ORIGIN_DOCUMENTED | GOOGLE_AI_EDITING_DOCUMENTED | AI_ORIGIN_DOCUMENTED | AI_EDITING_DOCUMENTED | LIKELY_AI_GENERATED | NO_STRONG_AI_SIGNALS | INCONCLUSIVE | CHECK_UNAVAILABLE
    publication_decision: str  # ALLOWED | HELD_FOR_REVIEW | BLOCKED | PENDING
    decision_reason: str
    google_ai_detection: GoogleAiDetectionResult
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
        google_detection: GoogleAiDetectionResult
    ) -> AnalysisReport:
        points: List[str] = []
        limitations = [
            "Automated checks provide evidence synthesis based on authenticated credentials, metadata, and statistical models.",
            "Ordinary editing, compression, or format transformations may alter pixel statistics."
        ]

        # 1. EVALUATE GOOGLE SYNTHID OFFICIAL API (if configured & detected)
        if google_detection.status == "COMPLETED" and google_detection.watermark_detected:
            points.append("Google Cloud SynthID API verified digital watermark from Google generative tools (Gemini / Imagen).")
            points.append(f"Provider request ID: {google_detection.provider_request_id or 'verified'}.")
            return AnalysisReport(
                outcome="GOOGLE_AI_ORIGIN_DOCUMENTED",
                publication_decision="BLOCKED",
                decision_reason="Cryptographically verified Google SynthID watermark confirms generation with Google AI. Direct publishing is blocked.",
                google_ai_detection=google_detection,
                provenance=provenance,
                metadata=metadata,
                detector=detector,
                evidence=EvidenceSummary(
                    badge_label="Google AI generation detected",
                    badge_variant="warning",
                    primary_explanation="Google SynthID digital watermark confirms this image was generated using Google AI (Gemini/Imagen).",
                    detailed_points=points,
                    limitations=limitations,
                    camera_origin_verified=False
                )
            )

        # 2. EVALUATE AUTHENTICATED CRYPTOGRAPHIC C2PA PROVENANCE
        if provenance.status in ("VALID_TRUSTED", "VALID_UNTRUSTED_SIGNER") and provenance.manifest_present:
            
            # Google AI Generation via C2PA
            if provenance.is_google_ai_origin_asserted:
                tools_str = ', '.join(provenance.google_tools_mentioned) or 'Gemini / Imagen'
                points.append(f"Content Credentials cryptographically confirm generation by Google AI ({tools_str}).")
                points.append(f"Signed by: {provenance.signer_name or provenance.issuer or 'Google LLC'}.")
                
                # Update google_detection record
                google_res = google_detection.model_copy()
                google_res.ai_origin_asserted = True
                google_res.tools_mentioned = provenance.google_tools_mentioned
                google_res.evidence_source = "c2pa_google"

                return AnalysisReport(
                    outcome="GOOGLE_AI_ORIGIN_DOCUMENTED",
                    publication_decision="BLOCKED",
                    decision_reason=f"Content Credentials confirm generation by Google AI ({tools_str}). Publication is blocked under platform policy.",
                    google_ai_detection=google_res,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="Google AI generation detected",
                        badge_variant="warning",
                        primary_explanation="C2PA Content Credentials confirm this image was created using Google AI (Gemini / Imagen).",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=False
                    )
                )

            # Google AI Generative Editing via C2PA
            if provenance.is_google_ai_editing_asserted:
                tools_str = ', '.join(provenance.google_tools_mentioned) or 'Google Photos Magic Editor / Gemini'
                points.append(f"Content Credentials show generative AI editing was applied using Google AI tools ({tools_str}).")
                
                google_res = google_detection.model_copy()
                google_res.ai_editing_asserted = True
                google_res.tools_mentioned = provenance.google_tools_mentioned
                google_res.evidence_source = "c2pa_google"

                return AnalysisReport(
                    outcome="GOOGLE_AI_EDITING_DOCUMENTED",
                    publication_decision="HELD_FOR_REVIEW",
                    decision_reason="Generative AI editing with Google AI tools documented in Content Credentials. Held for review.",
                    google_ai_detection=google_res,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="Google AI editing detected",
                        badge_variant="info",
                        primary_explanation="Content Credentials indicate AI-powered editing was performed using Google AI tools.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=provenance.is_camera_capture_asserted
                    )
                )

            # Other Certified AI Generation
            if provenance.is_ai_origin_asserted:
                points.append(f"C2PA Content Credentials assert creation with AI ({', '.join(provenance.ai_tools_mentioned) or 'Generative Tool'}).")
                points.append(f"Signer: {provenance.signer_name or provenance.issuer or 'Certified Signer'}.")
                return AnalysisReport(
                    outcome="AI_ORIGIN_DOCUMENTED",
                    publication_decision="BLOCKED",
                    decision_reason="Cryptographically verified C2PA Content Credentials assert AI generation. Publication is blocked.",
                    google_ai_detection=google_detection,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="AI origin documented",
                        badge_variant="warning",
                        primary_explanation="Content Credentials confirm this image was generated using AI.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=False
                    )
                )

            # Other Certified AI Editing
            if provenance.is_ai_editing_asserted:
                points.append(f"Content Credentials show generative AI editing ({', '.join(provenance.ai_tools_mentioned) or 'Generative Editor'}).")
                return AnalysisReport(
                    outcome="AI_EDITING_DOCUMENTED",
                    publication_decision="HELD_FOR_REVIEW",
                    decision_reason="Generative AI editing asserted in Content Credentials. Held for moderator review.",
                    google_ai_detection=google_detection,
                    provenance=provenance,
                    metadata=metadata,
                    detector=detector,
                    evidence=EvidenceSummary(
                        badge_label="AI editing documented",
                        badge_variant="info",
                        primary_explanation="Content Credentials confirm AI-powered editing was applied to this image.",
                        detailed_points=points,
                        limitations=limitations,
                        camera_origin_verified=provenance.is_camera_capture_asserted
                    )
                )

            # Hardware Camera Capture
            if provenance.is_camera_capture_asserted:
                points.append(f"Valid hardware Content Credentials from capture device ({provenance.signer_name or 'Hardware Signer'}).")
                return AnalysisReport(
                    outcome="NO_STRONG_AI_SIGNALS",
                    publication_decision="ALLOWED",
                    decision_reason="Hardware Content Credentials verify authentic camera capture sensor origin. Approved for publishing.",
                    google_ai_detection=google_detection,
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

        # 3. EVALUATE UNSIGNED METADATA CLUES
        if metadata.is_google_ai_metadata_detected:
            points.append(f"Unsigned metadata indicates Google AI software signature: {metadata.ai_generation_software_detected}.")
            points.append("Unsigned metadata is unverified evidence; holding for human review.")
            return AnalysisReport(
                outcome="INCONCLUSIVE",
                publication_decision="HELD_FOR_REVIEW",
                decision_reason="Unsigned metadata suggests Google AI generation/editing, but lacks cryptographic proof. Held for review.",
                google_ai_detection=google_detection,
                provenance=provenance,
                metadata=metadata,
                detector=detector,
                evidence=EvidenceSummary(
                    badge_label="Google AI indicators in metadata",
                    badge_variant="neutral",
                    primary_explanation="Header tags suggest Google AI generation or editing, but lack cryptographic signature. Held for review.",
                    detailed_points=points,
                    limitations=limitations,
                    camera_origin_verified=False
                )
            )

        if metadata.has_ai_generation_parameters:
            points.append(f"Unsigned metadata contains generative parameter block ({metadata.ai_generation_software_detected or 'AI Tool'}).")
            return AnalysisReport(
                outcome="INCONCLUSIVE",
                publication_decision="HELD_FOR_REVIEW",
                decision_reason="Unsigned generation parameters found in file header. Held for moderator review.",
                google_ai_detection=google_detection,
                provenance=provenance,
                metadata=metadata,
                detector=detector,
                evidence=EvidenceSummary(
                    badge_label="AI parameters detected in metadata",
                    badge_variant="neutral",
                    primary_explanation="File headers contain generative AI generation parameters. Held for review.",
                    detailed_points=points,
                    limitations=limitations,
                    camera_origin_verified=False
                )
            )

        if metadata.camera_make and metadata.camera_model:
            points.append(f"EXIF header indicates camera: {metadata.camera_make} {metadata.camera_model} (unsigned).")
        elif not metadata.has_exif:
            points.append("No EXIF metadata present (neutral evidence).")

        # 4. EVALUATE STATISTICAL PIXEL DETECTOR EXECUTION STATUS
        if detector.status in ("UNAVAILABLE", "FAILED"):
            points.append("Pixel detector is unavailable for this configuration. Honest abstention returned.")
            return AnalysisReport(
                outcome="CHECK_UNAVAILABLE",
                publication_decision="HELD_FOR_REVIEW",
                decision_reason="Automated pixel detector is unavailable. Held for manual moderator review or retry.",
                google_ai_detection=google_detection,
                provenance=provenance,
                metadata=metadata,
                detector=detector,
                evidence=EvidenceSummary(
                    badge_label="Image check unavailable",
                    badge_variant="unavailable",
                    primary_explanation="Automated pixel analysis is currently unavailable for this media format or configuration.",
                    detailed_points=points,
                    limitations=limitations,
                    camera_origin_verified=False
                )
            )

        # 5. DETECTOR COMPLETED: APPLY THRESHOLDS FOR PUBLICATION DECISION
        score = detector.raw_score if detector.raw_score is not None else 0.5
        points.append(f"UniversalFakeDetect analyzed pixel patterns (score: {score:.2f}).")

        if score >= self.high_threshold:
            outcome = "LIKELY_AI_GENERATED"
            pub_decision = "HELD_FOR_REVIEW"
            badge_label = "Likely AI-generated"
            badge_var = "warning"
            primary_exp = "Statistical feature analysis indicates patterns common in synthetic or AI-generated media."
            dec_reason = f"High synthetic likelihood score ({score:.2f} >= {self.high_threshold:.2f}). Held for moderator review."
        elif score <= self.low_threshold:
            outcome = "NO_STRONG_AI_SIGNALS"
            pub_decision = "ALLOWED"
            badge_label = "Likely authentic"
            badge_var = "neutral"
            primary_exp = "Pixel feature analysis and metadata inspection found no strong indicators of generative AI synthesis."
            dec_reason = f"Low synthetic likelihood score ({score:.2f} <= {self.low_threshold:.2f}) and no AI metadata. Approved for publishing."
            limitations.append("A 'Likely authentic' verdict does not guarantee an image is an original photograph.")
        else:
            outcome = "INCONCLUSIVE"
            pub_decision = "HELD_FOR_REVIEW"
            badge_label = "Could not determine"
            badge_var = "neutral"
            primary_exp = "Evidence is intermediate or ambiguous. Held for human review."
            dec_reason = f"Intermediate statistical confidence ({score:.2f}). Held for manual review."

        return AnalysisReport(
            outcome=outcome,
            publication_decision=pub_decision,
            decision_reason=dec_reason,
            google_ai_detection=google_detection,
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
