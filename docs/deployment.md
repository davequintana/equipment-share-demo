# Deployment

## Overview

This guide covers deployment strategies for Docker, Kubernetes, and AWS cloud environments with best practices for production deployments.

## Docker Deployment

### Local Development

Start the full development stack with databases:

```bash
# Start all services with databases
docker-compose up -d

# Start only databases
docker-compose up postgres redis kafka -d

# View running services
docker-compose ps

# View logs
docker-compose logs -f web-app
docker-compose logs -f fastify-api
docker-compose logs -f fastify-api
```

### Production Docker Build

Build optimized production images:

```bash
# Build all production images
docker-compose -f docker-compose.prod.yml build

# Build individual services
docker build -f infrastructure/docker/web-app.Dockerfile -t web-app:latest .
docker build -f infrastructure/docker/fastify-api.Dockerfile -t fastify-api:latest .
docker build -f infrastructure/docker/fastify-api.Dockerfile -t fastify-api:latest .
```

### Docker Compose Production

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale fastify-api=3

# Health check
docker-compose -f docker-compose.prod.yml ps
```

### Container Registry

Push images to container registry:

```bash
# Tag images for registry
docker tag web-app:latest your-registry.com/web-app:v1.0.0
docker tag fastify-api:latest your-registry.com/fastify-api:v1.0.0
docker tag fastify-api:latest your-registry.com/fastify-api:v1.0.0

# Push to registry
docker push your-registry.com/web-app:v1.0.0
docker push your-registry.com/fastify-api:v1.0.0
docker push your-registry.com/fastify-api:v1.0.0
```

## Kubernetes Deployment

### Prerequisites

```bash
# Ensure kubectl is configured
kubectl cluster-info

# Create namespace
kubectl create namespace enterprise-app
kubectl config set-context --current --namespace=enterprise-app
```

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Deploy specific components
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/kafka/
kubectl apply -f k8s/web-app/
kubectl apply -f k8s/fastify-api/
kubectl apply -f k8s/fastify-api/
kubectl apply -f k8s/ingress.yaml
```

### Monitor Deployment

```bash
# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress

# View pod logs
kubectl logs -f deployment/web-app
kubectl logs -f deployment/fastify-api
kubectl logs -f deployment/fastify-api

# Check pod details
kubectl describe pod <pod-name>
```

### Scaling

```bash
# Scale deployments
kubectl scale deployment web-app --replicas=3
kubectl scale deployment fastify-api --replicas=5
kubectl scale deployment fastify-api --replicas=3

# Horizontal Pod Autoscaler
kubectl autoscale deployment fastify-api --cpu-percent=70 --min=2 --max=10
kubectl autoscale deployment fastify-api --cpu-percent=70 --min=2 --max=10
```

### Rolling Updates

```bash
# Update image versions
kubectl set image deployment/web-app web-app=your-registry.com/web-app:v1.1.0
kubectl set image deployment/fastify-api fastify-api=your-registry.com/fastify-api:v1.1.0
kubectl set image deployment/fastify-api fastify-api=your-registry.com/fastify-api:v1.1.0

# Check rollout status
kubectl rollout status deployment/web-app
kubectl rollout status deployment/fastify-api
kubectl rollout status deployment/fastify-api

# Rollback if needed
kubectl rollout undo deployment/fastify-api
```

### Clean Up

```bash
# Remove all resources
kubectl delete -f k8s/

# Or remove by namespace
kubectl delete namespace enterprise-app
```

## AWS Deployment

### Prerequisites

```bash
# Configure AWS CLI
aws configure

# Install eksctl for EKS management
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### Infrastructure Deployment

Deploy core infrastructure with CloudFormation:

```bash
# Deploy VPC and core infrastructure
aws cloudformation create-stack \
  --stack-name enterprise-app-infrastructure \
  --template-body file://infrastructure/aws/main-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name enterprise-app-infrastructure
```

### EKS Cluster Deployment

```bash
# Create EKS cluster
eksctl create cluster \
  --name enterprise-app-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 6 \
  --managed

