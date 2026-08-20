let datosBD = { inventario: [], clientes: [], proveedores: [], ventas: [], vehiculos: [] };
let productoEnEdicion = null;
const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwkEYhuSWWDUy8PkWjgO3-VZ5bU3cLH__VIYnH-h-0xuEhrLQUTpLmEf-0lPJ4Ha3ZkMg/exec";

// 1. PUENTE DE CONEXIÓN MAESTRO (MODO WEB NATIVO)
async function ejecutarEnGoogle(accion, datos = {}) {
    try {
        let tiempo = new Date().getTime();
        let urlFinal = `${URL_API_GOOGLE}?accion=${encodeURIComponent(accion)}&datos=${encodeURIComponent(JSON.stringify(datos))}&auth=AutotecSecureKey2026&t=${tiempo}`;
        let peticion = await fetch(urlFinal, { method: 'GET', cache: 'no-store' });
        let textoRespuesta = await peticion.text();
        let res = JSON.parse(textoRespuesta);
        
        if (res && res.datos) {
            deduplicarDatos(res.datos);
        }
        return res;
    } catch (err) {
        console.error(err);
        return { exito: false, error: err.message };
    }
}

// 2. FUNCIÓN PARA LIMPIAR DATOS DUPLICADOS (Caché y Nube)
function deduplicarDatos(db) {
    if (db.clientes) {
        let unicos = new Map();
        db.clientes.forEach(c => unicos.set(c[0], c));
        db.clientes = Array.from(unicos.values());
    }
    if (db.vehiculos) {
        let unicos = new Map();
        db.vehiculos.forEach(v => unicos.set(v[1], v));
        db.vehiculos = Array.from(unicos.values());
    }
    if (db.ordenesServicio) {
        let unicos = new Map();
        db.ordenesServicio.forEach(o => {
            let obj = Array.isArray(o) ? {
                folio: o[0],
                vin: o[1],
                dueno: o[2],
                vehiculo: o[3],
                fecha: o[4],
                garantia: o[5],
                km: o[6],
                sintoma: o[7],
                total: o[8],
                refacciones: typeof o[9] === 'string' ? (o[9].trim() !== "" ? JSON.parse(o[9]) : []) : (o[9] || [])
            } : o;
            
            if (obj && obj.folio) unicos.set(obj.folio, obj);
        });
        db.ordenesServicio = Array.from(unicos.values());
    }
}

// 3. FUNCIÓN DE ARRANQUE OPTIMIZADA CON CACHÉ LOCAL
window.onload = async function () {
    try {
        // 1. Cargar desde caché si existe (ARRANQUE INSTANTÁNEO)
        let cacheLocal = localStorage.getItem('datosBD_cache');
        if (cacheLocal) {
            try {
                datosBD = JSON.parse(cacheLocal);
                deduplicarDatos(datosBD); // Elimina duplicados de la caché
                localStorage.setItem('datosBD_cache', JSON.stringify(datosBD)); // Guardamos limpio
                aplicarPermisos(); // Renderiza las tablas con los datos en caché
                document.getElementById('pantalla-carga').style.display = 'none';
                setTimeout(() => {
                    mostrarModal({
                        tipo: 'warning',
                        titulo: 'PROPIEDAD INTELECTUAL',
                        mensaje: '© 2026 Diaz´s Tech - Todos los derechos reservados.',
                        detalle: 'Queda estrictamente prohibida la venta, distribución, copia, o mal uso de este software sin autorización expresa del autor.',
                    });
                }, 400);
            } catch (e) {
                console.error("Error leyendo caché:", e);
            }
        }

        // 2. Buscar actualizaciones en segundo plano (SILENCIOSO)
        let resultado = await ejecutarEnGoogle("iniciarSistema", {});

        if (resultado && resultado.exito) {
            // Guardar la nueva versión en caché deduplicada
            deduplicarDatos(resultado.datos);
            localStorage.setItem('datosBD_cache', JSON.stringify(resultado.datos));
            datosBD = resultado.datos;

            if (!cacheLocal) {
                // Si no había caché, aplicamos permisos y quitamos la pantalla de carga ahora
                aplicarPermisos();
                document.getElementById('pantalla-carga').style.display = 'none';
                setTimeout(() => {
                    mostrarModal({
                        tipo: 'warning',
                        titulo: 'PROPIEDAD INTELECTUAL',
                        mensaje: '© 2026 Diaz´s Tech - Todos los derechos reservados.',
                        detalle: 'Queda estrictamente prohibida la venta, distribución, copia, o mal uso de este software sin autorización expresa del autor.',
                    });
                }, 400);
            } else {
                // Si ya había cargado la caché, solo actualizamos los datos visualmente sin interrumpir
                actualizarTodasLasTablas();
            }
        } else if (!cacheLocal) {
            mostrarErrorEnPantalla("Error de Base de Datos", resultado ? resultado.error : "Sin respuesta");
        }
    } catch (err) {
        if (!localStorage.getItem('datosBD_cache')) {
            mostrarErrorEnPantalla("Fallo Crítico en Arranque", err.message);
        }
    }
};

// 3. MOTOR DE MODALES COMPLETO
function mostrarModal(opciones) {
    return new Promise((resolve) => {
        let modal = document.getElementById('modal-moderno');
        let icono = document.getElementById('modal-icono');

        document.getElementById('modal-titulo').innerText = opciones.titulo || 'Alerta';
        document.getElementById('modal-mensaje').innerHTML = opciones.mensaje || '';
        document.getElementById('modal-detalle').innerHTML = opciones.detalle || '';

        let modalBox = modal.querySelector('.modal-box');
        if (modalBox) {
            let tit = (opciones.titulo || "").toUpperCase();
            let det = (opciones.detalle || "").toUpperCase();
            if (opciones.amplio || det.includes('<TABLE') || det.includes('OVERFLOW-Y') || tit.includes('HISTORIAL') || tit.includes('DESGLOSE') || tit.includes('EXPEDIENTE') || tit.includes('PARQUE') || tit.includes('ANTECEDENTES') || tit.includes('MEDIDAS')) {
                modalBox.classList.add('modal-box-amplio');
            } else {
                modalBox.classList.remove('modal-box-amplio');
            }
        }

        // Estilos de iconos según el tipo de pop-up
        icono.className = "modal-icon-circulo";
        if (opciones.tipo === 'error') { icono.classList.add('icon-error'); icono.innerText = '✕'; }
        else if (opciones.tipo === 'warning') { icono.classList.add('icon-warning'); icono.innerText = '⚠'; }
        // Si es de tipo prompt (para ajustar o escribir), cambiamos el icono por un lápiz
        if (opciones.tipo === 'prompt') {
            icono.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
        }

        // Permitir que al presionar Enter dentro del input se acepte automáticamente
        setTimeout(() => {
            const inputModal = modal.querySelector('input');
            if (inputModal) {
                inputModal.focus();
            }

            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    window.removeEventListener('keydown', handleKeyDown);

                    // Buscar específicamente el botón de Aceptar (evitando el de cancelar)
                    const botones = modal.querySelectorAll('button');
                    let btnAceptar = Array.from(botones).find(b => {
                        const texto = b.textContent.trim().toLowerCase();
                        return texto === 'aceptar' || texto === 'guardar' || texto === 'ok' || b.classList.contains('btn-primary');
                    });

                    // Si hay varios botones, asegurarnos de tomar el último (que es Aceptar)
                    if (!btnAceptar && botones.length > 0) {
                        btnAceptar = botones[botones.length - 1];
                    }

                    if (btnAceptar) {
                        btnAceptar.click();
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);

            const observer = new MutationObserver(() => {
                if (modal.style.display === 'none' || (!modal.classList.contains('activo') && modal.style.display === '')) {
                    window.removeEventListener('keydown', handleKeyDown);
                    observer.disconnect();
                }
            });
            observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
        }, 100);

        let input = document.getElementById('modal-input');
        if (opciones.tipo === 'prompt') {
            input.style.display = 'block';
            // La magia: Si le avisamos que es contraseña, pone asteriscos. Si no, lo deja normal.
            input.type = (opciones.esPassword || (opciones.titulo && opciones.titulo.toLowerCase().includes('contrase'))) ? 'password' : 'text';
            input.value = opciones.valorDefault || '';
            setTimeout(() => input.focus(), 100);
        } else {
            input.style.display = 'none';
        }

        let btnCancelar = document.getElementById('modal-btn-cancelar');
        btnCancelar.style.display = (opciones.tipo === 'confirmar' || opciones.tipo === 'prompt') ? 'block' : 'none';

        let btnTerciario = document.getElementById('modal-btn-terciario');
        if (btnTerciario) btnTerciario.style.display = 'none';

        let btnAceptar = document.getElementById('modal-btn-aceptar');
        btnAceptar.replaceWith(btnAceptar.cloneNode(true));
        btnAceptar = document.getElementById('modal-btn-aceptar');
        btnAceptar.innerText = opciones.btnTexto || 'Aceptar';
        btnAceptar.onclick = () => {
            let val = input.value;
            cerrarModal();
            resolve(opciones.tipo === 'prompt' ? val : true);
        };

        btnCancelar.replaceWith(btnCancelar.cloneNode(true));
        btnCancelar = document.getElementById('modal-btn-cancelar');
        btnCancelar.onclick = () => { cerrarModal(); resolve(null); };

        modal.style.display = 'flex';
    });
}
function cerrarModal() {
    document.getElementById('modal-moderno').style.display = 'none';
    document.getElementById('modal-detalle').innerHTML = '';
    document.getElementById('modal-input').value = '';
}
function mostrarErrorEnPantalla(titulo, mensaje) { document.getElementById('pantalla-carga').style.display = 'flex'; document.getElementById('pantalla-carga').innerHTML = "❌ " + titulo + "<br><br>" + mensaje; }
window.alert = function (mensaje) { mostrarModal({ tipo: 'exito', titulo: 'Completado', mensaje: mensaje }); };

// 4. LÓGICA DE INTERFAZ Y RESTRICCIONES DE USUARIO
function cambiarVista(id, btn) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.navbar button').forEach(b => b.classList.remove('activo'));
    document.getElementById(id).classList.add('activa');
    btn.classList.add('activo');
}

function aplicarPermisos() {
    let isAdmin = false; // MODO SOLO LECTURA WEB
    let navReportes = document.getElementById('nav-reportes');
    if (navReportes) navReportes.style.display = isAdmin ? 'inline-block' : 'none';
    
    let inputPrecio = document.getElementById('p-precio');
    if (inputPrecio) inputPrecio.readOnly = !isAdmin;
    
    actualizarTodasLasTablas();
}

async function solicitarAdmin() {
    mostrarModal({ tipo: 'error', titulo: 'Solo Lectura', mensaje: 'Esta versión web es únicamente para visualización. Los cambios deben hacerse desde la aplicación de escritorio.' });
}

// 5. TABLAS Y FILTROS
function actualizarTodasLasTablas() {
    if (typeof inicializarDatosDemoAutotec === 'function') inicializarDatosDemoAutotec();
    let isAdmin = document.body.classList.contains('is-admin');

    // 1. DICCIONARIO COMPLETO
    const catalogoLineas = {
        "SE": "SERVICIOS",
        "FA": "FILTROS DE ACEITE",
        "FG": "FILTROS DE GASOLINA",
        "FAC": "FILTROS DE AIRE DE CABINA"
    };

    // 2. Extraer siglas y combinarlas con las que ya existan en tu BD
    let lineasFijas = Object.keys(catalogoLineas);
    let todasLasLineas = [...new Set([...lineasFijas, ...datosBD.inventario.map(i => i[0])])].filter(Boolean).sort();

    // 3. Crear la lista desplegable con columnas matemáticas exactas
    let htL = '<option value="TODAS">TODAS</option>';
    todasLasLineas.forEach(l => {
        if (catalogoLineas[l]) {
            // TRUCO: Fijamos la primera columna a 12 espacios exactos menos lo que mida la sigla
            let espaciosFaltantes = 12 - l.length;
            let separacion = "&nbsp;".repeat(espaciosFaltantes);

            let textoVisible = `${l}${separacion}${catalogoLineas[l]}`;
            htL += `<option value="${l}">${textoVisible}</option>`;
        } else {
            htL += `<option value="${l}">${l}</option>`;
        }
    });

    let filtroLinea = document.getElementById('filtro-linea');
    filtroLinea.innerHTML = htL;
    // LA MAGIA: Forzamos la fuente monoespaciada para que las letras y espacios midan exactamente lo mismo
    filtroLinea.style.fontFamily = "'Consolas', 'Courier New', monospace";

    // Categorías y renderizado de tablas se queda igual
    let htC = '<option value="TODAS">Todas</option>';[...new Set(datosBD.inventario.map(i => i[3]))].filter(Boolean).sort().forEach(c => htC += `<option value="${c}">${c}</option>`); document.getElementById('filtro-categoria').innerHTML = htC;
    renderTablaInventario(datosBD.inventario);

    let htCli = '<option value="">Seleccione...</option><optgroup label="Clientes">';
    
    // 1. DIBUJAR TABLA DE CLIENTES CON BOTÓN DE EDITAR
    datosBD.clientes.forEach(f => {
        htCli += `<option value="${f[0]}">${f[0]}</option>`;
    });
    
    renderTablaClientes(datosBD.clientes);

    htCli += '</optgroup><optgroup label="Proveedores">'; let tbProv = '';

    // 2. DIBUJAR TABLA DE PROVEEDORES CON BOTÓN DE EDITAR
    datosBD.proveedores.forEach(f => {
        tbProv += `<tr>
        <td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td>
        <td style="white-space: nowrap;">
            <button class="btn-tabla" style="background-color:#8e44ad;" onclick="editarTextosProveedor('${f[0]}')">📝 Editar</button>
            <button class="btn-tabla btn-eliminar" onclick="borrarProveedor('${f[0]}')">X</button>
        </td>
    </tr>`;
        htCli += `<option value="${f[0]}">${f[0]}</option>`;
    });
    document.getElementById('tabla-cuerpo-proveedores').innerHTML = tbProv;
    document.getElementById('v-cliente').innerHTML = htCli;

    // 3. DIBUJAR TABLA Y SELECT DE VEHÍCULOS AUTOTEC
    let selectDueno = document.getElementById('v-auto-dueno');
    if (selectDueno) {
        let htDueno = '<option value="">Seleccione al cliente propietario...</option>';
        datosBD.clientes.forEach(f => {
            htDueno += `<option value="${f[0]}">${f[0]}</option>`;
        });
        selectDueno.innerHTML = htDueno;
    }
    if (typeof renderTablaVehiculos === 'function') renderTablaVehiculos();
}

// Variable global para controlar el retraso del buscador
let temporizadorFiltro;

