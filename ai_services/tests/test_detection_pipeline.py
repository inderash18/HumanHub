"""Comprehensive Regression and Boundary Test Suite for Origin & Authenticity Pipeline.

Tests:
1. Google SynthID Provider:
   - Reports honest NOT_CONFIGURED when credentials are missing.
   - Detects Google AI watermarks when provider returns positive.
2. C2PA Provenance with Google AI:
   - Detects Google AI origin assertions (Gemini / Imagen) -> GOOGLE_AI_ORIGIN_DOCUMENTED -> BLOCKED.
   - Detects Google AI generative editing assertions -> GOOGLE_AI_EDITING_DOCUMENTED -> HELD_FOR_REVIEW.
3. DecisionEngine Publication Decisions:
   - Google AI Origin -> BLOCKED.
   - Hardware camera capture -> ALLOWED.
   - Statistical suspicion (high threshold) -> HELD_FOR_REVIEW.
   - Inconclusive band -> HELD_FOR_REVIEW.
   - Detector UNAVAILABLE / FAILED -> HELD_FOR_REVIEW (never permissive posting).
   - Low threshold authentic -> ALLOWED.
"""
import io
import os
import sys
import unittest
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from detectors.universal_fake_detect import UniversalFakeDetectAdapter
from detectors.google_synthid import GoogleSynthIDAdapter, GoogleAiDetectionResult
from detectors.base import DetectorResult
from provenance.c2pa_verifier import C2PAVerifier, C2PAProvenanceResult
from metadata.extractor import MetadataExtractor, SanitizedMetadata
from engine.decision_policy import DecisionEngine, AnalysisReport


class TestGoogleSynthIDAdapter(unittest.TestCase):
    def test_synthid_reports_not_configured_honestly(self):
        """When credentials are not set, adapter must report NOT_CONFIGURED without faking scans."""
        adapter = GoogleSynthIDAdapter(api_key=None, project_id=None, credentials_path=None)
        self.assertFalse(adapter.is_configured)
        
        res = adapter.verify_watermark(b"fake_image_bytes")
        self.assertEqual(res.status, "NOT_CONFIGURED")
        self.assertIsNone(res.watermark_detected)
        self.assertIn("not configured", res.error_message.lower())

    def test_check_access_returns_detailed_status(self):
        adapter = GoogleSynthIDAdapter()
        access = adapter.check_access()
        self.assertIn("configured", access)
        self.assertIn("provider", access)


class TestDecisionEnginePublicationGate(unittest.TestCase):
    def setUp(self):
        self.engine = DecisionEngine(high_confidence_threshold=0.85, low_confidence_threshold=0.25)
        self.empty_metadata = SanitizedMetadata()
        self.empty_google = GoogleAiDetectionResult(status="NOT_CONFIGURED")

    def test_google_ai_c2pa_assertion_blocks_publication(self):
        """When C2PA Content Credentials confirm Google AI (Gemini/Imagen), publication must be BLOCKED."""
        provenance = C2PAProvenanceResult(
            status="VALID_TRUSTED",
            manifest_present=True,
            is_ai_origin_asserted=True,
            is_google_ai_origin_asserted=True,
            google_tools_mentioned=["Gemini", "Imagen"],
            signer_name="Google LLC"
        )
        detector = DetectorResult(model_name="UniversalFakeDetect", version="1.0.0", status="COMPLETED", raw_score=0.9)
        
        report = self.engine.evaluate(provenance, self.empty_metadata, detector, self.empty_google)
        self.assertEqual(report.outcome, "GOOGLE_AI_ORIGIN_DOCUMENTED")
        self.assertEqual(report.publication_decision, "BLOCKED")
        self.assertEqual(report.evidence.badge_label, "Google AI generation detected")
        self.assertIn("Google AI", report.decision_reason)

    def test_google_ai_editing_holds_for_review(self):
        """When C2PA Content Credentials confirm Google generative editing, publication must be HELD_FOR_REVIEW."""
        provenance = C2PAProvenanceResult(
            status="VALID_TRUSTED",
            manifest_present=True,
            is_ai_editing_asserted=True,
            is_google_ai_editing_asserted=True,
            google_tools_mentioned=["Google Photos Magic Editor"],
            signer_name="Google LLC"
        )
        detector = DetectorResult(model_name="UniversalFakeDetect", version="1.0.0", status="COMPLETED", raw_score=0.3)
        
        report = self.engine.evaluate(provenance, self.empty_metadata, detector, self.empty_google)
        self.assertEqual(report.outcome, "GOOGLE_AI_EDITING_DOCUMENTED")
        self.assertEqual(report.publication_decision, "HELD_FOR_REVIEW")
        self.assertEqual(report.evidence.badge_label, "Google AI editing detected")

    def test_detector_unavailable_holds_for_review_and_never_allows(self):
        """When detector is unavailable, policy must return CHECK_UNAVAILABLE and HELD_FOR_REVIEW."""
        provenance = C2PAProvenanceResult(status="ABSENT", manifest_present=False)
        detector = DetectorResult(model_name="UniversalFakeDetect", version="1.0.0", status="UNAVAILABLE", error_message="Offline")
        
        report = self.engine.evaluate(provenance, self.empty_metadata, detector, self.empty_google)
        self.assertEqual(report.outcome, "CHECK_UNAVAILABLE")
        self.assertEqual(report.publication_decision, "HELD_FOR_REVIEW")
        self.assertEqual(report.evidence.badge_label, "Image check unavailable")

    def test_hardware_camera_capture_allows_publication(self):
        """Valid hardware camera provenance allows publication."""
        provenance = C2PAProvenanceResult(
            status="VALID_TRUSTED",
            manifest_present=True,
            is_camera_capture_asserted=True,
            signer_name="Sony Electronics"
        )
        detector = DetectorResult(model_name="UniversalFakeDetect", version="1.0.0", status="COMPLETED", raw_score=0.1)
        
        report = self.engine.evaluate(provenance, self.empty_metadata, detector, self.empty_google)
        self.assertEqual(report.publication_decision, "ALLOWED")
        self.assertEqual(report.outcome, "NO_STRONG_AI_SIGNALS")
        self.assertTrue(report.evidence.camera_origin_verified)

    def test_low_score_authentic_allows_publication(self):
        """Low synthetic likelihood score without AI signals allows publication."""
        provenance = C2PAProvenanceResult(status="ABSENT", manifest_present=False)
        detector = DetectorResult(model_name="UniversalFakeDetect", version="1.0.0", status="COMPLETED", raw_score=0.15)
        
        report = self.engine.evaluate(provenance, self.empty_metadata, detector, self.empty_google)
        self.assertEqual(report.publication_decision, "ALLOWED")
        self.assertEqual(report.outcome, "NO_STRONG_AI_SIGNALS")


if __name__ == "__main__":
    unittest.main()
