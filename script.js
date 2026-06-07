// ===================================
// VARIABLES GENERALES Y CONFIGURACIÓN
// ===================================

const datosZonas = {
    frente: crearEstructuraZona(),
    atras: crearEstructuraZona(),
    panalIZ: crearEstructuraZona(),
    panalDE: crearEstructuraZona(),
    cajonDI: crearEstructuraZona(),
    cajonDD: crearEstructuraZona(),
    cajonTI: crearEstructuraZona(),
    cajonTD: crearEstructuraZona(),
    techo: crearEstructuraZona()
};

function crearEstructuraZona() {
    return { llenos: 0, cambios: 0, plasticos: 0, galones: 0, litro: 0, medio: 0 };
}

let zonaActual = "";
let listaPreciosEspeciales = []; 

// ===================================
// NAVEGACIÓN ENTRE INTERFACES
// ===================================

function mostrarPantalla(numero) {
    for (let i = 1; i <= 6; i++) {
        const p = document.getElementById("pantalla" + i);
        if (p) p.classList.add("oculta");
    }
    
    const pantallaObjetivo = document.getElementById("pantalla" + numero);
    if (pantallaObjetivo) pantallaObjetivo.classList.remove("oculta");

    actualizarStepper(numero);

    if (numero === 3) {
        arrastrarDatosPantalla3();
    } else if (numero === 4) {
        arrastrarDatosPantalla4();
    } else if (numero === 6) {
        calcularLiquidacionFinal();
    }
}

function actualizarStepper(pasoActivo) {
    for (let i = 1; i <= 6; i++) {
        const stepCircle = document.getElementById("step" + i);
        if (!stepCircle) continue;
        stepCircle.classList.remove("activo", "completado");
        if (i < pasoActivo) {
            stepCircle.classList.add("completado");
        } else if (i === pasoActivo) {
            stepCircle.classList.add("activo");
        }
    }
}

// ===================================
// CONTROL DE CONTEO FÍSICO (PASO 2)
// ===================================

function abrirZona(nombre) {
    zonaActual = nombre;
    document.getElementById("modal").style.display = "flex";
    document.getElementById("tituloZona").innerText = obtenerNombreBonito(nombre);

    const data = datosZonas[nombre];
    document.getElementById("llenos").value = data.llenos;
    document.getElementById("cambios").value = data.cambios;
    document.getElementById("plasticos").value = data.plasticos;
    document.getElementById("galones").value = data.galones;
    document.getElementById("litro").value = data.litro;
    document.getElementById("medio").value = data.medio;

    const extras = document.getElementById("productosExtra");
    if (nombre === "panalIZ" || nombre === "panalDE") {
        extras.style.display = "none";
    } else {
        extras.style.display = "block";
    }
}

function cerrarModal() {
    document.getElementById("modal").style.display = "none";
}

function guardarZona() {
    const data = datosZonas[zonaActual];
    data.llenos = Number(document.getElementById("llenos").value) || 0;
    data.cambios = Number(document.getElementById("cambios").value) || 0;
    data.plasticos = Number(document.getElementById("plasticos").value) || 0;

    if (zonaActual !== "panalIZ" && zonaActual !== "panalDE") {
        data.galones = Number(document.getElementById("galones").value) || 0;
        data.litro = Number(document.getElementById("litro").value) || 0;
        data.medio = Number(document.getElementById("medio").value) || 0;
    }

    marcarBotonCompleto(zonaActual);
    cerrarModal();
}

function marcarBotonCompleto(nombre) {
    const botones = document.querySelectorAll(".zona");
    botones.forEach(btn => {
        if (btn.getAttribute("onclick").includes(`'${nombre}'`)) {
            btn.classList.remove("pendiente");
            btn.classList.add("completo");
        }
    });
}

// ===================================
// LÓGICA DE BOTELLONES Y ESPECIALES (PASO 3)
// ===================================

