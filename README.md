# 🦷 Fichas ATM · Historia Clínica Digital Temporomandibular

> Software clínico para la evaluación, diagnóstico (criterios CDI-TTM), registro fotográfico y seguimiento evolutivo de trastornos de la articulación temporomandibular. **100% gratuito, de código abierto y con arquitectura Local-First (sin servidor).**

---

## 🔒 Privacidad por Diseño (Local-First)

* **Tus datos nunca salen de tu dispositivo:** A diferencia de las plataformas en la nube tradicionales, **Fichas ATM** no tiene backend, base de datos externa ni recopilación de telemetría.
* **Almacenamiento en `IndexedDB`:** Las historias clínicas y fotos adjuntas se guardan de forma encriptada/aislada en la memoria de tu propio navegador.
* **Sin costo de mantenimiento:** Funciona enteramente en el lado del cliente (HTML, CSS y JavaScript moderno).
* **Cumplimiento legal automático:** Al no existir un servidor intermedio, el profesional de la salud conserva el 100% de la custodia de las historias clínicas según normativas de protección de datos (RGPD / HIPAA / Ley 25.326).

---

## ✨ Características Principales

1. **Formulario Clínico Asistido (6 Pasos):**
   * **1. Paciente y Antecedentes:** Filiación, cálculo automático de edad, hábitos parafuncionales (bruxismo, apretamiento, masticación unilateral, onicofagia) y antecedentes.
   * **2. ATM Palpación y Rango:** Registro de ruidos articulares (clic vs. crepitación, fase de apertura/cierre), dolor condilar y mediciones mandibulares en milímetros (pre y post-tratamiento).
   * **3. Músculos y Cadena Cervical:** Palpación masetero, temporal, pterigoideos y correlación osteopática/postural (trapecios, esternocleidomastoideo, suboccipitales).
   * **4. Dolor y Oclusión:** Escala visual analógica (EVA 0-10) interactiva con gradiente semántico, factores moduladores y clasificación oclusal (Angle I/II/III, estabilidad, contactos).
   * **5. Criterios Diagnósticos CDI-TTM:** Grupos I (muscular), II (disco) y III (artralgia/artrosis) con observaciones y plan de tratamiento.
   * **6. Anotaciones y Fotos Clínicas:** Adjuntos de imágenes locales comprimidas en canvas (máx. 1920px) sin subir archivos a la red.

2. **Comparador de Evolución Sesión a Sesión:**
   * Contraste directo entre cualquier par de sesiones (Sesión X vs. Sesión Y).
   * Tarjetas de KPIs automáticas (variación del dolor EVA, apertura bucal y remisión de ruidos).
   * Resumen destacado de transiciones clínicas (*"Lo que cambió"*).

3. **Reportes Homologados A4 para Impresión y PDF:**
   * Hojas clínicas formateadas según estándares para guardar en PDF o imprimir.
   * Integración de firma digital, membrete, logo y matrícula del profesional.

4. **Copias de Seguridad (Backups JSON):**
   * Botón para exportar todas las fichas en un único archivo `.json`.
   * Restauración instantánea para migrar de computadora o navegador.

5. **Instalable y Offline (PWA):**
   * Funciona sin conexión a internet una vez cargado.
   * Se puede instalar en la pantalla de inicio o escritorio (Chrome, Safari, Edge) como una app nativa.

---

## 🚀 Cómo ponerlo online gratis (GitHub Pages)

Puedes hospedar esta aplicación en menos de 2 minutos sin pagar nada:

1. Crea un repositorio público o privado en tu cuenta de [GitHub](https://github.com) llamado `fichas-atm`.
2. Sube los archivos de este directorio:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fichas ATM Local-First"
   git branch -M main
   git remote add origin https://github.com/kinesoftware/fichas-atm.git
   git push -u origin main
   ```
3. En GitHub, ve a **Settings** > **Pages**.
4. En **Build and deployment** > **Branch**, selecciona `main` y la carpeta `/ (root)`. Haz clic en **Save**.
5. ¡Listo! En segundos tu aplicación estará activa en `https://kinesoftware.github.io/fichas-atm/`.

---

## 📬 Contacto y Soporte

Para consultas, sugerencias o contribuciones:
* Email: [fichas.atm@gmail.com](mailto:fichas.atm@gmail.com)
* Repositorio: [https://github.com/kinesoftware/fichas-atm](https://github.com/kinesoftware/fichas-atm)

---

## 💻 Uso Local sin Internet (Doble Clic)

Si no deseas subirlo a internet:
1. Abre una terminal en esta carpeta y corre cualquier servidor estático local (opcional):
   ```bash
   npx serve .
   # o con Python:
   python3 -m http.server 8000
   ```
2. O sube el código a **Cloudflare Pages** o **Vercel** arrastrando la carpeta.

---

## ⚕️ Descargo de Responsabilidad Médica (*Disclaimer*)

Este software ha sido diseñado como herramienta auxiliar de gestión documental y soporte para profesionales de la salud capacitados. No reemplaza el juicio clínico, examen presencial, diagnóstico ni tratamiento por parte de un profesional matriculado.

## 📄 Licencia

Publicado bajo Licencia **MIT**. Consulta el archivo [`LICENSE`](./LICENSE) para más detalles.
