import io

import soundfile as sf
from pydub import AudioSegment
from pydub.effects import normalize


class AudioProcessor:
    @staticmethod
    def calculate_duration_ms(wav_bytes: bytes) -> int:
        try:
            with io.BytesIO(wav_bytes) as f, sf.SoundFile(f) as sound_file:
                frames = len(sound_file)
                sample_rate = sound_file.samplerate
                return int((frames / sample_rate) * 1000)
        except Exception:
            # Fallback estimation
            return max(500, len(wav_bytes) // 48)

    @staticmethod
    def process_audio(
        wav_bytes: bytes,
        target_format: str = "wav",
        bitrate: int = 320,
        sample_rate: int | None = None,
        normalize_lufs: float | None = -16.0,
        trim_silence: bool = True,
        fade_in_ms: int = 0,
        fade_out_ms: int = 0,
    ) -> tuple[bytes, str]:
        """
        Processes audio: format conversion, normalization, fading.
        Returns (processed_bytes, mime_type).
        """
        # If no transformations and format is wav, return original
        if (
            target_format == "wav"
            and normalize_lufs is None
            and not trim_silence
            and fade_in_ms == 0
            and fade_out_ms == 0
            and sample_rate is None
        ):
            return wav_bytes, "audio/wav"

        try:
            audio = AudioSegment.from_file(io.BytesIO(wav_bytes), format="wav")

            # Resample if specified
            if sample_rate and audio.frame_rate != sample_rate:
                audio = audio.set_frame_rate(sample_rate)

            # Silence trimming (remove leading/trailing silence below -40dBFS)
            if trim_silence and len(audio) > 400:
                silence_threshold = -40.0
                start_trim = 0
                end_trim = len(audio)

                # Check start
                for i in range(0, min(1000, len(audio)), 50):
                    if audio[i : i + 50].dBFS > silence_threshold:
                        start_trim = max(0, i - 50)
                        break

                # Check end
                for i in range(len(audio), max(0, len(audio) - 1000), -50):
                    if audio[max(0, i - 50) : i].dBFS > silence_threshold:
                        end_trim = min(len(audio), i + 50)
                        break

                if end_trim > start_trim:
                    audio = audio[start_trim:end_trim]

            # Fades
            if fade_in_ms > 0 and len(audio) > fade_in_ms:
                audio = audio.fade_in(fade_in_ms)
            if fade_out_ms > 0 and len(audio) > fade_out_ms:
                audio = audio.fade_out(fade_out_ms)

            # Loudness normalization
            if normalize_lufs is not None:
                audio = normalize(audio)

            # Export to target format
            out_io = io.BytesIO()
            if target_format == "mp3":
                audio.export(out_io, format="mp3", bitrate=f"{bitrate}k")
                mime_type = "audio/mpeg"
            elif target_format == "flac":
                audio.export(out_io, format="flac")
                mime_type = "audio/flac"
            elif target_format == "ogg":
                audio.export(out_io, format="ogg", codec="libopus")
                mime_type = "audio/ogg"
            elif target_format == "m4a":
                audio.export(out_io, format="mp4", codec="aac")
                mime_type = "audio/mp4"
            else:
                audio.export(out_io, format="wav")
                mime_type = "audio/wav"

            return out_io.getvalue(), mime_type

        except Exception:
            # Fallback if pydub/ffmpeg fails on edge cases
            return wav_bytes, "audio/wav"

    @staticmethod
    def trim_audio_segment(
        wav_bytes: bytes,
        start_ms: int,
        end_ms: int,
        fade_in_ms: int = 50,
        fade_out_ms: int = 50,
    ) -> tuple[bytes, int]:
        """
        Trims a WAV audio buffer between start_ms and end_ms with optional micro-fades.
        Returns (trimmed_wav_bytes, new_duration_ms).
        """
        try:
            audio = AudioSegment.from_file(io.BytesIO(wav_bytes), format="wav")
            total_len = len(audio)

            safe_start = max(0, min(start_ms, total_len))
            safe_end = max(safe_start + 100, min(end_ms, total_len))

            trimmed = audio[safe_start:safe_end]

            if fade_in_ms > 0 and len(trimmed) > fade_in_ms:
                trimmed = trimmed.fade_in(fade_in_ms)
            if fade_out_ms > 0 and len(trimmed) > fade_out_ms:
                trimmed = trimmed.fade_out(fade_out_ms)

            out_io = io.BytesIO()
            trimmed.export(out_io, format="wav")
            return out_io.getvalue(), len(trimmed)
        except Exception as e:
            print(f"[ERROR] Trimming failed: {e}")
            return wav_bytes, AudioProcessor.calculate_duration_ms(wav_bytes)

    @classmethod
    async def process_audio_async(
        cls,
        wav_bytes: bytes,
        target_format: str = "wav",
        bitrate: int = 320,
        sample_rate: int | None = None,
        normalize_lufs: float | None = -16.0,
        trim_silence: bool = True,
        fade_in_ms: int = 0,
        fade_out_ms: int = 0,
    ) -> tuple[bytes, str]:
        """
        Non-blocking async wrapper that executes CPU-bound audio processing inside a worker thread.
        """
        import asyncio

        return await asyncio.to_thread(
            cls.process_audio,
            wav_bytes=wav_bytes,
            target_format=target_format,
            bitrate=bitrate,
            sample_rate=sample_rate,
            normalize_lufs=normalize_lufs,
            trim_silence=trim_silence,
            fade_in_ms=fade_in_ms,
            fade_out_ms=fade_out_ms,
        )

    @classmethod
    async def trim_audio_segment_async(
        cls,
        wav_bytes: bytes,
        start_ms: int,
        end_ms: int,
        fade_in_ms: int = 50,
        fade_out_ms: int = 50,
    ) -> tuple[bytes, int]:
        """
        Non-blocking async wrapper that executes audio segment slicing inside a worker thread.
        """
        import asyncio

        return await asyncio.to_thread(
            cls.trim_audio_segment,
            wav_bytes=wav_bytes,
            start_ms=start_ms,
            end_ms=end_ms,
            fade_in_ms=fade_in_ms,
            fade_out_ms=fade_out_ms,
        )