function arrastrarDatosPantalla3() {
    let tLlenos = 0, tCambios = 0, tPlasticos = 0;
    for (let z in datosZonas) {
        tLlenos += datosZonas[z].llenos;
        tCambios += datosZonas[z].cambios;
        tPlasticos += datosZonas[z].plasticos;
    }

    const salidaPlanta = Number(document.getElementById("salidaBotellones").value) || 0;
    document.getElementById("arrastreSalidaBot").innerText = salidaPlanta;
    document.getElementById("arrastrellenosBot").innerText = tLlenos;
    document.getElementById("arrastreCambiosBot").innerText = tCambios;

    const alerta = document.getElementById("alertaPlasticos");
    const diff = salidaPlanta - tPlasticos;

    if (diff === 0) {
        alerta.innerText = "✅ Cuadre de plásticos físico: Correcto";
        alerta.style.background = "#14532d"; alerta.style.color = "#4ade80";
        document.getElementById("faltanteBotellones").value = 0;
        document.getElementById("bloquePrecioPlastico").style.display = "none";
    } else if (diff > 0) {
        alerta.innerText = `⚠ Faltan físicamente ${diff} plásticos. Se activará cobro automático.`;
        alerta.style.background = "#7f1d1d"; alerta.style.color = "#fca5a5";
        document.getElementById("faltanteBotellones").value = diff;
        document.getElementById("bloquePrecioPlastico").style.display = "flex";
    } else {
        alerta.innerText = `⚠ Sobran físicamente ${Math.abs(diff)} plásticos.`;
        alerta.style.background = "#7c2d12"; alerta.style.color = "#fdba74";
        document.getElementById("faltanteBotellones").value = 0;
        document.getElementById("bloquePrecioPlastico").style.display = "none";
    }
    calcularLogicaBotellones();
}

function agregarPrecioEspecial() {
    const id = Date.now();
    
    const contenedorInputs = document.getElementById("contenedorPreciosEspeciales");
    const divInput = document.createElement("div");
    divInput.id = `es-input-${id}`;
    divInput.style.marginBottom = "10px";
    divInput.innerHTML = `
        <label style="color:#38bdf8">Cliente Especial</label>
        <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" placeholder="Nombre" id="nomEs-${id}" oninput="actualizarEstructuraEspecial(${id})" style="flex:1;">
            <input type="number" placeholder="Cant" id="cantEs-${id}" value="0" min="0" oninput="actualizarEstructuraEspecial(${id})" style="width:80px;">
            <button class="btnReset" style="width:40px; margin:0; padding:10px;" onclick="eliminarPrecioEspecial(${id})">X</button>
        </div>
    `;
    contenedorInputs.appendChild(divInput);

    const contenedorPrecios = document.getElementById("contenedorPreciosEspecialesValores");
    const divPrecio = document.createElement("div");
    divPrecio.id = `es-precio-${id}`;
    divPrecio.className = "grupo-dinero";
    divPrecio.style.marginTop = "10px";
    divPrecio.innerHTML = `
        <div>
            <label id="lblPrecio-${id}">Precio Especial</label>
            <input type="number" id="valPrecio-${id}" value="20" min="0" oninput="actualizarEstructuraEspecial(${id})">
        </div>
        <div>
            <label>Subtotal</label>
            <span class="subtotal-dinero" id="subEs-${id}">$0.00</span>
        </div>
    `;
    contenedorPrecios.appendChild(divPrecio);

    listaPreciosEspeciales.push({ id: id, nombre: "", cantidad: 0, precio: 20 });
    calcularLogicaBotellones();
}

function eliminarPrecioEspecial(id) {
    listaPreciosEspeciales = listaPreciosEspeciales.filter(x => x.id !== id);
    
    const elInput = document.getElementById(`es-input-${id}`);
    const elPrecio = document.getElementById(`es-precio-${id}`);
    if (elInput) elInput.remove();
    if (elPrecio) elPrecio.remove();

    calcularLogicaBotellones();
}

function actualizarEstructuraEspecial(id) {
    const obj = listaPreciosEspeciales.find(x => x.id === id);
    if (!obj) return;

    const nombreIn = document.getElementById(`nomEs-${id}`).value;
    const cantIn = Number(document.getElementById(`cantEs-${id}`).value) || 0;
    const precioIn = Number(document.getElementById(`valPrecio-${id}`).value) || 0;

    obj.nombre = nombreIn || "Especial";
    obj.cantidad = cantIn;
    obj.precio = precioIn;

    if(nombreIn) {
        document.getElementById(`lblPrecio-${id}`).innerText = `Precio: ${nombreIn}`;
    }
    calcularLogicaBotellones();
}

