# A pirâmide dos apps

Reels/Shorts vertical (1080x1920, 30 fps, ~76 s) animado em código com Remotion e narrado com voz do Gradium.

Tese: toda vez que construir fica fácil, o mundo inteiro constrói a mesma pirâmide.

## Rodar

```bash
npm install
npm run studio      # preview no Remotion Studio
npm run render      # out/piramide-dos-apps.mp4
```

Em máquina sem GPU (CI, container), acrescente `--gl=swangle` ao render.

## Voz (Gradium)

O vídeo já roda sem áudio: enquanto não existem os WAVs, cada cena usa uma estimativa de tempo calculada a partir do roteiro (incluindo as tags `<break>`). Quando a voz chega, tudo se reajusta sozinho.

```bash
pip install gradium
export GRADIUM_API_KEY=...
export GRADIUM_VOICE_ID=...
python scripts/voz.py            # todas as cenas
python scripts/voz.py cena-06    # regrava só uma
```

O script lê `roteiro/roteiro.json` e grava, por cena:

- `public/audio/cena-XX.wav`
- `public/captions/cena-XX.json` com `text`, `start_s`, `stop_s` de cada palavra

Opcionais: `GRADIUM_PRONUNCIATION_ID` (dicionário para "app", "IA", "prompt") e `GRADIUM_PADDING_BONUS` (positivo deixa mais lento).

Se preferir gerar pelo Studio, basta salvar os WAVs com esses nomes. Sem o JSON de timestamps, a legenda usa a estimativa esticada para a duração do áudio.

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
| `src/lib/Legenda.tsx` | Legenda de 2 a 3 palavras, palavra atual em dourado |
| `src/lib/Mapa.tsx` | Mapa-múndi de pontos e a câmera compartilhada pelas cenas 1, 4 e 7 |
| `src/lib/Piramides.tsx` | As quatro pirâmides low-poly |
| `scripts/voz.py` | Gradium: WAV + timestamps |
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

Mapa: Natural Earth (domínio público). Fonte: Inter (OFL).
