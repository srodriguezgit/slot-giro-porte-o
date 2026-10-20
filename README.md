# Giro Porteño

Juego de rodillos desarrollado con TypeScript y Phaser, con una identidad visual inspirada en Buenos Aires y el fileteado porteño.

Un proyecto personal que combina lógica de juego, animaciones, sonido y una interfaz adaptada a computadoras y celulares.

**Demo:** pendiente de publicación.

[Ver mi portfolio](https://srodriguezgit.github.io/portfolio/)

> Proyecto demostrativo con créditos ficticios. No permite depósitos, retiros ni apuestas con dinero real.

## La propuesta

Giro Porteño lleva elementos de la cultura argentina a un juego de tres rodillos: mate, empanada, choripán, parrilla y Obelisco.

La experiencia incluye un escenario nocturno, detalles ornamentales, música ambiental y animaciones que destacan las combinaciones ganadoras.

## Funcionalidades

- Tres rodillos con tres símbolos visibles por columna.
- Siete líneas de premio: tres horizontales, dos diagonales, V y V invertida.
- Valor del giro ajustable entre 10, 20, 50 y 100 créditos.
- Evaluación de múltiples líneas ganadoras en un mismo giro.
- Animación y resaltado de las combinaciones premiadas.
- Tabla de premios con representación visual de las líneas.
- Música ambiental y efectos de sonido con control de activación.
- Preferencia de sonido guardada en el navegador.
- Distribución adaptada a pantallas de escritorio y celulares.
- Reinicio de la demo con 1.000 créditos ficticios.

## Tecnologías

- **TypeScript:** lógica del juego y definición de tipos.
- **Phaser:** representación de los rodillos, interacción y animaciones.
- **Vite:** entorno de desarrollo y compilación.
- **HTML y CSS:** estructura, fondo y componentes complementarios.
- **Web Audio API:** efectos de sonido y control de audio.

## Organización del código

La lógica se divide en componentes con responsabilidades específicas:

| Componente | Responsabilidad |
| --- | --- |
| `SlotEngine` | Genera las posiciones de parada y los símbolos visibles. |
| `Paylines` | Define los recorridos de las siete líneas válidas. |
| `WinEvaluator` | Evalúa las combinaciones y calcula los premios. |
| `GameSession` | Administra los créditos y el valor del giro. |
| `ReelView` | Representa y anima cada rodillo. |
| `GameAudio` | Gestiona la música, los efectos y la preferencia de sonido. |
| `SlotScene` | Coordina la interfaz y el flujo de cada giro. |

El resultado se calcula antes de iniciar la animación. Los rodillos se desplazan hasta las posiciones obtenidas y, cuando todos terminan, se acredita el premio y se muestran las líneas ganadoras.

Durante el giro se bloquean las acciones que podrían alterar la partida, como cambiar la apuesta o reiniciar.

## Reglas

Cada giro descuenta el valor seleccionado del saldo disponible.

Una línea paga cuando contiene tres símbolos iguales, uno por rodillo. Las siete líneas participan en cada giro.

| Símbolo | Multiplicador |
| --- | ---: |
| Mate | ×1 |
| Empanada | ×2 |
| Choripán | ×4 |
| Parrilla | ×8 |
| Obelisco | ×12 |

El premio de cada línea se calcula multiplicando el valor del giro por el multiplicador del símbolo. Si hay varias líneas ganadoras, sus premios se suman.

Por ejemplo, una línea de empanadas en un giro de 10 créditos entrega un premio de 20 créditos. El costo del giro se descuenta por separado.

## Ejecutar localmente

Requisitos: Node.js y npm.

Instalar las dependencias:

```bash
npm ci
```

Iniciar el entorno de desarrollo:

```bash
npm run dev
```

Generar la versión de producción:

```bash
npm run build
```

Previsualizar la compilación:

```bash
npm run preview
```

En Windows PowerShell, si la ejecución de `npm.ps1` está bloqueada, utilizar `npm.cmd` en lugar de `npm`.

## Decisiones de desarrollo

- Separar el cálculo de resultados de su representación visual.
- Centralizar las reglas y los multiplicadores para facilitar cambios.
- Sincronizar la acreditación de premios con el final de las animaciones.
- Adaptar la distribución de controles a la orientación de la pantalla.
- Mantener una identidad visual consistente entre tablero, botones y menú de premios.

## Alcance

La demo funciona en el navegador y no requiere un servidor de aplicación ni una base de datos.

Los resultados utilizan `Math.random()`. El proyecto está pensado como una experiencia de portfolio, no como un sistema para operar apuestas con dinero real.

## Música y recursos

Música: **Tango pour Annick**, disponible en [Pixabay](https://pixabay.com/es/music/tango-tango-pour-annick-288336/).

Licencia: [Pixabay Content License](https://pixabay.com/service/license-summary/).

La música pertenece a su respectivo titular y no está incluida en una eventual licencia del código fuente.

## Autor

**Santiago Rodríguez**

Estudiante avanzado de Ingeniería en Sistemas de Información — UTN FRBA.

[Portfolio](https://srodriguezgit.github.io/portfolio/) · [GitHub](https://github.com/srodriguezgit)
