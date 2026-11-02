# Tribuna · Front

**Tribuna** es una red social futbolera: los hinchas opinan de cada partido, suben fotos de cancha y
reaccionan a lo que publica el resto. TP #2 de Programación IV (UTN FRA, 2026 C2).

| | |
|---|---|
| App en producción | https://tribuna-front-iota.vercel.app |
| API (back) | https://tribuna-back-zeyk.onrender.com · repo [`tribuna-back`](https://github.com/EnricoMontes/tribuna-back) |
| Stack | Angular 22 (standalone, zoneless, signals) · Reactive Forms · HttpClient · CSS propio |
| Estado | **Sprint 1**: registro, login, navegación y Mi perfil |

## Documentación

- 📋 **[Funcional](docs/funcional.md)**: qué puede hacer el usuario, pantallas, validaciones y mensajes, sin código.
- 🛠️ **[Técnica](docs/tecnico.md)**: arquitectura, estructura, decisiones (signals, formularios, observables, lazy loading) y deploy.

## Cómo correrlo en local

Requisito: Node 24 LTS. Con el back corriendo en `http://localhost:3000`:

```bash
npm install
npm start                 # http://localhost:4200
```

`npm run build` genera `dist/tribuna-front/browser`; `npm test` corre los tests con Vitest.
