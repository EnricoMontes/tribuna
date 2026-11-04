# Tribuna ⚽ · La red social futbolera

TP #2 de Programación IV (UTN FRA, 2026 C2). Los hinchas se registran, opinan de cada partido,
suben fotos de cancha y reaccionan a lo que publica el resto.

| | |
|---|---|
| App en producción | https://tribuna-front-iota.vercel.app |
| API en producción | https://tribuna-back-zeyk.onrender.com |
| Estado | **Sprint 1**: registro, login, navegación y Mi perfil |

## Estructura del repo (monorepo)

Un solo repositorio con las dos aplicaciones. Cada una se deploya por separado desde su carpeta:

```
tribuna/
├── back/    API REST · NestJS 12 + MongoDB Atlas (Mongoose) + Cloudinary → Render (Root Directory: back)
└── front/   SPA · Angular 22 (standalone, zoneless, signals)             → Vercel (Root Directory: front)
```

## Documentación

| | Funcional (sin código) | Técnica |
|---|---|---|
| **Back** | [back/docs/funcional.md](back/docs/funcional.md) | [back/docs/tecnico.md](back/docs/tecnico.md) |
| **Front** | [front/docs/funcional.md](front/docs/funcional.md) | [front/docs/tecnico.md](front/docs/tecnico.md) |

Colección de Postman con todos los casos (201, 400, 401, 409): [`back/postman/Tribuna-Sprint2.postman_collection.json`](back/postman/Tribuna-Sprint2.postman_collection.json).

## Cómo correrlo en local

Requisito: Node 24 LTS. En dos terminales:

```bash
# 1) API
cd back
npm install
cp .env.example .env      # completar MONGO_URI y las credenciales de Cloudinary
npm run start:dev         # http://localhost:3000

# 2) App
cd front
npm install
npm start                 # http://localhost:4200
```
