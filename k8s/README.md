# Kubernetes Infrastructure Configuration

## Overview

This directory contains the production-ready Kubernetes infrastructure configuration for the Enterprise NX Monorepo application with comprehensive security, scalability, and high availability features.

## Important Note About VS Code Warnings

**VS Code YAML linter may show "duplication" warnings for ConfigMaps and Secrets - these are FALSE POSITIVES.**

In Kubernetes, it's normal and correct for:

- Multiple deployments to reference the same ConfigMap
- Multiple deployments to reference the same Secret  
- ConfigMaps and Secrets to be shared across different components

This is actually a **best practice** for configuration management in Kubernetes. The warnings can be safely ignored as they don't represent actual issues.

## Components

### Core Infrastructure

- **PostgreSQL 15** - Primary database with persistent storage
- **Redis 7** - Caching layer and session storage
- **Apache Kafka 7.4** - Event streaming and user behavior analytics
- **Zookeeper 7.4** - Kafka coordination service

## Key Improvements Made

### ✅ Security Enhancements

- **Pod Security Contexts**: All containers run as non-root users
- **Security Contexts**: Dropped all unnecessary capabilities
- **Read-only Root Filesystems**: Where applicable
- **Service Account Token**: Disabled automatic mounting
- **Network Policies**: Implemented micro-segmentation between services

### ✅ Reliability & Monitoring

- **Health Checks**: Comprehensive liveness and readiness probes
- **Resource Management**: Proper CPU, memory, and storage limits
- **Init Containers**: Ensure proper startup ordering (Kafka waits for Zookeeper)
- **Persistent Storage**: StatefulSets for stateful services with dedicated storage

### ✅ Production Readiness

- **Proper Labels**: Consistent labeling for service discovery and monitoring
- **Storage Classes**: Configurable storage classes for different environments
- **Resource Quotas**: Defined resource requests and limits
- **Multi-Port Services**: Complete port configurations for Zookeeper clustering

## Deployment Structure

```text
├── Namespace: enterprise-app
├── PostgreSQL (StatefulSet)
│   ├── Persistent Storage: 10Gi
│   ├── Security: Non-root user (999)
│   └── Health Checks: pg_isready
├── Redis (Deployment)
│   ├── Security: Non-root user (999), read-only filesystem
│   └── Health Checks: redis-cli ping
├── Kafka (StatefulSet)
│   ├── Persistent Storage: 5Gi
│   ├── Security: Non-root user (1000)
│   ├── Init Container: Wait for Zookeeper
│   └── Health Checks: TCP socket probes
├── Zookeeper (StatefulSet)
│   ├── Persistent Storage: 2Gi data + 1Gi logs
│   ├── Security: Non-root user (1000)
│   └── Health Checks: ruok command
└── Network Policies
    ├── Database access: Application tier only
    ├── Cache access: Application tier only
    ├── Kafka access: Application tier + Zookeeper
    └── Zookeeper access: Kafka only
```

## Security Policies

### Network Segmentation

- **Database Tier**: Only accessible by application tier
- **Cache Tier**: Only accessible by application tier  
- **Messaging Tier**: Accessible by application tier and internal dependencies
- **Coordination Tier**: Only accessible by Kafka

### Pod Security

- All containers run as non-root users
- Capabilities dropped to minimum required
- Read-only root filesystems where possible
- Service account tokens disabled

## Resource Allocation

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|-------------|-----------|----------------|--------------|---------|
| PostgreSQL | 200m | 500m | 256Mi | 512Mi | 10Gi |
| Redis | 100m | 200m | 128Mi | 256Mi | - |
| Kafka | 300m | 600m | 512Mi | 1Gi | 5Gi |
| Zookeeper | 200m | 400m | 256Mi | 512Mi | 3Gi total |

## Deployment Commands

```bash

# Create namespace and apply configuration

kubectl apply -f infrastructure.yaml

# Verify deployment

kubectl get pods -n enterprise-app
kubectl get pvc -n enterprise-app
kubectl get networkpolicies -n enterprise-app

# Check service connectivity

kubectl get services -n enterprise-app
```

## Monitoring & Troubleshooting

### Health Check Commands

```bash

# PostgreSQL

kubectl exec -it postgres-0 -n enterprise-app -- pg_isready -U enterprise -d enterprise_db

# Redis

kubectl exec -it redis-xxx -n enterprise-app -- redis-cli ping

# Kafka

kubectl exec -it kafka-0 -n enterprise-app -- kafka-broker-api-versions --bootstrap-server localhost:9092

# Zookeeper

kubectl exec -it zookeeper-0 -n enterprise-app -- echo ruok | nc localhost 2181
```

### Log Monitoring

```bash

# View logs

kubectl logs -f postgres-0 -n enterprise-app
kubectl logs -f kafka-0 -n enterprise-app
kubectl logs -f zookeeper-0 -n enterprise-app
```

## Storage Configuration

- **Storage Class**: `fast-ssd` (configure per environment)
- **Access Mode**: `ReadWriteOnce` for all persistent volumes
- **Backup Strategy**: Consider implementing volume snapshots

## Environment Customization

1. **Storage Classes**: Update `storageClassName` based on your cluster
2. **Resource Limits**: Adjust based on your workload requirements
3. **Network Policies**: Modify based on your application architecture
4. **Security Contexts**: Adjust user IDs if required by your environment

## Best Practices Implemented

✅ **Stateful vs Stateless**: Proper StatefulSet usage for persistent services  
✅ **Health Monitoring**: Comprehensive health checks for all services  
✅ **Security First**: Zero-trust network policies and secure pod configurations  
✅ **Resource Management**: Proper resource allocation and limits  
✅ **Production Ready**: Configuration suitable for production environments  
✅ **Monitoring Ready**: Labels and annotations for observability tools  

## Next Steps

1. **Monitoring Stack**: Add Prometheus, Grafana for monitoring
2. **Backup Strategy**: Implement backup procedures for persistent data
3. **Secrets Management**: Consider external secret management (Vault, AWS Secrets Manager)
4. **Service Mesh**: Consider Istio for advanced traffic management
5. **Autoscaling**: Implement HPA for stateless components
