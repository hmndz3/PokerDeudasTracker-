# 🎲 PokerLedger

Aplicación web para llevar el control de mesas de póker entre amigos: registro de jugadores, mesas, recompras, cálculo automático de ganancias/pérdidas y simplificación de deudas.

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React |
| Backend | FastAPI (Python) |
| Base de datos | PostgreSQL |
| ORM | SQLAlchemy |
| Migraciones | Alembic |
| Autenticación | JWT |
| Contenedores | Docker + Docker Compose |
| Deploy | Railway |
| Versionamiento | GitHub |

## 📁 Estructura del proyecto
## ✨ Características principales

- 👥 Gestión de usuarios con roles (Admin / Jugador)
- 🃏 Creación y cierre de mesas de póker
- 💰 Registro de entradas, recompras y salidas
- 📊 Cálculo automático de ganancias y pérdidas
- 🔀 Algoritmo de simplificación de deudas
- ✅ Doble confirmación de pagos (deudor + receptor)
- 📜 Auditoría de cambios importantes
- 📈 Dashboards globales y por jugador

## 🚧 Estado del proyecto

En desarrollo. Construido por fases (ver commits).

## 📝 Reglas de negocio importantes

- Los montos se manejan internamente como **enteros en décimos** (Q45.5 → 455) para evitar errores de coma flotante.
- El nombre real del jugador es inmutable; usuario y contraseña sí se pueden cambiar.
- Una mesa solo se puede cerrar si `total_metido == total_salido`.
- Toda modificación a una mesa cerrada queda registrada en el audit log.

## 🚀 Cómo correr el proyecto

> ⏳ Instrucciones completas se agregarán en próximos commits.

## 📄 Licencia

Privado — uso personal.