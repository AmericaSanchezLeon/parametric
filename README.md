# Muro Paramétrico

App web (sin backend) para diseñar la elevación de un muro de tabique/block
a partir de parámetros y exportar el resultado a **DXF**.

## Uso

Abre `index.html` directamente en el navegador, o sirve la carpeta con
cualquier servidor estático:

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

## Parámetros

- **Ancho / alto del muro** (mm).
- **Pieza**: largo, alto y junta de mortero. Incluye presets de block hueco
  (400×200) y tabique (240×60), o valores personalizados.
- **Aparejo**: cuatrapeado (a hueso corrido, hiladas alternas desplazadas
  media pieza) o a plomo (juntas alineadas).
- **Aberturas**: lista de puertas/ventanas (x, y, ancho, alto medidos desde
  la esquina inferior izquierda del muro). Las piezas que se cruzan con una
  abertura no se dibujan.

El número de hiladas y de piezas por hilada se ajusta automáticamente para
que la pieza real (ligeramente distinta a la nominal) cubra el muro de forma
exacta, manteniendo la junta especificada.

## Exportar DXF

El botón **Descargar DXF** genera un archivo `muro-parametrico.dxf`
(formato AutoCAD R12, compatible con cualquier lector DXF) con capas:

- `WALL` – contorno del muro.
- `UNITS` – contorno de cada pieza (tabique/block).
- `OPENINGS` – contorno de cada abertura.
- `TEXT` – rótulo con dimensiones y tipo de aparejo.

Todas las coordenadas están en milímetros, origen en la esquina inferior
izquierda del muro.

## Estructura

- `index.html` / `css/style.css` – interfaz.
- `js/wall-geometry.js` – cálculo del patrón de hiladas y recorte por aberturas.
- `js/dxf-writer.js` – escritor DXF mínimo (entidades LINE/TEXT).
- `js/app.js` – vista previa en SVG y descarga del DXF.