function renderTablaInventario(lista) {
    let isAdmin = document.body.classList.contains('is-admin');
    let tInv = document.getElementById('tabla-cuerpo-inventario');

    if (lista.length === 0) { tInv.innerHTML = '<tr><td colspan="8" align="center">Vacio</td></tr>'; return; }

    let h = "";

    // LA MAGIA: Separamos los productos principales de las medidas específicas (variantes)
    let padres = lista.filter(f => !String(f[1]).includes('-ESP'));
    let variantes = datosBD.inventario.filter(f => String(f[1]).includes('-ESP'));

    let listaLimitada = padres.slice(0, 200);

    listaLimitada.forEach(f => {
        let desc = f[2] ? f[2].toString().replace(/'/g, "\\'").replace(/"/g, "&quot;") : "";

        // Encontrar las medidas de este producto y sumar el stock total
        let misVariantes = variantes.filter(v => String(v[1]).startsWith(f[1] + '-ESP'));
        let stockTotal = parseFloat(f[6]) || 0;
        misVariantes.forEach(v => stockTotal += (parseFloat(v[6]) || 0));

        // Protección del costo (Evitar el NaN)
        let costoLegible = f[4];
        if (isNaN(costoLegible)) { try { costoLegible = atob(f[4]); } catch (e) { costoLegible = f[4]; } }
        let cCosto = isAdmin ? `<td>$${parseFloat(costoLegible).toFixed(2)}</td>` : `<td>Oculto</td>`;

        // Creamos el botón de Desglose solo si el producto tiene medidas registradas
        let btnDesglose = misVariantes.length > 0 ? `<button class="btn-tabla" style="background-color:#9b59b6;" onclick="verMedidasDesglose('${f[1]}')">📏 Desglose</button>` : '';

        h += `<tr>
            <td>${f[0]}</td>
            <td><strong>${f[1]}</strong></td>
            <td>${f[2]}</td>
            <td>${f[3]}</td>
            ${cCosto}
            <td>$${parseFloat(f[5]).toFixed(2)}</td>
            <td><strong style="color:#27AE60; font-size:15px;">${stockTotal}</strong></td>
            <td style="white-space: nowrap;"> 
                ${btnDesglose}
                <button class="btn-tabla btn-ajustar" onclick="abrirAjusteStock('${f[1]}', '${desc}')">Stock</button> 
                <button class="btn-tabla btn-editar" onclick="abrirEdicionPrecios('${f[1]}', '${desc}', '${f[4]}', '${f[5]}')">Precios</button> 
                <button class="btn-tabla btn-editar" style="background-color:#1ABC9C;" onclick="abrirEdicionTextos('${f[1]}')">Editar</button>
                <button class="btn-tabla btn-eliminar" onclick="borrarProducto('${f[1]}')">X</button>
            </td>
        </tr>`;
    });

    if (lista.length > 100) h += `<tr><td colspan="8" style="text-align:center; color:gray; padding: 10px;"><em>Mostrando productos principales. Usa el buscador.</em></td></tr>`;
    tInv.innerHTML = h;
}

// Nueva función para mostrar la ventanita del Desglose
function verMedidasDesglose(codBase) {
    let misVariantes = datosBD.inventario.filter(v => String(v[1]).startsWith(codBase + '-ESP'));
    let detalle = misVariantes.map(v => {
        let medida = String(v[1]).split('-ESP')[1];
        return `• Medida ${medida} : ${v[6]} piezas en stock`;
    }).join('\n');

    mostrarModal({ tipo: 'info', titulo: 'DESGLOSE DE MEDIDAS', mensaje: 'Código: ' + codBase, detalle: detalle, btnTexto: 'Entendido' });
}

// OPTIMIZACIÓN 3: Se aplica el efecto "Debounce" al buscador
function filtrarInventario() {
    // Si el usuario presiona otra tecla rápido, borramos la orden anterior
    clearTimeout(temporizadorFiltro);

    // Ponemos una orden nueva que se ejecutará solo si deja de teclear por 300 milisegundos
    temporizadorFiltro = setTimeout(() => {
        let t = document.getElementById('filtro-texto').value.toLowerCase();
        let l = document.getElementById('filtro-linea').value;
        let c = document.getElementById('filtro-categoria').value;

        renderTablaInventario(datosBD.inventario.filter(i => {
            return ((i[1] || "").toLowerCase().includes(t) || (i[2] || "").toLowerCase().includes(t)) && (l === "TODAS" || i[0] == l) && (c === "TODAS" || i[3] == c);
        }));
    }, 300);
}

// 6. BUSCADORES
// 6. BUSCADORES
function filtrarSugerenciasVenta(t) { let b = document.getElementById('p-sugerencias'); if (!t) { b.style.display = 'none'; return; } let enc = datosBD.inventario.filter(p => p[1].toLowerCase().includes(t.toLowerCase()) || p[2].toLowerCase().includes(t.toLowerCase())).slice(0, 10); let h = ''; enc.forEach(p => h += `<div class="sugerencia-item" onclick="seleccionarProductoVenta('${p[1]}', '${p[2].replace(/'/g, "\\'").replace(/"/g, "&quot;")}', '${p[0]}', '${p[5]}')">${p[1]} - ${p[2].replace(/"/g, "&quot;")}</div>`); b.innerHTML = h; b.style.display = 'block'; }
function seleccionarProductoVenta(cod, desc, lin, pre) { document.getElementById('p-buscar-input').value = cod + " - " + desc; document.getElementById('p-producto').value = cod; document.getElementById('p-linea').value = lin; document.getElementById('p-precio').value = parseFloat(pre).toFixed(2); document.getElementById('p-sugerencias').style.display = 'none'; }

function filtrarSugerenciasProdTerminado(t) { let b = document.getElementById('prod-term-sugerencias'); if (!t) { b.style.display = 'none'; return; } let enc = datosBD.inventario.filter(p => p[1].toLowerCase().includes(t.toLowerCase()) || p[2].toLowerCase().includes(t.toLowerCase())).slice(0, 10); let h = ''; enc.forEach(p => h += `<div class="sugerencia-item" onclick="seleccionarProdTerminado('${p[1]}', '${p[2].replace(/'/g, "\\'").replace(/"/g, "&quot;")}')">${p[1]} - ${p[2].replace(/"/g, "&quot;")}</div>`); b.innerHTML = h; b.style.display = 'block'; }
function seleccionarProdTerminado(cod, desc) { document.getElementById('prod-term-buscar').value = cod + " - " + desc; document.getElementById('prod-terminado-select').value = cod; document.getElementById('prod-term-sugerencias').style.display = 'none'; }

function filtrarSugerenciasComp(t) { let b = document.getElementById('comp-sugerencias'); if (!t) { b.style.display = 'none'; return; } let enc = datosBD.inventario.filter(p => p[1].toLowerCase().includes(t.toLowerCase()) || p[2].toLowerCase().includes(t.toLowerCase())).slice(0, 10); let h = ''; enc.forEach(p => h += `<div class="sugerencia-item" onclick="seleccionarComp('${p[1]}', '${p[2].replace(/'/g, "\\'").replace(/"/g, "&quot;")}')">${p[1]} - ${p[2].replace(/"/g, "&quot;")}</div>`); b.innerHTML = h; b.style.display = 'block'; }
function seleccionarComp(cod, desc) {
    document.getElementById('comp-buscar').value = cod + " - " + desc;
    document.getElementById('comp-producto').value = cod;
    document.getElementById('comp-sugerencias').style.display = 'none';
    let prod = (datosBD.inventario || []).find(p => p[1] === cod);
    if (prod && document.getElementById('comp-precio-manual')) {
        let precio = parseFloat(prod[5]) || 0;
        if (precio === 0 && !isNaN(prod[4])) precio = parseFloat(prod[4]) || 0;
        document.getElementById('comp-precio-manual').value = precio.toFixed(2);
    }
}

function filtrarSugerenciasVehiculo(t) {
    let b = document.getElementById('vehiculos-sugerencias');
    if (!t) { b.style.display = 'none'; return; }
    let lowerT = t.toLowerCase();

    let coincidencias = [];
    (datosBD.vehiculos || []).forEach(v => {
        let dueno = v[0] || "";
        let vin = v[1] || "";
        let marcaModelo = `${v[2] || ""} ${v[3] || ""}`.trim();
        let placas = v[6] || "";
        let isGen = isGenericVIN(vin);
        let ordenesDelAuto = (datosBD.ordenesServicio || []).filter(o => {
            if (o.vin !== vin) return false;
            return isGen ? (o.dueno === dueno) : true;
        }).map(o => o.folio).join(", ");

        let textoCompleto = [dueno, vin, marcaModelo, placas, ordenesDelAuto].join(" ").toLowerCase();
        let terminos = lowerT.split(' ').filter(x => x.trim() !== '');

        if (terminos.every(termino => textoCompleto.includes(termino))) {
            coincidencias.push({ vin: vin, dueno: dueno, vehiculo: marcaModelo, ordenes: ordenesDelAuto });
        }
    });

    let enc = coincidencias.slice(0, 15);
    let h = '';
    enc.forEach(c => {
        h += `<div class="sugerencia-item" onclick="seleccionarVehiculoServicio('${c.vin}', '${c.dueno.replace(/'/g, "\\'")}')">
                      <b>${c.vehiculo}</b> - ${c.dueno} <br>
                      <small style="color:#7f8c8d;">Placas/VIN: ${c.vin}</small>
                      ${c.ordenes ? `<br><span style="color:#27ae60;font-size:11px;">Órdenes: ${c.ordenes}</span>` : ''}
                    </div>`;
    });

    b.innerHTML = h;
    b.style.display = enc.length > 0 ? 'block' : 'none';
}

function refrescarVistaActual() {
    let t = document.getElementById('filtro-texto').value.toLowerCase();
    let l = document.getElementById('filtro-linea').value;
    let c = document.getElementById('filtro-categoria').value;

    let filtrados = datosBD.inventario.filter(i => {
        return ((i[1] || "").toLowerCase().includes(t) || (i[2] || "").toLowerCase().includes(t)) && (l === "TODAS" || i[0] == l) && (c === "TODAS" || i[3] == c);
    });
    renderTablaInventario(filtrados);
}

async function abrirEdicionPrecios(cod, desc, c, p) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'Los empleados no tienen permisos para editar costos o precios.' });
    }
    let nC = await mostrarModal({ tipo: 'prompt', titulo: 'Modificar Costo', detalle: 'Nuevo Costo:', valorDefault: c }); if (!nC) return;
    let nP = await mostrarModal({ tipo: 'prompt', titulo: 'Modificar Precio', detalle: 'Nuevo Precio:', valorDefault: p }); if (!nP) return;

    let index = datosBD.inventario.findIndex(f => String(f[1]).trim() === String(cod).trim());
    if (index !== -1) {
        datosBD.inventario[index][4] = parseFloat(nC);
        datosBD.inventario[index][5] = parseFloat(nP);
    }

    refrescarVistaActual(); // Recarga instantánea sin temporizador
    mostrarModal({ tipo: 'success', titulo: 'Actualizado', mensaje: 'Precios modificados correctamente.' });

    ejecutarEnGoogle("actualizarPrecioCosto", { codigo: cod, nuevoCosto: parseFloat(nC), nuevoPrecio: parseFloat(nP) }).then(res => {
        if (!res.exito) mostrarModal({ tipo: 'error', titulo: 'Error de Sincronización', mensaje: 'Fallo al guardar en la nube el precio de: ' + cod });
    });
}

async function abrirAjusteStock(cod, desc) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'El ajuste de inventario requiere privilegios de Administrador.' });
    }
    let aj = await mostrarModal({ tipo: 'prompt', titulo: 'AJUSTE (+/-)', detalle: 'Cantidad a sumar o restar:' }); if (!aj) return;
    let obs = await mostrarModal({ tipo: 'prompt', titulo: 'Motivo del Ajuste', detalle: 'Escriba la justificación:' }); if (!obs) return;

    let index = datosBD.inventario.findIndex(f => String(f[1]).trim() === String(cod).trim());
    if (index !== -1) {
        let stockActual = parseFloat(datosBD.inventario[index][6]) || 0;
        datosBD.inventario[index][6] = stockActual + parseFloat(aj);
    }

    refrescarVistaActual(); // Recarga instantánea sin temporizador
    mostrarModal({ tipo: 'success', titulo: 'Stock Ajustado', mensaje: 'El inventario se actualizó correctamente.' });

    ejecutarEnGoogle("ajustarStockBase", { codigo: cod, cantidad: parseFloat(aj), obs: obs }).then(res => {
        if (!res.exito) mostrarModal({ tipo: 'error', titulo: 'Error de Sincronización', mensaje: 'Fallo al guardar el stock de: ' + cod });
    });
}



async function borrarProducto(cod) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'Solo el Administrador puede eliminar productos del catálogo.' });
    }
    if (await mostrarModal({ tipo: 'confirmar', titulo: 'Confirmar Eliminación', mensaje: '¿Está seguro de eliminar el producto: ' + cod + '?' })) {
        document.getElementById('pantalla-carga').style.display = 'flex';
        let r = await ejecutarEnGoogle("borrarProductoBD", cod);
        if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); mostrarModal({ tipo: 'success', titulo: 'Eliminado', mensaje: 'Producto borrado con éxito.' }); }
        else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); }
        document.getElementById('pantalla-carga').style.display = 'none';
    }
}

async function borrarCliente(nom) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'Solo el Administrador puede eliminar clientes del directorio.' });
    }
    if (await mostrarModal({ tipo: 'confirmar', titulo: 'Confirmar Eliminación', mensaje: '¿Borrar al cliente: ' + nom + '?' })) {
        document.getElementById('pantalla-carga').style.display = 'flex';
        let r = await ejecutarEnGoogle("borrarClienteBD", nom);
        if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); mostrarModal({ tipo: 'success', titulo: 'Eliminado', mensaje: 'Cliente borrado con éxito.' }); }
        else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); }
        document.getElementById('pantalla-carga').style.display = 'none';
    }
}

async function borrarProveedor(nom) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'Solo el Administrador puede eliminar proveedores del directorio.' });
    }
    if (await mostrarModal({ tipo: 'confirmar', titulo: 'Confirmar Eliminación', mensaje: '¿Borrar al proveedor: ' + nom + '?' })) {
        document.getElementById('pantalla-carga').style.display = 'flex';
        let r = await ejecutarEnGoogle("borrarProveedorBD", nom);
        if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); mostrarModal({ tipo: 'success', titulo: 'Eliminado', mensaje: 'Proveedor borrado con éxito.' }); }
        else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); }
        document.getElementById('pantalla-carga').style.display = 'none';
    }
}

// 8. GUARDADO DE NUEVOS

async function guardarProductoLocal(e) {
    e.preventDefault();
    if (!document.body.classList.contains('is-admin')) { return mostrarModal({ tipo: 'warning', titulo: 'Restringido', mensaje: 'Se requieren permisos de Administrador.' }); }
    document.getElementById('pantalla-carga').style.display = 'flex';
    if (productoEnEdicion) { await ejecutarEnGoogle("borrarProductoBD", productoEnEdicion); }
    let r = await ejecutarEnGoogle("guardarProducto", { linea: document.getElementById('prod-linea').value, codigo: document.getElementById('prod-codigo').value, descripcion: document.getElementById('prod-desc').value, categoria: document.getElementById('prod-cat').value, costo: document.getElementById('prod-costo').value, precio: document.getElementById('prod-precio').value, stock: document.getElementById('prod-stock').value });
    if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); document.getElementById('form-prod').reset(); productoEnEdicion = null; let btn = document.querySelector('#form-prod button[type="submit"]'); if (btn) btn.innerText = 'Guardar Producto'; mostrarModal({ tipo: 'success', titulo: 'Guardado', mensaje: 'Producto registrado con éxito.' }); } else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); }
    document.getElementById('pantalla-carga').style.display = 'none';
}
async function abrirEdicionTextos(codBase) {
    if (!document.body.classList.contains('is-admin')) {
        return mostrarModal({ tipo: 'warning', titulo: 'Acción Restringida', mensaje: 'Se requieren permisos de Administrador para editar productos.' });
    }
    let p = datosBD.inventario.find(x => String(x[1]) === String(codBase));
    if (!p) return;

    let nLinea = await mostrarModal({ tipo: 'prompt', titulo: 'Editar Línea', detalle: 'Nueva Línea:', valorDefault: p[0] });
    if (nLinea === null) return;
    let nCod = await mostrarModal({ tipo: 'prompt', titulo: 'Editar Código', detalle: 'Nuevo Código:', valorDefault: p[1] });
    if (nCod === null) return;
    let nDesc = await mostrarModal({ tipo: 'prompt', titulo: 'Editar Descripción', detalle: 'Nueva Descripción:', valorDefault: p[2] });
    if (nDesc === null) return;
    let nCat = await mostrarModal({ tipo: 'prompt', titulo: 'Editar Categoría', detalle: 'Nueva Categoría:', valorDefault: p[3] });
    if (nCat === null) return;

    document.getElementById('pantalla-carga').style.display = 'flex';
    let costoLegible = p[4];
    if (isNaN(costoLegible)) { try { costoLegible = atob(p[4]); } catch (e) { costoLegible = p[4]; } }

    // Delete old entry and save the updated one
    await ejecutarEnGoogle("borrarProductoBD", p[1]);
    let r = await ejecutarEnGoogle("guardarProducto", {
        linea: nLinea, codigo: nCod, descripcion: nDesc, categoria: nCat, costo: costoLegible, precio: p[5], stock: p[6]
    });
    if (r.exito) {
        datosBD = r.datos; actualizarTodasLasTablas();
        mostrarModal({ tipo: 'success', titulo: 'Actualizado', mensaje: 'Producto editado correctamente.' });
    } else {
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error });
    }
    document.getElementById('pantalla-carga').style.display = 'none';
}
async function guardarClienteLocal(e) { e.preventDefault(); document.getElementById('pantalla-carga').style.display = 'flex'; let r = await ejecutarEnGoogle("guardarCliente", { nombre: document.getElementById('cli-nombre').value, rfc: document.getElementById('cli-rfc').value, telefono: document.getElementById('cli-tel').value, direccion: document.getElementById('cli-dir').value }); if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); document.getElementById('form-cli').reset(); mostrarModal({ tipo: 'success', titulo: 'Guardado', mensaje: 'Cliente registrado con éxito.' }); } else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); } document.getElementById('pantalla-carga').style.display = 'none'; }
async function guardarProveedorLocal(e) { e.preventDefault(); document.getElementById('pantalla-carga').style.display = 'flex'; let r = await ejecutarEnGoogle("guardarProveedor", { nombre: document.getElementById('prov-nombre').value, rfc: document.getElementById('prov-rfc').value, telefono: document.getElementById('prov-tel').value, direccion: document.getElementById('prov-dir').value }); if (r.exito) { datosBD = r.datos; actualizarTodasLasTablas(); document.getElementById('form-prov').reset(); mostrarModal({ tipo: 'success', titulo: 'Guardado', mensaje: 'Proveedor registrado con éxito.' }); } else { mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error }); } document.getElementById('pantalla-carga').style.display = 'none'; }

