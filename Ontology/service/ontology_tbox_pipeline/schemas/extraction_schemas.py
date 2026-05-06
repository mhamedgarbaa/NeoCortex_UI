from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedClass(BaseModel):
    name: str = Field(
        ...,
        description="The name of the class in PascalCase (e.g., 'FinancialInstrument', 'Organization').",
    )
    parent_name: Optional[str] = Field(
        None,
        description="The name of the parent class from which this class inherits, if any. Leave null for top-level classes.",
    )
    description: str = Field(
        ...,
        description="A concise definition of the class based on the text.",
    )

class ExtractedClassList(BaseModel):
    classes: List[ExtractedClass] = Field(
        default_factory=list,
        description="The list of extracted functional classes from the text.",
    )

class ExtractedDataProperty(BaseModel):
    name: str = Field(
        ...,
        description="The name of the data property in camelCase (e.g., 'startDate', 'amount').",
    )
    domain_class: str = Field(
        ...,
        description="The name of the class (from the given class list) this property belongs to.",
    )
    range_xsd: str = Field(
        ...,
        description="The XSD datatype (e.g., 'xsd:string', 'xsd:integer', 'xsd:date', 'xsd:decimal', 'xsd:boolean').",
    )
    description: str = Field(
        ...,
        description="A concise definition of the attribute.",
    )

class ExtractedDataPropertyList(BaseModel):
    properties: List[ExtractedDataProperty] = Field(
        default_factory=list,
        description="The list of extracted data properties.",
    )

class ExtractedObjectProperty(BaseModel):
    name: str = Field(
        ...,
        description="The name of the object property in camelCase (e.g., 'hasCustomer', 'worksFor').",
    )
    domain_class: str = Field(
        ...,
        description="The name of the source class (from the given class list).",
    )
    range_class: str = Field(
        ...,
        description="The name of the target class (from the given class list).",
    )
    description: str = Field(
        ...,
        description="A concise definition of the relationship.",
    )
    inverse_of: Optional[str] = Field(
        None,
        description="The name of the inverse object property, if applicable (e.g., if 'hasCustomer' is inverse of 'isCustomerOf').",
    )

class ExtractedObjectPropertyList(BaseModel):
    properties: List[ExtractedObjectProperty] = Field(
        default_factory=list,
        description="The list of extracted object properties.",
    )
