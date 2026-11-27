"""Generador determinista de datos mock para el prototipo SaaS de redes de mercadeo.

Produce 5 archivos Excel con el esquema exacto de 53 columnas y un manifest JSON
con los totales precalculados para validar el frontend en la Fase 2.

Uso:
    uv run --with pandas --with openpyxl python generate_mock_data.py

El script usa random.seed(42) y es reproducible: ejecutarlo dos veces genera
exactamente los mismos archivos y el mismo manifest.
"""

from __future__ import annotations

import copy
import json
import random
import statistics
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import pandas as pd

# ---------------------------------------------------------------------------
# Configuración global y semilla fija
# ---------------------------------------------------------------------------

SEED = 42
random.seed(SEED)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data" / "mock_excel"

COLUMNAS: list[str] = [
    # 1-8 Identificación y contacto
    "ID_Socio",
    "Nombre_Completo",
    "Telefono",
    "Email",
    "Fecha_Inscripcion",
    "Fecha_Nacimiento",
    "Tipo_Membresia",
    "Segmento_Estado",
    # 9-14 Jerarquía y liderazgo
    "ID_Lider_Directo",
    "Nombre_Lider_Directo",
    "ID_Lider_Subred",
    "Nombre_Lider_Subred",
    "Nivel_Jerarquico",
    "Porcentaje_Incentivo",
    # 15-26 Campaña vigente y gestión
    "Campana_Actual",
    "Fecha_Corte",
    "Dia_Campana",
    "Hizo_Pedido",
    "Puntos_Personales",
    "Puntos_Grupo",
    "Valor_Pedido_MXN",
    "Saldo_Monedero_MXN",
    "Campanas_Sin_Pedido",
    "Nivel_Programa_Bienvenida",
    "Recibe_Catalogo_Impreso",
    "Elegible_Premio_Lealtad",
    # 27-43 Historial de 17 campañas anteriores
    *[f"Pts_Camp_Ant_{i:02d}" for i in range(1, 18)],
    # 44-53 Atributos complementarios
    "Estado_Republica",
    "Ciudad",
    "Canal_Ultimo_Pedido",
    "Fecha_Ultimo_Pedido",
    "Saldo_Credito_MXN",
    "Limite_Credito_MXN",
    "Reclutados_Directos",
    "Reclutados_Activos",
    "Premio_Ganado_Campana",
    "Codigo_Zona",
]

HIST_COLS = [f"Pts_Camp_Ant_{i:02d}" for i in range(1, 18)]
assert len(COLUMNAS) == 53, f"El esquema debe tener 53 columnas, tiene {len(COLUMNAS)}"

ESCALA_INCENTIVOS: list[tuple[int, int, int]] = [
    (0, 249, 0),
    (250, 499, 3),
    (500, 999, 6),
    (1000, 1999, 9),
    (2000, 3499, 12),
    (3500, 5499, 15),
    (5500, 7499, 18),
    (7500, 10**9, 25),
]

# Calendario: la campaña vigente es C15-2026 y arranca el 22/10/2026.
CURRENT_IDX = 31  # C1-2025 = 0, C17-2025 = 16, C15-2026 = 31
CURRENT_CAMPAIGN = "C15-2026"
CAMPAIGN_START = date(2026, 10, 22)
CORTE1_DATE = CAMPAIGN_START + timedelta(days=7)  # 2026-10-29, día 8
CORTE2_DATE = CAMPAIGN_START + timedelta(days=13)  # 2026-11-04, día 14
CUMPLE_INICIO = CAMPAIGN_START
CUMPLE_FIN = CAMPAIGN_START + timedelta(days=20)

NOMBRES = [
    "Ana Lucía", "Bruno Alberto", "Camila Fernanda", "Diego Armando", "Elena Patricia",
    "Fernando Javier", "Gabriela Itzel", "Héctor Manuel", "Isabel Cristina", "Jorge Alberto",
    "Karla Mariana", "Luis Enrique", "María Fernanda", "Nicolás Eduardo", "Olivia Guadalupe",
    "Pablo Andrés", "Quetzalli Patricia", "Ricardo Antonio", "Sandra Liliana", "Tomás Efraín",

    "Úrsula Marcela", "Valeria Alejandra", "Wenceslao Omar", "Ximena Rocío", "Yuri Alejandro",
    "Zoe Carolina", "Adriana Denise", "Brayan Alejandro", "Cecilia Marisol", "Damián Ismael",
    "Erika Yazmín", "Frida Valeria", "Gerardo Miguel", "Hilda Guadalupe", "Iván Cristóbal",
    "Jacqueline Ariadne", "Kevin Armando", "Lorena Beatriz", "Mauricio Salvador", "Natalia Paola",
    "Oscar Daniel", "Paola Andrea", "Raúl Emiliano", "Silvia Eugenia", "Teresa de Jesús",
    "Ulises Gabriel", "Verónica Alejandra", "Yolanda Rebeca", "Ángel Gabriel", "Bernardo Agustín",
    "Claudia Ivonne", "David Eduardo", "Esmeralda Lucero", "Félix Gerardo", "Graciela Nayeli",
]
APELLIDOS = [
    "Ramírez", "Martínez", "González", "Hernández", "López", "Pérez", "Sánchez", "Reyes",
    "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Morales", "Vargas", "Castillo",
    "Jiménez", "Moreno", "Rojas", "Medina", "Aguilar", "Herrera", "Vázquez", "Reyna",
    "Duarte", "Navarro", "Avilés", "Sandoval", "Robles", "Mejía", "Cordero", "Cabrera",
    "Fuentes", "Ibarra", "Lira", "Mondragón", "Orozco", "Palacios", "Quintero", "Salazar",
]
ESTADOS_CIUDADES = [
    ("Ciudad de México", "Iztapalapa"), ("Ciudad de México", "Coyoacán"),
    ("Jalisco", "Guadalajara"), ("Jalisco", "Tlajomulco"),
    ("Nuevo León", "Monterrey"), ("Nuevo León", "Guadalupe"),
    ("Estado de México", "Ecatepec"), ("Estado de México", "Naucalpan"),
    ("Puebla", "Puebla"), ("Puebla", "San Andrés Cholula"),
    ("Querétaro", "Querétaro"), ("Guanajuato", "León"),
    ("Michoacán", "Morelia"), ("Yucatán", "Mérida"),
    ("Veracruz", "Xalapa"), ("Coahuila", "Saltillo"),
    ("Sonora", "Hermosillo"), ("Chihuahua", "Chihuahua"),
    ("Baja California", "Tijuana"), ("Tamaulipas", "Reynosa"),
]
ZONAS = ["CENTRO", "NOROESTE", "NORESTE", "OCCIDENTE", "SURESTE", "ORIENTE"]
PREMIOS = [
    "Kit de Bienvenida", "Set de Cocina Básico", "Bolsa Térmica", "Set de Organización",
    "Cafetera Personal", "Set de Limpieza", "Mochila Urbana", "N/D",
]
CORREOS_DOMINIOS = ["ejemplo.mx", "correo-ejemplo.mx", "maildemo.mx"]
TITULARES_NOMBRES = {"Sofía Mendoza", "Carlos Ramírez"}


# ---------------------------------------------------------------------------
# Utilidades de dominio
# ---------------------------------------------------------------------------

def incentivo(puntos: float) -> int:
    """Escala de incentivos de red (RN de comisiones)."""
    for minimo, maximo, porcentaje in ESCALA_INCENTIVOS:
        if minimo <= puntos <= maximo:
            return porcentaje
    return 25


