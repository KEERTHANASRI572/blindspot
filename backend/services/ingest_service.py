import hashlib
import re
from typing import List, Dict, Any, Tuple
import math

class IngestService:
    """
    Ingestion and chunking service.
    Splits notes into meaningful semantic paragraphs and provides
    grounding retrieval for scenario generation.
    """
    def chunk_text(self, text: str, max_chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, str]]:
        """Split text by paragraphs and sentences with unique chunk IDs."""
        text = text.strip()
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
        
        chunks = []
        chunk_idx = 1
        
        for para in paragraphs:
            if len(para) <= max_chunk_size:
                c_id = f"chk-{hashlib.md5(para.encode('utf-8')).hexdigest()[:8]}"
                # Extract first sentence or 5 words as title
                first_line = para.split('.')[0][:40] + "..."
                chunks.append({
                    "id": c_id,
                    "title": first_line,
                    "text": para
                })
                chunk_idx += 1
            else:
                # Sub-chunk by sentences
                sentences = re.split(r'(?<=[.!?])\s+', para)
                current_buf = []
                current_len = 0
                for s in sentences:
                    current_buf.append(s)
                    current_len += len(s)
                    if current_len >= max_chunk_size:
                        c_text = " ".join(current_buf)
                        c_id = f"chk-{hashlib.md5(c_text.encode('utf-8')).hexdigest()[:8]}"
                        chunks.append({
                            "id": c_id,
                            "title": c_text[:40] + "...",
                            "text": c_text
                        })
                        current_buf = []
                        current_len = 0
                if current_buf:
                    c_text = " ".join(current_buf)
                    c_id = f"chk-{hashlib.md5(c_text.encode('utf-8')).hexdigest()[:8]}"
                    chunks.append({
                        "id": c_id,
                        "title": c_text[:40] + "...",
                        "text": c_text
                    })

        return chunks

    def compute_bm25_similarity(self, query: str, chunks: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Simple lightweight token-based similarity to ground scenarios in material."""
        query_words = set(re.findall(r'\w+', query.lower()))
        results = []
        for chk in chunks:
            chk_words = re.findall(r'\w+', chk["text"].lower())
            if not chk_words:
                continue
            matches = sum(1 for w in chk_words if w in query_words)
            score = matches / (len(chk_words) + 1.0)
            results.append({
                "chunk": chk,
                "score": score
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

ingest_service = IngestService()