// 9. ENSAMBLES Y VENTAS
// ==============================================
// 9. ENSAMBLES Y PRODUCCIÓN CON COSTEO
// ==============================================
let carritoProduccion = [];
let costoTotalProduccion = 0; // Guardará el costo total del ensamble

function agregarComponente() {
    let c = parseFloat(document.getElementById('comp-cant').value);
    let cod = document.getElementById('comp-producto').value;

    if (c > 0 && cod) {
        let p = datosBD.inventario.find(x => x[1] === cod);

        if (p) {
            // Leemos el costo del componente (y lo desciframos por si acaso)
            // Leemos el costo y verificamos si NO es un número normal antes de intentar descifrarlo
            let costoUnitario = p[4];
            if (isNaN(costoUnitario)) {
                try { costoUnitario = atob(p[4]); } catch (e) { costoUnitario = p[4]; }
            }
            costoUnitario = parseFloat(costoUnitario) || 0;

            let subtotalCosto = c * costoUnitario;

            carritoProduccion.push({
                cantidad: c || 0,
                codigoReal: cod || "",
                codigo: cod || "",
                linea: p[0] || "General",
                descripcion: p[2] || "",
                categoria: p[3] || "General",
                precio: p[5] || 0,
                costoUnitario: costoUnitario || 0,
                costo: costoUnitario || 0,
                subtotalCosto: subtotalCosto || 0
            });

            actTablaProd();

            // Limpiar inputs
            document.getElementById('comp-cant').value = 1;
            document.getElementById('comp-buscar').value = '';
            document.getElementById('comp-producto').value = '';
        }
    }
}

function actTablaProd() {
    let tb = document.getElementById('tabla-cuerpo-produccion');
    tb.innerHTML = '';
    costoTotalProduccion = 0; // Reiniciamos el contador

    carritoProduccion.forEach((i, idx) => {
        costoTotalProduccion += i.subtotalCosto;

        tb.innerHTML += `<tr>
            <td>${i.cantidad}</td>
            <td>${i.codigoReal}</td>
            <td>${i.descripcion}</td>
            <td>${i.categoria}</td>
            <td>$${i.costoUnitario.toFixed(2)}</td>
            <td><strong>$${i.subtotalCosto.toFixed(2)}</strong></td>
            <td><button class="btn-tabla btn-eliminar" onclick="carritoProduccion.splice(${idx},1); actTablaProd();">X</button></td>
        </tr>`;
    });

    // Actualizamos el letrero gigante naranja con el total
    let lblCosto = document.getElementById('lbl-costo-produccion');
    if (lblCosto) {
        lblCosto.innerText = costoTotalProduccion.toFixed(2);
    }
}
async function registrarProduccionLocal() {
    let productoFinal = document.getElementById('prod-terminado-select').value;
    let descProd = document.getElementById('prod-term-buscar').value;
    let specify = document.getElementById('input-specify').value || "";
    let fecha = document.getElementById('input-fecha-produccion').value;
    let cantidad = parseFloat(document.getElementById('prod-terminado-cant').value) || 1;

    if (!productoFinal || carritoProduccion.length === 0) {
        return mostrarModal({ tipo: 'warning', titulo: 'Atención', mensaje: 'Seleccione un producto final y agregue materiales.' });
    }

    document.getElementById('pantalla-carga').style.display = 'flex';

    let baseProd = datosBD.inventario.find(x => String(x[1]) === String(productoFinal)) || ["General", productoFinal, descProd || "", "Reconstruido", 0, 0, 0];

    let codDestino = specify.trim() !== "" ? String(productoFinal) + "-ESP" + specify.trim() : String(productoFinal);
    let descDestino = specify.trim() !== "" ? String(descProd || baseProd[2] || "") + " (Medida: " + specify.trim() + ")" : String(descProd || baseProd[2] || "");

    // Si se especifica una medida y la variante aún no está en inventario, se da de alta como desglose
    let prodExistente = datosBD.inventario.find(x => String(x[1]) === codDestino);
    if (!prodExistente && codDestino !== String(productoFinal)) {
        await ejecutarEnGoogle("guardarProducto", {
            linea: String(baseProd[0] || "General"),
            codigo: codDestino,
            descripcion: descDestino,
            categoria: String(baseProd[3] || "Reconstruido"),
            costo: String(costoTotalProduccion || baseProd[4] || 0),
            precio: String(baseProd[5] || 0),
            stock: "0"
        });
    }

    let listaComponentes = carritoProduccion.map(m => {
        let matProd = datosBD.inventario.find(x => String(x[1]) === String(m.codigoReal || m.codigo)) || [m.linea || "General", m.codigoReal || m.codigo || "", m.descripcion || "", m.categoria || "General", m.costoUnitario || m.costo || 0, m.precio || 0, 0];
        return {
            cantidad: String(m.cantidad || 0),
            codigoReal: String(m.codigoReal || m.codigo || ""),
            codigo: String(m.codigoReal || m.codigo || ""),
            id: String(m.codigoReal || m.codigo || ""),
            linea: String(m.linea || matProd[0] || "General"),
            descripcion: String(m.descripcion || matProd[2] || ""),
            categoria: String(m.categoria || matProd[3] || "General"),
            precio: String(m.precio || matProd[5] || m.costoUnitario || 0),
            costoUnitario: String(m.costoUnitario || m.costo || 0),
            costo: String(m.costoUnitario || m.costo || 0),
            subtotalCosto: String(m.subtotalCosto || 0),
            stock: String(matProd[6] || 0)
        };
    });

    let r = await ejecutarEnGoogle("procesarProduccion", {
        productoTerminado: codDestino,
        producto: codDestino,
        codigo: codDestino,
        codigoReal: codDestino,
        linea: String(baseProd[0] || "General"),
        descripcion: descDestino,
        categoria: String(baseProd[3] || "Reconstruido"),
        precio: String(baseProd[5] || 0),
        costo: String(costoTotalProduccion || baseProd[4] || 0),
        stock: String(prodExistente ? prodExistente[6] : (codDestino === String(productoFinal) ? baseProd[6] : 0)),
        specify: String(specify || ""),
        medida: String(specify || ""),
        fecha: String(fecha || ""),
        cantidad: String(cantidad || 1),
        cantidadTerminada: String(cantidad || 1),
        cantidadTerminado: String(cantidad || 1),
        cantidadProducida: String(cantidad || 1),
        cantidadProd: String(cantidad || 1),
        cant: String(cantidad || 1),
        qty: String(cantidad || 1),
        costoTotal: String(costoTotalProduccion || 0),
        componentes: listaComponentes,
        materiales: listaComponentes,
        items: listaComponentes,
        partidas: listaComponentes
    });

    if (r.exito) {
        imprimirReporteProduccion(descProd, specify, cantidad, carritoProduccion, costoTotalProduccion);

        carritoProduccion = [];

        document.getElementById('prod-term-buscar').value = '';
        document.getElementById('prod-terminado-select').value = '';
        document.getElementById('prod-terminado-cant').value = 1;
        document.getElementById('input-specify').value = '';
        document.getElementById('input-fecha-produccion').value = '';

        let r2 = await ejecutarEnGoogle("obtenerDatosCompletos", {});
        if (r2.exito) {
            datosBD = r2.datos;
            localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
            actualizarTodasLasTablas();
        }

        document.getElementById('pantalla-carga').style.display = 'none';

        if (specify && specify.trim() !== "") {
            verMedidasDesglose(String(productoFinal));
        } else {
            mostrarModal({ tipo: 'success', titulo: 'Éxito', mensaje: 'Producción registrada correctamente.' });
        }

        actTablaProd();

        document.getElementById('comp-cant').value = 1;
        document.getElementById('comp-buscar').value = '';
        document.getElementById('comp-producto').value = '';
    } else {
        document.getElementById('pantalla-carga').style.display = 'none';
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error });
    }
}

// ==============================================
// SISTEMA SEGURO DE VISUALIZACIÓN E IMPRESIÓN HTML (SIN POPUPS)
// ==============================================
function visualizarOImprimirHTML(html, tituloModal, imprimirInmediato = false, vinParaVolver = null) {
    let htmlLimpio = html.replace(/"/g, '&quot;');
    if (imprimirInmediato) {
        let iframe = document.getElementById('iframe-impresion-oculto');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'iframe-impresion-oculto';
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);
        }
        iframe.srcdoc = html;
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }, 500);
        };
    } else {
        let contenidoIframe = `<iframe id="iframe-impresion-visualizador" srcdoc="${htmlLimpio}" style="width:100%; height:75vh; border:none; background:white; border-radius: 8px; box-shadow: inset 0 0 5px rgba(0,0,0,0.1);"></iframe>`;
        
        mostrarModal({
            tipo: 'info',
            titulo: tituloModal,
            mensaje: '',
            detalle: contenidoIframe,
            amplio: true
        });

        // Usar los botones nativos del footer en lugar de inyectar HTML extra que rompe el layout
        setTimeout(() => {
            let btnAcep = document.getElementById('modal-btn-aceptar');
            if (btnAcep) {
                btnAcep.innerText = '🖨️ Imprimir Factura';
                btnAcep.style.backgroundColor = '#e67e22';
                // Sobrescribir la acción predeterminada para que imprima en lugar de cerrar
                btnAcep.onclick = () => document.getElementById('iframe-impresion-visualizador').contentWindow.print();
            }
            
            let btnCanc = document.getElementById('modal-btn-cancelar');
            if (btnCanc) {
                if (vinParaVolver) {
                    btnCanc.style.display = 'block';
                    btnCanc.innerText = '🔙 Volver al Historial';
                    btnCanc.style.backgroundColor = '#34495e';
                    btnCanc.style.color = 'white';
                    btnCanc.onclick = () => {
                        cerrarModal();
                        setTimeout(() => verHistorialServicioVehiculo(vinParaVolver), 100);
                    };
                } else {
                    btnCanc.style.display = 'none';
                }
            }

            let btnGuardar = document.getElementById('modal-btn-terciario');
            if (btnGuardar && html.includes('contenteditable="true"')) {
                btnGuardar.style.display = 'block';
                btnGuardar.innerText = '💾 Guardar Cambios';
                btnGuardar.style.backgroundColor = '#2ecc71';
                btnGuardar.style.color = 'white';
                
                btnGuardar.onclick = async () => {
                    let iframeDoc = document.getElementById('iframe-impresion-visualizador').contentDocument;
                    if (!iframeDoc) return;
                    
                    let folioStr = (iframeDoc.body.innerHTML.match(/PROD-\d+|[0-9]{2}-[0-9]{3,4}/) || [])[0];
                    if (!folioStr) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo extraer el folio de la factura.'});

                    let updateData = {
                        dueno: (iframeDoc.getElementById('factura-dueno') ? iframeDoc.getElementById('factura-dueno').innerText : '').trim(),
                        telefono: (iframeDoc.getElementById('factura-telefono') ? iframeDoc.getElementById('factura-telefono').innerText : '').trim(),
                        marca: (iframeDoc.getElementById('factura-marca') ? iframeDoc.getElementById('factura-marca').innerText : '').trim(),
                        tipo: (iframeDoc.getElementById('factura-tipo') ? iframeDoc.getElementById('factura-tipo').innerText : '').trim(),
                        modelo: (iframeDoc.getElementById('factura-modelo') ? iframeDoc.getElementById('factura-modelo').innerText : '').trim(),
                        placas: (iframeDoc.getElementById('factura-placas') ? iframeDoc.getElementById('factura-placas').innerText : '').trim(),
                        motor: (iframeDoc.getElementById('factura-motor') ? iframeDoc.getElementById('factura-motor').innerText : '').trim(),
                        cilindros: (iframeDoc.getElementById('factura-cilindros') ? iframeDoc.getElementById('factura-cilindros').innerText : '').trim(),
                        color: (iframeDoc.getElementById('factura-color') ? iframeDoc.getElementById('factura-color').innerText : '').trim(),
                        km: (iframeDoc.getElementById('factura-km') ? iframeDoc.getElementById('factura-km').innerText : '').trim(),
                        bujias: (iframeDoc.getElementById('factura-bujias') ? iframeDoc.getElementById('factura-bujias').innerText : '').trim(),
                        fGasolina: (iframeDoc.getElementById('factura-fgasolina') ? iframeDoc.getElementById('factura-fgasolina').innerText : '').trim(),
                        fAire: (iframeDoc.getElementById('factura-faire') ? iframeDoc.getElementById('factura-faire').innerText : '').trim(),
                        fAceite: (iframeDoc.getElementById('factura-faceite') ? iframeDoc.getElementById('factura-faceite').innerText : '').trim()
                    };

                    let ordenIdx = (datosBD.ordenesServicio || []).findIndex(v => v.folio === folioStr);
                    if (ordenIdx === -1) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se encontró la orden en memoria para el folio: ' + folioStr});
                    
                    let orden = datosBD.ordenesServicio[ordenIdx];
                    let vin = orden.vin;
                    
                    if (updateData.dueno) orden.dueno = updateData.dueno;
                    if (updateData.km) orden.km = updateData.km;
                    
                    let metadata = orden.refacciones.find(p => p.tipo === 'METADATA');
                    if (!metadata) {
                        metadata = { tipo: 'METADATA', costoUnitario: 0, precio: 0, cantidad: 1 };
                        orden.refacciones.push(metadata);
                    }
                    metadata.bujias = updateData.bujias;
                    metadata.fGasolina = updateData.fGasolina;
                    metadata.fAire = updateData.fAire;
                    metadata.fAceite = updateData.fAceite;
                    
                    let vehiculoIdx = (datosBD.vehiculos || []).findIndex(v => v[1] === vin);
                    let vehiculoModificado = false;
                    let v = null;
                    if (vehiculoIdx >= 0) {
                        v = datosBD.vehiculos[vehiculoIdx];
                        if (v[2] !== updateData.marca || v[3] !== updateData.modelo || v[5] !== updateData.motor || v[6] !== updateData.placas || v[7] !== updateData.color || v[0] !== updateData.dueno) {
                            vehiculoModificado = true;
                        }
                    }

                    if (vehiculoModificado && await mostrarModal({ tipo: 'confirmar', titulo: 'Actualizar Vehículo', mensaje: `Se detectaron cambios en la información del vehículo. ¿Deseas actualizar también la FICHA MAESTRA del vehículo (VIN: <b>${vin}</b>) para que los próximos servicios salgan con esta nueva información?`})) {
                        datosBD.vehiculos[vehiculoIdx] = [updateData.dueno, vin, updateData.marca, updateData.modelo, v[4]||'', updateData.motor, updateData.placas, updateData.color || v[7], new Date().toISOString().split("T")[0]];
                        try {
                            await ejecutarEnGoogle("guardarVehiculo", {
                                dueno: updateData.dueno, vin: vin, marca: updateData.marca, modelo: updateData.modelo, ano: v[4]||'', motor: updateData.motor, placas: updateData.placas, obs: updateData.color || v[7], fecha: new Date().toISOString().split("T")[0]
                            });
                        } catch(e) { console.log(e); }
                    }

                    localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
                    document.getElementById('pantalla-carga').style.display='flex';
                    try {
                        let r = await ejecutarEnGoogle("guardarOrdenServicio_Bulk", { 
                            folio: orden.folio, vin: orden.vin, dueno: orden.dueno, 
                            vehiculo: vehiculoIdx >= 0 ? `${datosBD.vehiculos[vehiculoIdx][2]} ${datosBD.vehiculos[vehiculoIdx][3]}` : '', 
                            fecha: orden.fecha, garantia: orden.garantia || '', km: orden.km, 
                            sintoma: orden.sintoma || '', total: orden.total, refacciones: orden.refacciones 
                        });
                        if(r.exito) {
                            if (r.datos && r.datos.inventario) datosBD = r.datos;
                            actualizarTodasLasTablas();
                            cerrarModal();
                            setTimeout(() => {
                                mostrarModal({ tipo:'success', titulo:'Factura Guardada', mensaje:'Los cambios en la factura se guardaron correctamente en la nube.' });
                                if (vinParaVolver) setTimeout(() => verHistorialServicioVehiculo(vinParaVolver), 1500);
                            }, 500);
                        } else {
                            mostrarModal({ tipo: 'error', titulo: 'Error al Guardar', mensaje: r.error });
                        }
                    } catch(e) {
                        console.error(e);
                        mostrarModal({ tipo: 'error', titulo: 'Error de Red', mensaje: 'No se pudo contactar al servidor. Error local: ' + e.message });
                    }
                    document.getElementById('pantalla-carga').style.display='none';
                };
            } else if (btnGuardar) {
                btnGuardar.style.display = 'none';
            }
        }, 50);
    }
}