function calcularLogicaBotellones() {
    const salidaPlanta = Number(document.getElementById("salidaBotellones").value) || 0;
    let tLlenos = 0, tCambios = 0;
    for (let z in datosZonas) {
        tLlenos += datosZonas[z].llenos;
        tCambios += datosZonas[z].cambios;
    }

    const creditos = Number(document.getElementById("grid-inputs-tres") ? 0 : document.getElementById("creditoBotellones").value) || 0;
    const casa = Number(document.getElementById("casaBotellones").value) || 0;
    const faltantes = Number(document.getElementById("faltanteBotellones").value) || 0;

    let sumaEspeciales = 0;
    listaPreciosEspeciales.forEach(x => sumaEspeciales += x.cantidad);

    let tienda = salidaPlanta - (tLlenos + tCambios + creditos + casa + sumaEspeciales + faltantes);
    if (tienda < 0) tienda = 0;
    document.getElementById("tiendaBotellones").value = tienda;

    const pCasa = Number(document.getElementById("precioCasa").value) || 0;
    const pTienda = Number(document.getElementById("precioTienda").value) || 0;
    const pFaltante = Number(document.getElementById("precioPlasticoFaltante").value) || 0;

    const subCasa = casa * pCasa;
    const subTienda = tienda * pTienda;
    const subFaltante = faltantes * pFaltante;

    document.getElementById("subtotalCasa").innerText = `$${subCasa.toFixed(2)}`;
    document.getElementById("subtotalTienda").innerText = `$${subTienda.toFixed(2)}`;
    document.getElementById("subtotalPlasticoFaltante").innerText = `$${subFaltante.toFixed(2)}`;

    let totalDineroEspeciales = 0;
    listaPreciosEspeciales.forEach(x => {
        const subE = x.cantidad * x.precio;
        totalDineroEspeciales += subE;
        const spanSub = document.getElementById(`subEs-${x.id}`);
        if (spanSub) spanSub.innerText = `$${subE.toFixed(2)}`;
    });

    const granTotalBotellones = subCasa + subTienda + subFaltante + totalDineroEspeciales;
    document.getElementById("totalDineroBotellones").innerText = `$${granTotalBotellones.toFixed(2)}`;

    calcularGranTotalEsperado();
}

// ===================================
// LOGICA OTROS PRODUCTOS (PASO 4)
// ===================================

function arrastrarDatosPantalla4() {
    let tGalones = 0, tLitro = 0, tMedio = 0;
    for (let z in datosZonas) {
        tGalones += datosZonas[z].galones;
        tLitro += datosZonas[z].litro;
        tMedio += datosZonas[z].medio;
    }
    document.getElementById("arrastreSalidaGal").innerText = document.getElementById("salidaGalones").value;
    document.getElementById("arrastreRegresoGal").innerText = tGalones;
    document.getElementById("arrastreSalidaLitro").innerText = document.getElementById("salidaLitro").value;
    document.getElementById("arrastreRegresoLitro").innerText = tLitro;
    document.getElementById("arrastreSalidaMedio").innerText = document.getElementById("salidaMedio").value;
    document.getElementById("arrastreRegresoMedio").innerText = tMedio;

    calcularLogicaOtros();
}

function calcularLogicaOtros() {
    const sGal = Number(document.getElementById("salidaGalones").value) || 0;
    const rGal = Number(document.getElementById("arrastreRegresoGal").innerText) || 0;
    const cGal = Number(document.getElementById("creditoGalones").value) || 0;
    const vGal = Math.max(0, sGal - (rGal + cGal));
    document.getElementById("vendidosGalones").value = vGal;
    const subGal = vGal * (Number(document.getElementById("precioGalon").value) || 0);
    document.getElementById("subtotalGalones").innerHTML = `<span>$${subGal.toFixed(2)}</span>`;

    const sLit = Number(document.getElementById("salidaLitro").value) || 0;
    const rLit = Number(document.getElementById("arrastreRegresoLitro").innerText) || 0;
    const cLit = Number(document.getElementById("creditoLitro").value) || 0;
    const vLit = Math.max(0, sLit - (rLit + cLit));
    document.getElementById("vendidosLitro").value = vLit;
    const subLit = vLit * (Number(document.getElementById("precioLitro").value) || 0);
    document.getElementById("subtotalLitro").innerHTML = `<span>$${subLit.toFixed(2)}</span>`;

    const sMed = Number(document.getElementById("salidaMedio").value) || 0;
    const rMed = Number(document.getElementById("arrastreRegresoMedio").innerText) || 0;
    const cMed = Number(document.getElementById("creditoMedio").value) || 0;
    const vMed = Math.max(0, sMed - (rMed + cMed));
    document.getElementById("vendidosMedio").value = vMed;
    const subMed = vMed * (Number(document.getElementById("precioMedio").value) || 0);
    document.getElementById("subtotalMedio").innerHTML = `<span>$${subMed.toFixed(2)}</span>`;

    calcularGranTotalEsperado();
}

