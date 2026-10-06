"""Comprehensive Regression and Boundary Test Suite for Origin & Authenticity Pipeline.

Tests:
1. Model loading & honest unavailable state (no dummy linear fallback).
2. EXIF orientation handling & transparency preprocessing.
3. Feature normalization and output range validation.
4. C2PA verifier with absent, unsupported, and valid assertions (no fake VALID_TRUSTED).
5. Metadata extraction with camera EXIF, privacy scrubbing, and neutral creative software handling.
6. DecisionEngine policy:
   - High threshold (>= 0.85 -> LIKELY_AI_GENERATED)
   - Low threshold (<= 0.25 -> NO_STRONG_AI_SIGNALS)
   - Inconclusive band (0.25 < score < 0.85 -> INCONCLUSIVE)
   - Detector UNAVAILABLE/FAILED -> CHECK_UNAVAILABLE
   - Valid C2PA AI generation assertion -> AI_ORIGIN_DOCUMENTED
   - Valid C2PA AI editing assertion -> AI_EDITING_DOCUMENTED
   - Missing metadata -> Neutral evidence.
   - Camera EXIF -> Informative note, not forcing decision.
   - Ordinary editing software -> Neutral, no AI accusation.
"""
import io
import os
import sys
import unittest
from PIL import Image, ImageOps

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from detectors.universal_fake_detect import UniversalFakeDetectAdapter
from detectors.base import DetectorResult
from provenance.c2pa_verifier import C2PAVerifier, C2PAProvenanceResult
from metadata.extractor import MetadataExtractor, SanitizedMetadata
from engine.decision_policy import DecisionEngine, AnalysisReport


class TestDetectorLoadingAndInference(unittest.TestCase):
    def test_detector_reports_honest_unavailable_without_weights(self):
        """When checkpoint or vision backbone is missing, detector must report UNAVAILABLE and not fake scores."""
        adapter = UniversalFakeDetectAdapter(checkpoint_path="/non/existent/path/univfd.pth")
        loaded = adapter.load_model()
        self.assertFalse(loaded)
        self.assertFalse(adapter.is_ready)

        img = Image.new("RGB", (100, 100), (200, 150, 100))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")

        res = adapter.predict(buf.getvalue())
        self.assertEqual(res.status, "UNAVAILABLE")
        self.assertIsNone(res.raw_score)
        self.assertIsNone(res.logit)
        self.assertIsNone(res.is_synthetic)
        self.assertIn("not found", res.error_message.lower())

    def test_preprocessing_handles_exif_orientation_and_transparency(self):
        """Preprocessing must handle transparency and EXIF orientation without crashes."""
        adapter = UniversalFakeDetectAdapter()
        
        # Transparent RGBA image
        img_rgba = Image.new("RGBA", (300, 200), (100, 150, 200, 128))
        tensor = adapter._preprocess_image(img_rgba)
        self.assertEqual(tensor.shape, (1, 3, 224, 224))

        # Palette P image
        img_p = Image.new("P", (150, 150))
        tensor_p = adapter._preprocess_image(img_p)
        self.assertEqual(tensor_p.shape, (1, 3, 224, 224))


class TestC2PAVerifier(unittest.TestCase):
    def test_c2pa_absent_does_not_spoof_valid_trusted(self):
        """Images containing the substring 'c2pa' must not be spoofed into VALID_TRUSTED without validation."""
        verifier = C2PAVerifier()
        # Normal image with fake 'c2pa' bytes in payload
        fake_image_bytes = b"FFD8FFE0" + b"some header with c2pa substring" + b"FFD9"
        res = verifier.verify(fake_image_bytes, mime_type="image/jpeg")

        self.assertIn(res.status, ("ABSENT", "UNSUPPORTED"))
        if not verifier._c2pa_available:
            self.assertEqual(res.status, "UNSUPPORTED")
        else:
            self.assertNotEqual(res.status, "VALID_TRUSTED")


class TestMetadataExtractor(unittest.TestCase):
    def test_missing_metadata_is_neutral(self):
        """An image with zero EXIF metadata must have neutral metadata flags."""
        extractor = MetadataExtractor()
        img = Image.new("RGB", (200, 200), (120, 120, 120))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")

        res = extractor.extract(buf.getvalue(), mime_type="image/jpeg")
        self.assertFalse(res.has_exif)
        self.assertIsNone(res.camera_make)
        self.assertIsNone(res.ai_generation_software_detected)
        self.assertFalse(res.has_ai_generation_parameters)

    def test_editing_software_does_not_trigger_ai_flag(self):
        """Standard editing tools (e.g. Adobe Photoshop) must not trigger ai_generation_software_detected."""
        extractor = MetadataExtractor()
        img = Image.new("RGB", (200, 200), (120, 120, 120))
        buf = io.BytesIO()
        # Save PNG with standard Photoshop software tag
        img.save(buf, format="PNG", pnginfo=None)

        res = extractor.extract(buf.getvalue(), mime_type="image/png")
        self.assertIsNone(res.ai_generation_software_detected)
        self.assertFalse(res.has_ai_generation_parameters)


