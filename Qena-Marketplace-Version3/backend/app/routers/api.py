from fastapi import APIRouter

from app.user.user_router import user_router
from app.product.product_router import product_router
from app.cart.cart_router import cart_router
from app.orders.order_router import order_router,orders_seller_router
from app.wallet.wallet_router import wallet_router,admin_wallet_router
from app.seller.seller_router import seller_router
from app.auth.auth_router import auth_router
from app.admin.admin_router import admin_router
from app.categories.category_router import category_router
from app.reviews.reviews_router import review_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(product_router)
api_router.include_router(cart_router)
api_router.include_router(order_router)
api_router.include_router(orders_seller_router)
api_router.include_router(wallet_router)
api_router.include_router(seller_router)
api_router.include_router(admin_router)
api_router.include_router(category_router)
api_router.include_router(review_router)
api_router.include_router(admin_wallet_router)