# Third-party components

LazyShelf uses the following components. Their code and model weights remain subject to their respective licences; the application licence does not replace them.

| Component | Version | Source | Licence |
| --- | --- | --- | --- |
| Transformers.js | 3.8.1 | https://github.com/huggingface/transformers.js | Apache-2.0; full installed licence in `licenses/TRANSFORMERS-APACHE-2.0.txt` |
| ONNX Runtime Web | 1.22.0-dev.20250409-89f8206ba4 | https://github.com/microsoft/onnxruntime/tree/89f8206ba4 | MIT; upstream licence in `licenses/ONNX-RUNTIME-MIT.txt` and full upstream notices in `licenses/ONNX-ThirdPartyNotices.txt`. This is not stable 1.22.0. |
| Xenova/all-MiniLM-L6-v2 | revision `751bff37182d3f1213fa05d7196b954e230abad9`; artifact hashes in `assets/manifest.json` | https://huggingface.co/Xenova/all-MiniLM-L6-v2 | Apache-2.0 according to model card; ONNX conversion of sentence-transformers/all-MiniLM-L6-v2 |

The model is used for embeddings, not generated answers. Runtime/model files total 47,579,285 bytes in the pinned manifest. The source code does not embed owner documents, credentials or private agent conversations. Model artifacts are excluded from Git by default and prepared separately.

The pinned [Xenova model card](licenses/XENOVA-MINILM-MODEL-CARD.txt) declares `license: apache-2.0`. It was retrieved from https://huggingface.co/Xenova/all-MiniLM-L6-v2/raw/751bff37182d3f1213fa05d7196b954e230abad9/README.md and retained verbatim (SHA-256 `63ea99bf681a2e9eda4f6a537d5ed8fda95d1677111656da37e9cfd080c3af02`). The full [Apache License 2.0 text](licenses/TRANSFORMERS-APACHE-2.0.txt) is included; the model card is provenance, not a replacement for that licence. Its usage examples are upstream documentation, not additional application behavior.

ONNX licence source: https://raw.githubusercontent.com/microsoft/onnxruntime/89f8206ba4/LICENSE . Full upstream notice source: https://raw.githubusercontent.com/microsoft/onnxruntime/89f8206ba4/ThirdPartyNotices.txt . The included notice is byte-identical to the retrieved upstream file, SHA-256 `e9e90971a8e75a9a8ac0c6412e29c1202d079998389915aa485f46c816c3b4cc`. Bundled runtime legal headers are preserved. The upstream notice covers multiple ONNX components/platforms and is retained in full rather than assuming which sections may be removed.

Existing browser-local semantic search tools, including SemanticFinder, informed the comparison. LazyShelf does not claim to invent semantic or hybrid search. No incumbent source code has been copied into the application.