// ==============================================
// REPORTE DE PRODUCCIÓN (DESCARGA DIRECTA HTML A ARCHIVO)
// ==============================================
function imprimirReporteProduccion(productoFinal, specify, cantidad, materiales, costoTotal) {
    let html = generarHTMLOrdenTrabajo({
        folio: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        dueno: "ALMACÉN / INTERNO",
        marca: "PRODUCCIÓN",
        modelo: productoFinal,
        tipo: specify,
        km: cantidad + " pzs",
        fecha: new Date().toLocaleDateString('es-MX'),
        partidas: materiales,
        total: costoTotal,
        comentarios: `Reporte de ensamblaje. Cantidad: ${cantidad} pieza(s).`
    });

    visualizarOImprimirHTML(html, 'Reporte de Producción: ' + productoFinal, true);
}
let carrito = []; let subtotalGlobal = 0; let ivaGlobal = 0;
function agregarPartida() { let c = parseFloat(document.getElementById('p-cant').value); let cod = document.getElementById('p-producto').value; if (c > 0 && cod) { let p = parseFloat(document.getElementById('p-precio').value) || 0; let d1 = parseFloat(document.getElementById('p-desc1').value) || 0; let d2 = parseFloat(document.getElementById('p-desc2').value) || 0; let d3 = parseFloat(document.getElementById('p-desc3').value) || 0; let imp = parseFloat(document.getElementById('p-impuesto').value) || 16; let com = parseFloat(document.getElementById('p-comision').value) || 0; let sub = c * (p * (1 - (d1 / 100)) * (1 - (d2 / 100)) * (1 - (d3 / 100))); let iva = sub * (imp / 100); carrito.push({ cantidad: c, linea: document.getElementById('p-linea').value, codigoReal: cod, producto: document.getElementById('p-buscar-input').value, desc1: d1, desc2: d2, desc3: d3, impuesto: imp, comision: com, precioUnitario: p, subtotal: sub, iva: iva, total: sub + iva }); actTablaVenta(); limpiarPartida(); } }
function limpiarPartida() { document.getElementById('p-cant').value = 1; document.getElementById('p-linea').value = ''; document.getElementById('p-buscar-input').value = ''; document.getElementById('p-producto').value = ''; document.getElementById('p-precio').value = ''; document.getElementById('p-desc1').value = 0; document.getElementById('p-desc2').value = 0; document.getElementById('p-desc3').value = 0; document.getElementById('p-impuesto').value = 16; document.getElementById('p-comision').value = 0; }
function actTablaVenta() { let tb = document.getElementById('tabla-cuerpo-venta'); tb.innerHTML = ''; subtotalGlobal = 0; ivaGlobal = 0; carrito.forEach((i, idx) => { subtotalGlobal += i.subtotal; ivaGlobal += i.iva; tb.innerHTML += `<tr><td>${i.cantidad}</td><td>${i.linea}</td><td>${i.producto}</td><td>${i.desc1}</td><td>${i.desc2}</td><td>${i.desc3}</td><td>${i.impuesto}</td><td>${i.comision}</td><td>$${i.precioUnitario}</td><td>$${i.total.toFixed(2)}</td><td><button onclick="carrito.splice(${idx},1); actTablaVenta();">X</button></td></tr>`; }); document.getElementById('lbl-subtotal').innerText = subtotalGlobal.toFixed(2); document.getElementById('lbl-iva').innerText = ivaGlobal.toFixed(2); document.getElementById('lbl-total').innerText = (subtotalGlobal + ivaGlobal).toFixed(2); }
async function procesarVenta() {
    let cli = document.getElementById('v-cliente').value;
    if (!cli || carrito.length === 0) {
        return mostrarModal({ tipo: 'warning', titulo: 'Datos Incompletos', mensaje: 'Seleccione un cliente y agregue al menos una partida a la venta.' });
    }

    document.getElementById('pantalla-carga').style.display = 'flex';

    // 1. AUTO-BORRADO: Detectamos qué medidas (specify) se van a quedar en cero
    let medidasParaBorrar = [];
    carrito.forEach(item => {
        // Si el producto que estamos vendiendo tiene la etiqueta oculta de medida (-ESP)
        if (String(item.codigoReal).includes('-ESP')) {
            let productoEnBD = datosBD.inventario.find(x => String(x[1]) === String(item.codigoReal));
            if (productoEnBD) {
                let stockDisponible = parseFloat(productoEnBD[6]) || 0;
                // Si lo que estoy vendiendo vacía el stock, lo anotamos para la lista negra
                if (stockDisponible - item.cantidad <= 0) {
                    medidasParaBorrar.push(item.codigoReal);
                }
            }
        }
    });

    // 2. Procesamos la venta normal en la nube
    let r = await ejecutarEnGoogle("procesarNotaVenta", {
        cliente: cli, pedido: document.getElementById('v-pedido').value,
        vendedor: document.getElementById('v-vendedor').value, moneda: document.getElementById('v-moneda').value,
        tipoCambio: document.getElementById('v-tc').value, detalles: carrito,
        subtotal: subtotalGlobal, iva: ivaGlobal, total: subtotalGlobal + ivaGlobal
    });

    if (r.exito) {
        // 3. LA MAGIA: Borramos de la base de datos las medidas que se agotaron
        for (let cod of medidasParaBorrar) {
            await ejecutarEnGoogle("borrarProductoBD", cod);
        }

        // Limpiamos pantalla
        carrito = []; actTablaVenta();
        document.getElementById('v-cliente').value = ''; document.getElementById('v-pedido').value = '';

        // Refrescamos base de datos
        let r2 = await ejecutarEnGoogle("obtenerDatosCompletos", {});
        if (r2.exito) {
            datosBD = r2.datos;
            localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
            actualizarTodasLasTablas();
        }

        document.getElementById('pantalla-carga').style.display = 'none';

        // Avisamos al usuario
        let extraMsg = medidasParaBorrar.length > 0 ? '\\n✅ Las medidas únicas agotadas fueron borradas de la base de datos.' : '';
        mostrarModal({ tipo: 'success', titulo: 'Venta Exitosa', mensaje: 'Nota procesada y descontada.' + extraMsg });
    } else {
        document.getElementById('pantalla-carga').style.display = 'none';
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: r.error });
    }
}

// ==============================================
// POP-UP DE DESGLOSE — solo cambia el btnTextos
// ==============================================
function verMedidasDesglose(codBase) {
    let isAdmin = document.body.classList.contains('is-admin');
    let misVariantes = datosBD.inventario.filter(v => String(v[1]).startsWith(codBase + '-ESP'));

    let detalleHTML = misVariantes.map(v => {
        let codigoVar = String(v[1]);
        let partes = codigoVar.split('-ESP');
        let medida = partes[1] ? partes[1].trim() : "";
        if (!medida) return '';

        let stock = parseFloat(v[6]) || 0;
        let costoLegible = v[4];
        if (isNaN(costoLegible)) {
            try { costoLegible = atob(v[4]); } catch (e) { costoLegible = v[4]; }
        }
        let costoFinal = parseFloat(costoLegible) || 0;
        let precioFinal = parseFloat(v[5]) || 0;
        let textoCosto = isAdmin ? `$${costoFinal.toFixed(2)}` : 'Oculto';
        let descSegura = v[2] ? v[2].replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ") : "";

        let btnStock = `<button class="btn-tabla btn-ajustar"  style="padding:4px 8px;font-size:11px;" onclick="cerrarModal();setTimeout(()=>abrirAjusteStock('${v[1]}','${descSegura}'),400)">Stock</button>`;
        let btnPrecio = `<button class="btn-tabla btn-editar"   style="padding:4px 8px;font-size:11px;" onclick="cerrarModal();setTimeout(()=>abrirEdicionPrecios('${v[1]}','${descSegura}','${v[4]}','${v[5]}'),400)">Precios</button>`;
        // ✅ CORREGIDO: mismo patrón cerrarModal+setTimeout, llama función separada sin prompt()
        let btnTextos = `<button class="btn-tabla" style="background:#8e44ad;color:white;border:none;border-radius:3px;cursor:pointer;padding:4px 8px;font-size:11px;" onclick="cerrarModal();setTimeout(()=>editarTextoVarianteModal('${v[1]}'),400)">Textos</button>`;
        let btnBorrar = `<button class="btn-tabla btn-eliminar" style="padding:4px 8px;font-size:11px;" onclick="cerrarModal();setTimeout(()=>borrarProducto('${v[1]}'),400)">X</button>`;

        return `
        <div style="background:#fff;border:1px solid #dcdde1;border-radius:4px;padding:8px 10px;margin-bottom:6px;text-align:left;box-shadow:0 1px 2px rgba(0,0,0,.05);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="color:#2c3e50;font-size:13px;">► Especificación: ${medida}</strong>
                <span style="color:#27ae60;font-weight:bold;font-size:12px;">Stock: ${stock}</span>
            </div>
            <div style="color:#7f8c8d;font-size:11px;margin-bottom:4px;">Desc: ${v[2]}</div>
            <div style="color:#7f8c8d;font-size:11px;margin-bottom:6px;">Costo: ${textoCosto} &nbsp;|&nbsp; Venta: $${precioFinal.toFixed(2)}</div>
            <div style="display:flex;gap:5px;">${btnStock} ${btnPrecio} ${btnTextos} ${btnBorrar}</div>
        </div>`;
    }).filter(Boolean).join('');

    let cajaConScroll = `<div style="max-height:55vh;overflow-y:auto;padding-right:5px;">${detalleHTML || '<p style="text-align:center;color:gray;">No hay variantes registradas.</p>'}</div>`;

    mostrarModal({
        tipo: 'info',
        titulo: '📦 DESGLOSE DE MEDIDAS',
        mensaje: 'Modelo Base: ' + codBase,
        detalle: cajaConScroll,
        btnTexto: 'Cerrar Desglose'
    });
}

// ==============================================
// 12. IMPRESIÓN DE FACTURA / ORDEN DE TRABAJO (CLON)
// ==============================================
function imprimirFacturaOrden(folio, imprimir = true) {
    try {
        let orden = (datosBD.ordenesServicio || []).find(o => o.folio === folio);
    if (!orden) {
        return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se encontró la orden de trabajo.' });
    }

    // Utiliza la función existente que mapea los datos de la orden a la plantilla de impresión
    if (typeof imprimirOrdenServicio === 'function') {
        imprimirOrdenServicio(orden, imprimir);
    } else {
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'La función de impresión de órdenes no está disponible.' });
    }
    } catch(err) {
        mostrarModal({ tipo: 'error', titulo: 'Error Interno', mensaje: 'Error al abrir factura: ' + err.message + '<br>' + err.stack });
    }
}

// ==============================================
// 13. EDITAR TEXTOS DE VARIANTE
// ==============================================
function editarTextoVarianteModal(codigo) {
    let prod = datosBD.inventario.find(x => String(x[1]) === String(codigo));
    if (!prod) {
        return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se encontró el producto en la base de datos.' });
    }

    // Escapamos para evitar XSS en el textarea
    let descActual = (prod[2] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let contenidoHTML = `
        <div style="text-align: left;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #7f8c8d;">
                Código: <strong>${prod[1]}</strong>
            </p>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; font-size: 13px;">
                Descripción / Especificación:
            </label>
            <textarea 
                id="input-nueva-desc" 
                rows="4" 
                style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; resize: vertical; box-sizing: border-box;"
            >${descActual}</textarea>
            <button 
                onclick="guardarTextoVariante('${codigo}')" 
                style="margin-top: 10px; width: 100%; padding: 10px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
                💾 Guardar Cambios
            </button>
        </div>`;

    mostrarModal({
        tipo: 'info',
        titulo: '✏️ Editar Texto de Variante',
        mensaje: '',
        detalle: contenidoHTML,
        btnTexto: 'Cancelar'
    });
}

// Función separada para guardar (lee el textarea antes de cerrar el modal)
async function guardarTextoVariante(codigo) {
    let prod = datosBD.inventario.find(x => String(x[1]) === String(codigo));
    if (!prod) return;

    let nuevaDesc = document.getElementById('input-nueva-desc').value;
    cerrarModal();

    document.getElementById('pantalla-carga').style.display = 'flex';

    // Prevenir duplicación eliminando el anterior primero si existe
    await ejecutarEnGoogle("borrarProductoBD", prod[1]);

    let costoLegible = prod[4];
    if (isNaN(costoLegible)) { try { costoLegible = atob(prod[4]); } catch (e) { costoLegible = prod[4]; } }

    let res = await ejecutarEnGoogle("guardarProducto", {
        linea: prod[0],
        codigo: prod[1],
        descripcion: nuevaDesc,
        categoria: prod[3],
        costo: costoLegible,
        precio: prod[5],
        stock: prod[6]
    });

    if (res.exito) {
        let r2 = await ejecutarEnGoogle("obtenerDatosCompletos", {});
        if (r2.exito) {
            datosBD = r2.datos;
            localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
            actualizarTodasLasTablas();
        }
        document.getElementById('pantalla-carga').style.display = 'none';
        mostrarModal({ tipo: 'success', titulo: 'Texto Actualizado', mensaje: 'La descripción de la variante se actualizó correctamente.' });
    } else {
        document.getElementById('pantalla-carga').style.display = 'none';
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: res.error || 'No se pudo actualizar el texto.' });
    }
}

