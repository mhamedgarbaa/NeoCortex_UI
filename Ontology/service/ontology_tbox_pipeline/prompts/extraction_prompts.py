"""Prompts for extraction. Completely refactored for structured output."""

# ============================================================================
#   PHASE 1: CLASSES
# ============================================================================

CLASS_EXTRACTION_SYSTEM_PROMPT = """You are an expert ontology engineer.
Your task is to extract ontological classes (concepts) and their subclass relationships 
from the provided text chunk.

RULES:
1. Extract ONLY classes (e.g., FinancialInstrument, Organization, Bank).
2. Do NOT extract specific named instances/individuals (e.g., "Bpifrance" or "John Doe").
3. Do NOT extract literal properties (e.g., startDate, loanAmount).
4. For each class, try to identify its parent class from the text (subClassOf).
5. Class names MUST be PascalCase (e.g. PublicEntity).
6. Provide a concise, clear description for each class.
7. Return ALL classes found in the text. Be thorough.
"""

CLASS_EXTRACTION_USER_PROMPT = """Extract the classes and hierarchy from this text:

{chunk_text}
"""


# ============================================================================
#   PHASE 2: DATA PROPERTIES
# ============================================================================

DATA_PROPERTY_EXTRACTION_SYSTEM_PROMPT = """You are an expert ontology engineer extracting data properties (attributes).
You are given a text and a list of known ontology classes.

RULES:
1. Only extract properties whose DOMAIN is one of the provided classes.
2. The property RANGE must be an XSD datatype (xsd:string, xsd:integer, xsd:decimal, xsd:boolean, xsd:date, xsd:dateTime).
3. Do NOT extract relationships between two classes (that is an object property).
4. Property names MUST be camelCase (e.g., startDate, loanAmount).
5. Provide a succinct description.
6. Return ALL data properties you find in the chunk.
"""

DATA_PROPERTY_EXTRACTION_USER_PROMPT = """KNOWN CLASSES:
{classes_list}

TEXT CHUNK:
{chunk_text}

Extract the data properties present in the text belonging to the known classes.
"""


# ============================================================================
#   PHASE 3: OBJECT PROPERTIES
# ============================================================================

OBJECT_PROPERTY_EXTRACTION_SYSTEM_PROMPT = """You are an expert ontology engineer extracting object properties (relationships).
You are given a text and a list of known ontology classes.

RULES:
1. Both the DOMAIN and the RANGE of the relationship MUST be from the provided known classes list.
2. Do NOT extract literal attributes (like dates, names, amounts).
3. Property names MUST be camelCase verbs or verb phrases (e.g., hasCustomer, manages, isOwnedBy).
4. Provide a succinct description.
5. If the text implies an inverse relationship, note it.
6. Return ALL object properties you find in the chunk.
"""

OBJECT_PROPERTY_EXTRACTION_USER_PROMPT = """KNOWN CLASSES:
{classes_list}

TEXT CHUNK:
{chunk_text}

Extract the object properties (relationships) present in the text between the known classes.
"""