def segmento(campanas_sin_pedido: int) -> str:
    """RN-04: clasificación exacta por campañas consecutivas sin pedido."""
    n = campanas_sin_pedido
    if n == 0:
        return "Activo"
    if n == 1:
        return "Inactivo_1"
    if n == 2:
        return "Inactivo_2"
    if n == 3:
        return "Inactivo_3"
    if 4 <= n <= 17:
        return "Durmiente"
    if 18 <= n <= 51:
        return "Historico"
    raise ValueError(f"Campanas_Sin_Pedido fuera de rango: {n}")


def etiqueta_campana(idx: int) -> str:
    """Índice global -> C<n>-<año>. Permite índices negativos (campañas de 2023)."""
    año = 2025 + idx // 17
    numero = idx % 17 + 1
    return f"C{numero}-{año}"


def inicio_campana(idx: int) -> date:
    """Fecha de inicio de una campaña dada su posición relativa a la vigente."""
    return CAMPAIGN_START - timedelta(days=21 * (CURRENT_IDX - idx))


def nombre_ficticio(usados: set[str]) -> str:
    for _ in range(200):
        nombre = f"{random.choice(NOMBRES)} {random.choice(APELLIDOS)}"
        if nombre not in usados and nombre not in TITULARES_NOMBRES:
            usados.add(nombre)
            return nombre
    raise RuntimeError("No se pudo generar un nombre único")


def contacto(nombre: str) -> tuple[str | None, str | None]:
    """Teléfono mexicano de 10 dígitos y correo ficticio; RF-15 permite vacíos."""
    telefono: str | None = None
    if random.random() >= 0.04:
        prefijo = random.choice(["55", "33", "81", "22", "44", "66"])
        telefono = prefijo + "".join(str(random.randint(0, 9)) for _ in range(8))

    email: str | None = None
    if random.random() >= 0.05:
        base = (
            nombre.lower()
            .replace("á", "a").replace("é", "e").replace("í", "i")
            .replace("ó", "o").replace("ú", "u").replace("ü", "u")
            .replace("ñ", "n")
            .replace(" ", ".")
        )
        email = f"{base}{random.randint(1, 99)}@{random.choice(CORREOS_DOMINIOS)}"
    return telefono, email


def fecha_nacimiento(cumpleanero: bool = False) -> date:
    if cumpleanero:
        dia = CUMPLE_INICIO + timedelta(days=random.randint(0, 20))
        año = random.randint(1970, 2000)
        return date(año, dia.month, dia.day)
    año = random.randint(1965, 2005)
    mes = random.randint(1, 12)
    dia = random.randint(1, 28)
    return date(año, mes, dia)


def dentro_de_campana(fecha: date | None) -> bool:
    if fecha is None:
        return False
    inicio = (fecha.month, fecha.day)
    fin = (CUMPLE_FIN.month, CUMPLE_FIN.day)
    comienzo = (CUMPLE_INICIO.month, CUMPLE_INICIO.day)
    if comienzo <= fin:
        return comienzo <= inicio <= fin
    return inicio >= comienzo or inicio <= fin


def historial_base(
    enroll_idx: int, sin_pedido: int, es_comprador: bool
) -> tuple[dict[int, int | None], int | None]:
    """RN-02/RN-05: None antes de la inscripción, 0 si existía pero no compró."""
    valores: dict[int, int | None] = {}
    ultimo_idx: int | None = None
    prob = 0.55 if es_comprador else 0.30
    for k in range(1, 18):
        idx = CURRENT_IDX - k
        if idx < enroll_idx:
            valores[k] = None
            continue
        if k <= sin_pedido:
            valores[k] = 0
            continue
        if random.random() < prob:
            valores[k] = random.choice([70, 70, 100, 100, 140, 200])
            ultimo_idx = idx
        else:
            valores[k] = 0
    return valores, ultimo_idx


# ---------------------------------------------------------------------------
# Especificaciones de los cinco escenarios
# ---------------------------------------------------------------------------

@dataclass
class Spec:
    key: str
    filename: str
    cuenta: str
    titular_id: str
    titular_nombre: str
    meta: int
    subred_sizes: list[int]
    leader_ids: list[str]
    leader_names: list[str]
    member_id_start: int
    fecha_corte: date
    dia_campana: int
    status_plan: dict[str, int]
    welcome_count: int
    target_puntos: int | None = None
    dirty: bool = False
    especiales: bool = False
    meta_info: dict[str, Any] = field(default_factory=dict)


SPEC_A1 = Spec(
    key="01",
    filename="01_Red_Mediana_383_Corte1.xlsx",
    cuenta="A",
    titular_id="200000",
    titular_nombre="Sofía Mendoza",
    meta=7500,
    subred_sizes=[110, 85, 68, 52, 40, 28],
    leader_ids=["200010", "200020", "200030", "200040", "200050", "200060"],
    leader_names=[
        "Valeria Castillo", "Miguel Ángel Torres", "Rosa Elena Vázquez",
        "Jorge Luis Herrera", "Patricia Reyna", "Fernando Duarte",
    ],
    member_id_start=200100,
    fecha_corte=CORTE1_DATE,
    dia_campana=8,
    status_plan={
        "buyers": 94, "inactivo_1": 80, "inactivo_2": 45,
        "inactivo_3": 30, "durmiente": 74, "historico": 60,
    },
    welcome_count=20,
    target_puntos=7150,
    dirty=True,
    especiales=True,
    meta_info={"descripcion": "Escenario principal, corte 1 (día 8), con filas sucias"},
)

SPEC_A2 = Spec(
    key="02",
    filename="02_Red_Mediana_383_Corte2.xlsx",
    cuenta="A",
    titular_id="200000",
    titular_nombre="Sofía Mendoza",
    meta=7500,
    subred_sizes=[110, 85, 68, 52, 40, 28],
    leader_ids=["200010", "200020", "200030", "200040", "200050", "200060"],
    leader_names=[
        "Valeria Castillo", "Miguel Ángel Torres", "Rosa Elena Vázquez",
        "Jorge Luis Herrera", "Patricia Reyna", "Fernando Duarte",
    ],
    member_id_start=200100,
    fecha_corte=CORTE2_DATE,
    dia_campana=14,
    status_plan=dict(SPEC_A1.status_plan),
    welcome_count=20,
    target_puntos=None,
    especiales=True,
    meta_info={"descripcion": "Actualización Corte 2 (día 14): 5 socios compraron"},
)

SPEC_03 = Spec(
    key="03",
    filename="03_Red_Pequena_25_Socios.xlsx",
    cuenta="A",
    titular_id="300000",
    titular_nombre="Sofía Mendoza",
    meta=1000,
    subred_sizes=[13, 12],
    leader_ids=["300010", "300020"],
    leader_names=["Daniela Ávila", "Hugo Navarro"],
    member_id_start=300100,
    fecha_corte=CORTE1_DATE,
    dia_campana=8,
    status_plan={
        "buyers": 9, "inactivo_1": 5, "inactivo_2": 3,
        "inactivo_3": 2, "durmiente": 4, "historico": 2,
    },
    welcome_count=4,
    meta_info={"descripcion": "Red pequeña para demos rápidas de agenda y filtros"},
)

