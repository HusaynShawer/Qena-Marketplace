from fastapi import HTTPException
from app.models.cart import Cart
from app.cart.cart_repo import CartRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.items import CartItemCreate,CartItemUpdate
from app.product.product_repo import ProductRepository
from uuid import UUID

class CartService:

    def __init__(self,session:AsyncSession):
        self.session = session
        self.cart_repo = CartRepository(session=session)
        self.product_repo = ProductRepository(session=session)

    async def get_cart(self, current_user: User) -> dict:
        cart_items = await self.cart_repo.get_user_cart(current_user.id)
        
        items = []
        for cart_item in cart_items:
            product = await self.product_repo.get_by_id(cart_item.product_id)
            items.append({
                "id": cart_item.id,
                "quantity": cart_item.quantity,
                "product": {
                    "id": str(product.id),
                    "name": product.name,
                    "price": product.price,
                    "image_url": product.image_url,
                    "stock": product.stock,
                }
            })
        
        total = sum(i["product"]["price"] * i["quantity"] for i in items)
        return {"items": items, "total": round(total, 2)}
    
    async def add_to_cart(self,item:CartItemCreate,current_user:User)-> dict:
        product = await self.product_repo.get_by_id(item.product_id)
        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )
        if product.stock < item.quantity:
            raise HTTPException(
                            status_code=400, detail="Insufficient stock"
                        )

        cart_item = await self.cart_repo.get_cart_item(current_user.id,item.product_id)

        if cart_item:
            cart_item.quantity+= item.quantity
            await self.cart_repo.save(cart_item)

        else:
            cart_item = Cart(user_id = current_user.id,product_id = item.product_id,
                         quantity = item.quantity)
            await self.cart_repo.create(cart_item)

        
        return {"message": "Added to cart"}


    async def delete_item(self, item_id: int, current_user: User) -> dict:
        cart = await self.cart_repo.get_cart_item_by_id(item_id, current_user.id)
        if not cart:
            raise HTTPException(status_code=404, detail="Cart item not found")
        await self.cart_repo.delete(cart=cart)
        return {"message": "cart item was deleted"}

    async def update_quantity(self,current_user:User,update_data:CartItemUpdate)->Cart:
        cart = await self.cart_repo.get_cart_item(current_user.id,update_data.product_id)
        if not cart:
            raise HTTPException(
                                status_code=404, detail="Cart Not Found"
                            )
        
        if update_data.quantity <= 0:
            raise HTTPException(
                                status_code=400, detail="Quantity must be greater than zero"
                            )

        product = await self.product_repo.get_by_id(update_data.product_id)

        if not product:
            raise HTTPException(
                                status_code=404, detail="Product Not Found"
                            )

        if product.stock < update_data.quantity:
            raise HTTPException(
                                status_code=400, detail="Quantity Not enough"
                            )
       
        cart.quantity = update_data.quantity
        await self.cart_repo.save(cart)
        return cart

    async def clear_cart(self,current_user:User)-> dict:
        cart = await self.cart_repo.get_user_cart(current_user.id)
        if not cart:
            raise HTTPException(
                                status_code=400, detail="Cart is already empty"
                            )
        
        await self.cart_repo.clear_cart(current_user.id)
        return {"message": "Cart cleared successfully"}
    