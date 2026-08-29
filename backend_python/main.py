import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .routers import auth, market, sales, guide
from .services.agmarknet_service import agmarknet_service


async def _background_price_sync():
    """
    Runs once after startup: fetches fresh APMC prices from data.gov.in
    and stores them into the local SQLite DB.
    Runs in a thread pool so it doesn't block the event loop.
    """
    await asyncio.sleep(2)   # Let the server fully start first
    print("🌐 [Startup] Triggering real-time APMC price sync from data.gov.in...")
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: agmarknet_service.fetch_and_store_prices(state="Punjab", limit=1500)
        )
        if result.get("success"):
            print(f"✅ [Startup] Synced {result.get('count', 0)} live market price records.")
        else:
            print(f"⚠️ [Startup] Price sync returned: {result.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"❌ [Startup] Price sync failed (will use seeded DB data): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    print("🌾 Initializing KisanSetu SQLite Database...")
    init_database()
    print("🚀 KisanSetu Backend ready on port 3000!")

    # Non-blocking background price sync
    asyncio.create_task(_background_price_sync())

    yield  # Application runs here

    # ── Shutdown ──
    print("🛑 KisanSetu Backend shutting down.")


app = FastAPI(
    title="KisanSetu Smart Mandi API",
    description="High-Performance Python Backend for KisanSetu Agricultural Intelligence Platform",
    version="2.0.0",
    lifespan=lifespan
)

# ── CORS Setup ──
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

# ── Root & Health Check ──
@app.get("/")
@app.get("/health")
@app.get("/api")
@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "service": "KisanSetu Python Backend",
        "status": "healthy",
        "version": "2.0.0",
        "docs": "/docs",
        "realtime_api_configured": bool(config.DATA_GOV_API_KEY)
    }
