# Adaptive Growth Operating System

Plataforma SaaS para gestión de contenido digital con IA, construida para agencias de marketing orientadas a ventas digitales.

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta Supabase (dev + prod)
- API Key de Anthropic Claude
- Google Cloud Console (OAuth 2.0)

## Setup inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales reales

# 3. Inicializar shadcn/ui (una sola vez)
npx shadcn@latest init

# 4. Correr en desarrollo
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en localhost:3000 |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript sin emitir |
| `npm run test` | Vitest unit/integration tests |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:generate` | Generar migración Drizzle desde schema |
| `npm run db:migrate` | Ejecutar migraciones pendientes |
| `npm run db:studio` | Drizzle Studio (UI de base de datos) |
| `npm run db:types` | Regenerar tipos desde Supabase |

## Arquitectura

```
Organization → Brand → ContentPlan → ContentItem
                                           ↓
                                      Approval Flow
                                           ↓
                                    Feedback → Rules
```

Ver [CLAUDE.md](./CLAUDE.md) para convenciones completas del proyecto.

## Fases

| Fase | Estado | Alcance |
|------|--------|---------|
| FASE 0 | ✅ Completa | Estructura base |
| FASE 1 | Pendiente | Auth, DB schema, multi-tenancy |
| FASE 2 | Pendiente | Brand Setup, generación de contenido |
| FASE 3 | Pendiente | Approval flow, feedback → reglas |
| FASE 4 | Pendiente | Memoria vectorial, aprendizaje mensual |
| FASE 5 | Pendiente | Reportería |
