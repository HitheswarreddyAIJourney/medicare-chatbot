from langchain_community.utilities import SQLDatabase
import os
import sqlite3
import requests
import tempfile
import re
from langchain_classic.chains import create_sql_query_chain
from langchain_core.prompts import ChatPromptTemplate
from .llm import llm
from ..constants import SYSTEM_PROMPT



def clean_sql(raw: str) -> str:
    """Strip markdown fences and any preamble, leaving only the SQL statement."""
    raw = re.sub(r"```(?:sql)?", "", raw).strip("`").strip()
    # If the LLM prefixed with 'SQLQuery:' or 'Question: ...\nSQLQuery:', keep only what's after
    if "SQLQuery:" in raw:
        raw = raw.split("SQLQuery:")[-1].strip()
    return raw

def sql_rag_chain(question: str,db_path:str) -> str:
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
        ("system", SYSTEM_PROMPT),
        ("human", "Question: {question}\nSQL Result: {result}\n\nAnswer:"),
    ])
    response = answer_prompt | llm
    answer= response.invoke({"question": question, "result": result}).content
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





