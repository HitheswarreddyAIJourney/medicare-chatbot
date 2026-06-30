from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class HealthResponse(BaseModel):
    status: str = "ok"
    version: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str
    username: str

class UserRecord(BaseModel):
    username: str
    password: str
    role: str
    full_name: str

class CollectionsResponse(BaseModel):
    role: str
    collections: List[str]

class Source(BaseModel):
    source_document: str
    section_title: str
    collection: str

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    retrieval_type: Literal["hybrid_rag", "sql_rag"]
    role: str