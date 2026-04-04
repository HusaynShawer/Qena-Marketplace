from fastapi import APIRouter

router = APIRouter()

@router.post("/webhook")
def webhook():
    return {"message": "Sync endpoint ready"}