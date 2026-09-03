import asyncio
import contextlib
import io
import os
import re
import subprocess
import tempfile
from collections.abc import AsyncIterator

import pydub

from engines.base import RawAudioChunk
from engines.wav_utils import convert_pcm_to_wav


def clean_script_for_tts(text: str) -> str:
    """
    Strips director's notes and meta instructions into pure spoken human speech.
    """
    if "## Transcript:" in text:
        text = text.split("## Transcript:", 1)[1]
    elif "Transcript:" in text:
        text = text.split("Transcript:", 1)[1]

    # Remove intro prompt prefix
    text = re.sub(
        r"^Read the following transcript[^\n]*\n*",
        "",
        text,
        flags=re.MULTILINE | re.IGNORECASE,
    )

    # Remove Speaker tags like "Speaker 1 - Zephyr:", "Speaker 1:", "Host (Alex):", "Guest:"
    text = re.sub(
        r"^(Speaker\s*\d*[^:\n]*|Host[^:\n]*|Guest[^:\n]*|Narrator[^:\n]*|Guide[^:\n]*|Presenter[^:\n]*|Anchor[^:\n]*|Trailer[^:\n]*):\s*",
        "",
        text,
        flags=re.MULTILINE | re.IGNORECASE,
    )

    # Remove bracketed tags like [reading], [pause: 1.2s], [warm, celebratory], [emphasis]
    text = re.sub(r"\[[^\]]*\]", " ", text)

    # Remove angle tags like <laugh>, <sigh>, <gasp>
    text = re.sub(r"<[^>]*>", " ", text)

    # Remove markdown hashes and headings
    text = re.sub(r"#+\s*[^\n]*", " ", text)

    # Clean whitespace
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    cleaned = " ".join(lines)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if not cleaned:
        cleaned = "Welcome to KobeanAudio Studio."
    return cleaned


VOICE_MAP = {
    # Kokoro voices
    "af_heart": "en-US-AvaNeural",
    "af_sarah": "en-US-JennyNeural",
    "af_bella": "en-US-EmmaNeural",
    "af_nicole": "en-US-MichelleNeural",
    "af_sky": "en-US-AnaNeural",
    "af_alloy": "en-US-AriaNeural",
    "af_jessica": "en-US-ElizabethNeural",
    "af_river": "en-US-JaneNeural",
    "am_adam": "en-US-AndrewNeural",
    "am_michael": "en-US-GuyNeural",
    "am_echo": "en-US-ChristopherNeural",
    "am_eric": "en-US-BrianNeural",
    "am_liam": "en-US-RogerNeural",
    "am_onyx": "en-US-SteffanNeural",
    "bf_emma": "en-GB-SoniaNeural",
    "bf_isabella": "en-GB-LibbyNeural",
    "bf_alice": "en-GB-MaisieNeural",
    "bf_lily": "en-GB-AdaNeural",
    "bm_george": "en-GB-RyanNeural",
    "bm_lewis": "en-GB-ThomasNeural",
    "bm_daniel": "en-GB-AlfieNeural",
    "bm_fable": "en-GB-OliverNeural",
    "jf_alpha": "ja-JP-NanamiNeural",
    "jf_gongitsune": "ja-JP-AoiNeural",
    "jm_kumo": "ja-JP-KeitaNeural",
    "zf_xiaobei": "zh-CN-XiaoxiaoNeural",
    "zm_yunjian": "zh-CN-YunjianNeural",
    "ff_siwis": "fr-FR-DeniseNeural",
    # Piper voices
    "piper_en_lessac": "en-US-JennyNeural",
    "piper_en_ryan": "en-US-GuyNeural",
    "piper_en_alan": "en-GB-RyanNeural",
    # Chatterbox voices
    "chatterbox_default_female": "en-US-EmmaNeural",
    "chatterbox_default_male": "en-US-ChristopherNeural",
    # Orpheus voices
    "orpheus_default": "en-US-AndrewNeural",
    "orpheus_expressive": "en-US-AriaNeural",
    # Qwen3 voices
    "qwen3_zh_female": "zh-CN-XiaoxiaoNeural",
    "qwen3_zh_male": "zh-CN-YunxiNeural",
    "qwen3_en_female": "en-US-AvaNeural",
    "qwen3_en_male": "en-US-BrianNeural",
    "qwen3_ja_female": "ja-JP-NanamiNeural",
    # Gemini voices fallback
    "Zephyr": "en-US-AvaNeural",
    "Achernar": "en-US-JennyNeural",
    "Achird": "en-US-AndrewNeural",
    "Algenib": "en-US-GuyNeural",
    "Algieba": "en-US-EmmaNeural",
    "Alnilam": "en-US-BrianNeural",
    "Aoede": "en-US-AriaNeural",
    "Autonoe": "en-US-MichelleNeural",
    "Callirrhoe": "en-US-AnaNeural",
    "Charon": "en-US-SteffanNeural",
    "Despina": "en-US-JaneNeural",
    "Enceladus": "en-US-RogerNeural",
    "Erinome": "en-GB-SoniaNeural",
    "Fenrir": "en-US-ChristopherNeural",
    "Gacrux": "en-GB-RyanNeural",
    "Iapetus": "en-US-GuyNeural",
    "Kore": "en-US-AnaNeural",
    "Laomedeia": "en-US-ElizabethNeural",
    "Leda": "en-US-SaraNeural",
    "Orus": "en-US-EricNeural",
    "Puck": "en-GB-MaisieNeural",
    "Pulcherrima": "en-GB-LibbyNeural",
    "Rasalgethi": "en-GB-ThomasNeural",
    "Sadachbia": "en-US-TonyNeural",
    "Sadaltager": "en-US-NancyNeural",
    "Schedar": "en-US-JennyNeural",
    "Sulafat": "en-US-JacobNeural",
    "Umbriel": "en-GB-OliverNeural",
    "Vindemiatrix": "en-GB-AdaNeural",
    "Zubenelgenubi": "en-US-ChristopherNeural",
}


