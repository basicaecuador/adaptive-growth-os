# Adaptive Growth Operating System — Convenciones del Proyecto

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript strict |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| ORM | Drizzle ORM |
| UI | Tailwind CSS v4 + shadcn/ui |
| Estado servidor | TanStack Query v5 |
| Estado UI | Zustand |
| Formularios | React Hook Form + Zod |
| AI | Anthropic Claude API (@anthropic-ai/sdk) |
| Testing | Vitest + Testing Library + Playwright |

## Regla fundamental

**Toda la lógica de negocio va en Route Handlers (`app/api/`). Sin Server Actions.**

Los Client Components llaman a Route Handlers vía TanStack Query.
Los Route Handlers delegan a Services.
Los Services son funciones puras que reciben el Supabase client como dependencia.

## Flujo de datos

```
Client Component
  → TanStack Query (fetch)
    → Route Handler (app/api/)
      → Service (src/services/)
        → Supabase / AI Agent
```

## Naming Conventions

| Artefacto | Convención | Ejemplo |
|-----------|-----------|---------|
| Archivos / carpetas | kebab-case | `brand-setup/`, `content-plan.service.ts` |
| Componentes React | PascalCase | `BrandSetupForm.tsx` |
| Funciones y variables | camelCase | `getBrandById` |
| Tipos e interfaces | PascalCase descriptivo | `BrandSetup`, `ContentPlanItem` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_CONTENT_PER_MONTH` |
| Hooks | prefijo `use` | `useBrand` |
| Stores Zustand | sufijo `.store` | `ui.store.ts` |
| Schemas Zod | sufijo `.schema` | `brand.schema.ts` |
| Services | sufijo `.service` | `brands.service.ts` |
| Agentes AI | sufijo `-agent` | `content-agent.ts` |

## Estructura de capas

```
src/
├── app/
│   ├── (auth)/           # Login, OAuth callback
│   ├── (dashboard)/      # UI autenticada
│   └── api/              # TODA la lógica de negocio
├── components/
│   ├── ui/               # shadcn/ui — no modificar directamente
│   ├── layout/           # Sidebar, Topbar, PageHeader
│   ├── shared/           # Componentes reutilizables
│   └── features/         # Componentes acoplados a dominio
├── lib/
│   ├── supabase/         # Clientes browser/server
│   ├── ai/               # Agents, prompts, memory
│   ├── rules/            # Motor de reglas
│   └── utils/            # Utilidades
├── services/             # Lógica de negocio (no conocen HTTP)
├── hooks/                # Custom hooks (TanStack Query wrappers)
├── stores/               # Zustand (solo UI state)
├── types/                # domain.ts, api.ts, schemas/
└── config/               # routes.ts, permissions.ts
```

## Prompts

Cada archivo en `lib/ai/prompts/` exporta:
- `buildXxxPrompt(context): string` — función pura, mismo input → mismo output base
- Tipos de input y output asociados
- Schema Zod del output esperado

Los agentes en `lib/ai/agents/` consumen prompts, llaman a Claude, y validan con Zod.

## Reglas de marca

Cada `Rule` tiene `instruction: string` — texto listo para insertar en prompts.
`lib/rules/engine.ts` compone las reglas activas en el contexto del agente.
`lib/rules/evaluator.ts` evalúa si el contenido generado cumple las reglas.

## Multi-tenancy

Jerarquía: `Organization → Brand → Content`
RLS en Supabase garantiza aislamiento a nivel de base de datos.
Los services reciben `supabaseClient` como dependencia — nunca usan un cliente global.

## Variables de entorno

- Prefijo `NEXT_PUBLIC_` **solo** para valores seguros de exponer al browser
- `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` **jamás** con prefijo `NEXT_PUBLIC_`
- Ver `.env.local.example` para la lista completa

## Fases de implementación

| Fase | Alcance |
|------|---------|
| FASE 0 | Estructura base ✅ |
| FASE 1 | Auth (Google OAuth), DB schema, multi-tenancy, UI shell |
| FASE 2 | Brand Setup, plan mensual, generación de contenido |
| FASE 3 | Approval flow, feedback → reglas |
| FASE 4 | Memoria vectorial, aprendizaje mensual |
| FASE 5 | Reportería |
