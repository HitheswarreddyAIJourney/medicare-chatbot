from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import FastEmbedSparse
from .constants import EMBED_MODEL,FOLDER_TO_ROLES, COLLECTION_NAME
from pathlib import Path
from typing import List
from langchain_core.documents import Document
from langchain_docling import DoclingLoader
from langchain_docling.loader import ExportType
from docling.chunking import HierarchicalChunker



# Dense embeddings — semantic understanding
dense_embeddings = HuggingFaceEmbeddings(
    model_name=EMBED_MODEL,
    model_kwargs={"device": "cpu"},      # change to "cuda" if you have a GPU
    encode_kwargs={"normalize_embeddings": True}
)

# Sparse embeddings — BM25 keyword matching (via FastEmbed)
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25", batch_size=32)


def load_documents(source_dir: str = "DataSources"):
    """
    Recursively load all PDF and Markdown files from source_dir.
    Converts into Langchain documents 
    Create Vector DB
    """
    source_path = Path(source_dir)

    files = [
        file for file in source_path.rglob("*")
        if file.suffix.lower() in {".pdf", ".md"}
    ]

    documents = []

    for file_path in files:
        folder = file_path.relative_to(source_path).parts[0]  # "billing", "clinical", etc.
        allowed_roles = FOLDER_TO_ROLES.get(folder, [])

        loader = DoclingLoader(
            str(file_path),
            export_type=ExportType.DOC_CHUNKS,
            chunker=HierarchicalChunker(),
        )
        docs = list(loader.load())
        for doc in docs:
            doc.metadata["folder"] = folder
            doc.metadata["allowed_roles"] = allowed_roles  # list of roles that can access this document
        documents.extend(docs)
    
    langchain_docs=[Document(page_content=doc.page_content, metadata=doc.metadata) for doc in documents]
    
    QdrantVectorStore.from_documents(
        langchain_docs,
        embedding=dense_embeddings,
        sparse_embedding=sparse_embeddings,
        host="localhost",
        port=6333,
        collection_name=COLLECTION_NAME,
        retrieval_mode=RetrievalMode.HYBRID,
    )


if __name__ == "__main__":
    load_documents()