function calcularGranTotalEsperado() {
    const texto = document.getElementById("totalDineroBotellones").innerText;
    const totalBotellones = Number(texto.replace('$', '').replace(/,/g, '')) || 0;
    
    const subG = (Number(document.getElementById("vendidosGalones").value) || 0) * (Number(document.getElementById("precioGalon").value) || 0);
    const subL = (Number(document.getElementById("vendidosLitro").value) || 0) * (Number(document.getElementById("precioLitro").value) || 0);
    const subM = (Number(document.getElementById("vendidosMedio").value) || 0) * (Number(document.getElementById("precioMedio").value) || 0);
    const abonos = Number(document.getElementById("abonosExtra").value) || 0;

    const granTotal = totalBotellones + subG + subL + subM + abonos;
    document.getElementById("granTotalEsperado").innerText = `$${granTotal.toFixed(2)}`;
}

// ===================================
// CONTEO DE EFECTIVO (PASO 5)
// ===================================

function calcularEfectivoCaja() {
    const denoms = [
        { id: "1000", val: 1000 }, { id: "500", val: 500 }, { id: "200", val: 200 },
        { id: "100", val: 100 }, { id: "50", val: 50 }, { id: "20", val: 20 },
        { id: "10", val: 10 }, { id: "5", val: 5 }, { id: "2", val: 2 },
        { id: "1", val: 1 }, { id: "05", val: 0.5 }
    ];

    let tNacional = 0;
    denoms.forEach(d => {
        const cant = Number(document.getElementById("e" + d.id).value) || 0;
        const sub = cant * d.val;
        tNacional += sub;
        document.getElementById("c" + d.id).innerText = `$${sub.toFixed(2)}`;
    });

    const cantDolar = Number(document.getElementById("eDolar").value) || 0;
    let tExtranjero = 0;

    if (cantDolar > 0) {
        document.getElementById("bloqueTipoCambio").style.display = "block";
        document.getElementById("subtotalDolar").style.display = "block";
        tExtranjero = cantDolar * (Number(document.getElementById("tipoCambio").value) || 0);
        document.getElementById("subtotalDolar").querySelector("span").innerText = `$${tExtranjero.toFixed(2)} (MXN)`;
    } else {
        document.getElementById("bloqueTipoCambio").style.display = "none";
        document.getElementById("subtotalDolar").style.display = "none";
    }

    const efectivoFinal = tNacional + tExtranjero;
    document.getElementById("totalEfectivoRecibido").innerText = `$${efectivoFinal.toFixed(2)}`;
}

// ===================================
// LIQUIDACIÓN FINAL (PASO 6)
// ===================================

function calcularLiquidacionFinal() {
    const esp = Number(document.getElementById("granTotalEsperado").innerText.replace('$', '').replace(/,/g, '')) || 0;
    const rec = Number(document.getElementById("totalEfectivoRecibido").innerText.replace('$', '').replace(/,/g, '')) || 0;

    document.getElementById("resumenEsperado").innerText = `$${esp.toFixed(2)}`;
    document.getElementById("resumenRecibido").innerText = `$${rec.toFixed(2)}`;

    const mensaje = document.getElementById("mensajeLiquidacion");
    const txtJustif = document.getElementById("textoJustificacion");
    const diferencia = rec - esp;

    if (diferencia >= 0) {
        mensaje.innerText = diferencia === 0 ? "✅ Cuentas Claras y Exactas" : `✅ Cuentas Claras (Sobra: +$${diferencia.toFixed(2)})`;
        mensaje.style.background = "#14532d"; mensaje.style.color = "#4ade80";
        if(txtJustif.value === "") txtJustif.value = "Ninguna incidencia, cuentas conformes.";
    } else {
        mensaje.innerText = `⚠ Falta Dinero: -$${Math.abs(diferencia).toFixed(2)}`;
        mensaje.style.background = "#7f1d1d"; mensaje.style.color = "#fca5a5";
    }
}

// ===================================
// EXPORTAR PDF REFORMADO (VERSION PROFESIONAL CON CREDITOS)
// ===================================

function procesarExportarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const chofer = document.getElementById("rutaChofer").value || "Sin Especificar";
    const ayudante = document.getElementById("rutaAyudante").value || "Sin Especificar";
    const ruta = document.getElementById("rutaNombre").value || "General";
    
    const hoy = new Date();
    const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const nombreArchivoPDF = `${fechaStr}_${ruta.replace(/ /g, '_')}_${chofer.replace(/ /g, '_')}.pdf`;

    // Encabezado institucional elegante
    pdf.setFillColor(15, 23, 42); 
    pdf.rect(0, 0, 210, 38, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("AGUA PURIFICADA EL MEZQUITAL", 14, 18);
    
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Reporte Automatizado de Control de Ventas y Liquidacion", 14, 25);
    pdf.text(`Fecha: ${fechaStr}`, 160, 25);

    // Caja de datos del viaje
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.setFont("Helvetica", "bold");
    pdf.text("DATOS DE LA RUTA LOGISTICA", 14, 48);
    pdf.setFont("Helvetica", "normal");
    pdf.text(`Ruta/Zona:  ${ruta}`, 14, 55);
    pdf.text(`Chofer:     ${chofer}`, 14, 61);
    pdf.text(`Ayudante:   ${ayudante}`, 110, 55);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(14, 66, 196, 66);

    // --- TABLA PROFESIONAL DE PRODUCTOS ---
    pdf.setFont("Helvetica", "bold");
    pdf.text("DESGLOSE GENERAL DE MERCANCIA Y VENTA", 14, 73);
    
    // Encabezados de columnas (Añadida la columna Crédito)
    let y = 80;
    pdf.setFillColor(240, 244, 248);
    pdf.rect(14, y, 182, 7, "F");
    pdf.setFontSize(9);
    pdf.text("Descripcion de Producto", 16, y + 5);
    pdf.text("Enviado", 72, y + 5);
    pdf.text("Regreso", 92, y + 5);
    pdf.text("Credito", 112, y + 5);
    pdf.text("Vendidos", 132, y + 5);
    pdf.text("P. Unit", 155, y + 5);
    pdf.text("Subtotal", 176, y + 5);
    
    pdf.setFont("Helvetica", "normal");
    y += 7;

    // Fila 1: Botellón Tienda
    let tLlenos = 0, tCambios = 0;
    for (let z in datosZonas) { tLlenos += datosZonas[z].llenos; tCambios += datosZonas[z].cambios; }
    const vTienda = Number(document.getElementById("tiendaBotellones").value) || 0;
    const pTienda = Number(document.getElementById("precioTienda").value) || 0;
    const cBotellon = Number(document.getElementById("creditoBotellones").value) || 0;
    
    pdf.text("Botellon (Precio Tienda)", 16, y + 5);
    pdf.text(document.getElementById("salidaBotellones").value, 74, y + 5);
    pdf.text(String(tLlenos + tCambios), 94, y + 5);
    pdf.text(String(cBotellon), 114, y + 5);
    pdf.text(String(vTienda), 134, y + 5);
    pdf.text(`$${pTienda}.00`, 155, y + 5);
    pdf.text(document.getElementById("subtotalTienda").innerText, 176, y + 5);
    y += 7; pdf.line(14, y, 196, y);

    // Fila 2: Botellón Casa
    const vCasa = Number(document.getElementById("casaBotellones").value) || 0;
    const pCasa = Number(document.getElementById("precioCasa").value) || 0;
    pdf.text("Botellon (Precio Casa)", 16, y + 5);
    pdf.text("-", 76, y + 5); pdf.text("-", 96, y + 5); pdf.text("-", 116, y + 5);
    pdf.text(String(vCasa), 134, y + 5);
    pdf.text(`$${pCasa}.00`, 155, y + 5);
    pdf.text(document.getElementById("subtotalCasa").innerText, 176, y + 5);
    y += 7; pdf.line(14, y, 196, y);

    // Filas Especiales Dinámicas
    listaPreciosEspeciales.forEach(x => {
        pdf.text(`Especial: ${x.nombre}`, 16, y + 5);
        pdf.text("-", 76, y + 5); pdf.text("-", 96, y + 5); pdf.text("-", 116, y + 5);
        pdf.text(String(x.cantidad), 134, y + 5);
        pdf.text(`$${x.precio}.00`, 155, y + 5);
        pdf.text(`$${(x.cantidad * x.precio).toFixed(2)}`, 176, y + 5);
        y += 7; pdf.line(14, y, 196, y);
    });

    // Fila: Plásticos Faltantes
    const vFalB = Number(document.getElementById("faltanteBotellones").value) || 0;
    if(vFalB > 0) {
        pdf.text("Plasticos rotos / Faltante Fisico", 16, y + 5);
        pdf.text("-", 76, y + 5); pdf.text("-", 96, y + 5); pdf.text("-", 116, y + 5);
        pdf.text(String(vFalB), 134, y + 5);
        pdf.text(`$${document.getElementById("precioPlasticoFaltante").value}.00`, 155, y + 5);
        pdf.text(document.getElementById("subtotalPlasticoFaltante").innerText, 176, y + 5);
        y += 7; pdf.line(14, y, 196, y);
    }

    // Fila: Galones
    const cGal = document.getElementById("creditoGalones").value;
    pdf.text("Galones individuales", 16, y + 5);
    pdf.text(document.getElementById("salidaGalones").value, 74, y + 5);
    pdf.text(document.getElementById("arrastreRegresoGal").innerText, 94, y + 5);
    pdf.text(String(cGal), 114, y + 5);
    pdf.text(document.getElementById("vendidosGalones").value, 134, y + 5);
    pdf.text(`$${document.getElementById("precioGalon").value}.00`, 155, y + 5);
    pdf.text(document.getElementById("subtotalGalones").innerText, 176, y + 5);
    y += 7; pdf.line(14, y, 196, y);

    // Fila: Litros
    const cLit = document.getElementById("creditoLitro").value;
    pdf.text("Paquetes de Litro", 16, y + 5);
    pdf.text(document.getElementById("salidaLitro").value, 74, y + 5);
    pdf.text(document.getElementById("arrastreRegresoLitro").innerText, 94, y + 5);
    pdf.text(String(cLit), 114, y + 5);
    pdf.text(document.getElementById("vendidosLitro").value, 134, y + 5);
    pdf.text(`$${document.getElementById("precioLitro").value}.00`, 155, y + 5);
    pdf.text(document.getElementById("subtotalLitro").innerText, 176, y + 5);
    y += 7; pdf.line(14, y, 196, y);

    // Fila: Medios Litros
    const cMed = document.getElementById("creditoMedio").value;
    pdf.text("Paquetes de Medio Litro", 16, y + 5);
    pdf.text(document.getElementById("salidaMedio").value, 74, y + 5);
    pdf.text(document.getElementById("arrastreRegresoMedio").innerText, 94, y + 5);
    pdf.text(String(cMed), 114, y + 5);
    pdf.text(document.getElementById("vendidosMedio").value, 134, y + 5);
    pdf.text(`$${document.getElementById("precioMedio").value}.00`, 155, y + 5);
    pdf.text(document.getElementById("subtotalMedio").innerText, 176, y + 5);
    y += 7; pdf.line(14, y, 196, y);

    // Abonos extra
    const abonoVal = Number(document.getElementById("abonosExtra").value) || 0;
    if (abonoVal > 0) {
        pdf.text("Cobranzas ingresadas / Abonos de clientes", 16, y + 5);
        pdf.text("-", 76, y + 5); pdf.text("-", 96, y + 5); pdf.text("-", 116, y + 5); pdf.text("-", 136, y + 5); pdf.text("-", 155, y + 5);
        pdf.text(`$${abonoVal.toFixed(2)}`, 176, y + 5);
        y += 7; pdf.line(14, y, 196, y);
    }

    // --- SECCIÓN DE BALANCE FINAL ---
    y += 12;
    pdf.setFillColor(245, 247, 250);
    pdf.rect(110, y, 86, 26, "F");
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(10);
    
    pdf.text("RESUMEN DE LIQUIDACION", 114, y + 6);
    pdf.setFont("Helvetica", "normal");
    pdf.text(`Monto Neto Esperado:`, 114, y + 14);
    pdf.text(document.getElementById("resumenEsperado").innerText, 176, y + 14);
    
    pdf.text(`Efectivo Fisico Entregado:`, 114, y + 21);
    pdf.text(document.getElementById("resumenRecibido").innerText, 176, y + 21);
    
    y += 32;

    // Procesar texto de estado limpiando emojis y caracteres especiales corruptos
    let textoEstadoLimpio = document.getElementById("mensajeLiquidacion").innerText;
    textoEstadoLimpio = textoEstadoLimpio.replace("✅", "").replace("⚠", "").replace("  ", " ").trim();
    // Quitar acentos manualmente para asegurar compatibilidad total en jsPDF
    textoEstadoLimpio = textoEstadoLimpio.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if(textoEstadoLimpio.toUpperCase().includes("FALTA")) {
        pdf.setFillColor(254, 226, 226); 
        pdf.setDrawColor(239, 68, 68);
        pdf.rect(14, y, 182, 10, "FD"); 
        pdf.setTextColor(153, 27, 27);
    } else {
        pdf.setFillColor(220, 252, 231); 
        pdf.setDrawColor(34, 197, 94);
        pdf.rect(14, y, 182, 10, "FD"); 
        pdf.setTextColor(21, 128, 61);
    }
    
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`ESTADO DE CAJA: ${textoEstadoLimpio.toUpperCase()}`, 18, y + 6.5);

    // Justificación Notas
    pdf.setTextColor(15, 23, 42);
    y += 18;
    pdf.setFont("Helvetica", "bold");
    pdf.text("NOTAS Y COMENTARIOS DE LA JORNADA", 14, y);
    pdf.setFont("Helvetica", "oblique");
    pdf.setFontSize(9);
    
    let notasJustif = document.getElementById("textoJustificacion").value || "Sin observaciones registradas.";
    notasJustif = notasJustif.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Limpiar acentos
    pdf.text(notasJustif, 14, y + 6);

    // Firmas fijas abajo
    pdf.setFont("Helvetica", "bold");
    pdf.line(30, 270, 90, 270);
    pdf.text("Firma del Repartidor", 43, 275);
    pdf.line(120, 270, 180, 270);
    pdf.text("Firma de Recibido Caja", 131, 275);

    pdf.save(nombreArchivoPDF);
}

