from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone

from openai import AsyncOpenAI

from agent import router as agent_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Base status models (existing) ----------
# ---------- API health/status ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

_STATUS_CHECKS = []

@api_router.get("/")
async def root():
    return {"message": "Débora.ai API online"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    item = StatusCheck(**input.model_dump())
    _STATUS_CHECKS.append(item)
    return item

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    return list(reversed(_STATUS_CHECKS[-1000:]))

# ---------- Débora Copilot (OpenAI API) ----------
COPILOT_SYSTEM = (
    "Você é a Débora Copilot, uma assistente de IA especialista em vendas imobiliárias "
    "para uma corretora brasileira. Você é objetiva, cordial, direta e usa português do Brasil. "
    "Sempre entregue respostas curtas, práticas e acionáveis. Nunca invente dados que não foram "
    "fornecidos. Formate a saída de forma clara — use bullets curtos quando fizer sentido."
)


class DealContext(BaseModel):
    title: str
    client_name: Optional[str] = None
    property_title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    days_in_stage: Optional[int] = None
    temperature: Optional[str] = None
    probability: Optional[float] = None


class SuggestRequest(BaseModel):
    deal: DealContext


class SummarizeRequest(BaseModel):
    client_name: str
    conversation: str  # bloco de texto com histórico


class FollowUpRequest(BaseModel):
    client_name: str
    context: str
    channel: Literal["whatsapp", "email", "sms"] = "whatsapp"
    tone: Literal["cordial", "formal", "urgente"] = "cordial"


class CopilotResponse(BaseModel):
    text: str


async def _chat(session_id: str, prompt: str) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada")

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    try:
        response = await client.responses.create(
            model=OPENAI_MODEL,
            instructions=COPILOT_SYSTEM,
            input=prompt,
        )
        return response.output_text
    except Exception as e:
        logger.exception("Copilot error")
        raise HTTPException(status_code=500, detail=f"Falha no Copilot: {e}")


@api_router.post("/copilot/suggest", response_model=CopilotResponse)
async def copilot_suggest(req: SuggestRequest):
    d = req.deal
    prompt = (
        f"Analise o negócio abaixo e sugira a próxima melhor ação para avançar no funil. "
        f"Máximo 4 bullets objetivos, priorizados. Foque em prática (o que fazer HOJE), "
        f"não em teoria.\n\n"
        f"Negócio: {d.title}\n"
        f"Cliente: {d.client_name or '—'}\n"
        f"Imóvel: {d.property_title or '—'}\n"
        f"Valor: R$ {d.value or 0:,.0f}\n"
        f"Etapa atual: {d.stage or '—'} (há {d.days_in_stage or 0} dias)\n"
        f"Temperatura: {d.temperature or 'morno'}\n"
        f"Probabilidade: {int(d.probability or 0)}%\n"
    )
    text = await _chat(f"suggest-{uuid.uuid4()}", prompt)
    return CopilotResponse(text=text)


@api_router.post("/copilot/summarize", response_model=CopilotResponse)
async def copilot_summarize(req: SummarizeRequest):
    prompt = (
        f"Resuma a conversa abaixo com {req.client_name} em no máximo 5 bullets curtos. "
        f"Inclua: (1) principal interesse do cliente, (2) objeções mencionadas, "
        f"(3) próximos passos combinados, (4) sinais de temperatura (frio/morno/quente), "
        f"(5) datas importantes.\n\n"
        f"Conversa:\n{req.conversation}\n"
    )
    text = await _chat(f"summary-{uuid.uuid4()}", prompt)
    return CopilotResponse(text=text)


@api_router.post("/copilot/followup", response_model=CopilotResponse)
async def copilot_followup(req: FollowUpRequest):
    channel_hint = {
        "whatsapp": "Mensagem curta de WhatsApp (até 4 linhas, use quebras de linha, informal-cordial).",
        "email": "E-mail profissional (assunto + corpo curto, saudação e assinatura).",
        "sms": "SMS bem curto (máx 160 caracteres), objetivo.",
    }[req.channel]
    prompt = (
        f"Escreva uma mensagem de follow-up para {req.client_name} no tom {req.tone}. "
        f"{channel_hint} Não use emojis em excesso. Contexto do relacionamento:\n{req.context}\n"
    )
    text = await _chat(f"followup-{uuid.uuid4()}", prompt)
    return CopilotResponse(text=text)


api_router.include_router(agent_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

