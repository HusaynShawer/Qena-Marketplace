from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category

router = APIRouter()


@router.get("/")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.id).all()
    return [{"id": c.id, "name": c.name} for c in cats]