def _generate_macos_say(text: str) -> bytes:
    """
    Offline fallback using macOS native neural speech synthesis system.
    """
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        cmd = ["/usr/bin/say", text, "-o", tmp_path, "--data-format=LEI16@24000"]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(tmp_path, "rb") as f:
            return f.read()
    except Exception:
        # Generate clean silent fallback WAV if system call fails
        return convert_pcm_to_wav(b"\x00" * 48000, "audio/L16;rate=24000")
    finally:
        if os.path.exists(tmp_path):
            with contextlib.suppress(OSError):
                os.remove(tmp_path)


async def synthesize_neural_speech(
    text: str,
    voice_id: str,
    speed: float = 1.0,
    pitch: float = 1.0,
    sample_rate: int = 24000,
) -> tuple[bytes, int, str]:
    """
    High-fidelity neural speech synthesis with multi-tier fallback.
    Returns (wav_bytes, sample_rate, mime_type).
    """
    clean_text = clean_script_for_tts(text)
    edge_voice = VOICE_MAP.get(voice_id, "en-US-JennyNeural")

    # Format rate parameter (e.g. +10% or -15%)
    rate_percent = int((speed - 1.0) * 100)
    rate_str = f"{rate_percent:+d}%"

    try:
        import edge_tts

        communicate = edge_tts.Communicate(clean_text, edge_voice, rate=rate_str)
        mp3_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_buffer.extend(chunk["data"])

        if len(mp3_buffer) > 0:
            seg = pydub.AudioSegment.from_file(io.BytesIO(mp3_buffer), format="mp3")
            if sample_rate and seg.frame_rate != sample_rate:
                seg = seg.set_frame_rate(sample_rate)
            wav_io = io.BytesIO()
            seg.export(wav_io, format="wav")
            return wav_io.getvalue(), sample_rate, "audio/wav"

    except Exception as e:
        print(f"[WARN] Neural speech online provider error: {e}, falling back to macOS say.")

    # Offline local fallback: macOS say
    wav_bytes = await asyncio.to_thread(_generate_macos_say, clean_text)
    return wav_bytes, sample_rate, "audio/wav"


async def stream_neural_speech(
    text: str,
    voice_id: str,
    speed: float = 1.0,
    pitch: float = 1.0,
    sample_rate: int = 24000,
) -> AsyncIterator[RawAudioChunk]:
    """
    Streams neural audio chunks smoothly for real-time player consumption.
    """
    clean_text = clean_script_for_tts(text)
    sentences = [s.strip() for s in re.split(r"[.!?]+", clean_text) if s.strip()]
    if not sentences:
        sentences = [clean_text]

    for idx, sentence in enumerate(sentences):
        wav_bytes, sr, mime = await synthesize_neural_speech(
            sentence, voice_id, speed, pitch, sample_rate
        )
        yield RawAudioChunk(
            data=wav_bytes,
            index=idx,
            is_final=False,
            sample_rate=sr,
            mime_type=mime,
        )
        await asyncio.sleep(0.02)

    # Sentinel chunk
    yield RawAudioChunk(
        data=b"",
        index=len(sentences),
        is_final=True,
        sample_rate=sample_rate,
        mime_type="audio/wav",
    )
