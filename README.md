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

## Publicar en Cloudflare Pages

No hace falta compilar nada: Cloudflare sirve los archivos tal cual.

### Opción A · desde el panel (recomendada)

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige el repositorio `jseborga/axioma`.
3. En la configuración del proyecto:
   - **Production branch**: la rama que quieras publicar (por ejemplo `main`, o la rama de trabajo si aún no has hecho merge).
   - **Framework preset**: `None`.
   - **Build command**: déjalo vacío.
   - **Build output directory**: `/` (la raíz del repositorio).
4. Pulsa **Save and Deploy**. En un minuto tendrás la app en `https://<nombre-del-proyecto>.pages.dev`.
5. Cada `git push` a la rama de producción vuelve a desplegar automáticamente. Los push a otras ramas crean vistas previas con su propia URL.

Para usar tu propio dominio: en el proyecto → **Custom domains** → **Set up a custom domain**. Si el dominio ya está en Cloudflare, el DNS se configura solo.

### Opción B · desde la terminal con Wrangler

```
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name axioma
```

La primera vez te pedirá crear el proyecto. Los despliegues siguientes son el mismo comando.

### Notas

- El archivo `_headers` indica a Cloudflare que no cachee `index.html` ni `sw.js`, para que cada despliegue llegue de inmediato a quien ya tenía la app abierta o instalada.
- Cuando cambies archivos, sube el número de versión en `sw.js` (`var CACHE="axioma-v2"`) para que los usuarios sin conexión reciban la versión nueva.
- La app usa HTTPS, algo que Cloudflare Pages da por defecto y que el service worker necesita para funcionar.
