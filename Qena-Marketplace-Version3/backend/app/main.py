from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, sellers, products, cart, orders, reviews, admin, sync, wallet,categories
from app.utils.logging import setup_logging

Base.metadata.create_all(bind=engine)
setup_logging()

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Security Headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Rate limiting simple
request_counts = {}

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host
    path = request.url.path
    key = f"{client_ip}:{path}"
    request_counts[key] = request_counts.get(key, 0) + 1
    if request_counts[key] > 100:
        return JSONResponse(status_code=429, content={"detail": "Too many requests"})
    response = await call_next(request)
    return response

app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(users.router,    prefix="/users",    tags=["users"])
app.include_router(sellers.router,  prefix="/sellers",  tags=["sellers"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(cart.router,     prefix="/cart",     tags=["cart"])
app.include_router(orders.router,   prefix="/orders",   tags=["orders"])
app.include_router(reviews.router,  prefix="/reviews",  tags=["reviews"])
app.include_router(admin.router,    prefix="/admin",    tags=["admin"])
app.include_router(sync.router,     prefix="/sync",     tags=["sync"])
app.include_router(wallet.router,   prefix="/wallet",   tags=["wallet"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
@app.get("/")
def read_root():
    return {"message": "Welcome to Qena Marketplace API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
