# Retrieval evaluation

This directory contains an original fictional document collection, fixed query expectations, a runnable retrieval-core evaluation and its actual output.

## Run it

From the LazyShelf repository after installing the model/runtime assets:

```sh
npm install --ignore-scripts
node evaluation/run-evaluation.mjs
```

The evaluation uses Transformers.js 3.8.1 and the local quantized MiniLM model. It disables network fetches during inference. The optional first and second arguments select a project root and an existing dependency root when the evaluation tools live outside a checkout. Those paths are not part of the result report.

## Method

Six original fictional English workshop documents contain 6,689 characters. Two share the same filename. The fixed set has twenty queries: eight paraphrases, four identifiers, three negation questions, two ambiguous questions and three absent-answer questions.

For the seventeen answerable queries, a correct result must contain a specified decisive span from an allowed source document. Merely returning another passage from the right file is not enough. Report top-one and top-three counts separately. The three absent-answer queries are retained in results but excluded from the answerable-query denominator.

Only document passage text and query text enter the embedding model. Source IDs and expected spans are used afterward for grading, not as model input. The embedding model uses mean pooling and normalization; the retrieval core uses its normal keyword and semantic ranking functions. Every ranked passage is checked against the exact decoded source slice at its recorded offsets.

## Actual result

| Mode | Top one | Top three |
| --- | ---: | ---: |
| Keyword | 13 / 17 | 15 / 17 |
| Semantic | 16 / 17 | 17 / 17 |

The semantic top-one miss is preserved rather than removed or retuned: it ranks the right document but not the complete expected decisive sentence first. Keyword failures are also retained. Neither method detects whether a natural-language question is answerable. A unique absent literal has no keyword matches; semantic retrieval can still return neighbors for it.

The run used thirteen chunks and 384-dimensional embeddings. It made zero network calls and all source-slice checks passed. Exact fixture/core hashes, timestamps, individual results and timing observations are in `results.json`.

## What this does not establish

These inputs were authored for evaluation and are not a blind real-user benchmark. The reviewer and implementer used related AI tooling and shared storage. Separate authorship does not imply independent scientific replication. The counts do not establish market demand, customer time savings, universal accuracy or superiority to SemanticFinder.

This is **Node CPU / ONNX**, not a browser WASM benchmark. It does not certify browser rendering, accessibility, cancellation behavior, mobile usability, offline navigation or release readiness. Installation downloads and inference are separate phases; network-free inference does not imply network-free installation.
