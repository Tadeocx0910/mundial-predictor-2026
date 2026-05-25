# Mundial Predictor 2026

App web de pronósticos para el Mundial 2026: React + Tailwind + Firebase + Vercel.

## Cómo subir a GitHub

1. Descomprime este ZIP.
2. Entra a tu repositorio `mundial-predictor-2026` en GitHub.
3. Pulsa **Add file > Upload files**.
4. Arrastra TODO el contenido de la carpeta descomprimida, no la carpeta completa.
5. Pulsa **Commit changes**.
6. Vercel detectará los cambios y publicará la web automáticamente.

## Cuenta admin

El admin configurado es: `tadeobz09@gmail.com`.
Regístrate/inicia sesión con ese correo para ver el panel Admin.

## Primer uso

1. Entra con tu correo admin.
2. Abre la pestaña **Admin**.
3. Pulsa **Inicializar grupos y partidos**.
4. Tus amigos crean sus cuentas.
5. Todos pronostican.
6. Como admin, cargas los resultados reales y el sistema calcula ranking y grupos.

## Firebase usado

Este proyecto ya incluye el firebaseConfig que compartiste.


## Nueva sección: Equipos y jugadores

La app incluye una pantalla `Equipos` con ficha de cada selección: grupo, DT, jugadores, club, edad, nacimiento, altura y peso. La base está preparada para cargar datos oficiales sin inventar información. Puedes editar `src/data/teamProfiles.js` o ampliar el panel Admin para guardar plantillas en Firebase.

## Nota de datos oficiales

Los grupos están cargados como base del proyecto. Revisa siempre FIFA antes del uso final, porque convocatorias y datos físicos de jugadores pueden actualizarse antes del inicio del torneo.
