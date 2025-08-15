# Application Deployment Configuration

## Overview

Production-ready Kubernetes deployment configuration for the Enterprise NX Monorepo web application and API services.

## Fixed Issues and Improvements

### ✅ **Security Enhancements**

- **Security Contexts**: All containers run as non-root users with restricted capabilities
- **Service Account Tokens**: Disabled automatic mounting
- **Read-only Filesystems**: Applied where possible (frontend containers)
- **Init Container Security**: Secure init containers with minimal privileges
- **Network Policies**: Micro-segmentation between application components

### ✅ **Reliability & Health Monitoring**

- **Health Checks**: Comprehensive liveness and readiness probes for all services
- **Init Containers**: Dependency checking for proper startup ordering
  - Web app waits for API availability
  - API waits for PostgreSQL, Redis, and Kafka
- **Resource Management**: Proper CPU, memory, and ephemeral storage limits
- **Auto-scaling**: HPA configuration for API backend

### ✅ **Production Configuration**

- **Specific Image Tags**: Replaced `:latest` with version-specific tags (`:1.0.0`)
- **Environment Variables**: Enhanced configuration with proper separation
- **Service Discovery**: Named ports and proper labels
- **Horizontal Pod Autoscaler**: CPU and memory-based scaling

### ✅ **Network Security**

- **Frontend Network Policy**:
  - Allows public ingress
  - Only permits egress to API and DNS
- **Backend Network Policy**:
  - Restricted ingress from frontend only
  - Egress limited to data tier services (PostgreSQL, Redis, Kafka)

## Application Architecture

```text
┌─────────────────┐    ┌──────────────────┐
│   LoadBalancer  │    │  ClusterIP Svc   │
│  (web-app-svc)  │    │ (fastify-api-svc)│
└─────────┬───────┘    └─────────┬────────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│    Web App      │───▶│   Fastify API    │
│   (Frontend)    │    │   (Backend)      │
│   Port: 4200    │    │   Port: 3334     │
│   Replicas: 2   │    │   Replicas: 3-10 │
└─────────────────┘    └─────────┬────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │   Infrastructure    │
                    │ (PostgreSQL, Redis, │
                    │      Kafka)         │
                    └─────────────────────┘
```

## Deployment Resources

| Resource Type | Name | Purpose |
|---------------|------|---------|
| **Namespace** | enterprise-app | Application isolation |
| **ConfigMap** | app-config | Non-sensitive configuration |
| **Secret** | app-secrets | Sensitive data (JWT, passwords) |
| **Deployment** | web-app | Frontend React application |
| **Deployment** | fastify-api | Backend API service |
| **Service** | web-app-service | Frontend load balancer |
| **Service** | fastify-api-service | Backend cluster service |
| **HPA** | fastify-api-hpa | API auto-scaling |
| **NetworkPolicy** | web-app-network-policy | Frontend network rules |
| **NetworkPolicy** | fastify-api-network-policy | Backend network rules |

## Security Configuration

### Container Security

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000/1001
  runAsGroup: 1000/1001
  fsGroup: 1000/1001

# Per container

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true  # where applicable
  capabilities:
    drop: [ALL]
```

### Network Segmentation

- **Frontend**: Public ingress, restricted egress to API only
- **Backend**: Frontend-only ingress, data-tier egress only
- **DNS**: Both tiers can access DNS for external dependencies

## Resource Allocation

| Component | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|----------|-------------|-----------|----------------|--------------|---------|
| **Web App** | 2 | 50m | 100m | 64Mi | 128Mi | 512Mi |
| **API** | 3-10 | 100m | 200m | 128Mi | 256Mi | 1Gi |

## Auto-scaling Configuration

```yaml

# Fastify API HPA

minReplicas: 3
maxReplicas: 10
metrics:
  - CPU: 70% utilization
  - Memory: 80% utilization
```

## Init Container Dependencies

### Web App Init

- **wait-for-api**: Ensures API service is available before starting

### API Init

- **wait-for-postgres**: PostgreSQL readiness check
- **wait-for-redis**: Redis connectivity check  
- **wait-for-kafka**: Kafka broker availability

## Environment Variables

### ConfigMap (app-config)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://enterprise@postgres:5432/enterprise_db
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:9092
LOG_LEVEL=info
SESSION_TIMEOUT=1800
CORS_ORIGIN=*
API_PORT=3334
WEB_PORT=4200
```

### Secrets (app-secrets)

```bash
JWT_SECRET=<base64-encoded-secret>
POSTGRES_PASSWORD=<base64-encoded-password>
```

## Deployment Commands

```bash

# Deploy the application

kubectl apply -f app-deployment.yaml

# Verify deployment status

kubectl get pods -n enterprise-app
kubectl get services -n enterprise-app
kubectl get hpa -n enterprise-app

# Check auto-scaling

kubectl describe hpa fastify-api-hpa -n enterprise-app

# Verify network policies

kubectl get networkpolicies -n enterprise-app
```

## Health Check Endpoints

### Frontend (Web App)

- **Liveness**: `GET /` (port 4200)
- **Readiness**: `GET /` (port 4200)

### Backend (API)

- **Liveness**: `GET /health` (port 3334)
- **Readiness**: `GET /health` (port 3334)

## Monitoring & Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n enterprise-app -o wide
kubectl describe pod <pod-name> -n enterprise-app
```

### View Logs

```bash
kubectl logs -f deployment/web-app -n enterprise-app
kubectl logs -f deployment/fastify-api -n enterprise-app
```

### Test Connectivity

```bash

# Test frontend service

kubectl port-forward svc/web-app-service 8080:80 -n enterprise-app

# Test API service

kubectl port-forward svc/fastify-api-service 3334:3334 -n enterprise-app
```

### Auto-scaling Metrics

```bash
kubectl top pods -n enterprise-app
kubectl describe hpa fastify-api-hpa -n enterprise-app
```

## Production Readiness Checklist

✅ **Security**: Non-root containers, network policies, minimal privileges  
✅ **Monitoring**: Health checks, resource limits, proper labeling  
✅ **Scalability**: HPA configuration, resource allocation  
✅ **Reliability**: Init containers, dependency checking, graceful failures  
✅ **Configuration**: Proper secrets management, environment separation  
✅ **Networking**: Service discovery, load balancing, ingress configuration  

## Next Steps

1. **SSL/TLS**: Configure ingress with SSL termination
2. **Monitoring Stack**: Add Prometheus metrics collection
3. **Logging**: Implement centralized logging (ELK/EFK stack)
4. **CI/CD**: Automate deployments with GitOps
5. **Backup Strategy**: Database backup automation
6. **Service Mesh**: Consider Istio for advanced traffic management
