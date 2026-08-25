export interface SpeechBlock {
  id: string;
  speaker: string;
  text: string;
}

export interface TemplatePreset {
  id: string;
  name: string;
  icon: string;
  category?: string;
  scene: string;
  context: string;
  pace: string;
  directorNotes?: {
    scene: string;
    pacing: string;
    style: string;
  };
  demoScript?: string;
  blocks?: SpeechBlock[];
  rawText?: string;
}

export type ScriptTemplate = TemplatePreset;

export interface AutoTagResult {
  scene: string;
  context: string;
  pace: string;
  blocks: SpeechBlock[];
  compiledText: string;
}

export const TEMPLATES: TemplatePreset[] = [
  {
    id: "studio-storytelling",
    name: "Studio Storytelling & Narration",
    icon: "📖",
    category: "Storytelling",
    scene: "An intimate soundproof studio with rich acoustic warmth.",
    context: "Captivating audiobook narration with nuanced pauses and emotional color.",
    pace: "Moderate, rhythmic, and natural pacing.",
    directorNotes: {
      scene: "An intimate soundproof studio with rich acoustic warmth.",
      pacing: "Moderate, rhythmic, and natural pacing.",
      style: "Warm, engaging, and expressive narration.",
    },
    demoScript:
      "[reading] [title] Welcome to KobeanAudio Neural Studio.\n[warm, celebratory] [pause: 1.0s] <laugh> Experience effortless control over 200+ director notes and expressive voice tags.",
  },
  {
    id: "podcast-dialogue",
    name: "Podcast Interview (2 Speakers)",
    icon: "🎙️",
    category: "Podcast",
    scene: "Modern broadcast studio with two dynamic hosts.",
    context: "Energetic dialogue between enthusiastic tech enthusiasts.",
    pace: "Conversational, brisk, and engaging tempo.",
    directorNotes: {
      scene: "Modern broadcast studio with two dynamic hosts.",
      pacing: "Conversational, brisk, and engaging tempo.",
      style: "Natural, dynamic two-host podcast interview.",
    },
    demoScript:
      "Host (Alex): [excited] Welcome back to the show! Today we have something truly special.\nGuest (Zephyr): [warm, smiling] Thanks for having me Alex, excited to be here!",
  },
  {
    id: "cinematic-trailer",
    name: "Cinematic Movie Trailer",
    icon: "🎬",
    category: "Cinema",
    scene: "Dark epic metropolis with booming orchestral tension.",
    context: "Deep, dramatic, suspenseful blockbuster trailer voice.",
    pace: "Deliberate, slow, suspenseful pauses.",
    directorNotes: {
      scene: "Dark epic metropolis with booming orchestral tension.",
      pacing: "Deliberate, slow, suspenseful pauses.",
      style: "Deep, authoritative, and cinematic.",
    },
    demoScript:
      "Trailer Voice: [intense, deep] In a world divided by shadow... [pause: 2.0s] One voice will change everything.",
  },
  {
    id: "meditation",
    name: "Mindfulness & Guided Meditation",
    icon: "🧘",
    category: "Wellness",
    scene: "A tranquil Japanese bamboo garden at sunrise with gentle water flowing nearby.",
    context: "Therapeutic wellness guidance with whispery breath and deep peaceful spacing.",
    pace: "Very slow, calming, peaceful tempo.",
    directorNotes: {
      scene: "A tranquil Japanese bamboo garden at sunrise with gentle water flowing nearby.",
      pacing: "Very slow, calming, peaceful tempo.",
      style: "Soft, whispery, and deeply relaxing.",
    },
    demoScript:
      "Guide: [soft, gentle] Take a deep, slow breath in... [pause: 3.0s] Release all tension from your shoulders.",
  },
  {
    id: "commercial-ad",
    name: "Upbeat Commercial Ad",
    icon: "⚡",
    category: "Advertising",
    scene: "High-energy commercial broadcast.",
    context: "Crisp, persuasive, and lively product showcase.",
    pace: "Fast, punchy, and confident.",
    directorNotes: {
      scene: "High-energy commercial broadcast.",
      pacing: "Fast, punchy, and confident.",
      style: "Upbeat, energetic, and persuasive commercial voiceover.",
    },
    demoScript:
      "Presenter: [enthusiastic] Introducing KobeanAudio! The ultimate workstation for professional creators.",
  },
  {
    id: "news-broadcast",
    name: "News Anchor Broadcast",
    icon: "📰",
    category: "Journalism",
    scene: "Live national newsroom desk.",
    context: "Neutral, authoritative, and articulate journalism.",
    pace: "Steady, clear, and professional.",
    directorNotes: {
      scene: "Live national newsroom desk.",
      pacing: "Steady, clear, and professional.",
      style: "Objective, authoritative broadcast journalism.",
    },
    demoScript:
      "Anchor: [formal, clear] Good evening. Here are today's top developing stories from the studio desk.",
  },
];

