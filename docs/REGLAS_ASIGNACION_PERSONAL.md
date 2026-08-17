# Reglas de asignacion de personal

Fecha: 2026-08-17

## Fuente

Referencia funcional:

- Imagen `WhatsApp Image 2026-08-15 at 10.49.56.jpeg`
- Excel `ESCALAFON 29-JUN-26.xlsx`

La imagen se usa como referencia de reglas, no como instruccion adicional.

## Encabezados detectados en el Excel

Hoja: `Hoja1`

Columnas:

- `rpto`
- `grado`
- `cedula`
- `nombres`
- `cefae`
- `descripcion`
- `fecultasc`
- `fecprxasc`
- `prom`
- `sexo`

## Normalizacion de cedula

La cedula se trata como string.

Regla conceptual:

```js
function normalizeCedula(value) {
  // remover caracteres no numericos
  // si hay 9 digitos, rellenar a la izquierda con 0
  // si hay 10 digitos, conservar
  // en otro caso, marcar incidencia
}
```

Ejemplo:

```text
400825097 -> 0400825097
```

## Codigos de grado observados

```text
TGRL, BGRL, CRNL, TCRN, MAYO, CAPT, TNTE, SUBT,
SLDO, CBOS, CBOP, SGOS, SGOP, SUBS, SUBP, SUBM,
KDTE, TRBP, SPNR, SPNP, CPTO
```

Tambien existe 1 fila con grado vacio.

## Clasificacion conservadora propuesta

| grado | categoria | instrumentos |
|---|---|---|
| TGRL | oficial general | BARON, EMA |
| BGRL | oficial general | BARON, EMA |
| CRNL | oficial superior | BARON, EMA; DISC solo si promocion 48-59 |
| TCRN | oficial superior | BARON, EMA; DISC solo si promocion 48-59 |
| MAYO | oficial superior | BARON, EMA; DISC solo si promocion 48-59 |
| CAPT | oficial | BARON, EMA |
| TNTE | oficial | BARON, EMA |
| SUBT | oficial | BARON, EMA |
| SLDO | aerotecnico | BARON, EMA |
| CBOS | aerotecnico | BARON, EMA |
| CBOP | aerotecnico | BARON, EMA |
| SGOS | aerotecnico | BARON, EMA |
| SGOP | sargento primero | BARON, EMA, DISC |
| SUBS | suboficial segundo | BARON, EMA, DISC |
| SUBP | suboficial primero | BARON, EMA, DISC |
| SUBM | suboficial mayor | BARON, EMA, DISC |
| KDTE | no elegible bajo reglas actuales | ninguno |
| TRBP | no elegible bajo reglas actuales | ninguno |
| SPNR | no elegible bajo reglas actuales | ninguno |
| SPNP | no elegible bajo reglas actuales | ninguno |
| CPTO | no elegible bajo reglas actuales | ninguno |

## Reglas aplicadas

### Regla A

Oficiales y aerotecnicos reciben:

- BARON
- EMA

### Regla B

Oficiales superiores con promocion entre 48 y 59 reciben:

- BARON
- EMA
- DISC

La condicion usada es:

```text
grado in (CRNL, TCRN, MAYO)
AND promocion BETWEEN 48 AND 59
```

No se clasifica a una persona como oficial superior solo por su promocion.

### Regla C

Desde SGOP hasta SUBM reciben:

- BARON
- EMA
- DISC

Codigos verificados en el Excel:

- `SGOP`
- `SUBS`
- `SUBP`
- `SUBM`

## Resumen del dry-run

- Total personal leido: 6.373
- Total elegible: 6.007
- Total excluido: 366
- Total con Bar-On: 6.007
- Total con EMA: 6.007
- Total con DISC: 1.504
- Total con incidencias: 366
- Cedulas duplicadas: 0

## DISC por grado

| grado | cantidad |
|---|---:|
| SGOP | 500 |
| SUBS | 397 |
| SUBP | 309 |
| MAYO | 147 |
| TCRN | 138 |
| SUBM | 13 |

## Reportes generados

- `reports/import_personal_dry_run.csv`
- `reports/import_personal_excepciones.csv`

## Ambiguedades a confirmar

- Si `KDTE` debe excluirse o incluirse en una campana separada.
- Si `TRBP`, `SPNR`, `SPNP` y `CPTO` son personal no militar/no autorizado para este alcance.
- Si oficiales generales `TGRL` y `BGRL` deben recibir DISC por regla institucional distinta. Con las reglas disponibles no reciben DISC.

