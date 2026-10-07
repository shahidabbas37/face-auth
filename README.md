# Face Auth

A face-recognition authentication application built as a full-stack learning project. Users can create an account with their name, email address, and a face photo, then sign in with their email and a new face photo. The photo can be selected from the device or captured using a live camera.

The project brings together a React frontend, a FastAPI REST API, the open-source [`face_recognition`](https://github.com/ageitgey/face_recognition) library, and Qdrant vector search. Docker Compose runs the frontend, backend, and vector database as one application.

## Screenshots

### Create an account

![Face Auth signup screen](screenshots/Screenshot%20from%202026-10-07%2018-51-11.png)

### Photo selected for signup

![Face Auth signup screen with a selected face photo](screenshots/Screenshot%20from%202026-10-07%2018-52-12.png)

## Features

- Create an account with a name, email address, and face image.
- Choose an image file or capture a photo from a live camera.
- Sign in using the registered email address and a face image.
- Generate face encodings and compare them to verify identity.
- Store face vectors and account metadata in Qdrant.
- Issue a JWT access token after successful authentication.
- View the current account, sign out, or delete the account.
- Run the frontend, API, and vector database together with Docker Compose.

## Technology

| Component | Technology |
| --- | --- |
| Frontend | React and Vite |
| API | Python, FastAPI, and Uvicorn |
| Face detection and encodings | [`face_recognition`](https://github.com/ageitgey/face_recognition) |
| Vector storage and search | Qdrant |
| Authentication tokens | JWT |
| Container orchestration | Docker Compose |

## Run With Docker Compose

### Prerequisites

- Git
- Docker Engine or Docker Desktop with the Docker Compose plugin
- Enough available memory and CPU for the face-recognition backend and its native dependencies; the first image build can take several minutes

The recommended way to run this project is with Docker Compose. The backend uses native face-recognition dependencies, and Qdrant is a separate service, so a local-only setup requires additional system libraries and manual service configuration.

### 1. Clone the repository

Replace the URL below with this repository's GitHub URL:

```sh
git clone <repository-url>
cd face-auth
```

### 2. Configure environment variables

Create your local environment file from the example:

```sh
cp .env.example .env
```

Before using the app, edit `.env` and replace `JWT_SECRET_KEY` with a unique, private value. You can generate one with:

```sh
openssl rand -hex 32
```

Do not commit `.env` or share the generated secret. The example file is safe to commit; local `.env` files are ignored by Git.

### 3. Build and start the application

```sh
docker compose up --build -d
```

The first build downloads base images and installs the backend and frontend dependencies. Later starts are usually faster. To follow service logs:

```sh
docker compose logs -f
```

Press `Ctrl+C` to stop following logs; this does not stop the containers.

### 4. Open the services

| Service | URL | Use |
| --- | --- | --- |
| Web application | [http://localhost:5173](http://localhost:5173) | Sign up and sign in |
| FastAPI Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) | Explore and try API endpoints |
| FastAPI ReDoc | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Alternative API documentation |
| Qdrant dashboard | [http://localhost:6333/dashboard](http://localhost:6333/dashboard) | Inspect Qdrant collections and points |
| Qdrant HTTP API | [http://localhost:6333](http://localhost:6333) | Qdrant service endpoint |

The frontend container serves the built React application. Its Nginx configuration forwards requests under `/api/` to the backend container, so the browser does not need to know Docker's internal service names.

### Stop and restart

Stop and remove the application containers and network:

```sh
docker compose down
```

This leaves the named `qdrant_data` volume intact, so registered face vectors remain available the next time the app starts. Start it again with:

```sh
docker compose up -d
```

To also permanently delete Qdrant's stored data, use:

```sh
docker compose down --volumes
```

The `--volumes` command deletes the database volume and all registered accounts/vectors stored in it. Use it only when you intend to reset the project data.

## Configuration

Compose reads settings from the root `.env` file. The available variables are documented in `.env.example`:

| Variable | Default | Description |
| --- | --- | --- |
| `WEB_PORT` | `5173` | Host port for the web application |
| `VITE_API_BASE_URL` | `/api/v1` | API path built into the frontend image |
| `API_PORT` | `8000` | Host port for the FastAPI service |
| `QDRANT_HTTP_PORT` | `6333` | Host port for the Qdrant HTTP API and dashboard |
| `QDRANT_GRPC_PORT` | `6334` | Host port for Qdrant gRPC |
| `QDRANT_HOST` | `qdrant` | Qdrant hostname as seen by the backend container |
| `QDRANT_PORT` | `6333` | Qdrant port as seen by the backend container |
| `QDRANT_COLLECTION` | `face_embeddings` | Collection used for face vectors |
| `JWT_SECRET_KEY` | Set in `.env` | Private signing key for access tokens; replace the example value |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | `60` | Access token lifetime in minutes |

`VITE_API_BASE_URL` is used at frontend build time. If you change it, rebuild the frontend image:

```sh
docker compose build frontend
docker compose up -d
```

## Face Matching Threshold

The backend currently defines `FACE_MATCH_THRESHOLD = 0.6` in `backend/app/services/auth.py`. The face library returns a distance between two face encodings; a **smaller distance means a closer match**.

- During login, a distance greater than the threshold is rejected.
- During signup, a distance at or below the threshold from an existing face is treated as a duplicate face.
- Lowering the value makes matching stricter and can reject genuine users when their photos differ.
- Raising the value makes matching more permissive and can increase false matches.

The threshold is a tuning parameter, not a universal security setting. Changing it affects both login verification and duplicate-face detection. For experimentation, edit the constant in `backend/app/services/auth.py`, then rebuild/restart the backend:

```sh
docker compose up --build -d backend
```

Test any change against varied images and lighting before relying on it. Face matching alone should not be considered sufficient protection for a production authentication system.

## API Overview

The API base path is `/api/v1`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/signup` | Register a name, email, and face image |
| `POST` | `/api/v1/auth/login` | Verify an email and face image, then return a JWT |
| `GET` | `/api/v1/auth/me` | Return the authenticated account; requires a bearer token |
| `DELETE` | `/api/v1/auth/me` | Delete the authenticated account; requires a bearer token |

Interactive endpoint documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs) while the containers are running.

## Repository Layout

```text
backend/       FastAPI application, face matching, JWT, and Qdrant access
frontend/      React and Vite web application, Dockerfile, and Nginx config
screenshots/   UI screenshots used in this README
docker-compose.yml
.env.example   Example Compose configuration (safe to commit)
```

## Notes

This repository is intended for learning and demonstration. Face images and derived face encodings are sensitive biometric data. The current project is not a security-audited identity provider; review privacy, consent, secure transport, storage protection, rate limiting, and other production requirements before deploying it for real users.

## Contributing

Contributions, suggestions, bug reports, and improvements are welcome. Feel free to open an issue to discuss an idea or submit a pull request. For code changes, include a brief description of the change and steps to test it.