// ==============================================
// ORDENACIÓN DE TABLAS
// ==============================================
let ordenActualInventario = { columna: -1, ascendente: true };
function ordenarTablaInventario(arg1, arg2, arg3) {
    let colIndex, tipo;
    if (typeof arg1 === 'object') {
        colIndex = arg2;
        tipo = arg3;
    } else {
        colIndex = arg1;
        tipo = arg2;
    }

    if (ordenActualInventario.columna === colIndex) {
        ordenActualInventario.ascendente = !ordenActualInventario.ascendente;
    } else {
        ordenActualInventario.columna = colIndex;
        ordenActualInventario.ascendente = true;
    }

    // Solo ordenar si existen datos cargados
    if (datosBD && datosBD.inventario) {
        datosBD.inventario.sort((a, b) => {
            let valA = a[colIndex];
            let valB = b[colIndex];

            if (tipo === 'numero') {
                let cleanA = String(valA).replace(/[^0-9.-]+/g, "");
                let cleanB = String(valB).replace(/[^0-9.-]+/g, "");
                let numA = parseFloat(cleanA) || 0;
                let numB = parseFloat(cleanB) || 0;
                return ordenActualInventario.ascendente ? numA - numB : numB - numA;
            } else {
                valA = String(valA || "").toLowerCase();
                valB = String(valB || "").toLowerCase();
                if (valA < valB) return ordenActualInventario.ascendente ? -1 : 1;
                if (valA > valB) return ordenActualInventario.ascendente ? 1 : -1;
                return 0;
            }
        });

        filtrarInventario();
    }
}

// ==============================================
// LÓGICA RESTAURADA: MODALES Y RESTRICCIONES
// ==============================================

// Bloqueo de herramientas de desarrollador
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        mostrarModal({
            tipo: 'error',
            titulo: 'Acceso Denegado',
            mensaje: 'No tienes permiso para ver la estructura interna.'
        });
    }
    if (e.key === 'F12') {
        e.preventDefault();
        mostrarModal({
            tipo: 'error',
            titulo: 'Acceso Denegado',
            mensaje: 'No tienes permiso para ver la estructura interna.'
        });
    }
});

