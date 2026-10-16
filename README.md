# Avanzada · Santander Arena

App para registrar vehículos en la hoja **patentes** y buscar patentes (muestra todos los registros repetidos y las patentes parecidas).

- **App:** https://equipo-avanzada.github.io
- **Android:** https://equipo-avanzada.github.io/avanzada.apk
- **iPhone:** abrir el link en Safari → la app muestra cómo instalarla (Compartir → Agregar a inicio)

## Cómo funciona

```
Teléfono (app web, APK Android o iPhone)  →  Apps Script (con clave)  →  Hoja de Google "patentes"
```

- La app está publicada gratis en GitHub Pages. El APK de Android solo abre esa misma página, así que **cualquier cambio que se suba aquí aparece solo en la web, en el APK y en el iPhone**. No hay que reinstalar nada.
- Los datos **no** están en GitHub: siguen en la hoja de Google. Sin la clave del equipo nadie puede leer ni escribir.
- La clave se pide una vez y dura 8 horas en cada teléfono.

## Hacer un cambio

| Qué cambia | Dónde | Qué hacer después |
|---|---|---|
| Cómo se ve la app, textos, botones | `index.html` | Subir a GitHub. Llega a todos en 1–10 min (cerrar y abrir la app). |
| Link de Apps Script | `config.js` | Subir el número en `config.js?v=` dentro de `index.html`. |
| Cómo guarda o busca en la hoja | `apps-script/Codigo.gs` | Pegarlo en Apps Script (con la clave real) → Implementar → Gestionar implementaciones → lápiz → **Nueva versión**. |
| Ícono o nombre de la app Android | Hay que generar un APK nuevo | Firmarlo con la **misma llave** (`signing.keystore`) y reinstalarlo. |

## Conectar la hoja (Apps Script)

1. En la hoja: **Extensiones → Apps Script**. Pegar `apps-script/Codigo.gs`.
2. Cambiar `CLAVE: 'CAMBIA_ESTA_CLAVE'` por la clave del equipo (**no subirla a GitHub**).
3. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: **Yo**. Acceso: **Cualquier usuario**.
4. Pegar el link `/exec` en `config.js`.

## Archivos especiales

- `avanzada.apk`: la app de Android.
- `.well-known/assetlinks.json`: le demuestra a Android que la app y la página son del mismo dueño (así la app abre sin barra del navegador). No tocar.
- `.nojekyll`: necesario para que GitHub publique la carpeta `.well-known`.
- La **llave de firma** del APK (`signing.keystore` + contraseñas) **no está en GitHub**. Guárdala en un lugar seguro: sin ella no se puede actualizar el APK ni subirlo a Play Store.
