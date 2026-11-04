# Tribuna · API (back)

API REST de **Tribuna**, la red social futbolera del TP #2 de Programación IV (UTN FRA, 2026 C2).
Los hinchas se registran, opinan de cada partido, suben fotos de cancha y reaccionan a lo que publica el resto.

| | |
|---|---|
| API en producción | https://tribuna-back-zeyk.onrender.com |
| App (front) | https://tribuna-front-iota.vercel.app · código en [`../front`](../front) (mismo repo) |
| Stack | NestJS 12 · MongoDB Atlas + Mongoose 9 · bcrypt · Multer + Cloudinary · class-validator |
| Estado | **Sprint 1**: registro y login |

## Documentación

- 📋 **[Funcional](docs/funcional.md)**: qué hace la API, explicado sin código (reglas, mensajes, qué responde en cada caso).
- 🛠️ **[Técnica](docs/tecnico.md)**: arquitectura, endpoints, estructura, decisiones, variables de entorno y deploy.
- 📮 **Postman**: [`postman/Tribuna-Sprint2.postman_collection.json`](postman/Tribuna-Sprint2.postman_collection.json). Tiene todos los casos (201, 400, 401 y 409) con tests.

## Cómo correrlo en local

Requisito: Node 24 LTS.

```bash
npm install
cp .env.example .env      # completar MONGO_URI y las credenciales de Cloudinary
npm run start:dev         # http://localhost:3000
```

Otros scripts: `npm run build` · `npm run start:prod` · `npm test` · `npm run lint`.
