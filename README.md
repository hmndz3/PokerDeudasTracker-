# 🎲 PokerLedger

App web para llevar el control de mesas de póker entre amigos. Registra jugadores, abre mesas, registra entradas/recompras/salidas, calcula ganancias y pérdidas, y genera automáticamente la forma más ordenada de saldar deudas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python 3.11) |
| Base de datos | PostgreSQL 16 |
| ORM | SQLAlchemy |
| Migraciones | Alembic |
| Auth | JWT (python-jose) |
| Contenedores | Docker + Docker Compose |
| Deploy | Railway |

## Características

- Roles **Admin** y **Jugador** con rutas protegidas
- Creación de grupos y mesas
- Registro de buy-in, recompras y salida por jugador
- Validación antes de cierre: `total_metido == total_salido`
- Algoritmo de simplificación de deudas (mínimas transacciones)
- Doble confirmación de pagos (deudor + receptor)
- Audit log de todas las acciones importantes
- Dashboard global (admin) y estadísticas por jugador
- Montos manejados internamente como **enteros en décimos** (Q45.5 → 455)

## Estructura

```
PokerLedger/
├── backend/
│   ├── app/
│   │   ├── core/          # security, deps
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # FastAPI routers
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/
│   ├── Dockerfile
│   ├── Procfile           # Para Railway
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Helpers axios por módulo
│   │   ├── components/    # Layout, ProtectedRoute
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Todas las pantallas
│   │   ├── utils/         # format.js
│   │   └── App.jsx
│   ├── Dockerfile         # Multi-stage prod build
│   └── nginx.conf
├── docker-compose.yml
├── railway.toml
└── .env.example
```

## Desarrollo local

### 1. Requisitos

- Docker Desktop
- Git

### 2. Setup

```bash
git clone https://github.com/hmndz3/PokerDeudasTracker-.git
cd PokerDeudasTracker-

# Copiar variables de entorno
cp .env.example .env
# Editar .env si necesitas cambiar credenciales
```

### 3. Levantar servicios

```bash
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Docs API | http://localhost:8000/docs |

### 4. Migraciones

Las migraciones corren automáticamente en producción (Procfile). En desarrollo:

```bash
# Dentro del contenedor backend
docker compose exec backend alembic upgrade head

# Crear nueva migración tras cambiar modelos
docker compose exec backend alembic revision --autogenerate -m "descripcion"
```

### 5. Crear primer admin

Con la API docs en http://localhost:8000/docs, el primer usuario admin debe insertarse directamente en la DB o via un seed script:

```bash
docker compose exec postgres psql -U pokerledger -d pokerledger -c "
INSERT INTO users (real_name, username, password_hash, role, is_active, created_at, updated_at)
VALUES ('Admin', 'admin', '\$2b\$12\$HASH_AQUI', 'ADMIN', true, now(), now());
"
```

O más fácil, usar el endpoint `/auth/register` directamente si temporalmente lo desprotegés.

## Deploy en Railway

### Backend

1. Crear nuevo proyecto en Railway
2. Conectar repositorio → seleccionar carpeta `/backend`
3. Agregar plugin **PostgreSQL** → Railway provee `DATABASE_URL` automáticamente
4. Configurar variables de entorno:
   ```
   JWT_SECRET=<openssl rand -hex 32>
   ```
5. Railway detecta el `Procfile` y corre: `alembic upgrade head && uvicorn ...`

### Frontend

1. Agregar nuevo servicio en el mismo proyecto Railway
2. Conectar repositorio → seleccionar carpeta `/frontend`
3. Configurar variables:
   ```
   VITE_API_URL=https://tu-backend.railway.app
   ```
4. Railway usa el `Dockerfile` multi-stage (build + nginx)

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Usuario autenticado |
| POST | `/auth/register` | Crear usuario (admin) |
| GET | `/groups` | Listar grupos |
| POST | `/groups` | Crear grupo (admin) |
| GET | `/tables` | Listar mesas |
| POST | `/tables` | Crear mesa (admin) |
| POST | `/tables/{id}/players` | Agregar jugador |
| GET | `/tables/{id}/validate` | Validar cierre |
| POST | `/tables/{id}/close` | Cerrar mesa + generar deudas |
| GET | `/debts` | Listar deudas |
| POST | `/debts/{id}/confirm-payment` | Deudor: "ya pagué" |
| POST | `/debts/{id}/confirm-received` | Receptor: "recibido" |
| GET | `/stats/dashboard` | Stats globales (admin) |
| GET | `/stats/me` | Mis estadísticas |
| GET | `/audit` | Audit log (admin) |

## Reglas de negocio clave

- El **nombre real** del jugador es inmutable una vez creado
- Una mesa solo se puede cerrar si `Σ total_metido == Σ cash_out`
- Si se modifica un resultado de mesa cerrada, queda registrado en audit log
- Los pagos requieren **doble confirmación**: deudor confirma → receptor confirma
- Montos internos en **décimos enteros**: Q45.5 = 455

## Licencia

Privado — uso personal.
