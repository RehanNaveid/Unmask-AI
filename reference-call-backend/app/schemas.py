from pydantic import BaseModel
from uuid import UUID

class StartReferenceCallRequest(BaseModel):
    candidate_id: UUID
    candidate_name: str
    reference_name: str
    phone_number: str

class FinalizeResponse(BaseModel):
    status: str
    summary: dict
