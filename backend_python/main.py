from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import config
from .database import init_database
from .routers import auth, market, sales

app = FastAPI(
    title="KisanSetu Smart Mandi API",
    description="High-Performance Python Backend for KisanSetu Agricultural Intelligence Platform",
    version="2.0.0"
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

# ── Startup Lifecycle ──
@app.on_event("startup")
def on_startup():
    print("🌾 Initializing KisanSetu Python Database...")
    init_database()
    print("🚀 KisanSetu Python Backend ready on port 3000!")

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