# Configure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name enterprise-app-cluster
```

### RDS Database Setup

```bash
# Deploy RDS PostgreSQL
aws cloudformation create-stack \
  --stack-name enterprise-app-database \
  --template-body file://infrastructure/aws/rds-postgres.yml \
  --parameters \
    ParameterKey=DBUsername,ParameterValue=enterprise \
    ParameterKey=DBPassword,ParameterValue=your-secure-password \
    ParameterKey=VPCStackName,ParameterValue=enterprise-app-infrastructure
```

### ElastiCache Redis Setup

```bash
# Deploy ElastiCache Redis
aws cloudformation create-stack \
  --stack-name enterprise-app-cache \
  --template-body file://infrastructure/aws/elasticache-redis.yml \
  --parameters \
    ParameterKey=VPCStackName,ParameterValue=enterprise-app-infrastructure
```

### Application Load Balancer

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=enterprise-app-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Deploy Application to EKS

```bash
# Create secrets for database and Redis
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://enterprise:password@rds-endpoint:5432/enterprise_db" \
  --from-literal=redis-url="redis://elasticache-endpoint:6379" \
  --from-literal=jwt-secret="your-production-jwt-secret"

# Deploy applications
kubectl apply -f k8s/

# Check ingress
kubectl get ingress
```

### SSL/TLS Configuration

```bash
# Install cert-manager for SSL certificates
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/ssl/cluster-issuer.yaml

# SSL will be automatically provisioned via ingress annotations
```

## Environment Configuration

### Production Environment Variables

```bash
# Application settings
NODE_ENV=production
PORT=3333

# Database (use AWS RDS endpoint)
DATABASE_URL=postgresql://enterprise:password@your-rds-endpoint.amazonaws.com:5432/enterprise_db
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis (use ElastiCache endpoint)
REDIS_URL=redis://your-elasticache-endpoint.cache.amazonaws.com:6379

# Authentication
JWT_SECRET=your-super-secure-256-bit-production-secret
JWT_EXPIRES_IN=24h

# AWS services
AWS_REGION=us-east-1
S3_BUCKET=your-app-assets-bucket

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info

# Security
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
```

### Kubernetes Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: "postgresql://enterprise:password@rds-endpoint:5432/enterprise_db"
  redis-url: "redis://elasticache-endpoint:6379"
  jwt-secret: "your-production-jwt-secret"
```

## Monitoring and Observability

### Health Checks

Configure Kubernetes health checks:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3333
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3333
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Logging

Configure centralized logging:

```bash
# Deploy ELK stack or use AWS CloudWatch
kubectl apply -f k8s/logging/

# Forward logs to CloudWatch
kubectl apply -f https://raw.githubusercontent.com/aws/aws-for-fluent-bit/mainline/aws-for-fluent-bit.yaml
```

### Metrics

Set up Prometheus monitoring:

```bash
# Install Prometheus Operator
kubectl create namespace monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

## Backup and Disaster Recovery

### Database Backups

```bash
# Automated RDS backups (configured in CloudFormation)
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier enterprise-app-db \
  --db-snapshot-identifier enterprise-app-backup-$(date +%Y%m%d)
```

### Application State Backup

```bash
# Backup Kubernetes configurations
kubectl get all --all-namespaces -o yaml > backup/k8s-backup-$(date +%Y%m%d).yaml

# Backup Redis data
kubectl exec -it redis-pod -- redis-cli --rdb /tmp/dump.rdb
kubectl cp redis-pod:/tmp/dump.rdb ./backup/redis-backup-$(date +%Y%m%d).rdb
```

## Security Considerations

### Network Security

- Configure VPC security groups
- Implement network policies in Kubernetes
- Use private subnets for databases
- Enable VPC flow logs

### Access Control

- Use IAM roles for service accounts (IRSA)
- Implement RBAC in Kubernetes
- Rotate secrets regularly
- Enable audit logging

### SSL/TLS

- Use ACM certificates for load balancers
- Enforce HTTPS redirects
- Configure secure cipher suites
- Enable HSTS headers

## Cost Optimization

### AWS Cost Management

- Use Spot instances for development
- Implement auto-scaling policies
- Schedule non-production environments
- Monitor costs with AWS Cost Explorer

### Resource Optimization

```bash
# Set resource limits and requests
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```
