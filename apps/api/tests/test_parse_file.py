import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from domain.services.document_parser import (
    clean_text_whitespace,
    extract_dialogue_blocks,
    parse_document,
    parse_srt_vtt,
)


def test_clean_text_whitespace():
    sample = "  Line 1   \n\n\n\n   Line 2  \n  Line 3  "
    cleaned = clean_text_whitespace(sample)
    assert cleaned == "Line 1\n\nLine 2\nLine 3"


def test_extract_dialogue_blocks_colon():
    sample = "Narrator: Welcome to KobeanAudio.\nDirector: Let's create expressive audio."
    blocks = extract_dialogue_blocks(sample)
    assert len(blocks) == 2
    assert blocks[0].speaker == "Narrator"
    assert blocks[0].text == "Welcome to KobeanAudio."
    assert blocks[1].speaker == "Director"
    assert blocks[1].text == "Let's create expressive audio."


def test_extract_dialogue_blocks_brackets():
    sample = "[Narrator] In a galaxy far away.\n[Hero] We must proceed."
    blocks = extract_dialogue_blocks(sample)
    assert len(blocks) == 2
    assert blocks[0].speaker == "Narrator"
    assert blocks[0].text == "In a galaxy far away."
    assert blocks[1].speaker == "Hero"
    assert blocks[1].text == "We must proceed."


def test_parse_srt_vtt():
    srt_sample = """1
00:00:01,000 --> 00:00:04,000
Narrator: Hello world!

2
00:00:04,500 --> 00:00:08,000
Director: Welcome to our podcast.
"""
    raw_text, blocks = parse_srt_vtt(srt_sample)
    assert "Narrator: Hello world!" in raw_text
    assert "00:00:01" not in raw_text
    assert len(blocks) == 2
    assert blocks[0].speaker == "Narrator"
    assert blocks[0].text == "Hello world!"


def test_parse_document_txt():
    sample_text = "Alice: Hi Bob!\nBob: Hello Alice!"
    resp = parse_document(
        filename="dialogue.txt",
        content_bytes=sample_text.encode("utf-8"),
        detect_speakers=True,
    )
    assert resp.filename == "dialogue.txt"
    assert resp.file_type == "txt"
    assert resp.word_count == 6
    assert len(resp.blocks) == 2


def test_parse_document_unsupported_format():
    with pytest.raises(ValueError, match="Unsupported file format"):
        parse_document("image.png", b"\x89PNG\r\n\x1a\n")


@pytest.mark.asyncio
async def test_parse_file_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        file_content = b"Narrator: Testing endpoint parsing.\nHost: Success!"
        files = {"file": ("script.txt", file_content, "text/plain")}
        response = await client.post("/api/v1/parse-file", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "script.txt"
        assert data["file_type"] == "txt"
        assert len(data["blocks"]) == 2
        assert data["blocks"][0]["speaker"] == "Narrator"
        assert data["blocks"][0]["text"] == "Testing endpoint parsing."
        assert data["word_count"] > 0
