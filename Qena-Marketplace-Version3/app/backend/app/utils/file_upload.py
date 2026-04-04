import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles
from app.config import settings

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_IMAGE_SIZE = (1200, 1200)  # Max width/height

async def save_upload_file(upload_file: UploadFile, subfolder: str = "") -> str:
    """Save uploaded file and return the URL path"""
    
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check extension
    ext = Path(upload_file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Create directory
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / filename
    
    # Save file
    try:
        contents = await upload_file.read()
        
        # Check file size
        if len(contents) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        # Save and optionally resize image
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        # Resize if needed
        if ext in {'.jpg', '.jpeg', '.png', '.webp'}:
            await resize_image(file_path)
        
        # Return relative URL path
        return f"/uploads/{subfolder}/{filename}" if subfolder else f"/uploads/{filename}"
        
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

async def resize_image(file_path: Path):
    """Resize image if it's too large"""
    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > MAX_IMAGE_SIZE[0] or img.height > MAX_IMAGE_SIZE[1]:
                img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                img.save(file_path, quality=85, optimize=True)
    except Exception:
        pass  # If resize fails, keep original

def delete_file(file_url: str):
    """Delete a file by its URL"""
    try:
        # Convert URL path to file path
        file_path = Path(settings.UPLOAD_DIR) / file_url.replace("/uploads/", "")
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass
