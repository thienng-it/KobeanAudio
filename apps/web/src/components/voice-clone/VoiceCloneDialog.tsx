"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Mic, Square, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { uploadClonedVoice } from "@/lib/api";
import { useEngineStore } from "@/stores/engineStore";
import { modalMotion, buttonTapMotion, buttonSubtleTapMotion } from "@/lib/motion";

interface VoiceCloneDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCloneDialog: React.FC<VoiceCloneDialogProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [voiceName, setVoiceName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { addCustomVoice, setActiveEngine } = useEngineStore();

  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e: any) {
      setError("Microphone permission denied or audio device unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async () => {
    if (!voiceName.trim()) {
      setError("Please name your cloned voice profile.");
      return;
    }

    const audioData = tab === "record" ? recordedBlob : uploadedFile;
    if (!audioData) {
      setError("Please record or upload a 5–15 second audio sample.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", voiceName.trim());
      formData.append(
        "audio_file",
        audioData,
        tab === "record" ? "recording.wav" : (audioData as File).name
      );

      const result = await uploadClonedVoice(formData);
      addCustomVoice(result.voice);
      setActiveEngine("chatterbox");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Failed to clone voice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voice-clone-dialog-overlay"
          {...modalMotion.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          {/* Modal Container with smooth single scale */}
          <motion.div
            key="voice-clone-dialog-card"
            {...modalMotion.card}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface-elevated)] p-6 space-y-5 shadow-2xl text-[var(--text-main)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-[var(--accent-primary)] border border-white/10 shadow-sm">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-main)]">
                    Instant Voice Clone
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Zero-Shot Neural Voice Cloning (Chatterbox)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-white/10 hover:text-[var(--text-main)] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 rounded-xl bg-black/20 p-1 border border-white/[0.06]">
              <button
                onClick={() => setTab("record")}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${
                  tab === "record"
                    ? "bg-white/[0.16] text-white font-semibold shadow-sm border border-white/15"
                    : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
                }`}
                style={{
                  backgroundColor: tab === "record" ? "var(--accent-primary)" : undefined,
                  color: tab === "record" ? "#FFFFFF" : undefined,
                }}
              >
                🎙️ Record Mic
              </button>
              <button
                onClick={() => setTab("upload")}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${
                  tab === "upload"
                    ? "bg-white/[0.16] text-white font-semibold shadow-sm border border-white/15"
                    : "text-[var(--text-faint)] hover:text-[var(--text-main)]"
                }`}
                style={{
                  backgroundColor: tab === "upload" ? "var(--accent-primary)" : undefined,
                  color: tab === "upload" ? "#FFFFFF" : undefined,
                }}
              >
                📁 Audio File
              </button>
            </div>

            {/* Profile Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">
                Voice Profile Name
              </label>
              <input
                type="text"
                placeholder="e.g. My Studio Voice, Joseph Podcast..."
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2 text-xs text-[var(--text-main)] placeholder-white/20 focus:border-[var(--accent-primary)] focus:outline-none"
              />
            </div>

            {/* Recording Mode */}
            {tab === "record" && (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 text-center space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Read aloud clearly for 5–15 seconds:
                  <span className="block mt-1.5 font-mono text-[11px] text-[var(--accent-primary)] italic">
                    "Hello, I am recording a high-fidelity sample of my voice for KobeanAudio
                    studio speech synthesis."
                  </span>
                </p>

                <div className="flex flex-col items-center justify-center space-y-2 pt-2">
                  {isRecording ? (
                    <motion.button
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      onClick={stopRecording}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-500/40"
                    >
                      <Square className="h-5 w-5 fill-current" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startRecording}
                      className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl"
                      style={{
                        backgroundImage: "var(--accent-gradient)",
                        boxShadow: "0 0 24px var(--accent-glow)",
                      }}
                    >
                      <Mic className="h-6 w-6" />
                    </motion.button>
                  )}

                  <span className="font-mono text-xs text-[var(--text-main)]">
                    {isRecording
                      ? `Recording... 0:${recordingSeconds < 10 ? "0" : ""}${recordingSeconds} / 0:15`
                      : recordedBlob
                      ? "✅ Audio Sample Ready"
                      : "Click microphone to start"}
                  </span>
                </div>
              </div>
            )}

            {/* Upload Mode */}
            {tab === "upload" && (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center space-y-2">
                <Upload className="mx-auto h-7 w-7 text-[var(--accent-primary)]" />
                <div className="text-xs font-medium text-[var(--text-main)]">
                  Select WAV / MP3 reference audio
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  5–15 seconds clean speech sample
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-[var(--text-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white"
                />
                {uploadedFile && (
                  <p className="text-xs text-emerald-400 font-medium">{uploadedFile.name}</p>
                )}
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="flex items-center space-x-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Voice cloned & activated successfully!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)] transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting || isRecording}
                className="rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-40"
                style={{
                  backgroundImage: "var(--accent-gradient)",
                  boxShadow: "0 0 20px var(--accent-glow)",
                }}
              >
                {isSubmitting ? "Cloning Voice..." : "Create Cloned Voice"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
