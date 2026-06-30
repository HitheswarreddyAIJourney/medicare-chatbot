from langchain_groq import ChatGroq
from ..constants import GROQ_MODEL



llm = ChatGroq(
    model=GROQ_MODEL,
    temperature=0,
    max_tokens=None,
    reasoning_format="parsed",
    timeout=None,
    max_retries=2,
)