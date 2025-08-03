# Monitoring

## Overview

Comprehensive monitoring and observability setup for production environments with health checks, logging, metrics, and alerting.

## Health Checks

### Application Health Endpoints

All services expose health check endpoints for monitoring and load balancer health checks.

#### Express API Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "memory": {
      "status": "healthy",
      "usage": "45%"
    }
  }
}
```

#### Fastify API Health Check

```http
GET /health
```

**Enhanced Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "12ms"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "3ms"
    },
    "kafka": {
      "status": "healthy",
      "brokers": 3
    },
    "memory": {
      "status": "healthy",
      "usage": "512MB",
      "limit": "1GB"
    },
    "cpu": {
      "status": "healthy",
      "usage": "25%"
    }
  }
}
```

### Health Check Implementation

```typescript
// Health check service
export class HealthCheckService {
  async getDatabaseHealth(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      await this.db.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async getRedisHealth(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async getMemoryHealth(): Promise<HealthStatus> {
    const used = process.memoryUsage();
    const total = used.heapTotal;
    const usage = Math.round((used.heapUsed / total) * 100);
    
    return {
      status: usage > 90 ? 'unhealthy' : 'healthy',
      usage: `${usage}%`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(total / 1024 / 1024)}MB`
    };
  }
}
```

### Kubernetes Health Checks

```yaml
# Deployment with health checks
apiVersion: apps/v1
kind: Deployment
metadata:
  name: express-api
spec:
  template:
    spec:
      containers:
      - name: express-api
        image: express-api:latest
        ports:
        - containerPort: 3333
        livenessProbe:
          httpGet:
            path: /health
            port: 3333
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3333
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 1
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Logging

### Structured Logging

All applications use structured logging with consistent format and levels.

#### Log Levels

- **ERROR**: Application errors and exceptions
- **WARN**: Warning conditions
- **INFO**: General operational messages
- **DEBUG**: Detailed debugging information (development only)

#### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "express-api",
  "version": "1.0.0",
  "requestId": "req-123456",
  "userId": "user-789",
  "message": "User login successful",
  "data": {
    "email": "user@example.com",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "duration": 150,
  "statusCode": 200
}
```

#### Logger Configuration

```typescript
// Winston logger configuration
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'api',
    version: process.env.APP_VERSION || '1.0.0',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Production: send logs to CloudWatch or ELK
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.CloudWatchLogs({
    logGroupName: process.env.LOG_GROUP_NAME,
    logStreamName: process.env.LOG_STREAM_NAME,
    awsRegion: process.env.AWS_REGION
  }));
}
```

#### Request Logging Middleware

```typescript
// Express request logging
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};
```

### Centralized Logging

#### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    ports:
      - "5044:5044"
    volumes:
      - ./infrastructure/logging/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

#### AWS CloudWatch Integration

```typescript
// CloudWatch logging configuration
import AWS from 'aws-sdk';

const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION
});

export const cloudWatchTransport = new winston.transports.CloudWatchLogs({
  logGroupName: '/aws/ecs/enterprise-app',
  logStreamName: `${process.env.SERVICE_NAME}-${Date.now()}`,
  awsRegion: process.env.AWS_REGION,
  messageFormatter: (logObject) => {
    return JSON.stringify(logObject);
  }
});
```

## Metrics and Monitoring

### Application Metrics

Track key performance indicators and business metrics.

#### Custom Metrics

```typescript
// Prometheus metrics
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Database query duration histogram
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Active user gauge
const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users'
});

// Login attempts counter
const loginAttempts = new client.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'method']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeUsers);
register.registerMetric(loginAttempts);

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Metrics Middleware

```typescript
// Express metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.url, res.statusCode.toString())
      .observe(duration);
      
    if (req.url.includes('/login')) {
      const status = res.statusCode === 200 ? 'success' : 'failure';
      loginAttempts.labels(status, 'password').inc();
    }
  });
  
  next();
};
```

### Infrastructure Metrics

#### Kubernetes Monitoring with Prometheus

```yaml
# k8s/monitoring/prometheus.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
    - job_name: 'express-api'
      static_configs:
      - targets: ['express-api:3333']
      metrics_path: '/metrics'
    - job_name: 'fastify-api'
      static_configs:
      - targets: ['fastify-api:3334']
      metrics_path: '/metrics'
```

#### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "Enterprise App Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ]
  }
}
```

## Alerting

### Prometheus Alerting Rules

```yaml
# k8s/monitoring/alert-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alert-rules
data:
  rules.yml: |
    groups:
    - name: enterprise-app
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10% for 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is above 2 seconds"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Cannot connect to PostgreSQL database"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourdomain.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@yourdomain.com'
    subject: 'Enterprise App Alert'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#alerts'
    title: 'Enterprise App Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Performance Monitoring

### Application Performance Monitoring (APM)

#### New Relic Integration

```typescript
// newrelic.js
'use strict';

exports.config = {
  app_name: ['Enterprise App'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info'
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f'
  },
  error_collector: {
    enabled: true
  }
};
```

#### Custom Performance Tracking

```typescript
// Performance tracking service
export class PerformanceTracker {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;
    
    const duration = Date.now() - start;
    this.timers.delete(label);
    
    // Record metric
    dbQueryDuration.labels('select', 'users').observe(duration / 1000);
    
    return duration;
  }

  static trackDatabaseQuery<T>(operation: () => Promise<T>, queryType: string, table: string): Promise<T> {
    const start = Date.now();
    
    return operation().finally(() => {
      const duration = (Date.now() - start) / 1000;
      dbQueryDuration.labels(queryType, table).observe(duration);
    });
  }
}
```

### Database Performance Monitoring

```sql
-- PostgreSQL slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;

-- Query performance analysis
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

## Security Monitoring

### Security Event Logging

```typescript
// Security event logger
export class SecurityLogger {
  static logAuthEvent(event: AuthEvent): void {
    logger.warn('Security event', {
      type: 'auth_event',
      event: event.type,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      reason: event.reason
    });
  }

  static logSuspiciousActivity(activity: SuspiciousActivity): void {
    logger.error('Suspicious activity detected', {
      type: 'security_alert',
      activity: activity.type,
      severity: activity.severity,
      details: activity.details,
      ip: activity.ip,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Intrusion Detection

```typescript
// Rate limiting and suspicious activity detection
export class SecurityMonitor {
  private static suspiciousIPs = new Set<string>();
  
  static checkSuspiciousActivity(req: Request): boolean {
    const ip = req.ip;
    
    // Check for common attack patterns
    const suspiciousPatterns = [
      /\/admin/,
      /\.php$/,
      /wp-admin/,
      /sqlmap/,
      /<script>/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(req.url) || pattern.test(req.get('User-Agent') || '')
    );
    
    if (isSuspicious) {
      this.suspiciousIPs.add(ip);
      SecurityLogger.logSuspiciousActivity({
        type: 'suspicious_request',
        severity: 'medium',
        details: { url: req.url, userAgent: req.get('User-Agent') },
        ip
      });
      
      return true;
    }
    
    return false;
  }
}
```
