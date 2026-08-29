import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .database import init_database
from .routers import auth, market, sales, guide
from .services.agmarknet_service import agmarknet_service

logger = logging.getLogger("kisansetu")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


async def _background_price_sync():
    """Fetches daily APMC market prices in the background on startup."""
    await asyncio.sleep(2)  # Give server a moment to finish binding
    logger.info("Starting background APMC market rate sync...")
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            lambda: agmarknet_service.fetch_and_store_prices(state="Punjab", limit=1500)
        )
        if result.get("success"):
            logger.info("Market price sync complete. Records synced: %s", result.get("count", 0))
        else:
            logger.warning("Price sync warning: %s", result.get("message", "Unknown error"))
    except Exception as exc:
        logger.error("Price sync failed, using fallback cached data: %s", exc)


async def _keep_alive_heartbeat():
    """24/7 background heartbeat task to prevent server sleep or idle timeouts."""
    while True:
        try:
            await asyncio.sleep(300)  # Every 5 minutes
            logger.info("💓 KisanSetu Server 24/7 Heartbeat: Active & Healthy")
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    init_database()
    logger.info("Server started on http://localhost:3000")

    # Trigger non-blocking price sync and keep-alive heartbeat
    sync_task = asyncio.create_task(_background_price_sync())
    heartbeat_task = asyncio.create_task(_keep_alive_heartbeat())

    yield

    sync_task.cancel()
    heartbeat_task.cancel()
    logger.info("Shutting down KisanSetu API server.")


app = FastAPI(
    title="KisanSetu API",
    description="Backend API for KisanSetu agricultural market price discovery and digital services.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handlers ──
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else "Request error",
            "details": exc.detail if not isinstance(exc.detail, str) else None
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Invalid request data"
    field = errors[0].get("loc", [""])[-1] if errors else ""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"{field}: {msg}" if field else msg,
            "details": errors
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Unhandled server exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}"
        }
    )

# ── Routers ──
app.include_router(auth.router)
app.include_router(market.router)
app.include_router(sales.router)
app.include_router(guide.router)

# ── Health Check ──
@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "KisanSetu Python Backend",
        "status": "healthy",
        "version": "2.0.0",
        "docs": "/docs",
        "realtime_api_configured": bool(config.DATA_GOV_API_KEY)
    }

# ── Serve Frontend Static Files ──
from pathlib import Path
from fastapi.staticfiles import StaticFiles

frontend_dir = Path(__file__).resolve().parent.parent
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
