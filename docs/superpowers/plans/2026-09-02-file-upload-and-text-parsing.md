# File Upload & Text Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to upload and parse documents (.txt, .md, .pdf, .docx, .srt, .vtt) to extract scripts for text-to-speech synthesis with an interactive preview dialog and multi-speaker block detection.

**Architecture:** Hybrid approach combining client-side fast-path for lightweight text/markdown with a FastAPI backend parser service (`/api/v1/parse-file`) for complex binary formats (PDF, Word, Subtitles), followed by a Radix + Framer Motion interactive preview dialog.

**Tech Stack:** Python 3.12+, FastAPI, `pypdf`, `python-docx`, Next.js 15, TypeScript 5, Radix UI, Zustand 5, Framer Motion.

## Global Constraints

- Zero `any` in TypeScript.
- Strict Pydantic models and type hints in Python.
- Unified Framer Motion springs (`modalMotion`, `buttonTapMotion` from `@/lib/motion`).
- Consistent studio theme tokens and glass styling (`.glass-popover`).
- Preserve existing editor text unless explicitly confirmed via the preview dialog.
- Keep `docs/CODEGRAPH.md` synchronized.

---

### Task 1: Shared Types & Python Dependencies

**Files:**
- Modify: `apps/api/pyproject.toml`
- Modify: `packages/types/src/index.ts`
- Modify: `apps/api/domain/models.py`

**Interfaces:**
- Produces:
  - TypeScript: `ParsedScriptBlock`, `ParseFileResponse`
  - Python: `ParsedBlock`, `ParseFileResponse`

- [ ] **Step 1: Add python-docx dependency in pyproject.toml**

Update `apps/api/pyproject.toml` dependencies to include `python-docx>=1.1.0` and `pypdf>=5.0.0`.

- [ ] **Step 2: Add shared TypeScript types**

In `packages/types/src/index.ts`:
```typescript
export interface ParsedScriptBlock {
  id?: string;
  speaker: string;
  text: string;
}

export interface ParseFileResponse {
  filename: string;
  file_type: string;
  raw_text: string;
  blocks: ParsedScriptBlock[];
  word_count: int;
  char_count: int;
  estimated_duration_sec: number;
}
```

- [ ] **Step 3: Add Pydantic response models**

In `apps/api/domain/models.py`:
```python
class ParsedBlock(BaseModel):
    speaker: str = "Narrator"
    text: str

class ParseFileResponse(BaseModel):
    filename: str
    file_type: str
    raw_text: str
    blocks: list[ParsedBlock]
    word_count: int
    char_count: int
    estimated_duration_sec: float
```

- [ ] **Step 4: Commit changes**

```bash
git add apps/api/pyproject.toml packages/types/src/index.ts apps/api/domain/models.py
git commit -m "feat(types): add file parsing models and python-docx dependency"
```

---

### Task 2: Backend Document Parser Service & Route

**Files:**
- Create: `apps/api/domain/services/document_parser.py`
- Create: `apps/api/api/routes/parse.py`
- Modify: `apps/api/main.py`
- Test: `apps/api/tests/test_parse_file.py`

**Interfaces:**
- Consumes: `ParsedBlock`, `ParseFileResponse` from `domain.models`
- Produces: `POST /api/v1/parse-file` endpoint

- [ ] **Step 1: Write unit tests for document parser**

Create `apps/api/tests/test_parse_file.py` covering:
- Plain text & Markdown parsing
- SRT / VTT subtitle timestamp removal & dialogue grouping
- Speaker cue pattern extraction (`Speaker: Hello`, `[Narrator] Once upon a time`)
- PDF / DOCX parsing mocks and error handling for unsupported formats

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_parse_file.py -v`

- [ ] **Step 3: Implement DocumentParser service**

In `apps/api/domain/services/document_parser.py`:
- Implement `parse_text_content(content: str, filename: str, detect_speakers: bool, clean_whitespace: bool) -> ParseFileResponse`
- Implement `parse_pdf_bytes(data: bytes, filename: str) -> str` using `pypdf.PdfReader`
- Implement `parse_docx_bytes(data: bytes, filename: str) -> str` using `docx.Document`
- Implement `parse_srt_vtt_content(content: str) -> list[ParsedBlock]` with regex stripping timestamps and indexing.
- Compute word count, char count, and estimated audio duration (`word_count / 150.0 * 60.0`).

- [ ] **Step 4: Create FastAPI route and register in main.py**

Create `apps/api/api/routes/parse.py` with `POST /api/v1/parse-file` accepting `UploadFile = File(...)`, `detect_speakers: bool = Form(True)`, `clean_whitespace: bool = Form(True)`.
Register `parse_router` in `apps/api/main.py`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest tests/test_parse_file.py -v`