// ===================================
// RESET DEL SISTEMA CON CONFIRMACIÓN
// ===================================

function restablecerSistemaTodo() {
    const confirmacion = confirm("⚠ ALERTA DE SEGURIDAD\n\n¿Estás completamente seguro de que deseas borrar todos los datos actuales?\nEsta acción vaciará la memoria y no se puede deshacer.");
    if (!confirmacion) return;

    document.getElementById("rutaChofer").value = "";
    document.getElementById("rutaAyudante").value = "";
    document.getElementById("rutaNombre").value = "";
    document.getElementById("salidaBotellones").value = "0";
    document.getElementById("salidaGalones").value = "0";
    document.getElementById("salidaLitro").value = "0";
    document.getElementById("salidaMedio").value = "0";

    for (let z in datosZonas) { datosZonas[z] = crearEstructuraZona(); }

    const botones = document.querySelectorAll(".zona");
    botones.forEach(btn => { btn.classList.remove("completo"); btn.classList.add("pendiente"); });

    listaPreciosEspeciales = [];
    document.getElementById("contenedorPreciosEspeciales").innerHTML = "";
    document.getElementById("contenedorPreciosEspecialesValores").innerHTML = "";

    document.getElementById("creditoBotellones").value = "0";
    document.getElementById("casaBotellones").value = "0";
    document.getElementById("abonosExtra").value = "0";
    document.getElementById("creditoGalones").value = "0";
    document.getElementById("creditoLitro").value = "0";
    document.getElementById("creditoMedio").value = "0";

    const idsCaja = ["1000", "500", "200", "100", "50", "20", "10", "5", "2", "1", "05"];
    idsCaja.forEach(id => document.getElementById("e" + id).value = "0");
    document.getElementById("eDolar").value = "0";
    document.getElementById("textoJustificacion").value = "";

    calcularEfectivoCaja();
    calcularLogicaBotellones();
    mostrarPantalla(1);
}

function obtenerNombreBonito(nombre) {
    const nombres = {
        frente: "Frente del Camión", atras: "Parte Trasera",
        panalIZ: "Panal Izquierdo", panalDE: "Panal Derecho",
        cajonDI: "Cajón Delantero Izquierdo", cajonDD: "Cajón Delantero Derecho",
        cajonTI: "Cajón Trasero Izquierdo", cajonTD: "Cajón Trasero Derecho", techo: "Techo"
    };
    return nombres[nombre] || nombre;
}

window.onload = function() {
    mostrarPantalla(1);
};