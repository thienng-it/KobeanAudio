import io
import re

from domain.models import ParsedBlock, ParseFileResponse


def clean_text_whitespace(text: str) -> str:
    """Normalize whitespace and collapse excessive line breaks."""
    lines = [line.strip() for line in text.splitlines()]
    cleaned = "\n".join(lines)
    # Collapse 3+ newlines into 2
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def parse_srt_vtt(content: str) -> tuple[str, list[ParsedBlock]]:
    """Parse SRT or WebVTT subtitle text and extract clean dialogue blocks."""
    # Strip WEBVTT header or metadata
    lines = content.splitlines()
    cleaned_lines = []

    # Regex to identify timecodes: 00:00:01,000 --> 00:00:04,000 or 00:01.000 --> 00:04.000
    timecode_pattern = re.compile(
        r"(\d{1,2}:)?\d{2}:\d{2}[,\.]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[,\.]\d{3}"
    )

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.upper().startswith("WEBVTT") or stripped.startswith("NOTE"):
            continue
        if stripped.isdigit():  # Subtitle index number
            continue
        if timecode_pattern.search(stripped):  # Timestamp line
            continue
        # Strip VTT speaker tags like <v SpeakerName>Dialogue</v> or standard HTML tags
        line_clean = re.sub(r"<v\s+([^>]+)>", r"\1: ", stripped)
        line_clean = re.sub(r"</?[^>]+>", "", line_clean).strip()
        if line_clean:
            cleaned_lines.append(line_clean)

    raw_text = "\n".join(cleaned_lines)
    blocks = extract_dialogue_blocks(raw_text)
    return raw_text, blocks


def extract_dialogue_blocks(text: str) -> list[ParsedBlock]:
    """
    Extract structured speaker blocks from text.
    Detects patterns like:
      - Speaker: Text
      - [Speaker] Text
      - (Speaker) Text
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return [ParsedBlock(speaker="Narrator", text="")]

    speaker_colon_pattern = re.compile(r"^([A-Za-z0-9_\-\s]{2,25}):\s*(.+)$")
    bracket_pattern = re.compile(r"^\[([A-Za-z0-9_\-\s]{2,25})\]\s*(.+)$")

    blocks: list[ParsedBlock] = []
    current_speaker = "Narrator"
    current_lines: list[str] = []

    for line in lines:
        match_colon = speaker_colon_pattern.match(line)
        match_bracket = bracket_pattern.match(line)

        if match_colon:
            if current_lines:
                blocks.append(ParsedBlock(speaker=current_speaker, text=" ".join(current_lines)))
                current_lines = []
            current_speaker = match_colon.group(1).strip()
            current_lines.append(match_colon.group(2).strip())
        elif match_bracket:
            if current_lines:
                blocks.append(ParsedBlock(speaker=current_speaker, text=" ".join(current_lines)))
                current_lines = []
            current_speaker = match_bracket.group(1).strip()
            current_lines.append(match_bracket.group(2).strip())
        else:
            current_lines.append(line)

    if current_lines:
        blocks.append(ParsedBlock(speaker=current_speaker, text=" ".join(current_lines)))

    return blocks if blocks else [ParsedBlock(speaker="Narrator", text=text)]


def parse_pdf_bytes(data: bytes) -> str:
    """Extract text from PDF byte content using pypdf."""
    try:
        import pypdf
    except ImportError:
        raise ValueError("PDF parsing requires pypdf. Run: pip install pypdf") from None
    reader = pypdf.PdfReader(io.BytesIO(data))
    page_texts = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            page_texts.append(extracted)
    return "\n\n".join(page_texts)


def parse_docx_bytes(data: bytes) -> str:
    """Extract paragraphs and text from DOCX byte content."""
    try:
        import docx
    except ImportError:
        raise ValueError(
            "DOCX parsing requires python-docx. Run: pip install python-docx"
        ) from None
    doc = docx.Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def parse_document(
    filename: str,
    content_bytes: bytes,
    detect_speakers: bool = True,
    clean_whitespace: bool = True,
) -> ParseFileResponse:
    """
    Parse uploaded file into text and structured blocks.
    Supports .txt, .md, .pdf, .docx, .srt, .vtt.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    raw_text = ""
    blocks: list[ParsedBlock] = []

    if ext in ["txt", "md"]:
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                raw_text = content_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, ValueError):
                continue
        if not raw_text and content_bytes:
            raw_text = content_bytes.decode("utf-8", errors="ignore")

    elif ext == "pdf":
        raw_text = parse_pdf_bytes(content_bytes)

    elif ext == "docx":
        raw_text = parse_docx_bytes(content_bytes)

    elif ext in ["srt", "vtt"]:
        text_str = ""
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                text_str = content_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, ValueError):
                continue
        raw_text, blocks = parse_srt_vtt(text_str)

    else:
        raise ValueError(
            f"Unsupported file format: .{ext}. Allowed formats: .txt, .md, .pdf, .docx, .srt, .vtt"
        )

    if clean_whitespace:
        raw_text = clean_text_whitespace(raw_text)

    if not blocks:
        if detect_speakers:
            blocks = extract_dialogue_blocks(raw_text)
        else:
            blocks = [ParsedBlock(speaker="Narrator", text=raw_text)]

    # Compute statistics
    words = raw_text.split()
    word_count = len(words)
    char_count = len(raw_text)
    # Assume 150 words per minute for audio narration
    estimated_duration_sec = round((word_count / 150.0) * 60.0, 1)

    return ParseFileResponse(
        filename=filename,
        file_type=ext,
        raw_text=raw_text,
        blocks=blocks,
        word_count=word_count,
        char_count=char_count,
        estimated_duration_sec=estimated_duration_sec,
    )
