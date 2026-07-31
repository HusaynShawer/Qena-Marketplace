from pydantic import BaseModel
from uuid import UUID
class catrequest(BaseModel):
    __tablename__ = "categories"
    
    name:str
    description :str