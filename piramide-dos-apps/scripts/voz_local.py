"""Narração local com o Kokoro (modelo aberto, Apache 2.0), sem conta em serviço nenhum.

Alternativa ao scripts/voz.py (Gradium). Gera os mesmos arquivos:
    public/audio/cena-XX.wav
    public/captions/cena-XX.json   [{ "text", "start_s", "stop_s" }, ...]

    pip install kokoro-onnx soundfile
    # baixe kokoro-v1.0.onnx e voices-v1.0.bin de https://huggingface.co/fastrtc/kokoro-onnx
    KOKORO_DIR=/pasta/dos/modelos python scripts/voz_local.py            # todas
    KOKORO_DIR=/pasta/dos/modelos python scripts/voz_local.py cena-06    # só uma

Opcionais: KOKORO_VOZ (pm_alex, pm_santa, pf_dora) e KOKORO_VELOCIDADE (padrão 1.15; 1.0 é mais lento).

O Kokoro não devolve timestamps por palavra. Por isso cada trecho entre pontuações
é sintetizado separado: o início e o fim de cada trecho são exatos, e as palavras
dentro dele são distribuídas pelo tamanho. Os trechos são curtos (1 a 8 palavras).
"""

import json
import os
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

RAIZ = Path(__file__).resolve().parent.parent
ROTEIRO = json.loads((RAIZ / "roteiro" / "roteiro.json").read_text(encoding="utf-8"))
DIR = Path(os.environ.get("KOKORO_DIR", "."))
VOZ = os.environ.get("KOKORO_VOZ", "pm_alex")
VELOCIDADE = float(os.environ.get("KOKORO_VELOCIDADE", "1.15"))

# Como a voz deve ler palavras que o português não lê sozinho.
PRONUNCIA = {"app": "épi", "apps": "épis", "ia": "i á"}
PAUSA = {".": 0.2, "?": 0.24, "!": 0.2, ":": 0.2, ",": 0.08}


def trechos(narracao: str):
    """Divide em trechos (lista de palavras) e a pausa que vem depois de cada um."""
    tokens = re.findall(r"<break[^>]*/>|[^\s<]+", narracao)
    saida, atual = [], []
    for tok in tokens:
        pausa = re.match(r'<break\s+time="([\d.]+)s"', tok)
        if pausa:
            if atual:
                saida.append([atual, 0.0])
                atual = []
            if saida:
                saida[-1][1] += float(pausa.group(1))
            continue
        atual.append(tok)
        if tok[-1] in PAUSA:
            saida.append([atual, PAUSA[tok[-1]]])
            atual = []
    if atual:
        saida.append([atual, 0.0])
    return saida


def falado(palavra: str) -> str:
    nucleo = re.sub(r"[^\wÀ-ÿ]", "", palavra).lower()
    if nucleo in PRONUNCIA:
        return re.sub(re.escape(re.sub(r"[^\wÀ-ÿ]", "", palavra)), PRONUNCIA[nucleo], palavra)
    return palavra


def aparar(audio: np.ndarray, sr: int) -> np.ndarray:
    """Tira o silêncio do começo e do fim, deixando uma margem curta."""
    forte = np.flatnonzero(np.abs(audio) > 0.012)
    if forte.size == 0:
        return audio
    margem = int(0.03 * sr)
    return audio[max(0, forte[0] - margem) : min(len(audio), forte[-1] + margem)]


def gerar(kokoro: Kokoro, cena: dict) -> float:
    partes, palavras, t, sr = [], [], 0.12, 24000
    partes.append(np.zeros(int(t * sr), dtype=np.float32))
    for lista, pausa in trechos(cena["narracao"]):
        texto = " ".join(falado(p) for p in lista)
        audio, sr = kokoro.create(texto, voice=VOZ, speed=VELOCIDADE, lang="pt-br")
        audio = aparar(audio.astype(np.float32), sr)
        dur = len(audio) / sr
        pesos = [len(re.sub(r"[^\wÀ-ÿ]", "", falado(p))) + 1.5 for p in lista]
        acumulado = 0.0
        for p, peso in zip(lista, pesos):
            ini = t + dur * acumulado / sum(pesos)
            acumulado += peso
            fim = t + dur * acumulado / sum(pesos)
            palavras.append({"text": p, "start_s": round(ini, 3), "stop_s": round(fim, 3)})
        partes += [audio, np.zeros(int(pausa * sr), dtype=np.float32)]
        t += dur + int(pausa * sr) / sr
    partes.append(np.zeros(int(0.15 * sr), dtype=np.float32))
    final = np.concatenate(partes)
    final = final / max(1e-6, float(np.abs(final).max())) * 0.89

    wav = RAIZ / "public" / "audio" / f"{cena['id']}.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(wav, final, sr, subtype="PCM_16")
    legenda = RAIZ / "public" / "captions" / f"{cena['id']}.json"
    legenda.parent.mkdir(parents=True, exist_ok=True)
    legenda.write_text(json.dumps(palavras, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{cena['id']}: {len(palavras)} palavras, {len(final) / sr:.2f}s")
    return len(final) / sr


def main() -> None:
    pedidas = set(sys.argv[1:])
    cenas = [c for c in ROTEIRO if not pedidas or c["id"] in pedidas]
    kokoro = Kokoro(str(DIR / "kokoro-v1.0.onnx"), str(DIR / "voices-v1.0.bin"))
    total = sum(gerar(kokoro, c) for c in cenas)
    print(f"total: {total:.1f}s (voz {VOZ}, velocidade {VELOCIDADE})")


if __name__ == "__main__":
    main()
