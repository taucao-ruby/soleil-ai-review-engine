# Draft: soleil-ai-review-engine Brainstorming - Clustering & Process Maps

## Initial Context
- Project: **soleil-ai-review-engineV2**
- Structure: 
    - `soleil-ai-review-engine/` (Likely the core application)
    - `soleil-ai-review-engine-mcp/` (Likely a Model Context Protocol server)
- Goal: Make it accurate and usable for smaller/dumber models.
- Current Focus: Implementing **Clustering** and **Process Maps**.

## Findings
- **Clustering**: Found `soleil-ai-review-engine/src/core/ingestion/cluster-enricher.ts`.
- **Process Maps**: No files matched `*process*map*` yet. Searching content next.

## Open Questions
- How is "process map" defined in this context? (Graph, mermaid diagram, flowchart?)
- What is the input for clustering? (Code chunks, files, commits?)
- What is the intended output for "smaller models"? (Simplified context, summaries?)
