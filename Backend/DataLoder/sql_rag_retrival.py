from langchain_community.utilities import SQLDatabase
import os
import sqlite3
import requests
import tempfile
import re
from langchain_classic.chains import create_sql_query_chain
from langchain_core.prompts import ChatPromptTemplate
from .llm import llm
from ..constants import SQL_ANSWER_SYSTEM



def clean_sql(raw: str) -> str:
    """Strip markdown fences and any preamble, leaving only the SQL statement."""
    raw = re.sub(r"```(?:sql)?", "", raw).strip("`").strip()
    # If the LLM prefixed with 'SQLQuery:' or 'Question: ...\nSQLQuery:', keep only what's after
    if "SQLQuery:" in raw:
        raw = raw.split("SQLQuery:")[-1].strip()
    return raw


def _fallback_count_answer(question: str, db_path: str) -> dict | None:
    """Handle simple count-style questions without using the external LLM."""
    normalized = question.lower()
    table_name = None

    if re.search(r"\bclaims?\b", normalized):
        table_name = "claims"
    elif re.search(r"\bmainten(?:ance\s+)?tickets?\b", normalized):
        table_name = "maintenance_tickets"

    if not table_name:
        return None

    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
    except Exception:
        return None

    label = table_name.replace("_", " ")
    if count == 1:
        noun = label[:-1] if label.endswith("s") else label
        answer = f"There is 1 {noun} in the database."
    else:
        answer = f"There are {count} {label} in the database."

    return {
        "answer": answer,
        "sources": [
            {
                "source_document": "mediassist.db",
                "section_title": table_name,
                "collection": "database",
            }
        ],
        "retrieval_type": "sql_rag",
        "role": None,
    }


def sql_rag_chain(question: str, db_path: str) -> str:
    fallback = _fallback_count_answer(question, db_path)
    if fallback is not None:
        return fallback

    # Step 1: Generate SQL from the natural language question
    db = SQLDatabase.from_uri(f"sqlite:///{db_path}")
    sql_query_chain = create_sql_query_chain(llm, db)
    raw_sql = sql_query_chain.invoke({"question": question})
    sql = clean_sql(raw_sql)
    print(f"[debug] cleaned SQL → {sql}")

    # Step 2: Execute the SQL against the database
    result = db.run(sql)

    # Step 3: Ask the LLM to turn the raw result into a natural language answer
    answer_prompt = ChatPromptTemplate.from_messages([
        ("system", SQL_ANSWER_SYSTEM),
        ("human", "{question}"),
    ])
    response = answer_prompt | llm
    answer = response.invoke({"question": question, "result": result}).content
    return {
        "answer": answer,
        "sources": [
            {
                "source_document": "mediassist.db",
                "section_title": db.get_usable_table_names(),
                "collection": "database",
            }
        ],
        "retrieval_type": "sql_rag",
        "role": None,  # set by orchestrator
    }