SPEC_04 = Spec(
    key="04",
    filename="04_Red_Grande_1500_Socios.xlsx",
    cuenta="A",
    titular_id="400000",
    titular_nombre="Sofía Mendoza",
    meta=40000,
    subred_sizes=[160, 150, 145, 140, 135, 130, 125, 120, 115, 105, 100, 75],
    leader_ids=[str(400010 + 10 * i) for i in range(12)],
    leader_names=[
        "Alicia Treviño", "Benjamín Ochoa", "Clara Eugenia Paz", "Dante Salinas",
        "Elisa Robledo", "Fabián Lozoya", "Gabriela Serrano", "Humberto Castañeda",
        "Irma Beltrán", "José Luis Arreola", "Karen Espinoza", "Lorenzo Fonseca",
    ],
    member_id_start=400200,
    fecha_corte=CORTE1_DATE,
    dia_campana=8,
    status_plan={
        "buyers": 380, "inactivo_1": 320, "inactivo_2": 220,
        "inactivo_3": 160, "durmiente": 260, "historico": 160,
    },
    welcome_count=60,
    meta_info={"descripcion": "Red grande para pruebas de rendimiento a escala"},
)

SPEC_B = Spec(
    key="05",
    filename="05_Cuenta_B_Aislada_120_Socios.xlsx",
    cuenta="B",
    titular_id="500000",
    titular_nombre="Carlos Ramírez",
    meta=4500,
    subred_sizes=[50, 40, 30],
    leader_ids=["500010", "500020", "500030"],
    leader_names=["Marisol Aguilar", "Raúl Sandoval", "Elena Robles"],
    member_id_start=500100,
    fecha_corte=CORTE1_DATE,
    dia_campana=8,
    status_plan={
        "buyers": 35, "inactivo_1": 25, "inactivo_2": 18,
        "inactivo_3": 12, "durmiente": 20, "historico": 10,
    },
    welcome_count=8,
    target_puntos=4380,
    meta_info={"descripcion": "Cuenta B aislada (F09/CA-14), prefijo 500XXX y meta 4,500"},
)


# ---------------------------------------------------------------------------
# Construcción de una red
# ---------------------------------------------------------------------------

def build_esqueleto(spec: Spec) -> list[dict[str, Any]]:
    """Crea la jerarquía base (titular, líderes de subred y socios)."""
    esqueleto: list[dict[str, Any]] = [
        {
            "id": spec.titular_id,
            "nombre": spec.titular_nombre,
            "directo": None,
            "subred": spec.titular_id,
            "nivel": "Nivel 1",
            "es_titular": True,
            "es_lider": False,
        }
    ]
    miembros = iter(str(i) for i in range(spec.member_id_start, spec.member_id_start + 10000))
    usados_nombres = {spec.titular_nombre, *spec.leader_names}

    for i, tamaño in enumerate(spec.subred_sizes):
        lid = spec.leader_ids[i]
        esqueleto.append(
            {
                "id": lid,
                "nombre": spec.leader_names[i],
                "directo": spec.titular_id,
                "subred": lid,
                "nivel": "Nivel 2",
                "es_titular": False,
                "es_lider": True,
                "reclutados": tamaño - 1,
            }
        )
        cantidad_miembros = tamaño - 1 - (1 if i == 0 else 0)
        for _ in range(cantidad_miembros):
            esqueleto.append(
                {
                    "id": next(miembros),
                    "nombre": nombre_ficticio(usados_nombres),
                    "directo": lid,
                    "subred": lid,
                    "nivel": "Nivel 3",
                    "es_titular": False,
                    "es_lider": False,
                    "reclutados": random.randint(0, 6),
                }
            )

    assert len(esqueleto) == sum(spec.subred_sizes), (
        f"{spec.filename}: {len(esqueleto)} socios vs {sum(spec.subred_sizes)} esperados"
    )
    return esqueleto


def asignar_estados(
    esqueleto: list[dict[str, Any]], plan: dict[str, int], forzar: set[str] | None = None
) -> tuple[set[str], dict[str, int]]:
    """Reparte compradores y las cinco clasificaciones RN-04."""
    ids = [s["id"] for s in esqueleto]
    por_id = {s["id"]: s for s in esqueleto}
    aleatorios = ids.copy()
    random.shuffle(aleatorios)

    compradores = {spec_id(esqueleto, "titular")}
    for s in esqueleto:
        if s["es_lider"]:
            compradores.add(s["id"])
    compradores.update(forzar or set())
    aleatorios = [i for i in aleatorios if i not in compradores]

    restantes_compradores = plan["buyers"] - len(compradores)
    if restantes_compradores < 0:
        raise ValueError("El plan de compradores no admite titular + líderes")
    compradores.update(aleatorios[:restantes_compradores])
    cursor = restantes_compradores

    sin_pedido: dict[str, int] = {}
    for clave, valor in [
        ("inactivo_1", 1), ("inactivo_2", 2), ("inactivo_3", 3),
    ]:
        for socio_id in aleatorios[cursor : cursor + plan[clave]]:
            sin_pedido[socio_id] = valor
        cursor += plan[clave]

    for _ in range(plan["durmiente"]):
        socio_id = aleatorios[cursor]
        sin_pedido[socio_id] = random.randint(4, 17)
        cursor += 1

    for _ in range(plan["historico"]):
        socio_id = aleatorios[cursor]
        sin_pedido[socio_id] = random.randint(18, 51)
        cursor += 1

    for s in esqueleto:
        if s["id"] in compradores:
            sin_pedido[s["id"]] = 0
        por_id[s["id"]]["sin_pedido"] = sin_pedido[s["id"]]
        por_id[s["id"]]["comprador"] = s["id"] in compradores
    return compradores, sin_pedido


def spec_id(esqueleto: list[dict[str, Any]], tipo: str) -> str:
    for s in esqueleto:
        if (tipo == "titular" and s["es_titular"]) or (tipo == "lider" and s["es_lider"]):
            return s["id"]
    raise ValueError(f"No se encontró {tipo}")


def inscripcion_valida(enroll_idx: int, fecha_corte: date) -> date:
    inicio = inicio_campana(enroll_idx)
    if enroll_idx == CURRENT_IDX:
        return inicio + timedelta(days=random.randint(0, 7))
    return min(inicio + timedelta(days=random.randint(0, 20)), fecha_corte)


