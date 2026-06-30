import os
from dotenv import load_dotenv
from typing import Dict, List
from pathlib import Path
from qdrant_client import QdrantClient



load_dotenv()


QDRANT_URL = "http://localhost:6333"


ROLE_TO_COLLECTIONS: Dict[str, List[str]] = {
    "doctor":            ["clinical", "general"],
    "nurse":             ["nursing", "general"],
    "billing_executive": ["billing", "general"],
    "technician":        ["equipment", "general"],
    "admin":             ["clinical", "nursing", "billing", "equipment", "general"],
}
ALL_ROLES = set(ROLE_TO_COLLECTIONS.keys())


# auth.py
USERS_PATH: str = os.getenv("USERS_PATH", "./backend/data/users.json")

JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "120"))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQL_DB_PATH: str = PROJECT_ROOT / "DataLoader" / "db" / "mediassist.db"
SQL_RAG_ROLES = {"billing_executive", "admin"}


# llm.py
GROQ_MODEL = "openai/gpt-oss-20b"

# Data Loader
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HYBRID_TOP_K = 10
CLIENT = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "medical_docs"
FOLDER_TO_ROLES: dict[str, list[str]] = {
    "clinical":  ["doctor", "admin"],
    "general":   ["doctor", "nurse", "billing_executive", "technician", "admin"],
    "equipment": ["technician", "admin"],
    "billing":   ["billing_executive", "admin"],
    "nursing":   ["nurse", "doctor", "admin"],
}

SYSTEM_PROMPT="""
You are a helpful medibot support assistant.
Answer the customer's question using ONLY the information provided in the context below.
If the answer is not in the context, say "I don't have that information."
Keep answers concise and friendly.

Context:
{context}
"""

