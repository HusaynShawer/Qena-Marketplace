from typing import List, Optional
from pydantic import BaseModel

class StatusUpdate(BaseModel):
    status: str

class CheckoutRequest(BaseModel):
    """Buyer fills this at checkout so the seller can see delivery details."""
    buyer_phone: str
    buyer_address: str
    buyer_city: str
    buyer_notes: Optional[str] = None