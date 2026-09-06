# Axioma

Puzle diario de deducción pura: no solo resuelves el tablero, descubres qué regla lo gobierna.

- Sin azar, sin adivinar, sin cuenta. Cada tablero se genera y verifica en el dispositivo con solución única.
- Tres modos: **Diario** (el mismo tablero para todo el mundo), **Flash** (rápido, 4×4) y **Libre** (niveles progresivos).
- PWA: funciona sin conexión y se puede instalar en el móvil.

## Ejecutar

Es HTML estático. Sirve la carpeta con cualquier servidor, por ejemplo:

```
python3 -m http.server 8080
```

y abre `http://localhost:8080`.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | Estructura de la app |
| `axioma.css` | Estilos (tema claro y oscuro) |
| `app.js` | Generador, verificador y lógica de juego |
| `sw.js` | Service worker para uso sin conexión |
| `manifest.json`, `icon.svg` | Instalación como app |