def generar_filas(spec: Spec) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Genera todas las filas válidas de un escenario y metadata de apoyo."""
    esqueleto = build_esqueleto(spec)
    forzados = {"200101", "200102"} if spec.especiales else set()
    compradores, sin_pedido = asignar_estados(esqueleto, spec.status_plan, forzados)

    # Programa de bienvenida RF-19: socios nuevos en campañas 1 a 4.
    candidatos_bienvenida = sorted(
        i for i in compradores
        if i != spec.titular_id and i not in spec.leader_ids
    )
    random.shuffle(candidatos_bienvenida)
    bienvenida: dict[str, int] = {}
    for i, socio_id in enumerate(candidatos_bienvenida[: spec.welcome_count]):
        bienvenida[socio_id] = i % 4 + 1

    por_id = {s["id"]: s for s in esqueleto}
    filas: list[dict[str, Any]] = []

    for s in esqueleto:
        sid = s["id"]
        comprador = sid in compradores
        sp = sin_pedido[sid]
        if sid in bienvenida:
            enroll_idx = CURRENT_IDX - (bienvenida[sid] - 1)
        elif comprador or sp <= 3:
            enroll_idx = CURRENT_IDX - random.randint(6, 17)
        elif sp <= 17:
            enroll_idx = CURRENT_IDX - random.randint(sp + 1, sp + 4)
        else:
            enroll_idx = CURRENT_IDX - random.randint(sp + 1, min(sp + 4, 60))

        hist, ultimo_idx = historial_base(enroll_idx, sp, comprador)
        if sid in bienvenida:
            puntos = 70
        elif comprador:
            puntos = random.choice([70, 70, 70, 100, 100, 140, 200])
        else:
            puntos = 0
        tel, mail = contacto(s["nombre"])
        if s["es_titular"]:
            tel = tel or "5512345678"
            mail = mail or f"titular{spec.titular_id}@ejemplo.mx"

        fila: dict[str, Any] = {
            "ID_Socio": sid,
            "Nombre_Completo": s["nombre"],
            "Telefono": tel,
            "Email": mail,
            "Fecha_Inscripcion": inscripcion_valida(enroll_idx, spec.fecha_corte),
            "Fecha_Nacimiento": fecha_nacimiento(),
            "Tipo_Membresia": "Member" if random.random() < 0.20 else "Socio",
            "Segmento_Estado": segmento(sp),
            "ID_Lider_Directo": s["directo"],
            "Nombre_Lider_Directo": None,
            "ID_Lider_Subred": s["subred"],
            "Nombre_Lider_Subred": None,
            "Nivel_Jerarquico": s["nivel"],
            "Porcentaje_Incentivo": 0,
            "Campana_Actual": CURRENT_CAMPAIGN,
            "Fecha_Corte": spec.fecha_corte,
            "Dia_Campana": spec.dia_campana,
            "Hizo_Pedido": "Sí" if comprador else "No",
            "Puntos_Personales": puntos,
            "Puntos_Grupo": 0,
            "Valor_Pedido_MXN": 0.0,
            "Saldo_Monedero_MXN": 0.0,
            "Campanas_Sin_Pedido": sp,
            "Nivel_Programa_Bienvenida": (
                f"Campaña {bienvenida[sid]}" if sid in bienvenida else "N/A"
            ),
            "Recibe_Catalogo_Impreso": "Sí" if sp < 4 else "No",
            "Elegible_Premio_Lealtad": "No",
            "_enroll_idx": enroll_idx,
            "_ultimo_idx": ultimo_idx,
            "_hist": hist,
            "_comprador": comprador,
            "_es_titular": s["es_titular"],
            "_es_lider": s["es_lider"],
            "_reclutados": s.get("reclutados", random.randint(0, 5)),
        }
        for k in range(1, 18):
            fila[f"Pts_Camp_Ant_{k:02d}"] = hist[k]

        estado, ciudad = random.choice(ESTADOS_CIUDADES)
        fila["Estado_Republica"] = estado
        fila["Ciudad"] = ciudad
        fila["Canal_Ultimo_Pedido"] = "N/D"
        fila["Fecha_Ultimo_Pedido"] = None
        fila["Saldo_Credito_MXN"] = 0.0
        fila["Limite_Credito_MXN"] = 0.0
        fila["Reclutados_Directos"] = fila["_reclutados"]
        fila["Reclutados_Activos"] = 0
        fila["Premio_Ganado_Campana"] = "N/D"
        fila["Codigo_Zona"] = f"ZONA-{random.choice(ZONAS)}-{random.randint(1, 9):02d}"

        if comprador:
            fila["Fecha_Ultimo_Pedido"] = spec.fecha_corte - timedelta(
                days=random.randint(0, spec.dia_campana - 1)
            )
            fila["Canal_Ultimo_Pedido"] = random.choice(["Web", "App Móvil"])
        elif ultimo_idx is not None:
            fila["Fecha_Ultimo_Pedido"] = inicio_campana(ultimo_idx) + timedelta(
                days=random.randint(0, 20)
            )
            fila["Canal_Ultimo_Pedido"] = random.choice(["Web", "App Móvil"])

        if random.random() < 0.40:
            limite = random.choice([3000, 5000, 8000, 12000, 15000])
            fila["Limite_Credito_MXN"] = limite
            fila["Saldo_Credito_MXN"] = round(limite * random.uniform(0.05, 0.80), 2)

        fila["Reclutados_Activos"] = (
            random.randint(0, fila["Reclutados_Directos"])
            if fila["Reclutados_Directos"] else 0
        )
        filas.append(fila)

    # Nombres de líderes resolutos por ID.
    nombres_por_id = {f["ID_Socio"]: f["Nombre_Completo"] for f in filas}
    for f in filas:
        if f["ID_Lider_Directo"]:
            f["Nombre_Lider_Directo"] = nombres_por_id[f["ID_Lider_Directo"]]
        f["Nombre_Lider_Subred"] = nombres_por_id[f["ID_Lider_Subred"]]

    meta: dict[str, Any] = {
        "compradores": compradores,
        "bienvenida": bienvenida,
        "por_id": por_id,
        "cumpleaneros": [],
        "wallet_ids": [],
        "special_no_ids": [],
        "duplicados_ids": [],
        "observados": [],
    }

    if spec.especiales:
        aplicar_casos_especiales(filas, spec, meta)
    if spec.target_puntos is not None:
        calibrar_puntos(filas, spec.target_puntos, meta)
    for f in filas:
        if f["Puntos_Personales"] > 0:
            f["Valor_Pedido_MXN"] = round(f["Puntos_Personales"] * random.uniform(9.5, 13.5), 2)
        total_hist = sum(v for v in f["_hist"].values() if v)
        f["Elegible_Premio_Lealtad"] = (
            "Sí" if f["Campanas_Sin_Pedido"] <= 2 and total_hist >= 210 else "No"
        )
        if f["Puntos_Personales"] >= 100:
            f["Premio_Ganado_Campana"] = random.choice([p for p in PREMIOS if p != "N/D"])
        elif f["Puntos_Personales"] == 70:
            f["Premio_Ganado_Campana"] = "Kit de Bienvenida"
    recalcular_grupos(filas, spec)
    return filas, meta


def aplicar_casos_especiales(
    filas: list[dict[str, Any]], spec: Spec, meta: dict[str, Any]
) -> None:
    """RN-03/04/05, RF-19 y RF-15: casos de prueba obligatorios del Corte 1."""
    por_id = {f["ID_Socio"]: f for f in filas}

    # Caso Estrella: 17 campañas históricas completas.
    estrella = por_id["200101"]
    valores_estrella = [70, 100, 70, 140, 100, 70, 200, 100, 70, 140,
                        100, 70, 100, 70, 140, 100, 200]
    estrella["_enroll_idx"] = CURRENT_IDX - 17
    estrella["Fecha_Inscripcion"] = inscripcion_valida(estrella["_enroll_idx"], spec.fecha_corte)
    for k, v in enumerate(valores_estrella, start=1):
        estrella[f"Pts_Camp_Ant_{k:02d}"] = v
        estrella["_hist"][k] = v
    estrella["_ultimo_idx"] = CURRENT_IDX - 1

    # Caso Parcial: solo 5 campañas válidas.
    parcial = por_id["200102"]
    valores_parcial = [70, 100, 70, 140, 100]
    parcial["_enroll_idx"] = CURRENT_IDX - 5
    parcial["Fecha_Inscripcion"] = inscripcion_valida(parcial["_enroll_idx"], spec.fecha_corte)
    for k in range(1, 18):
        valor = valores_parcial[k - 1] if k <= 5 else None
        parcial[f"Pts_Camp_Ant_{k:02d}"] = valor
        parcial["_hist"][k] = valor
    parcial["_ultimo_idx"] = CURRENT_IDX - 1

    # Exactamente 31 socios sin pedido actual que sí compraron en la campaña anterior.
    elegibles = [
        f for f in filas
        if f["Hizo_Pedido"] == "No"
        and f["Campanas_Sin_Pedido"] == 1
        and f["ID_Socio"] not in {"200101", "200102"}
    ]
    random.shuffle(elegibles)
    elegibles.sort(key=lambda f: int(f["ID_Socio"]))
    especiales = elegibles[:31]
    especiales_ids: set[str] = set()
    especiales_set = {e["ID_Socio"] for e in especiales}
    for f in filas:
        if f["Hizo_Pedido"] == "No" and f["ID_Socio"] not in especiales_set:
            if f["Pts_Camp_Ant_01"] is not None:
                f["Pts_Camp_Ant_01"] = 0
                f["_hist"][1] = 0
    for f in especiales:
        f["Pts_Camp_Ant_01"] = random.choice([70, 100, 140])
        f["_hist"][1] = f["Pts_Camp_Ant_01"]
        f["_ultimo_idx"] = CURRENT_IDX - 1
        especiales_ids.add(f["ID_Socio"])
    meta["special_no_ids"] = sorted(especiales_ids)

    # Al menos 25 socios con saldo en monedero y sin pedido actual (RF de reactivación).
    candidatos_wallet = [
        f for f in filas
        if f["Hizo_Pedido"] == "No" and f["ID_Socio"] not in especiales_ids
    ]
    random.shuffle(candidatos_wallet)
    candidatos_wallet.sort(key=lambda f: int(f["ID_Socio"]))
    wallet = candidatos_wallet[:28]
    saldos_fijos = [514, 240, 185, 620]
    for i, f in enumerate(wallet):
        f["Saldo_Monedero_MXN"] = float(saldos_fijos[i]) if i < 4 else float(
            random.randint(50, 800)
        )
    meta["wallet_ids"] = [f["ID_Socio"] for f in wallet]

    # Cumpleañeros dentro de los 21 días de la campaña vigente.
    candidatos_cumple = [
        f for f in filas if f["ID_Socio"] not in {spec.titular_id, "200101", "200102"}
    ]
    random.shuffle(candidatos_cumple)
    for f in candidatos_cumple[:12]:
        f["Fecha_Nacimiento"] = fecha_nacimiento(cumpleanero=True)
        meta["cumpleaneros"].append(f["ID_Socio"])
    meta["cumpleaneros"].sort()

    # Fuentes de las filas duplicadas: compradores comunes, nunca casos especiales.
    candidatos_dup = [
        f for f in filas
        if f["Hizo_Pedido"] == "Sí"
        and f["ID_Socio"] not in {spec.titular_id, "200101", "200102"}
        and f["ID_Socio"] not in especiales_ids
        and f["ID_Socio"] not in meta["wallet_ids"]
    ]
    candidatos_dup.sort(key=lambda f: int(f["ID_Socio"]))
    meta["duplicados_ids"] = [candidatos_dup[0]["ID_Socio"], candidatos_dup[40]["ID_Socio"]]

    # 5 socios que comprarán entre Corte 1 y Corte 2 (sin pedido, 0 pts, con historial 0).
    candidatos_conversion = [
        f for f in filas
        if f["Hizo_Pedido"] == "No"
        and f["Campanas_Sin_Pedido"] == 1
        and f["Pts_Camp_Ant_01"] == 0
        and f["ID_Socio"] not in especiales_ids
        and f["ID_Socio"] not in meta["wallet_ids"]
        and f["ID_Socio"] not in meta["duplicados_ids"]
    ]
    por_lider: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for f in candidatos_conversion:
        por_lider[f["ID_Lider_Subred"]].append(f)
    lideres = list(por_lider)
    random.shuffle(lideres)
    conversiones: list[str] = []
    for lid in lideres:
        candidatos = sorted(por_lider[lid], key=lambda f: int(f["ID_Socio"]))
        if candidatos:
            conversiones.append(candidatos[random.randint(0, min(3, len(candidatos) - 1))]["ID_Socio"])
        if len(conversiones) == 5:
            break
    meta["conversion_ids"] = conversiones


def calibrar_puntos(
    filas: list[dict[str, Any]], objetivo: int, meta: dict[str, Any]
) -> None:
    """Ajusta puntos de compradores comunes para alcanzar un total exacto."""
    protegidos = set(meta.get("bienvenida", {})) | {"200101", "200102"}
    ajustables = [
        f for f in filas
        if f["Puntos_Personales"] > 0 and f["ID_Socio"] not in protegidos
    ]
    total = sum(f["Puntos_Personales"] for f in filas)
    intentos = 0
    while total != objetivo and intentos < 500000:
        intentos += 1
        if total > objetivo:
            candidatos = [f for f in ajustables if f["Puntos_Personales"] > 70]
            if not candidatos:
                break
            f = random.choice(candidatos)
            f["Puntos_Personales"] -= 10
            total -= 10
        else:
            candidatos = [f for f in ajustables if f["Puntos_Personales"] < 200]
            if not candidatos:
                break
            f = random.choice(candidatos)
            f["Puntos_Personales"] += 10
            total += 10
    assert total == objetivo, f"No se pudo calibrar {total} -> {objetivo}"


def recalcular_grupos(filas: list[dict[str, Any]], spec: Spec) -> None:
    """Puntos_Grupo y Porcentaje_Incentivo derivados del total de la subred."""
    total_red = sum(f["Puntos_Personales"] for f in filas)
    por_subred: dict[str, int] = defaultdict(int)
    for f in filas:
        por_subred[f["ID_Lider_Subred"]] += f["Puntos_Personales"]
    for f in filas:
        grupo = total_red if f["ID_Socio"] == spec.titular_id else por_subred[f["ID_Lider_Subred"]]
        f["Puntos_Grupo"] = grupo
        f["Porcentaje_Incentivo"] = incentivo(grupo)


# ---------------------------------------------------------------------------
# Filas sucias y escritura
# ---------------------------------------------------------------------------

def agregar_filas_sucias(
    filas: list[dict[str, Any]], meta: dict[str, Any]
) -> list[dict[str, Any]]:
    """RF-02/RF-04/CA-03: 2 duplicadas + 3 observadas = 388 filas."""
    sucias: list[dict[str, Any]] = []
    for socio_id in meta["duplicados_ids"]:
        sucias.append(copy.deepcopy(next(f for f in filas if f["ID_Socio"] == socio_id)))

    sin_id = copy.deepcopy(filas[7])
    sin_id["ID_Socio"] = None
    sucias.append(sin_id)

    sin_contacto = copy.deepcopy(filas[9])
    sin_contacto["ID_Socio"] = "209999"
    sin_contacto["Telefono"] = ""
    sin_contacto["Email"] = None
    sucias.append(sin_contacto)

    puntos_corruptos = copy.deepcopy(filas[11])
    puntos_corruptos["ID_Socio"] = "209998"
    puntos_corruptos["Puntos_Personales"] = -50
    puntos_corruptos["Hizo_Pedido"] = "Sí"
    sucias.append(puntos_corruptos)

    meta["observados"] = [
        {"tipo": "sin_ID_Socio", "fila": 386},
        {"tipo": "telefono_vacio_y_email_vacio", "fila": 387, "ID_Socio": "209999"},
        {"tipo": "puntos_personales_negativos", "fila": 388, "ID_Socio": "209998", "valor": -50},
    ]
    return filas + sucias


def a_dataframe(filas: list[dict[str, Any]]) -> pd.DataFrame:
    df = pd.DataFrame([{c: f[c] for c in COLUMNAS} for f in filas], columns=COLUMNAS)
    df = df.astype(object).where(df.notna(), None)
    return df


def escribir_excel(filas: list[dict[str, Any]], ruta: Path) -> pd.DataFrame:
    df = a_dataframe(filas)
    assert list(df.columns) == COLUMNAS and len(COLUMNAS) == 53
    with pd.ExcelWriter(ruta, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Reporte_Red", index=False)
    return df


# ---------------------------------------------------------------------------
# Métricas y manifest
# ---------------------------------------------------------------------------

def _numero(valor: Any) -> float | int:
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return 0
    return valor


def metricas(filas_validas: list[dict[str, Any]], spec: Spec) -> dict[str, Any]:
    df = a_dataframe(filas_validas)
    puntos = pd.to_numeric(df["Puntos_Personales"], errors="coerce").fillna(0)
    sin_pedido = pd.to_numeric(df["Campanas_Sin_Pedido"], errors="coerce").fillna(0)
    monedero = pd.to_numeric(df["Saldo_Monedero_MXN"], errors="coerce").fillna(0)
    anterior_1 = pd.to_numeric(df["Pts_Camp_Ant_01"], errors="coerce").fillna(0)
    total_puntos = int(puntos.sum())
    no_compraron = df["Hizo_Pedido"] == "No"
    segmentos = df["Segmento_Estado"].value_counts().to_dict()
    cumple = sum(1 for f in filas_validas if dentro_de_campana(f["Fecha_Nacimiento"]))
    return {
        "total_filas_validas": int(len(df)),
        "activos": int((sin_pedido == 0).sum()),
        "sin_pedido": int(no_compraron.sum()),
        "inactivos_1": int(segmentos.get("Inactivo_1", 0)),
        "inactivos_2": int(segmentos.get("Inactivo_2", 0)),
        "inactivos_3": int(segmentos.get("Inactivo_3", 0)),
        "durmientes_4_a_17": int(segmentos.get("Durmiente", 0)),
        "historicos_18_a_51": int(segmentos.get("Historico", 0)),
        "programa_bienvenida": int((df["Nivel_Programa_Bienvenida"] != "N/A").sum()),
        "con_saldo_monedero": int((monedero > 0).sum()),
        "con_saldo_monedero_sin_pedido": int(((monedero > 0) & no_compraron).sum()),
        "no_con_pedido_pero_compro_campana_anterior": int((no_compraron & (anterior_1 > 0)).sum()),
        "cumpleaneros_dentro_de_campana": cumple,
        "puntos_totales_actuales": total_puntos,
        "meta": spec.meta,
        "brecha_vs_meta": spec.meta - total_puntos,
        "porcentaje_incentivo_red": incentivo(total_puntos),
        "pedidos_campana_actual": int((df["Hizo_Pedido"] == "Sí").sum()),
        "catalogo_impreso_si": int((df["Recibe_Catalogo_Impreso"] == "Sí").sum()),
        "catalogo_impreso_no": int((df["Recibe_Catalogo_Impreso"] == "No").sum()),
    }


def desglose_lideres(
    filas_validas: list[dict[str, Any]], spec: Spec
) -> list[dict[str, Any]]:
    resultado: list[dict[str, Any]] = []
    ids = [spec.titular_id, *spec.leader_ids]
    for lid in ids:
        sub = [f for f in filas_validas if f["ID_Lider_Subred"] == lid]
        if not sub:
            continue
        puntos = sum(int(_numero(f["Puntos_Personales"])) for f in sub)
        activos = sum(1 for f in sub if f["Campanas_Sin_Pedido"] == 0)
        sin_pedido = sum(1 for f in sub if f["Hizo_Pedido"] == "No")
        resultado.append(
            {
                "ID_Lider": lid,
                "Nombre_Lider": sub[0]["Nombre_Lider_Subred"],
                "es_titular": lid == spec.titular_id,
                "socios": len(sub),
                "puntos_totales": puntos,
                "puntos_promedio": round(puntos / len(sub), 2),
                "activos": activos,
                "sin_pedido": sin_pedido,
                "porcentaje_incentivo": incentivo(puntos),
            }
        )
    return resultado


def stats_historicas(fila: dict[str, Any]) -> dict[str, Any]:
    valores = [
        int(_numero(fila[c]))
        for c in HIST_COLS
        if fila[c] is not None and not (isinstance(fila[c], float) and pd.isna(fila[c]))
    ]
    if not valores:
        return {
            "periodos_validos": 0,
            "promedio": 0,
            "mediana": 0,
            "maximo": 0,
            "valores": [],
        }
    return {
        "periodos_validos": len(valores),
        "promedio": round(statistics.mean(valores), 2),
        "mediana": round(statistics.median(valores), 2),
        "maximo": max(valores),
        "valores": valores,
    }


def info_archivo(
    filas: list[dict[str, Any]],
    filas_validas: list[dict[str, Any]],
    spec: Spec,
    meta: dict[str, Any],
) -> dict[str, Any]:
    total_filas = len(filas)
    duplicados = total_filas - len(filas_validas) - len(meta.get("observados", []))
    informacion: dict[str, Any] = {
        "archivo": spec.filename,
        "cuenta": spec.cuenta,
        "descripcion": spec.meta_info["descripcion"],
        "titular": {"ID_Socio": spec.titular_id, "Nombre_Completo": spec.titular_nombre},
        "campana": {
            "actual": CURRENT_CAMPAIGN,
            "dia": spec.dia_campana,
            "duracion_dias": 21,
            "campanias_por_anio": 17,
            "fecha_corte": spec.fecha_corte.isoformat(),
            "fecha_inicio": CAMPAIGN_START.isoformat(),
            "historicas": [
                {"columna": c, "campana": etiqueta_campana(CURRENT_IDX - k)}
                for k, c in enumerate(HIST_COLS, start=1)
            ],
        },
        "conteo_filas": {
            "total_filas": total_filas,
            "validas": len(filas_validas),
            "duplicadas": duplicados,
            "observadas": len(meta.get("observados", [])),
        },
        "kpis": metricas(filas_validas, spec),
        "desglose_lideres": desglose_lideres(filas_validas, spec),
        "casos_especiales": {
            "17_campanas": "200101" if spec.especiales else None,
            "5_campanas": "200102" if spec.especiales else None,
            "no_con_pedido_pero_compro_ant_01": meta.get("special_no_ids", []),
            "saldo_monedero_sin_pedido_ids": meta.get("wallet_ids", []),
            "cumpleaneros_ids": meta.get("cumpleaneros", []),
            "programa_bienvenida_ids": [
                sid for sid, k in meta.get("bienvenida", {}).items()
            ],
        },
        "estadisticas_historicas_clave": {},
        "filas_observadas": meta.get("observados", []),
    }
    por_id = {f["ID_Socio"]: f for f in filas_validas}
    if spec.especiales:
        for sid in ["200101", "200102", spec.titular_id]:
            if sid in por_id:
                informacion["estadisticas_historicas_clave"][sid] = stats_historicas(por_id[sid])
    return informacion


# ---------------------------------------------------------------------------
# Corte 2
# ---------------------------------------------------------------------------

def generar_corte2(
    filas_corte1: list[dict[str, Any]], meta: dict[str, Any], spec: Spec
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    filas = copy.deepcopy(filas_corte1)
    por_id = {f["ID_Socio"]: f for f in filas}
    cambios = []
    for i, sid in enumerate(meta["conversion_ids"]):
        f = por_id[sid]
        antes = {
            "Hizo_Pedido": f["Hizo_Pedido"],
            "Puntos_Personales": f["Puntos_Personales"],
            "Campanas_Sin_Pedido": f["Campanas_Sin_Pedido"],
            "Segmento_Estado": f["Segmento_Estado"],
            "Puntos_Grupo": f["Puntos_Grupo"],
        }
        puntos = 100 if i < 2 else 70
        f["Hizo_Pedido"] = "Sí"
        f["Puntos_Personales"] = puntos
        f["Valor_Pedido_MXN"] = round(puntos * 11.5, 2)
        f["Campanas_Sin_Pedido"] = 0
        f["Segmento_Estado"] = "Activo"
        f["Fecha_Corte"] = CORTE2_DATE
        f["Dia_Campana"] = 14
        f["Fecha_Ultimo_Pedido"] = CORTE2_DATE
        f["Canal_Ultimo_Pedido"] = "Web" if i % 2 == 0 else "App Móvil"
        f["Recibe_Catalogo_Impreso"] = "Sí"
        f["Elegible_Premio_Lealtad"] = "Sí"
        f["Premio_Ganado_Campana"] = (
            "Set de Organización" if puntos == 100 else "Kit de Bienvenida"
        )
        cambios.append(
            {
                "ID_Socio": sid,
                "Nombre_Completo": f["Nombre_Completo"],
                "ID_Lider_Subred": f["ID_Lider_Subred"],
                "antes": antes,
                "despues": {
                    "Hizo_Pedido": f["Hizo_Pedido"],
                    "Puntos_Personales": f["Puntos_Personales"],
                    "Campanas_Sin_Pedido": f["Campanas_Sin_Pedido"],
                    "Segmento_Estado": f["Segmento_Estado"],
                },
            }
        )
    for f in filas:
        f["Fecha_Corte"] = CORTE2_DATE
        f["Dia_Campana"] = 14
    recalcular_grupos(filas, spec)
    return filas, {
        "conversiones": cambios,
        "conversion_ids": meta["conversion_ids"],
    }


# ---------------------------------------------------------------------------
# Validación y salida en consola
# ---------------------------------------------------------------------------

def check(condicion: bool, mensaje: str) -> None:
    if not condicion:
        raise AssertionError(f"VALIDACIÓN FALLIDA: {mensaje}")
    print(f"  [OK] {mensaje}")


def validar_corte1(filas: list[dict[str, Any]], meta: dict[str, Any], spec: Spec) -> None:
    validas = filas[:383]
    ids = [f["ID_Socio"] for f in validas]
    check(len(filas) == 388, "Corte 1: 388 filas totales")
    check(len(validas) == 383 and len(set(ids)) == 383, "Corte 1: 383 socios únicos")
    df = a_dataframe(validas)
    check(
        int((df["Hizo_Pedido"].eq("No") & pd.to_numeric(df["Pts_Camp_Ant_01"], errors="coerce").gt(0)).sum()) == 31,
        "Corte 1: exactamente 31 'No' con Pts_Camp_Ant_01 > 0",
    )
    monedero = pd.to_numeric(df["Saldo_Monedero_MXN"], errors="coerce").fillna(0)
    sin_pedido = df["Hizo_Pedido"].eq("No")
    check(
        int((monedero.gt(0) & sin_pedido).sum()) >= 25,
        f"Corte 1: {int((monedero.gt(0) & sin_pedido).sum())} socios con monedero sin pedido (>= 25)",
    )
    estrella = next(f for f in validas if f["ID_Socio"] == "200101")
    parcial = next(f for f in validas if f["ID_Socio"] == "200102")
    check(
        all(estrella[f"Pts_Camp_Ant_{k:02d}"] is not None for k in range(1, 18)),
        "Caso Estrella 200101: 17 campañas históricas completas",
    )
    check(
        all(parcial[f"Pts_Camp_Ant_{k:02d}"] is not None for k in range(1, 6))
        and all(parcial[f"Pts_Camp_Ant_{k:02d}"] is None for k in range(6, 18)),
        "Caso Parcial 200102: 5 campañas válidas y 12 vacías",
    )
    check(
        any(dentro_de_campana(f["Fecha_Nacimiento"]) for f in validas),
        "Corte 1: hay cumpleañeros dentro de la campaña vigente",
    )
    check(
        sum(1 for f in validas if f["Segmento_Estado"] == "Historico") > 0
        and all(
            CURRENT_IDX - f["_enroll_idx"] >= f["Campanas_Sin_Pedido"]
            for f in validas if f["Segmento_Estado"] == "Historico"
        ),
        "RN-04: históricos con antigüedad suficiente",
    )
    check(
        all(
            (f["Hizo_Pedido"] == "Sí" and f["Puntos_Personales"] > 0)
            or (f["Hizo_Pedido"] == "No" and f["Puntos_Personales"] == 0)
            for f in validas
        ),
        "RN-03: pedido implica puntos > 0; sin pedido implica 0 puntos",
    )
    check(
        all(
            (f["Campanas_Sin_Pedido"] < 4) == (f["Recibe_Catalogo_Impreso"] == "Sí")
            for f in validas
        ),
        "Catálogo impreso: Sí si < 4 campañas sin pedido, No en caso contrario",
    )
    check(
        all(
            (f[f"Pts_Camp_Ant_{k:02d}"] is None) == (CURRENT_IDX - k < f["_enroll_idx"])
            for f in validas for k in range(1, 18)
        ),
        "RN-02/RN-05: celdas vacías solo antes de la inscripción",
    )
    todos_ids = [f["ID_Socio"] for f in filas]
    duplicados = [sid for sid in meta["duplicados_ids"] if todos_ids.count(sid) == 2]
    check(len(duplicados) == 2, "Corte 1: 2 filas duplicadas por ID_Socio")
    check(len(meta["observados"]) == 3, "Corte 1: 3 filas observadas")


def validar_corte2(filas: list[dict[str, Any]], meta: dict[str, Any]) -> None:
    check(len(filas) == 383, "Corte 2: 383 filas, sin duplicados ni observadas")
    check(len({f["ID_Socio"] for f in filas}) == 383, "Corte 2: 383 socios únicos")
    por_id = {f["ID_Socio"]: f for f in filas}
    puntos = [por_id[sid]["Puntos_Personales"] for sid in meta["conversion_ids"]]
    check(
        sorted(puntos) == [70, 70, 70, 100, 100],
        "Corte 2: 5 conversiones (2 de 100 pts y 3 de 70 pts)",
    )
    check(
        all(por_id[sid]["Campanas_Sin_Pedido"] == 0 for sid in meta["conversion_ids"]),
        "Corte 2: los 5 conversores quedan Activos (0 campañas sin pedido)",
    )
    check(
        all(f["Dia_Campana"] == 14 and f["Fecha_Corte"] == CORTE2_DATE for f in filas),
        "Corte 2: día 14 de 21 y fecha de corte 2026-11-04",
    )


def imprimir_tabla(titulo: str, encabezados: list[str], filas: list[list[Any]]) -> None:
    anchos = [len(str(h)) for h in encabezados]
    for fila in filas:
        for i, valor in enumerate(fila):
            anchos[i] = max(anchos[i], len(str(valor)))
    linea = "-" * (sum(anchos) + 3 * len(anchos) + 1)
    print(f"\n{titulo}")
    print(linea)
    print(" | ".join(str(h).ljust(anchos[i]) for i, h in enumerate(encabezados)))
    print(linea)
    for fila in filas:
        print(" | ".join(str(v).ljust(anchos[i]) for i, v in enumerate(fila)))
    print(linea)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("=" * 78)
    print("GENERADOR DETERMINISTA DE DATOS MOCK - FASE 1 (seed=42)")
    print("=" * 78)

    manifiesto: dict[str, Any] = {
        "metadata": {
            "version": "1.0",
            "semilla": SEED,
            "descripcion": "Datos 100% ficticios para prototipo SaaS de redes de mercadeo",
            "esquema_columnas": len(COLUMNAS),
            "campana_vigente": CURRENT_CAMPAIGN,
            "duracion_campana_dias": 21,
            "campanias_por_anio": 17,
            "reglas": {
                "RN-03": "Con pedido solo si Hizo_Pedido='Sí' y Puntos_Personales > 0",
                "RN-04": "0=Activo; 1/2/3=Inactivos; 4-17=Durmiente; 18-51=Histórico",
                "RN-02_RN-05": "None antes de inscripción; 0 si existía pero no compró",
                "RF-19": "Programa de bienvenida en campañas 1 a 4",
                "RF-15": "Teléfono/correo faltantes se renderizan como N/D",
            },
        },
        "escala_incentivos": [
            {"min": a, "max": b, "porcentaje": p} for a, b, p in ESCALA_INCENTIVOS
        ],
        "columnas": COLUMNAS,
        "archivos": {},
    }

    print("\n[1/6] Generando Corte 1 (383 socios + 5 filas sucias)...")
    filas_a1, meta_a1 = generar_filas(SPEC_A1)
    filas_totales_a1 = agregar_filas_sucias(filas_a1, meta_a1)
    validar_corte1(filas_totales_a1, meta_a1, SPEC_A1)
    df_a1 = escribir_excel(filas_totales_a1, OUTPUT_DIR / SPEC_A1.filename)
    manifiesto["archivos"][SPEC_A1.filename] = info_archivo(
        filas_totales_a1, filas_a1, SPEC_A1, meta_a1
    )
    print(f"  -> {SPEC_A1.filename}: {len(df_a1)} filas x {len(df_a1.columns)} columnas")

    print("\n[2/6] Generando Corte 2 (383 socios limpios)...")
    filas_a2, meta_a2 = generar_corte2(filas_a1, meta_a1, SPEC_A2)
    validar_corte2(filas_a2, meta_a2)
    df_a2 = escribir_excel(filas_a2, OUTPUT_DIR / SPEC_A2.filename)
    meta_a2_completo = {**meta_a1, "observados": [], "conversiones": meta_a2["conversiones"]}
    manifiesto["archivos"][SPEC_A2.filename] = info_archivo(
        filas_a2, filas_a2, SPEC_A2, meta_a2_completo
    )
    manifiesto["archivos"][SPEC_A2.filename]["cambios_entre_cortes"] = meta_a2["conversiones"]
    print(f"  -> {SPEC_A2.filename}: {len(df_a2)} filas x {len(df_a2.columns)} columnas")

    for spec in (SPEC_03, SPEC_04, SPEC_B):
        print(f"\nGenerando {spec.filename}...")
        filas, meta = generar_filas(spec)
        df = escribir_excel(filas, OUTPUT_DIR / spec.filename)
        manifiesto["archivos"][spec.filename] = info_archivo(filas, filas, spec, meta)
        print(f"  -> {len(df)} filas x {len(df.columns)} columnas")

    kpi1 = manifiesto["archivos"][SPEC_A1.filename]["kpis"]
    kpi2 = manifiesto["archivos"][SPEC_A2.filename]["kpis"]
    manifiesto["comparativa_cortes"] = {
        "corte_1": kpi1,
        "corte_2": kpi2,
        "delta": {
            clave: kpi2[clave] - kpi1[clave]
            for clave in [
                "activos", "sin_pedido", "inactivos_1", "pedidos_campana_actual",
                "puntos_totales_actuales", "brecha_vs_meta", "porcentaje_incentivo_red",
            ]
        },
        "socios_que_compraron_entre_cortes": meta_a2["conversiones"],
        "lideres_afectados": sorted(
            {c["ID_Lider_Subred"] for c in meta_a2["conversiones"]}
        ),
    }
    manifiesto["validaciones"] = {
        "esquema_53_columnas": True,
        "hoja_principal": "Reporte_Red",
        "total_filas_corte1": 388,
        "socios_unicos_corte1": 383,
        "duplicadas_corte1": 2,
        "observadas_corte1": 3,
        "no_con_pedido_con_compra_anterior": 31,
        "monedero_sin_pedido_minimo": 25,
        "conversiones_corte2": 5,
    }

    ruta_manifest = OUTPUT_DIR / "seed_data_manifest.json"
    ruta_manifest.write_text(
        json.dumps(manifiesto, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print("\n[6/6] Verificando archivos generados...")
    generados = sorted(p.name for p in OUTPUT_DIR.iterdir())
    esperados = sorted(
        [s.filename for s in (SPEC_A1, SPEC_A2, SPEC_03, SPEC_04, SPEC_B)]
        + ["seed_data_manifest.json"]
    )
    check(generados == esperados, "Los 5 Excel + manifest existen en data/mock_excel/")
    for nombre in generados:
        ruta = OUTPUT_DIR / nombre
        print(f"  - {nombre:<42} {ruta.stat().st_size:>10,} bytes")

    claves = [
        ("Socios válidos", "total_filas_validas"),
        ("Activos", "activos"),
        ("Sin pedido", "sin_pedido"),
        ("Inactivos 1", "inactivos_1"),
        ("Inactivos 2", "inactivos_2"),
        ("Inactivos 3", "inactivos_3"),
        ("Durmientes 4-17", "durmientes_4_a_17"),
        ("Históricos 18-51", "historicos_18_a_51"),
        ("Programa bienvenida", "programa_bienvenida"),
        ("Con monedero", "con_saldo_monedero"),
        ("Monedero sin pedido", "con_saldo_monedero_sin_pedido"),
        ("'No' con compra anterior", "no_con_pedido_pero_compro_campana_anterior"),
        ("Puntos totales", "puntos_totales_actuales"),
        ("Meta", "meta"),
        ("Brecha (meta - puntos)", "brecha_vs_meta"),
        ("% incentivo red", "porcentaje_incentivo_red"),
    ]
    imprimir_tabla(
        "RESUMEN CORTE 1 vs CORTE 2 (Cuenta A)",
        ["Métrica", "Corte 1 (día 8)", "Corte 2 (día 14)", "Delta"],
        [
            [etiqueta, kpi1[c], kpi2[c], kpi2[c] - kpi1[c]]
            for etiqueta, c in claves
        ],
    )
    imprimir_tabla(
        "CONVERSORES ENTRE CORTES",
        ["ID_Socio", "Antes", "Después", "Líder subred"],
        [
            [
                c["ID_Socio"],
                f"{c['antes']['Hizo_Pedido']}/{c['antes']['Puntos_Personales']} pts",
                f"{c['despues']['Hizo_Pedido']}/{c['despues']['Puntos_Personales']} pts",
                c["ID_Lider_Subred"],
            ]
            for c in meta_a2["conversiones"]
        ],
    )
    imprimir_tabla(
        "RESUMEN POR ARCHIVO",
        ["Archivo", "Filas", "Válidas", "Puntos", "Meta", "Brecha"],
        [
            [
                nombre.replace(".xlsx", ""),
                datos["conteo_filas"]["total_filas"],
                datos["conteo_filas"]["validas"],
                datos["kpis"]["puntos_totales_actuales"],
                datos["kpis"]["meta"],
                datos["kpis"]["brecha_vs_meta"],
            ]
            for nombre, datos in manifiesto["archivos"].items()
        ],
    )
    print("\nPROCESO COMPLETADO SIN ERRORES")


if __name__ == "__main__":
    main()