document.addEventListener('contextmenu', event => {
    event.preventDefault();
    mostrarModal({
        tipo: 'warning',
        titulo: 'Acceso Denegado',
        mensaje: 'El menú contextual está deshabilitado.'
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const version = params.get('v');
    if (version) {
        const vBadge = document.getElementById('version-app');
        if (vBadge) {
            vBadge.innerText = 'Versión ' + version;
        }
    }
});
// 10. REPORTES


// ============================================================================
// ============================================================================
// MÓDULO EXCLUSIVO AUTOTEC INVENTORY: CONTROL DE VEHÍCULOS, ÓRDENES DE SERVICIO Y GARANTÍAS
// ============================================================================

function inicializarDatosDemoAutotec() {
    if (!datosBD.vehiculos) datosBD.vehiculos = [];
    if (!datosBD.ordenesServicio) datosBD.ordenesServicio = [];

    // Configurar fechas por defecto al día de hoy en formularios
    let hoy = new Date().toISOString().split('T')[0];
    let inputFechAuto = document.getElementById('v-auto-fecha');
    if (inputFechAuto && !inputFechAuto.value) inputFechAuto.value = hoy;
    let inputFechServ = document.getElementById('input-fecha-produccion');
    if (inputFechServ && !inputFechServ.value) inputFechServ.value = hoy;

    // Datos de prueba basados en el reporte del escáner LAUNCH X-431 proporcionado por el usuario
    if (datosBD.clientes.length === 0 && !datosBD.clientes.some(c => c[0].includes('Chamin'))) {
        datosBD.clientes.push(["Chamin (Cliente de Prueba)", "XAXX010101000", "622-123-4567", "Guaymas, Sonora"]);
    }
    if (datosBD.vehiculos.length === 0) {
        datosBD.vehiculos.push([
            "Chamin (Cliente de Prueba)", // 0: Dueño
            "2CNBE13C826938470",          // 1: VIN / Serie
            "CHEVROLET",                  // 2: Marca
            "Tracker",                    // 3: Modelo
            "2002",                       // 4: Año
            "L34 2.0L 4 DOHC",            // 5: Motor (Engine Size)
            "SON-2026 / 185,000 km",      // 6: Placas / Km
            "Diagnóstico LAUNCH X-431 (Técnico: Ramón Pablos). DTC: P0122 Voltaje bajo circuito sensor TP; P0128 Temperatura refrigerante más baja que regulación del termostato.", // 7: Observaciones / Diagnóstico
            hoy                           // 8: Fecha Registro / Garantía
        ]);
    }

    // Si no hay órdenes de servicio de muestra, agregamos una para que se vea el historial cuantificable del auto de Chamin
    if (datosBD.ordenesServicio.length === 0 && datosBD.vehiculos.some(v => v[1] === "2CNBE13C826938470")) {
        datosBD.ordenesServicio.push({
            folio: "ORD-1001",
            vin: "2CNBE13C826938470",
            dueno: "Chamin (Cliente de Prueba)",
            vehiculo: "CHEVROLET Tracker (2002)",
            fecha: "2026-08-01",
            garantia: "60 Días",
            km: "185,000 km",
            sintoma: "Mantenimiento preventivo, afinación y reemplazo de sensores reportados por escáner LAUNCH.",
            total: 2850.00,
            refacciones: [
                { cantidad: 1, codigoReal: "REF-001", descripcion: "SENSOR TP (POSICIÓN ACELERADOR)", categoria: "Refacción Eléctrica", costoUnitario: 850.00, subtotalCosto: 850.00 },
                { cantidad: 1, codigoReal: "REF-002", descripcion: "TERMOSTATO DE REFRIGERACIÓN", categoria: "Refacción Mecánica", costoUnitario: 600.00, subtotalCosto: 600.00 },
                { cantidad: 1, codigoReal: "SERV-01", descripcion: "MANO DE OBRA Y DIAGNÓSTICO LAUNCH X-431", categoria: "Servicio", costoUnitario: 1400.00, subtotalCosto: 1400.00 }
            ]
        });
    }
}

function isGenericVIN(vin) {
    if (!vin) return true;
    let v = vin.trim().toUpperCase();
    return ["REFECCION", "REFACCION", "S/N", "N/A", "NA", "0", "0000", "SIN NUMERO", "NINGUNO", "NO", "S/N "].includes(v) || v.length <= 4;
}

function renderTablaVehiculos(vehiculosAMostrar = datosBD.vehiculos) {
    let tbody = document.getElementById('tabla-cuerpo-vehiculos');
    if (!tbody) return;
    if (!vehiculosAMostrar || vehiculosAMostrar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" align="center" style="padding: 20px; color: #7f8c8d;">No hay vehículos registrados o no coinciden con la búsqueda.</td></tr>';
        return;
    }
    
    // LIMITAR A 200 REGISTROS PARA MEJORAR RENDIMIENTO
    let limitados = vehiculosAMostrar.slice(0, 200);
    
    let h = "";
    limitados.forEach((v, idx) => {
        let dueno = v[0] || "-";
        let vin = v[1] || "-";
        let marcaModelo = `${v[2] || ""} ${v[3] || ""}`.trim() || "-";
        let ano = v[4] || "-";
        let motor = v[5] || "-";
        let placas = v[6] || "-";
        // Extraer números de órdenes como historial de clones (Facturas)
        let isGen = isGenericVIN(vin);
        let ordenesDeEsteVehiculo = (datosBD.ordenesServicio || []).filter(o => {
            if (o.vin !== vin) return false;
            return isGen ? (o.dueno === dueno) : true;
        });
        let totalOrdenes = ordenesDeEsteVehiculo.length;
        
        let fechaMod = v[8] || "Sin registrar";
        if (totalOrdenes > 0) {
            fechaMod = ordenesDeEsteVehiculo[totalOrdenes - 1].fecha || fechaMod;
        }
        let strOrdenes = totalOrdenes > 0 ? `<span style="background: #eaf2f8; color: #2980b9; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #d4e6f1;">${totalOrdenes} Visita(s)</span>` : `<span style="color: gray;">Ninguna</span>`;
        let badgeHistorial = totalOrdenes > 0 ? ` <span style="background:#e74c3c; color:white; padding: 2px 6px; border-radius: 10px; font-size:11px; margin-left:3px;">${totalOrdenes}</span>` : "";

        h += `<tr>
            <td style="font-weight: bold; color: #2c3e50;">${dueno}</td>
            <td style="font-family: monospace; color: #d35400; font-weight: bold; background: #fdf2e9; padding: 4px 8px; border-radius: 4px;">${vin}</td>
            <td style="font-weight: 600;">${marcaModelo}</td>
            <td style="text-align: center;">${ano}</td>
            <td style="font-size: 0.9em; color: #34495e;">${motor}</td>
            <td style="text-align: center; font-size: 0.9em;">${placas}</td>
            <td style="font-weight: bold; color: #27ae60;"><span style="background: #e8f8f5; padding: 5px 10px; border-radius: 4px; border: 1px solid #a3e4d7; white-space: nowrap;">📅 ${fechaMod}</span></td>
            <td style="text-align: center; font-size: 0.9em;">${strOrdenes}</td>
            <td style="white-space: nowrap; text-align: center;">
                <button class="btn-tabla" style="background-color: #3498db; padding: 6px 12px; margin-right: 4px;" onclick="verDesgloseVehiculo('${vin}', '${dueno.replace(/'/g, "\\'")}')">📋 Ficha</button>
                <button class="btn-tabla" style="background-color: #8e44ad; padding: 6px 12px; margin-right: 4px;" onclick="verHistorialServicioVehiculo('${vin}', '${dueno.replace(/'/g, "\\'")}')">📜 Órdenes de Servicio${badgeHistorial}</button>
                <button class="btn-tabla btn-eliminar" style="background-color: #e67e22;" onclick="borrarVehiculo('${vin}')">X</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = h;

    // Actualizar también el selector de vehículos en el módulo de Órdenes de Servicio
    let selectServ = document.getElementById('serv-vehiculo-select');
    if (selectServ) {
        let valAct = selectServ.value;
        let optHtml = '<option value="">Seleccione o busque en el parque vehicular...</option>';
        datosBD.vehiculos.forEach(v => {
            optHtml += `<option value="${v[1]}">🚗 ${v[2]} ${v[3]} (Año ${v[4]}) | VIN: ${v[1]} - Dueño: ${v[0]}</option>`;
        });
        selectServ.innerHTML = optHtml;
        if (valAct && datosBD.vehiculos.some(v => v[1] === valAct)) {
            selectServ.value = valAct;
        }
    }
}

function verDesgloseVehiculo(vin, duenoReq) {
    let vehiculos = (datosBD.vehiculos || []);
    let vehiculo;
    if (duenoReq) vehiculo = vehiculos.find(v => v[1] === vin && v[0] === duenoReq);
    if (!vehiculo) vehiculo = vehiculos.find(v => v[1] === vin);
    
    if (!vehiculo) return;

    let htmlDetalle = `
        <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px;">
            <p style="margin: 6px 0; font-size: 1.05em;"><b>👤 Propietario:</b> <span style="color: #2980b9; font-weight: bold;">${vehiculo[0]}</span></p>
            <p style="margin: 6px 0; font-size: 1.05em;"><b>🔢 VIN / N° Serie:</b> <span style="font-family: monospace; background: #eee; padding: 2px 8px; border-radius: 4px; color: #d35400; font-weight: bold;">${vehiculo[1]}</span></p>
            <p style="margin: 6px 0;"><b>🚗 Vehículo:</b> ${vehiculo[2]} ${vehiculo[3]} &nbsp;|&nbsp; <b>Año:</b> ${vehiculo[4]}</p>
            <p style="margin: 6px 0;"><b>⚙️ Motor (Engine Size):</b> <span style="color: #27ae60; font-weight: 600;">${vehiculo[5]}</span></p>
            <p style="margin: 6px 0;"><b>🏷️ Placas / Km:</b> ${vehiculo[6] || 'No especificado'} &nbsp;|&nbsp; <b>📅 Fecha Reg./Garantía:</b> <span style="color:#27ae60; font-weight:bold;">${vehiculo[8] || 'Sin fecha'}</span></p>
            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 12px 0;">
            <p style="margin: 5px 0; color: #c0392b; font-weight: bold;">🛠️ Expediente Técnico y Diagnóstico (Escáner):</p>
            <div style="background: #fff; padding: 12px; border-left: 4px solid #e74c3c; border-radius: 4px; font-size: 0.95em; max-height: 160px; overflow-y: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${vehiculo[7] ? vehiculo[7].replace(/\n/g, '<br>') : 'Sin observaciones registradas en el diagnóstico.'}
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn-principal" style="background-color: #8e44ad; width: 100%; padding: 10px; font-size: 14px;" onclick="document.querySelector('.modal-overlay').style.display='none'; verHistorialServicioVehiculo('${vin}', '${vehiculo[0].replace(/'/g, "\\'")}')">📜 Ver Historial de Servicios y Refacciones del Automóvil</button>
            </div>
        </div>
    `;

    // Respetar regla global de no remover promesas y preservar innerHTML
    mostrarModal({
        tipo: 'info',
        titulo: 'EXPEDIENTE TÉCNICO AUTOTEC',
        mensaje: `Desglose de unidad <b>${vehiculo[2]} ${vehiculo[3]}</b>`,
        detalle: htmlDetalle,
        amplio: true
    });
}

function verHistorialServicioVehiculo(vin, duenoReq) {
    let vehiculos = datosBD.vehiculos || [];
    let vehiculo;
    if (duenoReq) {
        vehiculo = vehiculos.find(x => x[1] === vin && x[0] === duenoReq);
    }
    if (!vehiculo) {
        vehiculo = vehiculos.find(x => x[1] === vin);
    }
    
    if (!vehiculo) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'Vehículo no encontrado.' });
    
    let isGen = isGenericVIN(vin);
    let duenoActual = vehiculo[0];
    
    let ordenes = (datosBD.ordenesServicio || []).filter(o => {
        if (o.vin !== vin) return false;
        return isGen ? (o.dueno === duenoActual) : true;
    });

    let htmlDetalle = `
        <div style="background-color: #fcfcfc; padding: 15px; border-radius: 8px; border: 1px solid #dcdde1; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><span style="font-size: 1.2em;">👤</span> Propietario: <b style="color: #2980b9;">${vehiculo[0]}</b></p>
            <p style="margin: 5px 0;"><span style="font-size: 1.2em;">🚗</span> Vehículo: <b>${vehiculo[2]} ${vehiculo[3]} (${vehiculo[4]})</b> | <b>VIN:</b> <span style="color: #d35400;">${vehiculo[1]}</span></p>
            <p style="margin: 5px 0;"><span style="font-size: 1.2em;">📅</span> Último Servicio: <b style="color: #27ae60;">${vehiculo[8] || "N/A"}</b></p>
        </div>
        <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
    `;

    if (ordenes.length === 0) {
        htmlDetalle += `<p style="text-align:center; padding: 30px; color: #7f8c8d; font-style: italic;">No hay historial de órdenes de servicio registradas para este automóvil en el sistema.</p>`;
    } else {
        // Ordenar por folio descendente (año-numero)
        ordenes.sort((a, b) => {
            let partsA = (a.folio || "").split("-");
            let partsB = (b.folio || "").split("-");
            
            let yearA = parseInt(partsA[0]) || 0;
            let numA = parseInt(partsA[1]) || 0;
            
            let yearB = parseInt(partsB[0]) || 0;
            let numB = parseInt(partsB[1]) || 0;
            
            if (yearA !== yearB) {
                return yearB - yearA;
            }
            return numB - numA;
        });

        ordenes.forEach(ord => {
            htmlDetalle += `
                <details style="background-color: white; border: 1px solid #bdc3c7; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <summary style="background-color: #2c3e50; color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-weight: bold; font-size: 1.1em;">🛠️ Órden: ${ord.folio}</span>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 0.9em; background: #27ae60; padding: 4px 10px; border-radius: 14px; font-weight: bold;">📅 ${ord.fecha}</span>
                            <button onclick="event.stopPropagation(); cargarOrdenParaEdicion('${ord.folio}')" class="btn-tabla" style="background-color: #f39c12; margin: 0; padding: 4px 10px;">✏️ Editar</button>
                            <button onclick="event.stopPropagation(); eliminarOrdenServicio('${ord.folio}', '${ord.vin}')" class="btn-tabla btn-eliminar" style="margin: 0; padding: 4px 10px;">🗑️ Borrar</button>
                            <button onclick="event.stopPropagation(); imprimirFacturaOrden('${ord.folio}', false)" class="btn-tabla" style="background-color: #3498db; margin: 0; padding: 4px 10px;">👁️ Ver</button>
                            <button onclick="event.stopPropagation(); imprimirFacturaOrden('${ord.folio}', true)" class="btn-tabla" style="background-color: #e67e22; margin: 0; padding: 4px 10px;">🖨️ Imprimir</button>
                        </div>
                    </summary>
                    <div style="padding: 12px 15px; background-color: #fdfefe; border-top: 1px solid #bdc3c7;">
                        <p style="margin: 0 0 8px 0; color: #34495e; font-size: 0.95em;">
                            Kilometraje registrado: <span style="color: #2980b9; font-weight: bold;">${ord.km || 'N/A'}</span>
                        </p>
                        <p style="margin: 0; color: #34495e; font-size: 0.95em;">
                            Trabajo Realizado / Síntoma: <b style="color: #c0392b;">${ord.sintoma || 'Sin especificar'}</b>
                        </p>
                    </div>
                </details>
            `;
        });
    }

    htmlDetalle += `</div>`;

    // Preservando regla global de promesas e innerHTML
    mostrarModal({
        tipo: 'info',
        titulo: 'HISTORIAL DE SERVICIOS Y REFACCIONES (AUTOTEC)',
        mensaje: `Expediente del automóvil <b>${vehiculo[2]} ${vehiculo[3]}</b>`,
        detalle: htmlDetalle,
        amplio: true
    });
}

function cargarOrdenParaEdicion(folio) {
    let orden = (datosBD.ordenesServicio || []).find(o => o.folio === folio);
    if (!orden) return;
    
    // Cerrar cualquier modal abierto
    let m = document.getElementById('modal-overlay');
    if (m) m.remove();

    // Cambiar pestaña a Órdenes de Servicio
    cambiarVista('seccion-produccion', document.getElementById('nav-produccion'));

    // Llenar formulario
    document.getElementById('serv-vehiculo-input').value = `${orden.dueno} - ${orden.vehiculo}`;
    document.getElementById('serv-vehiculo-hidden').value = orden.vin;
    document.getElementById('serv-folio').value = orden.folio;
    document.getElementById('input-fecha-produccion').value = orden.fecha;
    document.getElementById('serv-km').value = orden.km === "No registrado" ? "" : orden.km;
    document.getElementById('serv-sintoma').value = orden.sintoma === "Servicio técnico general y refacciones" ? "" : orden.sintoma;
    
    // Seleccionar vehículo internamente para rellenar campos readonly
    seleccionarVehiculoServicio(orden.vin, orden.dueno);
    
    // Ya no cargamos las refacciones viejas al carrito, porque ahora 
    // registrarOrdenServicioLocal detectará el folio y agregará (append)
    // las nuevas refacciones ingresadas a las existentes de forma automática.
    carritoProduccion = [];
    
    actTablaProd();
    
    // Cambiar el texto del botón de procesar para indicar que es una edición
    let btnSubmit = document.getElementById('btn-procesar-prod');
    if (btnSubmit) {
        btnSubmit.innerHTML = '🛠️ Actualizar Orden (Agregar Partidas)';
    }

    mostrarModal({ tipo: 'info', titulo: 'Modo Actualización', mensaje: `Se detectó la orden ${folio}. Los productos que agregues ahora se sumarán a la orden existente.` });
}

async function eliminarOrdenServicio(folio, vin) {
    if (await mostrarModal({ tipo: 'confirmar', titulo: 'Borrar Orden', mensaje: `¿Estás completamente seguro de que deseas eliminar la orden de servicio <b>${folio}</b>? Las refacciones de esta orden regresarán al inventario general.` })) {
        let pantallaCarga = document.getElementById('pantalla-carga');
        if (pantallaCarga) pantallaCarga.style.display = 'flex';
        
        let respuesta = await ejecutarEnGoogle("eliminarOrdenServicio", folio);
        
        if (respuesta.exito) {
            // Eliminar de memoria local
            if (datosBD.ordenesServicio) {
                datosBD.ordenesServicio = datosBD.ordenesServicio.filter(o => o.folio !== folio);
            }
            
            // Refrescar inventario local si es posible
            if (respuesta.datos && respuesta.datos.inventario) {
                datosBD = respuesta.datos;
            }
            localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
            actualizarTodasLasTablas();
            
            if (pantallaCarga) pantallaCarga.style.display = 'none';
            mostrarModal({ tipo: 'success', titulo: 'Eliminada', mensaje: `La orden ${folio} fue eliminada correctamente.` }).then(() => {
                // Refrescar historial del vehículo
                verHistorialServicioVehiculo(vin);
            });
        } else {
            if (pantallaCarga) pantallaCarga.style.display = 'none';
            mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo eliminar: ' + respuesta.error });
        }
    }
}

function verCarrosCliente(nombreCliente) {
    let carros = (datosBD.vehiculos || []).filter(v => v[0] === nombreCliente);

    if (carros.length === 0) {
        return mostrarModal({
            tipo: 'info',
            titulo: 'Expediente del Cliente',
            mensaje: `El cliente <b>${nombreCliente}</b> aún no tiene vehículos registrados en el taller.`,
            detalle: '<p style="color: #7f8c8d; margin-top: 10px;">Dirígete a la sección de <b>🚘 Vehículos</b> en el menú superior para registrar y vincular automóviles a su nombre.</p>'
        });
    }

    let htmlDetalle = `<div style="width: 100%; text-align: left; margin-top: 10px;">`;
    carros.forEach((v, idx) => {
        let isGen = isGenericVIN(v[1]);
        let totalOrd = (datosBD.ordenesServicio || []).filter(o => {
            if (o.vin !== v[1]) return false;
            return isGen ? (o.dueno === v[0]) : true;
        }).length;
        htmlDetalle += `
            <div style="background: #f8f9fa; padding: 14px; border-radius: 6px; border-left: 4px solid #3498db; margin-bottom: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <span style="font-weight: bold; color: #2c3e50; font-size: 1.15em;">🚗 ${v[2]} ${v[3]} (Año ${v[4]})</span>
                    <div>
                        <button class="btn-tabla" style="background-color: #8e44ad; padding: 6px 12px; font-size: 0.9em; font-weight: bold; cursor: pointer; margin-right: 5px;" onclick="verHistorialServicioVehiculo('${v[1]}', '${v[0].replace(/'/g, "\\'")}')">📜 Órdenes (${totalOrd})</button>
                        <button class="btn-tabla" style="background-color: #27ae60; padding: 6px 12px; font-size: 0.9em; font-weight: bold; cursor: pointer;" onclick="verDesgloseVehiculo('${v[1]}', '${v[0].replace(/'/g, "\\'")}')">📋 Ficha</button>
                    </div>
                </div>
                <p style="margin: 6px 0; font-size: 1em;"><b>VIN / Serie:</b> <span style="font-family: monospace; background:#fdf2e9; padding:2px 8px; border-radius:4px; color: #d35400; font-weight: bold;">${v[1]}</span> &nbsp;|&nbsp; <b>Motor:</b> ${v[5]} &nbsp;|&nbsp; <b>📅 Fecha Mod.:</b> ${v[8] || 'Sin fecha'}</p>
                <p style="margin: 6px 0; font-size: 0.95em; color: #475569;"><b>Diagnóstico/Obs:</b> ${v[7] ? (v[7].length > 150 ? v[7].substring(0, 150) + '...' : v[7]) : 'Sin observaciones'}</p>
            </div>
        `;
    });
    htmlDetalle += `</div>`;

    mostrarModal({
        tipo: 'info',
        titulo: `PARQUE VEHICULAR DE AUTOTEC`,
        mensaje: `Unidades asociadas a <b>${nombreCliente}</b> (${carros.length} en expediente):`,
        detalle: htmlDetalle,
        amplio: true
    });
}

function seleccionarVehiculoServicio(vin, duenoReq) {
    if (!vin) {
        document.getElementById('serv-dueno').value = "";
        document.getElementById('serv-modelo').value = "";
        document.getElementById('serv-vin').value = "";
        document.getElementById('serv-km').value = "";
        document.getElementById('serv-vehiculo-hidden').value = "";
        return;
    }
    let vehiculo;
    if (duenoReq) vehiculo = (datosBD.vehiculos || []).find(v => v[1] === vin && v[0] === duenoReq);
    if (!vehiculo) vehiculo = (datosBD.vehiculos || []).find(v => v[1] === vin);

    if (vehiculo) {
        document.getElementById('serv-dueno').value = vehiculo[0] || "";
        document.getElementById('serv-modelo').value = `${vehiculo[2] || ""} ${vehiculo[3] || ""} (Año ${vehiculo[4] || ""})`.trim();
        document.getElementById('serv-vin').value = vehiculo[1] || "";
        document.getElementById('serv-km').value = vehiculo[6] || "";

        document.getElementById('serv-vehiculo-hidden').value = vin;
        document.getElementById('serv-vehiculo-input').value = `${vehiculo[0]} - ${vehiculo[2]} ${vehiculo[3]}`;
        document.getElementById('vehiculos-sugerencias').style.display = 'none';
    }
}

function agregarComponenteServicio() {
    let cant = parseFloat(document.getElementById('comp-cant').value);
    let textoBuscar = document.getElementById('comp-buscar').value.trim();
    let codSeleccionado = document.getElementById('comp-producto').value;
    let precioManual = parseFloat(document.getElementById('comp-precio-manual').value) || 0;

    if (cant > 0 && textoBuscar !== "") {
        let p = (datosBD.inventario || []).find(x => x[1] === codSeleccionado || x[1] === textoBuscar || `${x[1]} - ${x[2]}` === textoBuscar);

        let codigoReal = p ? p[1] : "SERV/REF-MANUAL";
        let desc = p ? p[2] : textoBuscar;
        let cat = p ? (p[3] || "Refacción") : "Servicio / Taller";
        let costoUnitario = precioManual;

        if (costoUnitario === 0 && p) {
            let valCosto = p[5];
            if (isNaN(valCosto) || parseFloat(valCosto) === 0) {
                try { valCosto = atob(p[4]); } catch (e) { valCosto = p[4]; }
            }
            costoUnitario = parseFloat(valCosto) || 0;
        }

        let subtotalCosto = cant * costoUnitario;

        carritoProduccion.push({
            cantidad: cant,
            codigoReal: codigoReal,
            codigo: codigoReal,
            linea: p ? (p[0] || "AUTOTEC") : "Taller",
            descripcion: desc,
            categoria: cat,
            precio: costoUnitario,
            costoUnitario: costoUnitario,
            costo: costoUnitario,
            subtotalCosto: subtotalCosto
        });

        actTablaProd();

        // Limpiar inputs de captura de partida
        document.getElementById('comp-cant').value = 1;
        document.getElementById('comp-buscar').value = '';
        document.getElementById('comp-producto').value = '';
        if (document.getElementById('comp-precio-manual')) document.getElementById('comp-precio-manual').value = '';
    } else {
        mostrarModal({ tipo: 'warning', titulo: 'Partida Incompleta', mensaje: 'Ingresa una cantidad y selecciona una refacción del inventario o escribe el nombre del servicio realizado.' });
    }
}

async function registrarOrdenServicioLocal() {
    let vin = document.getElementById('serv-vin').value;
    let dueno = document.getElementById('serv-dueno').value;
    let modelo = document.getElementById('serv-modelo').value;
    let fecha = document.getElementById('input-fecha-produccion').value;
    let km = document.getElementById('serv-km').value;
    let sintoma = document.getElementById('serv-sintoma').value;
    let bujiasVal = document.getElementById('serv-bujias') ? document.getElementById('serv-bujias').value : '';
    let fGasolinaVal = document.getElementById('serv-fgasolina') ? document.getElementById('serv-fgasolina').value : '';
    let fAireVal = document.getElementById('serv-faire') ? document.getElementById('serv-faire').value : '';
    let fAceiteVal = document.getElementById('serv-faceite') ? document.getElementById('serv-faceite').value : '';

    if (!vin || carritoProduccion.length === 0) {
        return mostrarModal({ tipo: 'warning', titulo: 'Atención', mensaje: 'Selecciona el vehículo al que se le realizó el servicio buscándolo en el recuadro de texto y agrega al menos una refacción o partida de servicio.' });
    }

    let pantallaCarga = document.getElementById('pantalla-carga');
    if (pantallaCarga) pantallaCarga.style.display = 'flex';

    let objFecha = fecha ? new Date(fecha + "T00:00:00") : new Date();
    let anioCorto = objFecha.getFullYear().toString().slice(-2);

    let folioManual = document.getElementById('serv-folio') ? document.getElementById('serv-folio').value.trim().toUpperCase() : "";
    let folioOrden;
    if (folioManual !== "") {
        folioOrden = folioManual;
    } else {
        let maxNum = 0;
        let ordenesDelAnio = (datosBD.ordenesServicio || []).filter(o => o.folio && o.folio.startsWith(anioCorto + "-"));
        ordenesDelAnio.forEach(o => {
            let num = parseInt(o.folio.split("-")[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        });
        folioOrden = `${anioCorto}-${maxNum + 1}`;
    }

    // Restar existencias en inventario local para refacciones mapeadas
    carritoProduccion.forEach(item => {
        let prod = (datosBD.inventario || []).find(p => p[1] === item.codigoReal);
        if (prod) {
            let stockAct = parseFloat(prod[6]) || 0;
            prod[6] = (stockAct - item.cantidad).toString();
        }
    });

    let refaccionesAEnviar = JSON.parse(JSON.stringify(carritoProduccion));
    if (bujiasVal || fGasolinaVal || fAireVal || fAceiteVal) {
        refaccionesAEnviar.push({
            tipo: 'METADATA',
            bujias: bujiasVal,
            fGasolina: fGasolinaVal,
            fAire: fAireVal,
            fAceite: fAceiteVal
        });
    }

    let nuevaOrden = {
        folio: folioOrden,
        vin: vin,
        dueno: dueno,
        vehiculo: modelo,
        fecha: fecha || new Date().toISOString().split("T")[0],
        km: km || "No registrado",
        sintoma: sintoma || "Servicio técnico general y refacciones",
        total: costoTotalProduccion,
        refacciones: refaccionesAEnviar
    };

    let ordenExistenteIdx = -1;
    if (datosBD.ordenesServicio) {
        ordenExistenteIdx = datosBD.ordenesServicio.findIndex(o => o.folio === folioOrden);
    } else {
        datosBD.ordenesServicio = [];
    }
    
    // Evitar duplicados locales al editar y hacer APPEND de refacciones
    if (ordenExistenteIdx > -1) {
        let ordenAnterior = datosBD.ordenesServicio[ordenExistenteIdx];
        
        let refaccionesFusionadas = [];
        let metadatosAnteriores = null;
        
        // Conservar las viejas
        if (ordenAnterior.refacciones && Array.isArray(ordenAnterior.refacciones)) {
            ordenAnterior.refacciones.forEach(r => {
                if (r.tipo === 'METADATA') {
                    metadatosAnteriores = r;
                } else {
                    refaccionesFusionadas.push(r);
                }
            });
        }
        
        // Añadir las nuevas
        refaccionesAEnviar.forEach(r => {
            if (r.tipo !== 'METADATA') {
                refaccionesFusionadas.push(r);
            }
        });
        
        // Actualizar Metadatos (bujías, filtros...) si se escribieron de nuevo
        let metadatosNuevos = refaccionesAEnviar.find(r => r.tipo === 'METADATA');
        if (metadatosNuevos) {
            refaccionesFusionadas.push(metadatosNuevos);
        } else if (metadatosAnteriores) {
            refaccionesFusionadas.push(metadatosAnteriores);
        }
        
        nuevaOrden.refacciones = refaccionesFusionadas;
        
        // Recalcular el gran total de la orden
        let costoNuevasRefacciones = refaccionesAEnviar.filter(r => r.tipo !== 'METADATA').reduce((acc, curr) => acc + curr.subtotalCosto, 0);
        nuevaOrden.total = (parseFloat(ordenAnterior.total) || 0) + costoNuevasRefacciones;
        
        datosBD.ordenesServicio[ordenExistenteIdx] = nuevaOrden;
    } else {
        datosBD.ordenesServicio.push(nuevaOrden);
    }

    // Actualizar fecha de modificación en el expediente del automóvil
    let veh = (datosBD.vehiculos || []).find(v => v[1] === vin);
    if (veh) {
        veh[8] = nuevaOrden.fecha;
        if (km && km.trim() !== "") veh[6] = km;
    }

    localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));

    // Intentar sincronizar en servidor Google
    try {
        let res = await ejecutarEnGoogle("guardarOrdenServicio", nuevaOrden);
        if (res && res.exito && res.datos) {
            datosBD = res.datos;
            localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
        }
    } catch (err) { }

    // Limpiar carrito de partidas de servicio
    carritoProduccion = [];
    actTablaProd();

    // Limpiar Inputs de búsqueda
    document.getElementById('serv-vehiculo-input').value = "";
    document.getElementById('serv-vehiculo-hidden').value = "";
    seleccionarVehiculoServicio("");
    document.getElementById('serv-sintoma').value = "";
    if(document.getElementById('serv-folio')) document.getElementById('serv-folio').value = "";
    if(document.getElementById('serv-bujias')) document.getElementById('serv-bujias').value = "";
    if(document.getElementById('serv-fgasolina')) document.getElementById('serv-fgasolina').value = "";
    if(document.getElementById('serv-faire')) document.getElementById('serv-faire').value = "";
    if(document.getElementById('serv-faceite')) document.getElementById('serv-faceite').value = "";

    actualizarTodasLasTablas();
    if (pantallaCarga) pantallaCarga.style.display = 'none';

    // Respetar regla global de promesas y preservar innerHTML de tablas/modales
    mostrarModal({
        tipo: 'success',
        titulo: '¡Orden de Trabajo Registrada con Éxito!',
        mensaje: `La orden <b>${folioOrden}</b> por un total de <b>$${parseFloat(costoTotalProduccion || 0).toFixed(2)}</b> fue guardada y vinculada a <b>${modelo}</b> (VIN: <code>${vin}</code>).<br><br>¿Deseas imprimir la factura de este servicio o inspeccionar el historial completo del automóvil?`,
        detalle: `<div style="text-align:center; margin-top:15px; display:flex; gap: 10px; justify-content:center;">
                    <button class="btn-principal" style="background-color:#3498db; font-size:14px; padding: 10px;" onclick="document.querySelector('.modal-overlay').style.display='none'; imprimirFacturaOrden('${folioOrden}', true)">🖨️ Imprimir Factura Física</button>
                    <button class="btn-principal" style="background-color:#8e44ad; font-size:14px; padding: 10px;" onclick="document.querySelector('.modal-overlay').style.display='none'; verHistorialServicioVehiculo('${vin}')">📜 Abrir Historial del Vehículo</button>
                  </div>`
    });
}


async function guardarVehiculoLocal(e) {
    e.preventDefault();
    let dueno = document.getElementById('v-auto-dueno').value;
    let vin = document.getElementById('v-auto-vin').value.trim().toUpperCase();
    let placas = document.getElementById('v-auto-placas').value.trim();
    let marca = document.getElementById('v-auto-marca').value.trim();
    let modelo = document.getElementById('v-auto-modelo').value.trim();
    let ano = document.getElementById('v-auto-ano').value;
    let motor = document.getElementById('v-auto-motor').value.trim();
    let obs = document.getElementById('v-auto-obs').value.trim();
    let fechaMod = document.getElementById('v-auto-fecha').value || new Date().toISOString().split("T")[0];

    if (!dueno || !vin) {
        return mostrarModal({ tipo: 'warning', titulo: 'Datos Incompletos', mensaje: 'Debes seleccionar un propietario e ingresar el VIN / Número de Serie del vehículo.' });
    }

    let pantallaCarga = document.getElementById('pantalla-carga');
    if (pantallaCarga) pantallaCarga.style.display = 'flex';

    // Verificar si ya existía para actualizar o insertar
    let idxExt = (datosBD.vehiculos || []).findIndex(v => v[1] === vin);
    if (idxExt >= 0) {
        datosBD.vehiculos[idxExt] = [dueno, vin, marca, modelo, ano, motor, placas, obs, fechaMod];
    } else {
        datosBD.vehiculos.push([dueno, vin, marca, modelo, ano, motor, placas, obs, fechaMod]);
    }
    localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));

    try {
        let r = await ejecutarEnGoogle("guardarVehiculo", {
            dueno: dueno, vin: vin, marca: marca, modelo: modelo, ano: ano, motor: motor, placas: placas, obs: obs, fecha: fechaMod
        });
        if (r && r.exito) {
            datosBD = r.datos;
        }
    } catch (err) { }

    document.getElementById('form-vehiculo').reset();
    let hoy = new Date().toISOString().split("T")[0];
    if (document.getElementById('v-auto-fecha')) document.getElementById('v-auto-fecha').value = hoy;

    actualizarTodasLasTablas();
    if (pantallaCarga) pantallaCarga.style.display = 'none';
    mostrarModal({ tipo: 'success', titulo: 'Vehículo Guardado', mensaje: `El vehículo <b>${marca} ${modelo}</b> (${vin}) fue actualizado con fecha de registro/garantía <b>${fechaMod}</b> en el expediente de <b>${dueno}</b>.` });
}

async function borrarVehiculo(vin) {
    if (await mostrarModal({ tipo: 'confirmar', titulo: 'Eliminar Vehículo', mensaje: `¿Estás seguro de eliminar el vehículo con VIN <b>${vin}</b> del expediente de AUTOTEC?` })) {
        datosBD.vehiculos = (datosBD.vehiculos || []).filter(v => v[1] !== vin);
        localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
        let res = await ejecutarEnGoogle("borrarVehiculoBD", vin);
        console.log("Respuesta borrar vehiculo Nube:", res);
        actualizarTodasLasTablas();
        mostrarModal({ tipo: 'success', titulo: 'Eliminado', mensaje: 'Vehículo eliminado del expediente de AUTOTEC.' });
    }
}

function filtrarVehiculos() {
    let input = document.getElementById('buscar-vehiculo');
    let selectAnio = document.getElementById('filtro-anio-vehiculo');
    if (!input) return;
    
    let q = input.value.toLowerCase().trim();
    let anioFiltro = selectAnio ? selectAnio.value : "";
    
    let filtrados = (datosBD.vehiculos || []).filter(v => {
        let fechaMod = v[8] || "";
        
        // Filtro por año
        if (anioFiltro && !fechaMod.startsWith(anioFiltro)) {
            // Revisa si alguna de sus órdenes es de este año (por si la fechaMod no cuadra)
            let isGen = isGenericVIN(v[1]);
            let ordenesCarro = (datosBD.ordenesServicio || []).filter(o => {
                if (o.vin !== v[1]) return false;
                return isGen ? (o.dueno === v[0]) : true;
            });
            let tieneOrdenEnAnio = ordenesCarro.some(o => o.fecha && o.fecha.startsWith(anioFiltro));
            if (!tieneOrdenEnAnio) return false;
        }

        // Filtro por texto
        if (q) {
            let terminos = q.split(' ').filter(x => x.trim() !== '');
            let textoCarro = [v[0], v[1], v[2], v[3], v[6], v[7]].join(" ").toLowerCase();
            let isGen = isGenericVIN(v[1]);
            let ordenesCarro = (datosBD.ordenesServicio || []).filter(o => {
                if (o.vin !== v[1]) return false;
                return isGen ? (o.dueno === v[0]) : true;
            });
            let textoOrdenes = ordenesCarro.map(o => o.folio || "").join(" ").toLowerCase();
            let textoCompleto = textoCarro + " " + textoOrdenes;
            return terminos.every(termino => textoCompleto.includes(termino));
        }
        
        return true;
    });

    renderTablaVehiculos(filtrados);
}


function generarHTMLOrdenTrabajo(datos) {
    let htmlRefacciones = '';
    let htmlServicios = '';
    let totRef = 0;
    let totServ = 0;

    let partidasLocales = datos.partidas;
    if (typeof partidasLocales === 'string') {
        try { partidasLocales = JSON.parse(partidasLocales); } catch(e) { partidasLocales = []; }
    }
    partidasLocales = partidasLocales || [];

    let refacciones = partidasLocales.filter(p => p && p.tipo !== 'SERVICIO' && p.tipo !== 'METADATA' && !(p.descripcion || '').toUpperCase().includes('MANO DE OBRA') && !(p.descripcion || '').toUpperCase().includes('SERVICIO'));
    let servicios = partidasLocales.filter(p => p && (p.tipo === 'SERVICIO' || (p.descripcion || '').toUpperCase().includes('MANO DE OBRA') || (p.descripcion || '').toUpperCase().includes('SERVICIO') || (p.descripcion || '').toUpperCase().includes('PAQUETE')) && p.tipo !== 'METADATA');

    let metadata = partidasLocales.find(p => p && p.tipo === 'METADATA') || {};
    let bujiasVal = metadata.bujias || '';
    let fGasolinaVal = metadata.fGasolina || '';
    let fAireVal = metadata.fAire || '';
    let fAceiteVal = metadata.fAceite || '';

    let maxFilas = Math.max(15, refacciones.length, servicios.length);
    for (let i = 0; i < maxFilas; i++) {
        let r = refacciones[i];
        let s = servicios[i];
        let rCant = r ? r.cantidad : '';
        let rDesc = r ? r.descripcion : '';
        // Usar precio (unitario) para mostrar al cliente
        let rPreUnitario = r && typeof r.precio !== 'undefined' ? r.precio : (r && typeof r.costoUnitario !== 'undefined' ? r.costoUnitario : 0);
        let rPre = r && rPreUnitario ? `$${parseFloat(rPreUnitario).toFixed(2)}` : (r ? '' : '');
        if (r && r.subtotalCosto) totRef += parseFloat(r.subtotalCosto);

        let sDesc = s ? s.descripcion : '';
        let sPreUnitario = s && typeof s.precio !== 'undefined' ? s.precio : (s && typeof s.costoUnitario !== 'undefined' ? s.costoUnitario : 0);
        let sPre = s && sPreUnitario ? `$${parseFloat(sPreUnitario).toFixed(2)}` : (s ? '' : '');
        if (s && s.subtotalCosto) totServ += parseFloat(s.subtotalCosto);

        htmlRefacciones += `<tr>
            <td style="width:10%; text-align:center; border-right:1px solid #000; border-bottom:1px solid #000;">${rCant}</td>
            <td style="width:70%; border-right:1px solid #000; border-bottom:1px solid #000; padding-left:5px; font-size:10px;">${rDesc}</td>
            <td style="width:20%; text-align:right; border-bottom:1px solid #000; padding-right:5px;">${rPre}</td>
        </tr>`;

        htmlServicios += `<tr>
            <td style="width:80%; border-right:1px solid #000; border-bottom:1px solid #000; padding-left:5px; font-size:10px;">${sDesc}</td>
            <td style="width:20%; text-align:right; border-bottom:1px solid #000; padding-right:5px;">${sPre}</td>
        </tr>`;
    }

    let subtotal = totRef + totServ;
    let grantotal = parseFloat(datos.total) || subtotal;

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Orden de Trabajo</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 3px; }
            .header-table td { border: none; }
            .bordered-table th, .bordered-table td { border: 1px solid #000; }
            .grid-container { display: flex; width: 100%; border: 2px solid #000; margin-top: 10px; }
            .col-left { width: 50%; border-right: 2px solid #000; }
            .col-right { width: 50%; }
            .inner-table { width: 100%; border-collapse: collapse; }
            .inner-table th { background-color: #e0e0e0; font-size: 10px; border-bottom: 2px solid #000; }
            .inner-table td { border: none; font-size: 10px; height: 16px; }
            .editable-field { transition: background 0.2s; cursor: pointer; }
            .editable-field:hover, .editable-field:focus { background-color: #fff9c4 !important; outline: 1px solid #f39c12; }
        </style>
    </head>
    <body>
        <table class="header-table">
            <tr>
                <td style="width: 60%;">
                    <img src="./AUTOTEC-LOGO.png" style="max-width: 300px; height: auto; margin-bottom: 5px;" alt="AUTOTEC Logo" onerror="this.style.display='none'">
                    <p style="margin:5px 0 0 0; font-weight:bold; text-decoration:underline;">TEL: (622) 132 63 32</p>
                </td>
                <td style="width: 40%; text-align:right; vertical-align:top;">
                    <div style="border:2px solid #000; display:inline-block; width:220px; text-align:center;">
                        <div style="background:#ccc; border-bottom:2px solid #000; font-weight:bold; padding:4px;">ORDEN DE TRABAJO</div>
                        <div style="display:flex; border-bottom:2px solid #000;">
                            <div style="width:30%; background:#ccc; border-right:2px solid #000; padding:4px; font-weight:bold;">No.</div>
                            <div style="width:70%; padding:4px; font-weight:bold; font-size:16px; background:#fff;">${datos.folio || ''}</div>
                        </div>
                        <div style="background:#ccc; border-bottom:2px solid #000; font-weight:bold; padding:4px;">FECHA</div>
                        <div style="padding:4px; font-weight:bold; background:#fff;">${datos.fecha || new Date().toLocaleDateString('es-MX')}</div>
                    </div>
                </td>
            </tr>
        </table>
        
        <table class="bordered-table" style="margin-top:10px; border:2px solid #000;">
            <tr>
                <td colspan="4" style="border-bottom:2px solid #000;"><b>CLIENTE:</b> &nbsp; <span id="factura-dueno" class="editable-field" contenteditable="true">${datos.dueno || ''}</span></td>
                <td colspan="4" style="border-bottom:2px solid #000; text-align:right;"><b>TEL:</b> &nbsp; <span id="factura-telefono" class="editable-field" contenteditable="true">${datos.telefono || ''}</span></td>
            </tr>
            <tr style="text-align:center; font-weight:bold; background:#f0f0f0;">
                <td style="width:15%;">MARCA</td><td style="width:15%;">TIPO</td><td style="width:15%;">MODELO</td><td style="width:15%;">PLACAS</td><td style="width:15%;">MOTOR</td><td style="width:10%;">CILINDROS</td><td style="width:15%;">COLOR</td>
            </tr>
            <tr style="text-align:center; height:20px;">
                <td id="factura-marca" class="editable-field" contenteditable="true">${datos.marca || ''}</td><td id="factura-tipo" class="editable-field" contenteditable="true">${datos.tipo || ''}</td><td id="factura-modelo" class="editable-field" contenteditable="true">${datos.modelo || ''}</td><td id="factura-placas" class="editable-field" contenteditable="true">${datos.placas || ''}</td><td id="factura-motor" class="editable-field" contenteditable="true">${datos.motor || ''}</td><td id="factura-cilindros" class="editable-field" contenteditable="true">${datos.cilindros || ''}</td><td id="factura-color" class="editable-field" contenteditable="true">${datos.color || ''}</td>
            </tr>
            <tr style="text-align:center; font-weight:bold; background:#f0f0f0;">
                <td colspan="2">KILOMETROS</td><td colspan="2">VIN</td><td>BUJIAS</td><td>F. GASOLINA</td><td>F. AIRE</td><td>F. ACEITE</td>
            </tr>
            <tr style="text-align:center; height:20px;">
                <td colspan="2" id="factura-km" class="editable-field" contenteditable="true">${datos.km || ''}</td><td colspan="2" id="factura-vin" style="font-family:monospace; font-size:12px;">${datos.vin || ''}</td><td id="factura-bujias" class="editable-field" contenteditable="true">${bujiasVal}</td><td id="factura-fgasolina" class="editable-field" contenteditable="true">${fGasolinaVal}</td><td id="factura-faire" class="editable-field" contenteditable="true">${fAireVal}</td><td id="factura-faceite" class="editable-field" contenteditable="true">${fAceiteVal}</td>
            </tr>
        </table>
        
        <div class="grid-container">
            <div class="col-left">
                <table class="inner-table">
                    <thead><tr><th style="width:10%; border-right:1px solid #000;">CANT</th><th style="width:70%; border-right:1px solid #000;">REFACCION</th><th style="width:20%;">PRECIO</th></tr></thead>
                    <tbody>${htmlRefacciones}</tbody>
                </table>
            </div>
            <div class="col-right">
                <table class="inner-table">
                    <thead><tr><th style="width:80%; border-right:1px solid #000;">SERVICIO</th><th style="width:20%;">PRECIO</th></tr></thead>
                    <tbody>${htmlServicios}</tbody>
                </table>
            </div>
        </div>
        
        <div style="display:flex; width:100%; border:2px solid #000; border-top:none;">
            <div style="width:50%; display:flex; border-right:2px solid #000;">
                <div style="width:70%; text-align:right; font-weight:bold; padding:5px; border-right:1px solid #000;">TOTAL REFACCIONES:</div>
                <div style="width:30%; text-align:right; font-weight:bold; padding:5px;">$${totRef.toFixed(2)}</div>
            </div>
            <div style="width:50%; display:flex;">
                <div style="width:70%; text-align:right; font-weight:bold; padding:5px; border-right:1px solid #000;">TOTAL SERVICIO:</div>
                <div style="width:30%; text-align:right; font-weight:bold; padding:5px;">$${totServ.toFixed(2)}</div>
            </div>
        </div>
        
        <div style="display:flex; width:100%; margin-top:5px;">
            <div style="width:70%; border:2px solid #000; padding:5px; margin-right:5px; position:relative; min-height:80px;">
                <div style="display:flex; border-bottom:1px solid #ccc; height:30%;"><div style="width:20px; border-right:1px solid #ccc;">F<br><br><br>1/2<br><br><br>E</div><div style="padding-left:10px;"><b style="font-size:10px;">COMENTARIOS DEL CLIENTE:</b><br><span style="font-size:11px;">${datos.comentarios || ''}</span></div></div>
                <div style="position:absolute; bottom:5px; font-size:8px; line-height:1.1; padding-right:10px;">
                    Por este PAGARE me(nos) obligo (amos) a pagar incondicionalmente a la orden de : MIGUEL ANGEL QUIROZ COTA en Guaymas, Sonora o en cualquier plaza el dia _______________ de ____________________ de _______________ la cantidad de $ _______________. Suma que reconozco adeudarles y la cual causará intereses moratorios del _________% mensual desde su vencimiento. Me someto expresamente a los tribunales que el acreedor elija, renunciando al fuero de mi domicilio. En caso de cobro judicial pagaré los gastos que se ocasionen.
                </div>
            </div>
            <div style="width:30%;">
                <table style="width:100%; border-collapse:collapse; border:2px solid #000;">
                    <tr><td style="border-bottom:1px solid #000; font-weight:bold; padding:5px;">TOTAL:</td><td style="border-bottom:1px solid #000; border-left:1px solid #000; text-align:right; padding:5px;">$${grantotal.toFixed(2)}</td></tr>
                    <tr><td style="border-bottom:1px solid #000; font-weight:bold; padding:5px;">I.V.A.:</td><td style="border-bottom:1px solid #000; border-left:1px solid #000; text-align:right; padding:5px;"></td></tr>
                    <tr><td style="font-weight:bold; padding:5px;">GRAN TOTAL:</td><td style="border-left:1px solid #000; text-align:right; padding:5px; background:#e0e0e0; font-weight:bold;">$${grantotal.toFixed(2)}</td></tr>
                </table>
                <div style="margin-top:15px; border-top:1px solid #000; text-align:center; font-size:10px; padding-top:2px;">FIRMA DEL CLIENTE</div>
            </div>
        </div>
        <div style="border:2px solid #000; margin-top:5px; min-height:40px; padding:5px;">
            <b style="font-size:10px;">COMENTARIOS MECANICO:</b>
        </div>
        <div style="margin-top:10px; text-align:right;">
            <div style="display:inline-block; border-top:1px solid #000; padding-top:2px; font-weight:bold; font-size:10px; width:200px; text-align:center;">MECANICO RESPONSABLE</div>
        </div>
    </body>
    </html>`;
}

function imprimirOrdenServicio(orden, imprimir = true) {
    try {
        let vehiculo = (datosBD.vehiculos || []).find(v => v[1] === orden.vin);
    let datosImpresion = {
        folio: orden.folio,
        fecha: orden.fecha,
        dueno: orden.dueno || (vehiculo ? vehiculo[0] : ''),
        telefono: "", // Podríamos buscar el teléfono en clientes si es necesario
        marca: vehiculo ? vehiculo[2] : '',
        modelo: vehiculo ? vehiculo[3] : '',
        tipo: vehiculo ? vehiculo[3] : '', // A veces el tipo es el mismo modelo o carroceria
        placas: vehiculo ? vehiculo[6] : '',
        motor: vehiculo ? vehiculo[5] : '',
        cilindros: "",
        color: vehiculo ? vehiculo[7] : '',
        km: orden.km,
        vin: orden.vin,
        partidas: orden.refacciones,
        total: orden.total,
        comentarios: orden.sintoma
    };

    // Extraer teléfono del nombre si el usuario lo escribió ahí (ej. "IVONNE LOPEZ 6221650293")
    let telMatch = datosImpresion.dueno.match(/(622|662|631|644)\d{7}/); // Busca números de 10 dígitos que empiecen con ladas de Sonora comunes
    if (telMatch) {
        datosImpresion.telefono = telMatch[0];
        datosImpresion.dueno = datosImpresion.dueno.replace(telMatch[0], '').trim();
    } else {
        // Intentar buscar el teléfono en la base de clientes como respaldo
        let cliente = (datosBD.clientes || []).find(c => c[0] === datosImpresion.dueno);
        if (cliente && cliente[2] !== "S/N") datosImpresion.telefono = cliente[2]; // Índice 2 es el teléfono
    }

    let html = generarHTMLOrdenTrabajo(datosImpresion);
    visualizarOImprimirHTML(html, 'Factura / Órden de Trabajo: ' + orden.folio, imprimir, orden.vin);
    } catch(err) {
        mostrarModal({ tipo: 'error', titulo: 'Error Interno (OrdenServicio)', mensaje: 'Fallo crítico: ' + err.message + '<br>' + err.stack });
    }
}

// ==============================================
function abrirModalUnificarClientes() {
    let clientesArray = (datosBD.clientes || []).map(c => c[0]).sort();
    
    let opcionesClientes = clientesArray.map(c => 
        `<div class="item-variacion" style="margin-bottom: 5px;">
            <label><input type="checkbox" class="chk-variacion" value="${c}"> ${c}</label>
         </div>`
    ).join('');
    
    let opcionesDatalist = clientesArray.map(c => `<option value="${c}">`).join('');
    
    let html = `
        <div style="text-align:left;">
            <p style="margin-bottom: 5px; color: #555;">Selecciona o escribe el nombre principal (destino):</p>
            <input list="lista-clientes-target" id="target-cliente" class="form-control" placeholder="Ej. IPPSA" style="width:100%; padding: 8px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #ccc;">
            <datalist id="lista-clientes-target">
                ${opcionesDatalist}
            </datalist>
            
            <p style="margin-bottom: 5px; color: #555;">Selecciona las variaciones que se fusionarán en el nombre principal:</p>
            <p style="margin-bottom: 10px; font-size: 12px; color: #d9534f;"><b>Nota Segura:</b> Los vehículos y órdenes <b>NO se borrarán</b>, solo se transferirán al nuevo cliente unificado.</p>
            
            <input type="text" placeholder="🔎 Buscar variación en la lista..." style="width:100%; padding: 6px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc;" oninput="
                let v = this.value.toUpperCase();
                document.querySelectorAll('.item-variacion').forEach(el => {
                    el.style.display = el.innerText.toUpperCase().includes(v) ? 'block' : 'none';
                })
            ">
            
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #fafafa; border-radius: 4px;">
                ${opcionesClientes}
            </div>
        </div>
    `;

    mostrarModal({
        tipo: 'confirmar',
        titulo: '🔗 Unificar Clientes Duplicados',
        mensaje: '',
        detalle: html,
        amplio: false
    }).then(async (confirmado) => {
        if (!confirmado) return;
        
        let target = document.getElementById('target-cliente').value.trim().toUpperCase();
        let checkboxes = document.querySelectorAll('.chk-variacion:checked');
        let variaciones = Array.from(checkboxes).map(chk => chk.value);
        
        if (!target) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'Debe especificar un nombre de cliente destino.' });
        if (variaciones.length === 0) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'Debe seleccionar al menos una variación para fusionar.' });
        
        // DOBLE CHECK: Calcular impactos
        let vehiculosAfectados = (datosBD.inventario || []).filter(v => variaciones.includes(v[0])).length;
        let ordenesAfectadas = (datosBD.ordenes || []).filter(o => variaciones.includes(o[2])).length;
        
        let confirmacionDoble = await mostrarModal({
            tipo: 'confirmar',
            titulo: '⚠️ Confirmación de Unificación',
            mensaje: `¿Estás seguro de que deseas agrupar <b>${variaciones.length}</b> cliente(s) bajo el nombre <b>"${target}"</b>?`,
            detalle: `<ul style="text-align:left; margin-top:10px;">
                        <li><b>Vehículos que se moverán:</b> ${vehiculosAfectados}</li>
                        <li><b>Órdenes que se actualizarán:</b> ${ordenesAfectadas}</li>
                      </ul>
                      <p style="margin-top:10px; font-size:12px; color:#d9534f;">Verifica que no haya errores de selección. Los vehículos y órdenes se mantendrán intactos y se asignarán a ${target}.</p>`
        });
        
        if (!confirmacionDoble) return;
        
        document.getElementById('pantalla-carga').style.display = 'flex';
        let res = await ejecutarEnGoogle('unificarClientes', { targetNombre: target, variaciones: JSON.stringify(variaciones) });
        if (res.error) {
            mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: res.error });
        } else {
            datosBD = res.datos || res; // Compatibilidad
            actualizarTodasLasTablas();
            mostrarModal({ tipo: 'success', titulo: 'Completado', mensaje: 'Los clientes han sido unificados con éxito y los vehículos/órdenes han sido reagrupados correctamente.' });
        }
        document.getElementById('pantalla-carga').style.display = 'none';
    });
}

