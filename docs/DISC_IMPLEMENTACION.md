# DISC implementacion

## Estado

DISC queda preparado a nivel de:

- migracion `instrument_versions`
- asignaciones `assessment_assignments.instrument_code = 'disc'`
- clasificacion del escalafon
- portal de participante

## Pendiente bloqueante

No se activo el instrumento DISC en `lib/instruments/index.js` porque el scoring no debe inventarse.

Los manuales suministrados contienen:

- `disc-sistema-de-perfil-personal-instrucciones-y-ejemplos-en-espanol.pdf`
  - pagina 4: hoja de respuestas de 28 grupos
  - paginas 5-7: instrucciones de conteo, diferencia y graficas
  - pagina 10: indice de intensidad dimensional
  - paginas 12-15: tabla del patron de perfil clasico
  - paginas 16-21: interpretaciones de patrones
- `133997765-Manual-Disc.pdf`
  - paginas 3-26: descripcion de dimensiones y patrones

Para completar DISC se debe transcribir de forma auditada:

- 28 grupos x 4 palabras
- mapa palabra -> D/I/S/C para MAS y MENOS
- tabla de conversion a graficas I/II/III
- procedimiento de patron clasico/especial
- fixtures de ejemplo del manual

Hasta que eso exista, cualquier scoring automatico seria riesgoso.

