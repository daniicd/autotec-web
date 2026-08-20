## Entorno Web Estático (Solo Lectura)
Cuando modifiques archivos de código (HTML, JS, CSS) para esta aplicación web:
- Debes tener en cuenta que este es un **entorno estrictamente de Solo Lectura**.
- No intentes reintroducir formularios de guardado, edición, o eliminación. La aplicación está diseñada deliberadamente sin funciones de escritura para proteger la base de datos maestra.
- Esta aplicación NO usa Electron. Es una página web estática pura (Vanilla JS, HTML, CSS) diseñada para subirse a Firebase Hosting, GitHub Pages o Netlify.

## Evitar Duplicación de Funciones
Antes de agregar una nueva función o modificar intensamente un archivo existente:
1. Siempre busca en el archivo para verificar si ya existe una función con un nombre similar.
2. Si existe, modifícala en lugar de duplicarla al final del archivo.
3. Presta mucha atención a la lógica existente (como event listeners o manejo de UI) para asegurar que no se rompa nada al actualizar.

## Reemplazo Seguro de Código
Cuando hagas ediciones (especialmente con herramientas automáticas):
- NUNCA uses límites de cadenas/regex genéricos o ambiguos.
- SIEMPRE limita tus reemplazos a las líneas exactas del bloque o función que intentas modificar.
- Verifica el contenido del bloque a reemplazar para asegurarte de no borrar funciones no relacionadas.

## Dominio de Negocio: Autotec Web Viewer
- **Base de Datos en Google Sheets:** La fuente de verdad es un documento de Google Sheets operado a través de Google Apps Script. 
- **Conexión API:** El puente de conexión principal se encuentra en `app.js` mediante la función `ejecutarEnGoogle()`, la cual usa `fetch()` hacia el endpoint de Apps Script (URL_API_GOOGLE).
- **Inventario, Vehículos y Órdenes:** Las tablas cargan datos de la misma base que la app `.exe`, pero aquí el objetivo es visualizar de manera eficiente. No hay funciones de autenticación porque todo se renderiza como "Modo Empleado / Espectador".
- **Sin Errores en Celdas:** Puesto que esta aplicación no escribe datos a Google Sheets, no es necesario preocuparse por enviar el formato de celdas correcto al backend. El trabajo de escritura se mantiene aislado en la aplicación de escritorio.