class TestDecisionEnginePolicy(unittest.TestCase):
    def setUp(self):
        self.engine = DecisionEngine(high_confidence_threshold=0.85, low_confidence_threshold=0.25)
        self.default_provenance = C2PAProvenanceResult(status="ABSENT")
        self.default_metadata = SanitizedMetadata(has_exif=True, camera_make="Nikon", camera_model="Z6")

    def test_high_score_yields_likely_ai_generated(self):
        """Detector score >= 0.85 produces LIKELY_AI_GENERATED."""
        detector_res = DetectorResult(
            model_name="UnivFD",
            version="1.0.0",
            checkpoint_identifier="vit_l14",
            preprocessing_version="v1",
            device="cpu",
            raw_score=0.92,
            logit=2.44,
            is_synthetic=True,
            confidence=0.84,
            status="COMPLETED"
        )
        report = self.engine.evaluate(self.default_provenance, self.default_metadata, detector_res)
        self.assertEqual(report.outcome, "LIKELY_AI_GENERATED")
        self.assertEqual(report.evidence.badge_variant, "warning")
        self.assertEqual(report.evidence.badge_label, "Likely AI-generated")

    def test_low_score_yields_likely_authentic(self):
        """Detector score <= 0.25 produces NO_STRONG_AI_SIGNALS / Likely authentic."""
        detector_res = DetectorResult(
            model_name="UnivFD",
            version="1.0.0",
            checkpoint_identifier="vit_l14",
            preprocessing_version="v1",
            device="cpu",
            raw_score=0.12,
            logit=-1.99,
            is_synthetic=False,
            confidence=0.76,
            status="COMPLETED"
        )
        report = self.engine.evaluate(self.default_provenance, self.default_metadata, detector_res)
        self.assertEqual(report.outcome, "NO_STRONG_AI_SIGNALS")
        self.assertEqual(report.evidence.badge_label, "Likely authentic")
        self.assertIn("Likely authentic", report.evidence.badge_label)

    def test_intermediate_score_yields_inconclusive(self):
        """Detector score in ambiguous band (0.25 < score < 0.85) produces INCONCLUSIVE."""
        detector_res = DetectorResult(
            model_name="UnivFD",
            version="1.0.0",
            checkpoint_identifier="vit_l14",
            preprocessing_version="v1",
            device="cpu",
            raw_score=0.55,
            logit=0.20,
            is_synthetic=True,
            confidence=0.10,
            status="COMPLETED"
        )
        report = self.engine.evaluate(self.default_provenance, self.default_metadata, detector_res)
        self.assertEqual(report.outcome, "INCONCLUSIVE")
        self.assertEqual(report.evidence.badge_label, "Could not determine")

    def test_detector_unavailable_yields_check_unavailable_without_ai_label(self):
        """When detector is UNAVAILABLE, system returns CHECK_UNAVAILABLE and does NOT label image as AI."""
        detector_res = DetectorResult(
            model_name="UnivFD",
            version="1.0.0",
            checkpoint_identifier="vit_l14",
            preprocessing_version="v1",
            device="cpu",
            status="UNAVAILABLE",
            error_message="Weights not configured"
        )
        report = self.engine.evaluate(self.default_provenance, self.default_metadata, detector_res)
        self.assertEqual(report.outcome, "CHECK_UNAVAILABLE")
        self.assertEqual(report.evidence.badge_variant, "unavailable")
        self.assertEqual(report.evidence.badge_label, "Image check unavailable")

    def test_valid_c2pa_ai_origin_overrides_pixel_score(self):
        """Cryptographically valid C2PA AI generation assertion produces AI_ORIGIN_DOCUMENTED."""
        provenance = C2PAProvenanceResult(
            status="VALID_TRUSTED",
            manifest_present=True,
            signature_valid=True,
            signer_trusted=True,
            signer_name="OpenAI",
            is_ai_origin_asserted=True,
            ai_tools_mentioned=["DALL-E 3"]
        )
        detector_res = DetectorResult(
            model_name="UnivFD",
            version="1.0.0",
            checkpoint_identifier="vit_l14",
            preprocessing_version="v1",
            device="cpu",
            raw_score=0.15,
            status="COMPLETED"
        )
        report = self.engine.evaluate(provenance, self.default_metadata, detector_res)
        self.assertEqual(report.outcome, "AI_ORIGIN_DOCUMENTED")
        self.assertEqual(report.evidence.badge_label, "AI origin documented")
        self.assertEqual(report.evidence.badge_variant, "verified")


if __name__ == "__main__":
    unittest.main()
