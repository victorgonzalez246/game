import fs from 'fs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from 'docx';

// Estilos de colores
const COLOR_PRIMARY = '0F172A'; // Azul muy oscuro / pizarra
const COLOR_ACCENT = '06B6D4';  // Cyan
const COLOR_SECONDARY = '3B82F6'; // Azul
const COLOR_GOLD = 'D97706';    // Dorado
const COLOR_MUTED = '64748B';   // Gris elegante
const COLOR_BG_LIGHT = 'F8FAFC';// Fondo suave
const COLOR_BG_ALT = 'F1F5F9';  // Alternado tabla

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 150 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 32, // 16pt
        color: COLOR_PRIMARY,
        font: 'Segoe UI'
      })
    ]
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_SECONDARY,
        font: 'Segoe UI'
      })
    ]
  });
}

function createHeading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_PRIMARY,
        font: 'Segoe UI'
      })
    ]
  });
}

function createParagraph(text, isBold = false) {
  return new Paragraph({
    spacing: { before: 60, after: 120, line: 300 },
    children: [
      new TextRun({
        text: text,
        bold: isBold,
        size: 21, // 10.5pt
        color: '334155',
        font: 'Segoe UI'
      })
    ]
  });
}

function createBullet(title, desc) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 80 },
    children: [
      new TextRun({
        text: title + ': ',
        bold: true,
        size: 21,
        color: COLOR_PRIMARY,
        font: 'Segoe UI'
      }),
      new TextRun({
        text: desc,
        size: 21,
        color: '475569',
        font: 'Segoe UI'
      })
    ]
  });
}

function createCodeBlock(codeLines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_ACCENT },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: codeLines.map(line => new Paragraph({
              spacing: { before: 20, after: 20 },
              children: [
                new TextRun({
                  text: line,
                  font: 'Consolas',
                  size: 18,
                  color: '0F172A'
                })
              ]
            }))
          })
        ]
      })
    ]
  });
}

function createStyledTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: '0F172A' },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: 'Segoe UI' })
              ]
            })
          ]
        }))
      }),
      ...rows.map((row, idx) => new TableRow({
        children: row.map(cell => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? 'FFFFFF' : COLOR_BG_ALT },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: cell, size: 19, color: '334155', font: 'Segoe UI' })
              ]
            })
          ]
        }))
      }))
    ]
  });
}

