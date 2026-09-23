"""Metadata Extractor Engine (EXIF, XMP, IPTC, PNG text).

Extracts camera, software, and creation information while strictly scrubbing
private fields (GPS, serial numbers, personal identifiers) and raw generation prompts.
"""
import io
import re
import logging
import time
from typing import Dict, Any, List, Optional
from PIL import Image, ExifTags
from pydantic import BaseModel, Field

logger = logging.getLogger("metadata_extractor")

class SanitizedMetadata(BaseModel):
    has_exif: bool = False
    has_xmp: bool = False
    has_iptc: bool = False
    
    # Camera information (publicly safe)
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    lens_model: Optional[str] = None
    focal_length: Optional[str] = None
    exposure_time: Optional[str] = None
    f_number: Optional[str] = None
    iso_speed: Optional[int] = None
    
    # Software & creation
    software: Optional[str] = None
    creation_date: Optional[str] = None
    modify_date: Optional[str] = None
    color_space: Optional[str] = None
    
    # Image properties
    width: int = 0
    height: int = 0
    format: str = "UNKNOWN"
    
    # AI Generation clues in unsigned metadata
    ai_generation_software_detected: Optional[str] = None
    has_ai_generation_parameters: bool = False
    
    # Sanitization indicator
    gps_scrubbed: bool = False
    serial_scrubbed: bool = False
    
    latency_ms: float = 0.0

class MetadataExtractor:
    # Known AI generation software strings in metadata
    AI_SOFTWARE_SIGNATURES = [
        (re.compile(r"midjourney", re.I), "Midjourney"),
        (re.compile(r"stable diffusion|automatic1111|comfyui|invokeai|webui", re.I), "Stable Diffusion"),
        (re.compile(r"dall[\-e\s]*[23]", re.I), "DALL-E"),
        (re.compile(r"adobe firefly", re.I), "Adobe Firefly"),
        (re.compile(r"novelai", re.I), "NovelAI"),
        (re.compile(r"bing image creator|copilot designer", re.I), "Microsoft Designer")
    ]

    def extract(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> SanitizedMetadata:
        start_time = time.perf_counter()
        result = SanitizedMetadata()
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            result.width = image.width
            result.height = image.height
            result.format = image.format or mime_type.split("/")[-1].upper()

            # 1. Process EXIF tags
            exif_data = image.getexif()
            if exif_data:
                result.has_exif = True
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    
                    # Privacy scrubs
                    if "GPS" in tag_name:
                        result.gps_scrubbed = True
                        continue
                    if "SerialNumber" in tag_name or "InternalSerialNumber" in tag_name:
                        result.serial_scrubbed = True
                        continue

                    # Safe mappings
                    if tag_name == "Make" and isinstance(value, str):
                        result.camera_make = value.strip()[:64]
                    elif tag_name == "Model" and isinstance(value, str):
                        result.camera_model = value.strip()[:64]
                    elif tag_name == "Software" and isinstance(value, str):
                        result.software = value.strip()[:128]
                    elif tag_name == "DateTime" and isinstance(value, str):
                        result.creation_date = value.strip()
                    elif tag_name == "ColorSpace":
                        result.color_space = "sRGB" if value == 1 else "Uncalibrated"

                # Check EXIF IFD sub-tags if available
                try:
                    for ifd_id in ExifTags.IFD:
                        try:
                            ifd = exif_data.get_ifd(ifd_id)
                            for sub_tag_id, sub_val in ifd.items():
                                sub_name = ExifTags.TAGS.get(sub_tag_id, str(sub_tag_id))
                                if "GPS" in sub_name:
                                    result.gps_scrubbed = True
                                    continue
                                if "SerialNumber" in sub_name:
                                    result.serial_scrubbed = True
                                    continue
                                if sub_name == "LensModel" and isinstance(sub_val, str):
                                    result.lens_model = sub_val.strip()[:64]
                                elif sub_name == "ISOSpeedRatings" and isinstance(sub_val, (int, float)):
                                    result.iso_speed = int(sub_val)
                                elif sub_name == "DateTimeOriginal" and isinstance(sub_val, str):
                                    result.creation_date = sub_val.strip()
                        except Exception:
                            pass
                except Exception:
                    pass

            # 2. Process PNG text chunks / info dictionary (e.g. Stable Diffusion parameters)
            if hasattr(image, "info") and isinstance(image.info, dict):
                info = image.info
                # Check for XMP
                if "XML:com.adobe.xmp" in info or "xmp" in info:
                    result.has_xmp = True
                    xmp_str = str(info.get("XML:com.adobe.xmp") or info.get("xmp", ""))
                    for pattern, label in self.AI_SOFTWARE_SIGNATURES:
                        if pattern.search(xmp_str):
                            result.ai_generation_software_detected = label
                            result.has_ai_generation_parameters = True
                            break

                # Check for SD / NovelAI parameters
                if "parameters" in info or "prompt" in info or "workflow" in info:
                    result.has_ai_generation_parameters = True
                    if not result.ai_generation_software_detected:
                        result.ai_generation_software_detected = "Generative AI Tool (Parameters Found)"

                # Check software tag in info
                if "Software" in info and isinstance(info["Software"], str) and not result.software:
                    result.software = info["Software"][:128]

            # 3. Check software string against AI signatures
            if result.software and not result.ai_generation_software_detected:
                for pattern, label in self.AI_SOFTWARE_SIGNATURES:
                    if pattern.search(result.software):
                        result.ai_generation_software_detected = label
                        break

        except Exception as e:
            logger.warning("Error reading metadata: %s", e)

        result.latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return result
