# Vértice Studio: gerador de landing pages com IA

Site de uma agência de landing pages para negócios locais, com um **gerador em que o visitante descreve o próprio negócio e recebe, em segundos, uma prévia do seu site** escrita pelo Google Gemini.

🔗 **No ar:** https://vertice-studio-rose.vercel.app

![Prévias geradas](public/showcase/0.jpg)

## O problema
O dono de um pequeno negócio não consegue imaginar o próprio site antes de pagar por ele. Mostrar um portfólio de outros clientes não resolve: ele quer ver **o dele**.

## A solução e o que aprendi
1. **v1: a IA desenhava a página inteira** (HTML/CSS em streaming). Resultado: páginas com "cara de IA", genéricas.
2. **v2: a IA só escreve.** O Gemini devolve **JSON estruturado** (título, seções, chamadas, perguntas frequentes) e o conteúdo é encaixado em **5 modelos visuais feitos à mão**.

> Restringir o que o modelo controla aumentou muito a qualidade percebida. A IA é ótima em texto adaptado ao negócio; o design fica com quem decide.

## Stack
Next.js 16 · React 19 · React Three Fiber (vitrine 3D) · GSAP · Tailwind 4 · Google Gemini API

| O quê | Onde |
|---|---|
| Gerador com IA | `components/Generator.tsx`, `app/api/generate/route.ts`, `lib/page-prompt.ts` |
| Modelos visuais | `components/sites/` |
| Vitrine 3D | `components/Hero.tsx`, `components/Phone3D.tsx` |
| Recebimento de leads | `app/api/lead/route.ts` |
| Textos, planos, preços | `lib/config.ts` |

## Rodar localmente
1. Node.js 22+ e `npm install`
2. Copie `.env.example` para `.env.local` e coloque sua chave do Gemini
3. `npm run dev` e abra http://localhost:3000

O CSS do Tailwind é compilado por `scripts/tw-safelist.mjs` (o `dev` e o `build` já rodam isso).

---
Feito por Felippe Sicalhone · [portfólio](https://felippe-sicalhone.vercel.app)
