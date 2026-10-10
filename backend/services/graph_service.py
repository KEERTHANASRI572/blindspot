import networkx as nx
from typing import List, Dict, Any
import hashlib
from services.llm_client import llm_client

class GraphService:
    """
    Concept Graph Builder using NetworkX.
    Extracts concepts and typed relations (prerequisite_of, causes, contrasts_with, part_of),
    deduplicates nodes, and serializes to interactive graph format.
    """
    def build_graph_from_llm(self, topic_title: str, text: str, chunks: List[Dict[str, str]]) -> Dict[str, Any]:
        """Extract concept nodes and edges from text via LLM or demo mock."""
        chunk_snippets = "\n".join([f"[{c['id']}]: {c['text'][:150]}..." for c in chunks[:5]])
        
        prompt = (
            f"You are a cognitive science expert building an educational concept ontology.\n"
            f"Topic: {topic_title}\n"
            f"Material chunks:\n{chunk_snippets}\n\n"
            f"Extract 4 to 6 key concept nodes and directed typed edges connecting them.\n"
            f"Allowed edge types: 'prerequisite_of', 'causes', 'contrasts_with', 'part_of'.\n"
            f"Return JSON format:\n"
            f"{{\n"
            f"  \"nodes\": [\n"
            f"    {{\"id\": \"c-1\", \"name\": \"Concept Name\", \"summary\": \"1-sentence summary\", \"source_chunk_ids\": [\"chk-1\"]}}\n"
            f"  ],\n"
            f"  \"edges\": [\n"
            f"    {{\"from\": \"c-1\", \"to\": \"c-2\", \"type\": \"prerequisite_of\"}}\n"
            f"  ]\n"
            f"}}"
        )

        mock_fallback = {
            "nodes": [
                {"id": "c-1", "name": f"{topic_title} Fundamentals", "summary": "Core foundational mechanisms and definitions.", "source_chunk_ids": [chunks[0]["id"]] if chunks else []},
                {"id": "c-2", "name": f"{topic_title} Architecture & Rules", "summary": "Structural invariants and behavioral constraints.", "source_chunk_ids": [chunks[1]["id"]] if len(chunks) > 1 else []},
                {"id": "c-3", "name": f"{topic_title} Optimization & Edge Cases", "summary": "Real-world trade-offs, concurrency, and anomaly handling.", "source_chunk_ids": [chunks[2]["id"]] if len(chunks) > 2 else []}
            ],
            "edges": [
                {"from": "c-1", "to": "c-2", "type": "prerequisite_of"},
                {"from": "c-2", "to": "c-3", "type": "causes"}
            ]
        }

        graph_data = llm_client.generate_json(prompt, mock_fallback=mock_fallback)
        return self.normalize_and_clean_graph(graph_data)

    def normalize_and_clean_graph(self, graph_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate, deduplicate, and build NetworkX graph."""
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])
        
        G = nx.DiGraph()
        
        node_map = {}
        for n in nodes:
            nid = n.get("id") or f"c-{hashlib.md5(n.get('name', '').encode()).hexdigest()[:6]}"
            node_map[nid] = {
                "id": nid,
                "name": n.get("name", "Unnamed Concept"),
                "summary": n.get("summary", ""),
                "source_chunk_ids": n.get("source_chunk_ids", []),
                "p_known": n.get("p_known", 0.30)
            }
            G.add_node(nid, **node_map[nid])

        cleaned_edges = []
        for e in edges:
            u = e.get("from") or e.get("from_node")
            v = e.get("to") or e.get("to_node")
            e_type = e.get("type", "prerequisite_of")
            
            if u in node_map and v in node_map and u != v:
                G.add_edge(u, v, type=e_type)
                cleaned_edges.append({
                    "id": f"e-{u}-{v}",
                    "from": u,
                    "to": v,
                    "type": e_type
                })

        return {
            "nodes": list(node_map.values()),
            "edges": cleaned_edges
        }

graph_service = GraphService()
