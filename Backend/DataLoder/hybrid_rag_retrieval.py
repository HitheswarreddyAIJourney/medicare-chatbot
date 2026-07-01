from typing import Dict, Any
from langchain_classic.retrievers import ContextualCompressionRetriever


def _normalize_section_title(value: Any) -> str:
    """Convert heading metadata to a single string for API compatibility."""
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return " / ".join(cleaned) if cleaned else ""
    if value is None:
        return ""
    return str(value)
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from ..constants import HYBRID_TOP_K, CLIENT, COLLECTION_NAME, SYSTEM_PROMPT
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
)
import logging
from langchain_classic.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from .llm import llm
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from ..data_loader import dense_embeddings, sparse_embeddings

log = logging.getLogger(__name__)


vectorstore = QdrantVectorStore(
    client=CLIENT,
    collection_name=COLLECTION_NAME,
    embedding=dense_embeddings,
    sparse_embedding=sparse_embeddings,
    retrieval_mode=RetrievalMode.HYBRID,
)

# Load cross-encoder model (downloads ~270MB on first run)
cross_encoder = HuggingFaceCrossEncoder(
    model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"
)

# Wrap it as a LangChain document compressor
reranker = CrossEncoderReranker(
    model=cross_encoder,
    top_n=3           # keep only top-3 after reranking
)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{input}"),
])



def _build_hybrid_retriever(role: str):
    """Build a Qdrant retriever filtered by the user's allowed roles."""
    return vectorstore.as_retriever(
        search_kwargs={
            "k": HYBRID_TOP_K,
            "filter": Filter(
                must=[
                    FieldCondition(
                        key="metadata.allowed_roles",
                        match=MatchValue(value=role),
                    )
                ]
            ),
        }
    )

def _build_reranking_chain(role: str):
    hybrid_retriever = _build_hybrid_retriever(role)
    reranking_retriever = ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=hybrid_retriever,
    )
    return create_retrieval_chain(
        reranking_retriever,
        create_stuff_documents_chain(llm, prompt),
    )

# Ask Reranking RAG a question
def ask_reranking(question: str, role: str) -> Dict[str, Any]:
    reranking_rag_chain = _build_reranking_chain(role)
    result = reranking_rag_chain.invoke({"input": question})
    log.info("Reranking result: %s", result.get("context"))

    # Convert Document objects to dicts matching Source schema.
    # Some documents provide headings as lists, so normalize them to strings.
    sources = []
    for doc in result.get("context", []):
        metadata = doc.metadata.get("dl_meta", {}) or {}
        origin = metadata.get("origin", {}) or {}
        headings = metadata.get("headings", "")
        sources.append({
            "source_document": origin.get("filename", ""),
            "section_title": _normalize_section_title(headings),
            "collection": doc.metadata.get("_collection_name", ""),
        })
    result["sources"] = sources
    return result