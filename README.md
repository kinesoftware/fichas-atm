# 🦷 Fichas ATM · Sistema de Historias Clínicas Temporomandibulares (Local-First)

> **Software libre, gratuito y 100% offline para la evaluación clínica, diagnóstico (criterios CDI-TTM), registro fotográfico y seguimiento evolutivo de la Articulación Temporomandibular.**  
> Diseñado bajo arquitectura **Local-First**: tus datos nunca salen de tu equipo.

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](./LICENSE)
[![Sin Servidor](https://img.shields.io/badge/servidor-no_requerido-success.svg)](#-privacidad-absoluta-local-first)
[![100% Offline](https://img.shields.io/badge/funciona-100%25_offline-orange.svg)](#-c%C3%B3mo-bajarlo-y-usarlo-en-1-minuto)

---

## 🎁 Libertad Total de Uso, Modificación y Distribución

Este proyecto es **software libre de código abierto** bajo la **Licencia MIT**. Esto significa que:

* ✅ **Uso libre y gratuito:** Puedes utilizarlo de por vida en tu consultorio privado, centro de rehabilitación, clínica u hospital sin pagar jamás ninguna suscripción ni licencia.
* ✅ **Libre para modificar:** Tienes total libertad para adaptar las preguntas, agregar nuevos campos, cambiar los colores, traducirlo a otros idiomas o adaptarlo a otras especialidades de kinesiología o medicina (columna, postura, suelo pélvico, etc.).
* ✅ **Libre para distribuir:** Puedes compartirlo con colegas, enviarlo por correo, pasarlo en un pendrive a tus alumnos o subirlo a tu propio sitio web.
* ✅ **Sin restricciones comerciales:** Puedes usarlo en tu actividad profesional diaria con total tranquilidad.

---

## 📥 Cómo Bajarlo y Usarlo en 1 Minuto

No necesitas instalar programas complicados, ni bases de datos, ni saber programar.

### Método 1: Descarga directa (El más fácil para cualquier persona)
1. **Descarga el proyecto:** Haz clic en el botón verde **`Code`** arriba a la derecha y selecciona **`Download ZIP`** (o [haz clic aquí para descargar el ZIP directamente](https://github.com/kinesoftware/fichas-atm/archive/refs/heads/main.zip)).
2. **Descomprime el archivo:** Extrae la carpeta descargada en cualquier lugar de tu computadora (por ejemplo, en *Documentos* o en el *Escritorio*).
3. **Ábrelo con doble clic:** Haz doble clic sobre el archivo **`index.html`**. Se abrirá en tu navegador web habitual (Chrome, Edge, Safari, Firefox, Brave, etc.).
4. **¡Listo!** Ya puedes comenzar a cargar tus pacientes y realizar evaluaciones. Funciona **completamente offline**, incluso si te quedas sin conexión a internet o llevas tu laptop al consultorio.

### Método 2: Clonar con Git (Para desarrolladores)
```bash
git clone https://github.com/kinesoftware/fichas-atm.git
cd fichas-atm
# Abre el index.html en tu navegador:
open index.html # En macOS
# o start index.html en Windows
```

---

## 🔒 Privacidad Absoluta (Local-First)

La privacidad de tus pacientes es la máxima prioridad:

* **Tus datos nunca salen de tu computadora:** A diferencia de las plataformas en la nube, **Fichas ATM no tiene servidores remotos, bases de datos externas ni telemetría**.
* **Almacenamiento en `IndexedDB` local:** Toda la información médica, mediciones y fotografías clínicas se guardan exclusivamente en el almacenamiento interno de tu propio navegador.
* **Custodia legal garantizada:** Al no transmitirse datos por internet a terceros, cumples automáticamente con las leyes de confidencialidad médica y protección de datos personales (RGPD, HIPAA, Ley 25.326, etc.).

---

## ✨ Características Principales

### 1. Asistente de Evaluación Clínica en 6 Pasos
* **Paso 1: Filiación y Hábitos:** Datos del paciente, cálculo automático de edad, antecedentes y registro de hábitos parafuncionales (bruxismo diurno/nocturno, apretamiento, masticación unilateral, onicofagia).
* **Paso 2: ATM y Rangos Mandibulares:** Palpación condilar (polo lateral y posterior), ruidos articulares (clic y crepitación en apertura/cierre), y mediciones milimétricas pre y post-tratamiento (apertura libre, asistida, lateralidades y protrusión).
* **Paso 3: Músculos y Cadena Cervical:** Palpación del sistema masticatorio (masetero, temporal, pterigoideos) y musculatura cervical/postural (trapecios, esternocleidomastoideo, suboccipitales).
* **Paso 4: Dolor y Oclusión:** Escala Visual Analógica (EVA 0–10) con respuesta visual dinámica, factores agravantes/atenuantes y relación oclusal (Angle, estabilidad y contactos).
* **Paso 5: Criterios Diagnósticos CDI-TTM:** Clasificación orientativa en Grupos I (muscular), II (desplazamientos de disco) y III (artralgias/artrosis), junto con plan de tratamiento.
* **Paso 6: Anotaciones y Fotos:** Registro de observaciones clínicas y adjuntos de fotografías optimizadas automáticamente en el navegador.

### 2. Soporte Multi-Profesional
* Varios profesionales pueden compartir la misma computadora o consultorio.
* Selector rápido de usuario activo en la barra superior.
* Cada profesional cuenta con su propio nombre, título, número de matrícula (M.N. / M.P.), logo institucional y **firma digital** personalizada para los informes.
* Incluye una herramienta integrada con **🪄 eliminación automática de fondo blanco** para firmas fotografiadas en papel.

### 3. Exportación Granular y Flexible (JSON)
* **De a una sola ficha:** Botón directo `JSON` en cada sesión para descargar fichas individuales.
* **Por paciente:** Descarga en un único archivo todo el historial clínico y evolución de un paciente.
* **Por selección múltiple (Lotes):** Casillas de verificación para marcar grupos de fichas y exportarlas con un solo clic.
* **Copia de seguridad completa:** Respaldo íntegro de toda la clínica para migrar de equipo o guardar en un pendrive o disco externo.
* **Importación simétrica:** Reconoce e importa automáticamente cualquiera de estos archivos con solo arrastrarlos o abrirlos.

### 4. Informes Profesionales en PDF y A4
* Generación instantánea de hojas clínicas formateadas para imprimir o guardar en PDF.
* Incluye membrete con logo, datos de contacto del consultorio, desglose completo de la sesión y firma digital del profesional actuante.

### 5. Comparador Evolutivo Sesión a Sesión
* Contraste directo entre dos consultas de un mismo paciente.
* Cálculo automático de KPIs de evolución: variación del dolor en la escala EVA, cambio en milímetros de apertura bucal y remisión de síntomas.
* Pestaña interactiva *"Lo que cambió"* que resalta automáticamente las diferencias clínicas.

---

## 🛠️ Tecnologías y Desarrollo

Este proyecto fue desarrollado bajo la filosofía de máxima sencillez, durabilidad y cero dependencias pesadas:

* **HTML5 semántico y accesible.**
* **CSS3 moderno** con variables, flexbox, grid y diseño responsive adaptable a tablets y computadoras de escritorio.
* **JavaScript ES Modules (Vanilla JS):** Código desacoplado, modular y sin dependencias de frameworks externos como React o Angular.
* **Empaquetado offline:** Cuenta con un bundle único (`js/app.bundle.js`) generado con `esbuild`, lo que permite que el software funcione sin problemas directamente abriendo el archivo local con `file:///` sin bloqueos de CORS.

Si deseas modificar el código fuente en `js/modules/` y regenerar el bundle:
```bash
# Instalar esbuild o correrlo al vuelo:
npx esbuild js/app.js --bundle --format=iife --outfile=js/app.bundle.js
```

---

## ⚕️ Descargo de Responsabilidad Médica (*Medical Disclaimer*)

Este software es una herramienta auxiliar de registro asistencial y documental destinada al uso por parte de profesionales de la salud capacitados. Las referencias y criterios CDI-TTM incorporados son de apoyo orientativo y en ningún caso sustituyen el juicio clínico, examen físico directo, diagnóstico ni tratamiento por parte de un profesional universitario matriculado.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Eres libre de usarlo, modificarlo, bifurcarlo (*fork*) y distribuirlo comercial o privadamente.

Para más detalles, consulta el archivo [LICENSE](./LICENSE).

---

## 📬 Contacto y Comunidad

¿Tienes dudas, sugerencias o quieres compartir mejoras?
* **Email:** [fichas.atm@gmail.com](mailto:fichas.atm@gmail.com)
* **GitHub:** [https://github.com/kinesoftware/fichas-atm](https://github.com/kinesoftware/fichas-atm)