/**
 * Extracts clean blocks from raw text
 */
export function extractBlocksFromRaw(rawScript: string): SpeechBlock[] {
  const lines = rawScript.split("\n").filter((l) => l.trim().length > 0);
  const blocks: SpeechBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const speakerMatch = line.match(/^([^:\n]+):\s*(.*)$/);
    if (speakerMatch) {
      blocks.push({
        id: `block-${i + 1}`,
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].trim(),
      });
    } else {
      blocks.push({
        id: `block-${i + 1}`,
        speaker: `Speaker ${blocks.length + 1}`,
        text: line,
      });
    }
  }

  return blocks;
}

/**
 * Compiles visual blocks to raw script text
 */
export function compileBlocksToRaw(blocks: SpeechBlock[]): string {
  return blocks
    .map((b) => (b.speaker ? `${b.speaker}: ${b.text}` : b.text))
    .join("\n\n");
}

/**
 * Extracts pure content lines from script text, stripping prior director note headers.
 */
export function extractCleanScriptLines(text: string): string[] {
  let working = text;

  // If already in director's note format, extract the transcript section
  if (working.includes("## Transcript:")) {
    working = working.split("## Transcript:")[1];
  } else if (working.includes("Transcript:")) {
    working = working.split("Transcript:")[1];
  }

  // Remove existing header lines like "Read the following transcript..."
  working = working.replace(/^Read the following transcript[^\n]*\n*/gi, "");
  working = working.replace(/#+\s*Director's\s*note[^\n]*\n*/gi, "");
  working = working.replace(/#+\s*Scene:[^\n]*\n*/gi, "");
  working = working.replace(/#+\s*Sample\s*Context:[^\n]*\n*/gi, "");
  working = working.replace(/Pace:[^\n]*\n*/gi, "");

  // Split by non-empty lines
  const rawLines = working
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const finalLines: string[] = [];

  for (const line of rawLines) {
    // If the line has multiple distinct sentences, split on terminal punctuation
    const sentences = line
      .match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences && sentences.length > 1) {
      finalLines.push(...sentences);
    } else {
      finalLines.push(line);
    }
  }

  // Fallback default lines if empty
  if (finalLines.length === 0) {
    return [
      "Welcome to KobeanAudio Studio.",
      "Experience high-fidelity speech synthesis powered by cutting-edge neural models.",
    ];
  }

  return finalLines;
}

/**
 * Clean existing tags from a line to allow fresh tag re-styling
 */
export function stripTagsFromLine(line: string): string {
  return line
    .replace(/^(Speaker\s*\d*[^:\n]*|Host[^:\n]*|Guest[^:\n]*|Narrator[^:\n]*|Guide[^:\n]*|Presenter[^:\n]*|Anchor[^:\n]*|Trailer[^:\n]*):\s*/gi, "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligently applies a template archetype (emotions, pauses, director notes)
 * to arbitrary user text without erasing their words.
 */
export function autoTagScriptWithTemplate(
  rawScript: string,
  template: TemplatePreset
): AutoTagResult {
  const cleanLines = extractCleanScriptLines(rawScript);

  let generatedBlocks: SpeechBlock[] = [];

  switch (template.id) {
    case "podcast-dialogue": {
      const speakers = ["Host (Alex)", "Guest (Zephyr)"];
      const emotionPoolHost = ["[excited]", "[warm, curious]", "[enthusiastic]"];
      const emotionPoolGuest = ["[warm, smiling]", "[thoughtful]", "[confident]"];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const speaker = speakers[idx % 2];
        const emotion =
          idx % 2 === 0
            ? emotionPoolHost[(idx / 2) % emotionPoolHost.length]
            : emotionPoolGuest[Math.floor(idx / 2) % emotionPoolGuest.length];
        const pause = idx % 2 === 0 ? " [pause: 0.8s]" : " [pause: 0.5s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker,
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }

    case "cinematic-trailer": {
      const emotions = [
        "[intense, deep]",
        "[whispering]",
        "[dramatic]",
        "[authoritative]",
      ];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const emotion = emotions[idx % emotions.length];
        const pause = idx % 2 === 0 ? " [pause: 2.2s]" : " [pause: 1.8s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker: "Trailer Voice",
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }

    case "meditation": {
      const emotions = [
        "[soft, gentle]",
        "[warm, calming]",
        "[slow cadence]",
        "[gentle emphasis]",
      ];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const emotion = emotions[idx % emotions.length];
        const pause = idx === 0 ? " [pause: 3.0s]" : idx % 2 === 0 ? " [pause: 2.5s]" : " [pause: 2.0s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker: "Guide",
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }

    case "commercial-ad": {
      const emotions = [
        "[enthusiastic]",
        "[confident, punchy]",
        "[excited]",
        "[warm, celebratory]",
      ];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const emotion = emotions[idx % emotions.length];
        const pause = idx === cleanLines.length - 1 ? "" : " [pause: 0.6s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker: "Presenter",
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }

    case "news-broadcast": {
      const emotions = [
        "[formal, clear]",
        "[authoritative]",
        "[clear, concise]",
        "[neutral broadcast]",
      ];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const emotion = emotions[idx % emotions.length];
        const pause = idx === cleanLines.length - 1 ? "" : " [pause: 1.0s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker: "Anchor",
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }

    case "studio-storytelling":
    default: {
      const emotions = [
        "[reading] [title]",
        "[reading] [warm, informative]",
        "[reading] [excited, clear]",
        "[warm, celebratory]",
      ];

      generatedBlocks = cleanLines.map((line, idx) => {
        const stripped = stripTagsFromLine(line);
        const emotion = emotions[idx % emotions.length];
        const pause = idx === 0 ? " [pause: 1.2s]" : idx === 1 ? " <laugh> [pause: 1.5s]" : " [pause: 1.0s]";
        return {
          id: `block-${idx + 1}-${Date.now()}`,
          speaker: "Speaker 1 - Zephyr",
          text: `${emotion} ${stripped}${pause}`,
        };
      });
      break;
    }
  }

  // Compile standard Google AI Pro Director's Note structure
  let compiled = "Read the following transcript based on the director's note.\n\n";
  compiled += "# Director's note\n";
  if (template.pace) compiled += `Pace: ${template.pace.trim()}\n\n`;
  if (template.scene) compiled += `## Scene:\n${template.scene.trim()}\n\n`;
  if (template.context) compiled += `## Sample Context:\n${template.context.trim()}\n\n`;
  compiled += "## Transcript:\n";
  generatedBlocks.forEach((b) => {
    compiled += `${b.speaker}: ${b.text}\n\n`;
  });

  return {
    scene: template.scene,
    context: template.context,
    pace: template.pace,
    blocks: generatedBlocks,
    compiledText: compiled.trim(),
  };
}

export function autoTagScript(rawScript: string, template: TemplatePreset): string {
  return autoTagScriptWithTemplate(rawScript, template).compiledText;
}
