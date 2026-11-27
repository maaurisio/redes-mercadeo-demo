# RedPulse · Prototipo de Plataforma de Seguimiento y Análisis de Redes de Mercadeo

**RedPulse** es un prototipo web navegable (SaaS B2B) para líderes de redes de mercadeo por catálogo con campañas de 21 días y 17 campañas anuales. Incluye 22 pantallas funcionales: tablero, importación y previsualización de Excel, directorio y ficha de socios, segmentación, agenda, proyecciones, analítica, exportación y administración multicuenta.

> **Entorno de prototipo · Datos 100 % ficticios de demostración.** No se usan marcas comerciales reales ni datos personales reales.

## Stack

- React 18 + Vite 6 + TypeScript (strict)
- Tailwind CSS v4
- SheetJS (`xlsx`) para importar archivos `.xlsx` reales en el navegador
- ExcelJS para exportar los 3 reportes con formato ejecutivo, fórmulas, filtros y pestañas
- Persistencia en `localStorage` (historial de cortes, rol, filtros, prioridades, gestiones, plantillas y línea base)

## Requisitos

- Node.js 20+ y npm (probado con Node 22 / npm 10)
- Opcional: `uv` para regenerar los datos ficticios con Python

## Instalación y servidor local

```powershell
cd "C:\Users\mauri\Documents\prototypes\Redes de Mercadeo"
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**.

Otros comandos:

```powershell
npm run build     # tsc -b && vite build (verificación de tipos + bundle de producción)
npm run preview   # sirve el build de producción
npm run typecheck # sólo verificación de TypeScript
```

## Datos de demostración

Los archivos Excel y el manifest se generaron en la Fase 1 y están versionados en:

- `data/mock_excel/` — 5 archivos `.xlsx` + `seed_data_manifest.json` (fuente del generador)
- `public/data/mock_excel/` — copia servida en producción (Vercel) para las cargas rápidas

| Archivo | Contenido |
|---|---|
| `01_Red_Mediana_383_Corte1.xlsx` | 383 socios, 6 subredes, 388 filas (2 duplicadas y 3 observadas), meta 7,500 pts, día 8 |
| `02_Red_Mediana_383_Corte2.xlsx` | 383 socios, 5 conversiones, 7,560 pts, día 14 |
| `03_Red_Pequena_25_Socios.xlsx` | 25 socios, 2 subredes |
| `04_Red_Grande_1500_Socios.xlsx` | 1,500 socios, 12 subredes |
| `05_Cuenta_B_Aislada_120_Socios.xlsx` | Cuenta B aislada, prefijo `500XXX`, meta 4,500 pts |

Casos de prueba incluidos: `200101` (17 campañas históricas), `200102` (5 campañas), 31 socios sin pedido que compraron en la campaña anterior, 28 con saldo en monedero sin pedido y cumpleañeros dentro de la campaña.

### Regenerar los Excel (opcional)

El generador usa semilla fija `random.seed(42)`, por lo que es reproducible:

```powershell
& C:\Users\mauri\.local\bin\uv.exe run --with pandas --with openpyxl python generate_mock_data.py
Copy-Item data/mock_excel/* -Destination public/data/mock_excel -Force
```

Si `uv` no está en esa ruta, instálalo o usa `uv run --with pandas --with openpyxl python generate_mock_data.py`.

## Estructura principal

```
src/
├─ App.tsx                 # 22 rutas y control de acceso por rol/cuenta
├─ components/             # Layout, UI compartida, pantallas de acceso restringido
├─ lib/                    # parser Excel, formato, segmentos, router, storage
├─ state/AppContext.tsx    # estado global persistido
├─ screens/                # las 22 pantallas
└─ utils/projections.ts    # reglas matemáticas RN-02/05..11 y RF-36
```

## Flujos de demostración

- **F01** Excel → dashboard · **F02** Corte 1 → Corte 2
- **F03** Inactivos → compromiso · **F04** Filtro por líder · **F05** Comparación de métodos
- **F06** Promesa manual de 100 pts (estimación, no pedido real) · **F07** Línea base vs cierre
- **F08** Durmientes → plantilla WhatsApp · **F09** Aislamiento A/B y rol administrador · **F10** Pausar cuenta

El botón **Reiniciar Demo** de la barra superior restaura el estado inicial (Cuenta A, Corte 1, rol Líder Titular).
