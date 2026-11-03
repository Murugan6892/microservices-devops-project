# Microservices DevOps Demo

A small three-service application for the AWS/DevOps assignment:
- User Service: `GET /users`, `GET /users/:id`
- Product Service: `GET /products`, `GET /products/:id`
- Order Service: `GET /orders`, `GET /orders/:id`
- Every service exposes `GET /health`

This is a demo application. Data is stored in memory and resets when a container restarts.
No database or application feature development is required for the assignment.

## Run locally with Docker Compose

Prerequisites: Docker Engine and Docker Compose plugin.

```bash
docker compose up -d --build
docker compose ps
```

Test through Nginx (port 8080):

```bash
curl http://localhost:8080/users
curl http://localhost:8080/products
curl http://localhost:8080/orders
curl http://localhost:8080/health/users
curl http://localhost:8080/health/products
curl http://localhost:8080/health/orders
```

Stop:

```bash
docker compose down
```

## Direct service ports (optional)

- User Service: `http://localhost:3001`
- Product Service: `http://localhost:3002`
- Order Service: `http://localhost:3003`
- Nginx gateway: `http://localhost:8080`

## Request routing

| URL path | Destination |
|---|---|
| `/users` | User Service |
| `/products` | Product Service |
| `/orders` | Order Service |
| `/health/users` | User Service health endpoint |
| `/health/products` | Product Service health endpoint |
| `/health/orders` | Order Service health endpoint |

## Repository layout

```text
microservices-devops-project/
├── user-service/
├── product-service/
├── order-service/
├── nginx/
└── docker-compose.yml
```

## Important

This project contains only the application source and local container deployment files.
For the assignment, add the Jenkinsfile and Terraform configuration in the next stages.
Do not commit AWS access keys, SSH private keys, passwords, or `.env` files containing secrets.
