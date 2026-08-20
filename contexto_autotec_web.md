# Contexto y Arquitectura: Autotec Web Viewer

Esta carpeta contiene la **Versión Web (Solo Lectura)** del sistema de administración y punto de venta del Taller Autotec.
A diferencia de la aplicación principal (que está desarrollada en Electron.js), este proyecto es un frontend ligero e independiente.

## 🎯 Objetivo de este Proyecto
Permitir la visualización y consulta remota de los registros del taller (órdenes de trabajo, clientes, vehículos, inventario y reportes financieros) desde cualquier navegador de internet, sin poner en riesgo la integridad de los datos.

Debido a que esta aplicación puede estar expuesta en internet público, se ha despojado por completo de:
- Formularios de guardado y edición de datos.
- Lógica de inicio de sesión de administradores (el sistema funciona permanentemente en "Modo Empleado").
- Credenciales quemadas de escritura o tokens de seguridad comprometedores.

## 🛠️ Tecnologías Usadas
- **Estructura y Estilos:** HTML5 (`index.html`) y CSS3 puro (`styles.css`).
- **Lógica Frontend:** Vanilla JavaScript (`app.js`).
- **Backend y Base de Datos:** Todo el almacenamiento reside en **Google Sheets**, operado como una base de datos.
- **API (Middle-ware):** Google Apps Script expone un endpoint mediante `URL_API_GOOGLE`. 

## 🌐 Flujo de Conexión
En el código antiguo (`.exe`), la conexión se realizaba a través de un puente IPC de Electron (`window.api.ejecutarEnGoogle`).
En esta versión web, dicho puente fue reemplazado en `app.js` por peticiones HTTP nativas:

```javascript
async function ejecutarEnGoogle(accion, datos = {}) {
    // Uso de fetch() nativo para descargar la base de datos de manera estática.
    let urlFinal = `${URL_API_GOOGLE}?accion=...`;
    let peticion = await fetch(urlFinal, { method: 'GET', cache: 'no-store' });
    let textoRespuesta = await peticion.text();
    // ...
}
```

## 📜 Reglas de Desarrollo
Si decides expandir esta aplicación web:
1. **Mantén el enfoque en la visualización:** Puedes mejorar las gráficas, crear nuevos dashboards, añadir filtros o exportadores de PDF de los datos. Sin embargo, no intentes habilitar la edición.
2. **Cualquier cambio de escritura, envíalo a la app de escritorio:** Si el usuario solicita habilitar alguna función para editar datos (por ejemplo, guardar un nuevo vehículo), debes rechazarlo cortésmente y sugerirle que para desarrollar módulos de escritura, la conversación debe realizarse abriendo la carpeta principal del `.exe`.
3. **No uses frameworks pesados:** Este sistema fue migrado para ser un *single-file app* rápido. No añadas `node_modules`, ni `React` ni empaquetadores sin la orden expresa del usuario.