async function generateDocumentation() {
  const doc = new Document({
    creator: 'Antigravity AI',
    title: 'Documentación Técnica - Snake Game & n8n Integration',
    description: 'Documentación completa del juego de la serpiente, sistema de calificaciones, progresión de coronas y flujos automatizados en n8n.',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children: [
          // Portada / Encabezado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: '🐍 SNAKE GAME WEB & AUTOMATIZACIÓN CON n8n',
                bold: true,
                size: 38,
                color: COLOR_PRIMARY,
                font: 'Segoe UI'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 300 },
            children: [
              new TextRun({
                text: 'Documentación de Arquitectura, Mecánicas de Juego y Flujos de Automatización',
                size: 22,
                color: COLOR_MUTED,
                font: 'Segoe UI',
                italics: true
              })
            ]
          }),

          // Resumen Ejecutivo
          createHeading1('1. Resumen Ejecutivo del Proyecto'),
          createParagraph(
            'El presente proyecto consiste en el desarrollo de una aplicación web moderna del clásico juego de la serpiente (Snake Game) construida con React y Vite, diseñada con una interfaz gráfica estilizada bajo estética Cyberpunk / Dark Glow sin barras de desplazamiento (viewport adaptado a 100vh). ' +
            'Además de las dinámicas tradicionales de movimiento y recolección, el sistema incorpora un gestor de jugadores activos, tabla de calificaciones local persistente, barra de progreso dinámico con 3 niveles de coronas de maestría y una completa integración con la plataforma de automatización de flujos de trabajo n8n.'
          ),

          // Mecánicas del Juego
          createHeading1('2. Características y Mecánicas del Juego'),
          createParagraph('La aplicación incorpora mecánicas diseñadas para maximizar la competitividad y la retención del usuario:'),

          createBullet('🎮 Registro de Jugador', 'Permite al usuario ingresar su apodo o nombre antes o durante la partida, asociando sus logros y puntuación en tiempo real.'),
          createBullet('📊 Sistema de Calificaciones (Leaderboard)', 'Panel interactivo donde se visualiza el top de mejores jugadores clasificados por fecha, puntaje y longitud alcanzada.'),
          createBullet('⚡ Aceleración Progresiva', 'La velocidad del juego incrementa gradualmente con cada manzana consumida (tick rate variable desde 160ms hasta 50ms), aumentando el desafío.'),
          createBullet('🖥️ Diseño Full-Viewport (100vh)', 'Interfaz optimizada y centrada milimétricamente en pantalla para no generar scrolls verticales ni horizontales en monitores estándar.'),

          // Sistema de Coronas
          createHeading2('2.1. Sistema de Progresión de Coronas y Barra de Hitos'),
          createParagraph('Para incentivar el juego de alto rendimiento, se implementó una barra de progreso visual con tres hitos de puntuación que otorgan coronas que se dibujan en la cabeza de la serpiente:'),

          createStyledTable(
            ['Nivel / Corona', 'Puntaje Requerido', 'Icono y Color', 'Efecto Visual en Juego'],
            [
              ['Nivel 1: Corona de Bronce', '800 Puntos', '👑 Bronce (#cd7f32)', 'Corona de bronce sobre la cabeza y aura ámbar'],
              ['Nivel 2: Corona de Plata', '1,600 Puntos', '👑 Plata (#e2e8f0)', 'Corona plateada con destello y brillo aumentado'],
              ['Nivel 3: Corona de Oro Real', '3,500 Puntos', '👑 Oro (#fbbf24)', 'Corona dorada máxima con resplandor legendario']
            ]
          ),

          // Integración con n8n
          createHeading1('3. Integración y Automatización con n8n'),
          createParagraph(
            'n8n es una plataforma de automatización de flujos basada en nodos (workflow automation). Para este videojuego se estructuraron tres flujos de trabajo en formato JSON, permitiendo orquestar eventos del juego con servicios en la nube, bases de datos y canales de mensajería.'
          ),

          createHeading2('3.1. Flujo 1: n8n-snake-simple.json (Procesador Ligero)'),
          createParagraph(
            'Diseñado para funcionar sin necesidad de configurar credenciales externas en n8n. Recibe la partida vía Webhook, evalúa la puntuación del jugador mediante un nodo de código JavaScript y devuelve inmediatamente el rango alcanzado.'
          ),
          createBullet('Endpoint Webhook', 'POST /webhook/snake-score-simple'),
          createBullet('Lógica de Rangos', '🌱 Novato (<50 pts) | ⚡ Avanzado (50-99 pts) | 🔥 Maestro (100-199 pts) | 👑 Dios de la Serpiente (200+ pts)'),
          createBullet('Respuesta', 'HTTP 200 con payload JSON detallando el estado, mensaje y fecha.'),

          createHeading2('3.2. Flujo 2: n8n-snake-workflow.json (Récords, Hojas de Cálculo y Deploy)'),
          createParagraph(
            'Un flujo empresarial completo que maneja múltiples ramificaciones según el resultado de la partida:'
          ),
          createBullet('Notificación por Correo (Gmail OAuth2)', 'Dispara un correo electrónico HTML profesional si el jugador supera el récord histórico anterior.'),
          createBullet('Persistencia en Google Sheets', 'Inserta una nueva fila con Jugador, Puntuación, Si fue Récord, Longitud final, Velocidad y Manzanas comidas.'),
          createBullet('Webhook de Despliegue CI/CD', 'Ruta secundaria /webhook/snake-deploy que permite disparar builds y despliegues automáticos del frontend.'),

          createHeading2('3.3. Flujo 3: n8n-snake-crowns-achievements.json (Logros y Notificaciones)'),
          createParagraph(
            'Flujo enfocado en la progresión de coronas (800, 1600 y 3500 puntos). Procesa el desbloqueo y genera automáticamente mensajes enriquecidos:'
          ),
          createBullet('Endpoint Webhook', 'POST /webhook/snake-crown-unlock'),
          createBullet('Discord Webhook Integrado', 'Genera un Rich Embed con formato JSON listo para Discord con los colores temáticos de cada corona y avatar de serpiente.'),
          createBullet('Telegram / Slack Template', 'Crea el mensaje Markdown listo para ser enviado a canales de anuncios de la comunidad.'),
          createBullet('Bifurcación Oro Real', 'Filtra si el jugador superó los 3,500 puntos para emitir un certificado especial de "Rey de la Serpiente".'),

          // Estructura de Datos
          createHeading1('4. Estructura de Datos del Webhook (Payload JSON)'),
          createParagraph('Ejemplo del objeto enviado desde el cliente web hacia el webhook de n8n al desbloquear una corona:'),

          createCodeBlock([
            'POST /webhook/snake-crown-unlock HTTP/1.1',
            'Host: tu-instancia-n8n.com',
            'Content-Type: application/json',
            '',
            '{',
            '  "playerName": "Alex Pro",',
            '  "score": 850,',
            '  "tier": 1,',
            '  "crownName": "Corona de Bronce",',
            '  "applesEaten": 85,',
            '  "timestamp": "2026-09-21T14:20:00.000Z"',
            '}'
          ]),

          new Paragraph({ spacing: { before: 150, after: 100 } }),
          createParagraph('Respuesta devuelta por n8n hacia el juego:'),
          createCodeBlock([
            'HTTP/1.1 200 OK',
            'Content-Type: application/json',
            '',
            '{',
            '  "status": "crown_unlocked",',
            '  "message": "¡Gran logro! Desbloqueaste la Corona de Bronce. Sigue subiendo para la de Oro Real!",',
            '  "player": "Alex Pro",',
            '  "score": 850,',
            '  "tier": 1,',
            '  "trophyId": "TROPHY_BRONZE_800",',
            '  "badge": "👑🥉"',
            '}'
          ]),

          // Arquitectura del Sistema
          createHeading1('5. Arquitectura y Tecnologías Empleadas'),
          createStyledTable(
            ['Capa / Componente', 'Tecnología', 'Función Principal'],
            [
              ['Frontend Core', 'React 19 + Vite 8', 'Renderizado reactivo rápido y ciclo de vida de la aplicación'],
              ['Canvas / Renderizado', 'HTML5 Canvas 2D', 'Dibujo de la serpiente, comida, rejilla y coronas animadas'],
              ['Estilos y Layout', 'Vanilla CSS Cyberpunk', 'Diseño oscuro, bordes luminiscentes, grid centrado y viewport 100vh'],
              ['Control de Versiones', 'Git & GitHub', 'Repositorio remoto sincronizado (victorgonzalez246/game)'],
              ['Automatización Backend', 'n8n Workflow Automation', 'Recepción de eventos, webhooks, notificaciones y almacenamiento']
            ]
          ),

          // Guía de Importación n8n
          createHeading1('6. Guía de Uso e Importación en n8n'),
          createParagraph('Para desplegar y utilizar los flujos creados en cualquier servidor o instancia local de n8n:'),
          createBullet('Paso 1', 'Abrir la interfaz web de n8n (por ejemplo en http://localhost:5678).'),
          createBullet('Paso 2', 'Navegar a la sección Workflows en la barra lateral izquierda.'),
          createBullet('Paso 3', 'Hacer clic en el menú superior derecho (...) y seleccionar "Import from File".'),
          createBullet('Paso 4', 'Seleccionar el archivo deseado (n8n-snake-simple.json, n8n-snake-workflow.json o n8n-snake-crowns-achievements.json).'),
          createBullet('Paso 5', 'Activar el interruptor "Active" en la esquina superior para habilitar el webhook de escucha.')
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('c:\\Users\\HP78D\\Downloads\\quizz-5\\DOCUMENTACION_JUEGO_Y_N8N.docx', buffer);
  console.log('Documento Word creado exitosamente: DOCUMENTACION_JUEGO_Y_N8N.docx');
}

generateDocumentation().catch(err => {
  console.error('Error generando documento:', err);
  process.exit(1);
});
