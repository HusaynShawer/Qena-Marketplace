import re
from fastapi import HTTPException

def sanitize_string(value: str, field_name: str, max_length: int = 500) -> str:
    """تنضيف الـ input من XSS"""
    if not value or not value.strip():
        raise HTTPException(status_code=422, detail=f"{field_name} cannot be empty")
    # شيل الـ HTML tags
    clean = re.sub(r'<[^>]+>', '', value)
    clean = clean.strip()
    if len(clean) > max_length:
        raise HTTPException(status_code=422, detail=f"{field_name} too long (max {max_length})")
    return clean

def validate_price(price: float) -> float:
    if price <= 0:
        raise HTTPException(status_code=422, detail="Price must be greater than 0")
    if price > 10_000_000:
        raise HTTPException(status_code=422, detail="Price too high")
    return round(price, 2)

def validate_stock(stock: int) -> int:
    if stock < 0:
        raise HTTPException(status_code=422, detail="Stock cannot be negative")
    if stock > 100_000:
        raise HTTPException(status_code=422, detail="Stock too high")
    return stock

def validate_email(email: str) -> str:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(status_code=422, detail="Invalid email address")
    return email.lower().strip()
