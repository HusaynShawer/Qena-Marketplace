import logging
import os
from logging.handlers import RotatingFileHandler


def setup_logging():
    os.makedirs("logs", exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(),
            RotatingFileHandler(
                filename="logs/app.log",
                maxBytes=5 * 1024 * 1024,  # 5 MB
                backupCount=5,
                encoding="utf-8",
            ),
        ],
    )


setup_logging()

logger = logging.getLogger(__name__)