# A pirâmide dos apps

Reels/Shorts vertical (1080x1920, 30 fps, ~84 s) animado em código com Remotion, narrado e com a marca da Overflow.

Tese: toda vez que construir fica fácil, o mundo inteiro constrói a mesma pirâmide.

## Rodar

```bash
npm install
npm run studio      # preview no Remotion Studio
npm run render      # out/piramide-dos-apps.mp4
```

Em máquina sem GPU (CI, container), acrescente `--gl=swangle` ao render.

## Marca

Identidade da Overflow, com os tokens em `src/lib/tema.ts`: Deep Ink e Bone Paper como base, Overflow Blue e Acid Signal como destaque. Space Grotesk nos títulos e legendas, Instrument Serif itálico para uma palavra de destaque, JetBrains Mono nos rótulos. O wordmark assina a última cena.

No vídeo a cor conta a história: o app commodity não tem cor, o nicho é azul e a ponta é acid.

## Voz

Os arquivos em `public/audio` e `public/captions` versionados aqui foram gerados com a opção local abaixo. Sem áudio nenhum o vídeo também roda: cada cena usa uma estimativa de tempo calculada a partir do roteiro (incluindo as tags `<break>`). Trocar a voz reajusta tudo sozinho.

### Opção 1: Gradium

```bash
pip install gradium
export GRADIUM_API_KEY=...
export GRADIUM_VOICE_ID=...
python scripts/voz.py            # todas as cenas
python scripts/voz.py cena-06    # regrava só uma
```

Devolve timestamps reais por palavra. Opcionais: `GRADIUM_PRONUNCIATION_ID` (dicionário para "app", "IA", "prompt") e `GRADIUM_PADDING_BONUS` (positivo deixa mais lento).

### Opção 2: Kokoro, local

Modelo aberto (Apache 2.0), roda na máquina, sem conta.

```bash
pip install kokoro-onnx soundfile
# baixe kokoro-v1.0.onnx e voices-v1.0.bin de https://huggingface.co/fastrtc/kokoro-onnx
KOKORO_DIR=/pasta/dos/modelos python scripts/voz_local.py
```

Vozes em português: `pm_alex` (padrão), `pm_santa`, `pf_dora`, via `KOKORO_VOZ`. Ritmo em `KOKORO_VELOCIDADE` (padrão 1.15). O Kokoro não devolve timestamps por palavra: o script sintetiza cada trecho entre pontuações em separado, então o início e o fim de cada trecho são exatos e as palavras dentro dele são distribuídas pelo tamanho.

Os dois scripts leem `roteiro/roteiro.json` e gravam, por cena, `public/audio/cena-XX.wav` e `public/captions/cena-XX.json` (`text`, `start_s`, `stop_s`).

## Como o tempo funciona

- `src/Root.tsx` (`calculateMetadata`): cada cena dura o áudio + 0,3 s de respiro.
- `src/lib/tempo.ts` (`criarCue`): as animações são presas a palavras do roteiro, não a frames fixos. `cue("Egito")` devolve o frame em que a palavra é falada. Trocar a voz ou o ritmo não quebra a sincronia.
- Toda animação, inclusive o 3D, é calculada a partir de `useCurrentFrame()`. Os sorteios usam semente fixa.

## Estrutura

| Arquivo | O quê |
| --- | --- |
| `roteiro/roteiro.json` | Narração das 7 cenas (fonte única para a voz e para a estimativa) |
| `src/PiramideDosApps.tsx` | Composição: 7 `<Sequence>`, áudio, trilha e efeitos |
| `src/cenas/Cena01..07.tsx` | Uma cena por arquivo |
| `src/lib/Legenda.tsx` | Legenda de 2 a 3 palavras, palavra atual em acid |
| `src/lib/Mapa.tsx` | Mapa-múndi de pontos e a câmera compartilhada pelas cenas 1, 4 e 7 |
| `src/lib/Piramides.tsx` | As quatro pirâmides low-poly |
| `src/lib/tema.ts` | Tokens da marca Overflow (cores, fontes, áreas seguras) |
| `scripts/voz.py` | Gradium: WAV + timestamps |
| `scripts/voz_local.py` | Kokoro local: WAV + timestamps por trecho |
| `scripts/gerar-sfx.mjs` | Sintetiza trilha e efeitos provisórios em `public/sfx` |
| `scripts/stills.mjs` | Renderiza frames soltos para revisão (`node scripts/stills.mjs 110 900`) |

## Trilha e efeitos

Os arquivos em `public/sfx` (`trilha`, `tum`, `impacto`, `whoosh`, `clique`) são sintetizados por `npm run sfx`, sem direitos de terceiros. Para usar sons de uma biblioteca, substitua os WAVs mantendo os nomes. A trilha tem corte seco antes da última frase da Cena 6. Para renderizar sem eles: `--props='{"sfx":false}'`.

## Skill do Remotion

```bash
npx skills add remotion-dev/skills
```

## Antes de postar

Confira no celular: legenda legível e nada importante no topo (230 px) e no rodapé (400 px), onde a interface do Instagram cobre. Essas margens estão em `SEGURO`, em `src/lib/tema.ts`.

Mapa: Natural Earth (domínio público). Fontes: Space Grotesk, Instrument Serif e JetBrains Mono (OFL).