// ==============================================
// 15. FUNCIONES PARA TABLA Y EDICIÓN DE CLIENTES
// ==============================================

function renderTablaClientes(clientes = datosBD.clientes) {
    let html = '';
    (clientes || []).forEach(f => {
        html += `<tr>
            <td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td>
            <td style="white-space: nowrap;">
                <button class="btn-tabla" style="background-color:#2980b9; margin-right: 4px;" onclick="verCarrosCliente('${f[0]}')">🚘 Ver Carros</button>
                <button class="btn-tabla" style="background-color:#8e44ad;" onclick="editarClienteModal('${f[0]}')">📝 Editar</button>
                <button class="btn-tabla btn-eliminar" onclick="borrarCliente('${f[0]}')">X</button>
            </td>
        </tr>`;
    });
    let tbody = document.getElementById('tabla-cuerpo-clientes');
    if (tbody) tbody.innerHTML = html;
}

function filtrarClientes() {
    let input = document.getElementById('buscar-cliente');
    if (!input) return;
    let q = input.value.toLowerCase().trim();
    if (!q) {
        renderTablaClientes(datosBD.clientes);
        return;
    }
    
    let terminos = q.split(' ').filter(x => x.trim() !== '');
    let filtrados = (datosBD.clientes || []).filter(c => {
        let textoCompleto = c.join(" ").toLowerCase();
        return terminos.every(termino => textoCompleto.includes(termino));
    });
    renderTablaClientes(filtrados);
}

