"""Gera a narração de cada cena no Gradium, com timestamps por palavra.

    pip install gradium
    export GRADIUM_API_KEY=...      # chave da API
    export GRADIUM_VOICE_ID=...     # voz escolhida (ou o clone da sua voz)
    python scripts/voz.py           # todas as cenas
    python scripts/voz.py cena-06   # regrava só uma

Opcionais:
    GRADIUM_PRONUNCIATION_ID  dicionário de pronúncia criado no Studio (app, IA, prompt)
    GRADIUM_PADDING_BONUS     ritmo: positivo = mais lento, negativo = mais rápido

Lê roteiro/roteiro.json e escreve:
    public/audio/cena-XX.wav
    public/captions/cena-XX.json   [{ "text", "start_s", "stop_s" }, ...]
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from gradium import GradiumClient, TTSSetup

RAIZ = Path(__file__).resolve().parent.parent
ROTEIRO = json.loads((RAIZ / "roteiro" / "roteiro.json").read_text(encoding="utf-8"))


async def gerar(client: GradiumClient, cena: dict) -> None:
    setup = TTSSetup(voice_id=os.environ["GRADIUM_VOICE_ID"], output_format="wav")
    if pron := os.environ.get("GRADIUM_PRONUNCIATION_ID"):
        setup["pronunciation_id"] = pron
    if bonus := os.environ.get("GRADIUM_PADDING_BONUS"):
        setup["json_config"] = {"padding_bonus": float(bonus)}

    resultado = await client.tts(setup, cena["narracao"])

    wav = RAIZ / "public" / "audio" / f"{cena['id']}.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    wav.write_bytes(resultado.raw_data)

    palavras = [
        {"text": t.text.strip(), "start_s": round(t.start_s, 3), "stop_s": round(t.stop_s, 3)}
        for t in resultado.text_with_timestamps
        if t.text.strip() and "<" not in t.text  # ignora as tags de pausa
    ]
    legenda = RAIZ / "public" / "captions" / f"{cena['id']}.json"
    legenda.parent.mkdir(parents=True, exist_ok=True)
    legenda.write_text(json.dumps(palavras, ensure_ascii=False, indent=2), encoding="utf-8")

    fim = palavras[-1]["stop_s"] if palavras else 0
    print(f"{cena['id']}: {len(palavras)} palavras, fala termina em {fim:.2f}s -> {wav.relative_to(RAIZ)}")


async def main() -> None:
    if "GRADIUM_VOICE_ID" not in os.environ:
        sys.exit("Defina GRADIUM_VOICE_ID (e GRADIUM_API_KEY).")
    pedidas = set(sys.argv[1:])
    cenas = [c for c in ROTEIRO if not pedidas or c["id"] in pedidas]
    if not cenas:
        sys.exit(f"Nenhuma cena com esse id. Opções: {', '.join(c['id'] for c in ROTEIRO)}")
    client = GradiumClient()  # lê GRADIUM_API_KEY
    for cena in cenas:  # uma por vez: mais fácil ver qual falhou e regravar
        await gerar(client, cena)


if __name__ == "__main__":
    asyncio.run(main())
