# LazyShelf

A small, local passage finder for English text and Markdown. Search by words or by meaning, then inspect the exact original source. Semantic similarity is not proof of an answer.

## Local development

Requires Node.js 22 or newer and a modern browser with WebAssembly. No API key or GPU is required.

```sh
node --test tests/*.test.mjs
node scripts/serve.mjs
```

Open http://127.0.0.1:4187. Lexical search works immediately. Prepare semantic search with one explicit setup download (about 47.6 MB total runtime/model assets):

```sh
node scripts/download-assets.mjs
node scripts/verify-assets.mjs
```

Downloads come from the public npm CDN and Hugging Face, without an API key. Every artifact must match the committed SHA-256 manifest before installation. Internet access is required for this setup step. The application subsequently requests assets from its own local server, not a remote inference service. Source files, queries and documents are not supplied to the setup downloader. No npm installation is needed to serve the static app or run core tests.

Alternatively, for an existing downloaded asset cache:

```sh
node scripts/prepare-assets.mjs /path/to/existing/cache-root
```

The cache root must contain `node_modules/@huggingface/transformers`, `node_modules/onnxruntime-web` and `model-cache/Xenova/all-MiniLM-L6-v2`. The preparation script copies public assets locally and records their hashes; it does not download anything. It is a development provenance utility; use the hash-pinned downloader for normal installation.

## Scope

- UTF-8 `.txt` and `.md` only; 30 files, 500 KB per file, 500,000 total characters, at most 900 passages.
- Files remain in page memory. Clearing or reloading removes the collection; this is not a backup system.
- No generated answers, file edits, PDF parsing or account connections.
- Inspect source context for negation, codes and ambiguous language. Rankings can be wrong.
- Model assets are served locally. Offline reload and the final deployable package require separate verification; no universal offline claim is made.

## Technical structure

`dist/core.mjs` implements strict decoding, bounded collections, exact-offset chunks and lexical/semantic ranking. `dist/embedding-worker.mjs` runs CPU WASM inference outside the UI thread. `dist/app.mjs` manages collection revisions, cancellation and source inspection. Text is rendered as text nodes, never executable Markdown/HTML.

This project uses Transformers.js and the Apache-2.0 MiniLM model. See `THIRD_PARTY_NOTICES.md` and `licenses/` for exact versions, model revision and bundled notices. Existing tools including SemanticFinder already provide browser-local semantic search; LazyShelf makes no claim to invent that approach.

## Reproducible evaluation and source package

`evaluation/README.md` documents the synthetic, non-blind retrieval fixture, measured results and limitations. These results are not a user study or a head-to-head accuracy comparison with SemanticFinder.

```sh
node scripts/package-source.mjs --check
node scripts/package-source.mjs /path/to/new-source-package
```

The packaging command requires a new destination, includes licensing and evaluation files, and creates a file-by-file SHA-256 manifest. Downloaded model/runtime assets and imported user documents are not part of the source package. Prepare the pinned assets separately with the setup commands above.