function editarClienteModal(nombre) {
    let cliente = (datosBD.clientes || []).find(c => String(c[0]) === String(nombre));
    if (!cliente) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se encontró el cliente.' });

    let formHTML = `
        <div style="text-align: left;">
            <label style="display:block; font-weight:bold; font-size:13px; margin-bottom:5px;">Nombre / Razón Social:</label>
            <input type="text" id="edit-cli-nombre" value="${cliente[0]}" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
            
            <label style="display:block; font-weight:bold; font-size:13px; margin-bottom:5px;">RFC:</label>
            <input type="text" id="edit-cli-rfc" value="${cliente[1] || ''}" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
            
            <label style="display:block; font-weight:bold; font-size:13px; margin-bottom:5px;">Teléfono:</label>
            <input type="text" id="edit-cli-tel" value="${cliente[2] || ''}" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
            
            <label style="display:block; font-weight:bold; font-size:13px; margin-bottom:5px;">Dirección:</label>
            <input type="text" id="edit-cli-dir" value="${cliente[3] || ''}" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
            
            <button onclick="guardarEdicionCliente('${nombre}')" style="width:100%; padding:10px; background:#8e44ad; color:white; border:none; border-radius:4px; font-weight:bold; font-size:14px; cursor:pointer;">💾 Guardar Cambios</button>
        </div>
    `;

    mostrarModal({
        tipo: 'info',
        titulo: 'Editar Cliente',
        mensaje: `Modifica los datos del cliente <b>${nombre}</b>.`,
        detalle: formHTML,
        amplio: false
    });
}

async function guardarEdicionCliente(nombreOriginal) {
    let nuevoNombre = document.getElementById('edit-cli-nombre').value.trim();
    let nuevoRfc = document.getElementById('edit-cli-rfc').value.trim();
    let nuevoTel = document.getElementById('edit-cli-tel').value.trim();
    let nuevaDir = document.getElementById('edit-cli-dir').value.trim();

    if (!nuevoNombre) return mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'El nombre es obligatorio.' });

    // Ocultar modal actual y mostrar cargando
    document.getElementById('modal-moderno').style.display = 'none';
    mostrarModal({ 
        tipo: 'info', 
        titulo: 'Guardando...', 
        mensaje: 'Enviando cambios a la base de datos...', 
        detalle: '<div style="text-align:center; margin-top:15px; font-weight:bold; color:#3498db;">Conectando con Google Sheets...</div>' 
    });

    let payload = {
        nombreOriginal: nombreOriginal,
        nombreNuevo: nuevoNombre,
        rfc: nuevoRfc || "S/N",
        telefono: nuevoTel || "S/N",
        direccion: nuevaDir || "S/N"
    };

    let res = await ejecutarEnGoogle("editarCliente", payload);
    
    if (res && res.exito) {
        datosBD = res.datos;
        localStorage.setItem('datosBD_cache', JSON.stringify(datosBD));
        actualizarTodasLasTablas();
        mostrarModal({ tipo: 'success', titulo: 'Cliente Actualizado', mensaje: 'Los datos del cliente se guardaron correctamente.' });
    } else {
        mostrarModal({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo guardar el cliente: ' + (res.error || 'Error desconocido') });
    }
}