- [ ] **Step 6: Commit**

```bash
git add apps/api/domain/services/document_parser.py apps/api/api/routes/parse.py apps/api/main.py apps/api/tests/test_parse_file.py
git commit -m "feat(api): implement /api/v1/parse-file document parsing service"
```

---

### Task 3: Web API Client Integration

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: `POST /api/v1/parse-file`
- Produces: `parseDocumentFile(file: File, options?: { detectSpeakers?: boolean; cleanWhitespace?: boolean }): Promise<ParseFileResponse>`

- [ ] **Step 1: Implement `parseDocumentFile` in `apps/web/src/lib/api.ts`**

Add client-side reader for `.txt`/`.md` with regex speaker detection fallback, and `FormData` upload to `${API_BASE_URL}/api/v1/parse-file` for other files.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat(web): add parseDocumentFile API client"
```

---

### Task 4: File Import Preview Dialog Component

**Files:**
- Create: `apps/web/src/components/editor/FileImportDialog.tsx`

**Interfaces:**
- Consumes: `ParseFileResponse` from `@kobeanaudio/types`, `modalMotion` from `@/lib/motion`
- Produces: `<FileImportDialog isOpen={...} onClose={...} parseResult={...} onImport={...} />`

- [ ] **Step 1: Implement `FileImportDialog.tsx`**

Build dialog with:
- Stats strip: Filename, badge with format, Word count, Character count, Est. audio read duration.
- View switch: "Dialogue Blocks" vs "Raw Script".
- Editable text / preview blocks.
- Options:
  - Mode: "Replace Current Script" vs "Append to Script".
  - Toggle: "Detect Multi-Speaker Blocks".
  - Toggle: "Clean Extra Whitespace".
- Actions: "Cancel" button and "Import into Editor" primary button.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/editor/FileImportDialog.tsx
git commit -m "feat(web): create FileImportDialog preview component"
```

---

### Task 5: TextEditor Toolbar & Dropzone Integration

**Files:**
- Modify: `apps/web/src/components/editor/TextEditor.tsx`

**Interfaces:**
- Consumes: `FileImportDialog`, `parseDocumentFile`
- Produces: Integrated file upload button, drag-and-drop file dropzone on editor, and synchronized store update.

- [ ] **Step 1: Add upload button and dropzone handler to TextEditor**

- Add `<button>` with `<Upload />` icon in the top toolbar with tooltip "Upload & Parse Document (.txt, .md, .pdf, .docx, .srt)".
- Add hidden `<input type="file" accept=".txt,.md,.pdf,.docx,.srt,.vtt" />`.
- Add dragover/dragleave/drop event handlers to container with subtle animated border highlight.
- Connect file selection to `parseDocumentFile` and open `FileImportDialog`.
- On import confirm:
  - If Replace mode: sets `textContent` and replaces `blocks`.
  - If Append mode: appends to `textContent` and appends to `blocks`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/editor/TextEditor.tsx
git commit -m "feat(web): integrate file upload toolbar button and drag-drop into TextEditor"
```

---

### Task 6: Verification, Documentation & Codegraph Update

**Files:**
- Modify: `docs/CODEGRAPH.md`

- [ ] **Step 1: Run backend test suite**

Run: `cd apps/api && pytest -v`

- [ ] **Step 2: Run frontend build / lint check**

Run: `cd apps/web && npm run lint`

- [ ] **Step 3: Update `docs/CODEGRAPH.md`**

Add `RouteParse` (`POST /api/v1/parse-file`), `FileImportDialog.tsx`, and `DocumentParser` to the codegraph architecture diagram and dataflow matrix.

- [ ] **Step 4: Commit**

```bash
git add docs/CODEGRAPH.md
git commit -m "docs(codegraph): update architecture graph with file parser service and dialog"
```
