from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, sellers, products, cart, orders, reviews, admin, sync, wallet
from app.utils.logging import setup_logging

Base.metadata.create_all(bind=engine)
setup_logging()

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(sellers.router, prefix="/sellers", tags=["sellers"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(cart.router, prefix="/cart", tags=["cart"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(sync.router, prefix="/sync", tags=["sync"])
app.include_router(wallet.router, prefix="/wallet", tags=["wallet"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Qena Marketplace API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
