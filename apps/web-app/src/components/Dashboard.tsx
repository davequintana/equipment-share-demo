import React from 'react';
import * as styles from '../styles/theme.css';

export const Dashboard: React.FC = () => {
  const features = [
    {
      icon: '⚛️',
      title: 'React 19',
      description: 'Latest React with concurrent features and improved performance',
    },
    {
      icon: '🏗️',
      title: 'NX Monorepo',
      description: 'Powerful build system with dependency graph and caching',
    },
    {
      icon: '🎨',
      title: 'Vanilla Extract',
      description: 'Zero-runtime CSS-in-TypeScript with type safety',
    },
    {
      icon: '🚀',
      title: 'Express & Fastify',
      description: 'Multiple backend options with JWT authentication',
    },
    {
      icon: '🐘',
      title: 'PostgreSQL',
      description: 'Robust relational database for enterprise applications',
    },
    {
      icon: '📡',
      title: 'Apache Kafka',
      description: 'Event streaming platform for real-time data pipelines',
    },
    {
      icon: '🐳',
      title: 'Docker & Kubernetes',
      description: 'Containerization and orchestration for scalable deployments',
    },
    {
      icon: '☁️',
      title: 'AWS Ready',
      description: 'Cloud-native architecture with AWS integration',
    },
    {
      icon: '🧪',
      title: 'Playwright Testing',
      description: 'End-to-end testing across all modern browsers',
    },
    {
      icon: '📚',
      title: 'Storybook',
      description: 'Component library and design system documentation',
    },
    {
      icon: '⚡',
      title: 'Vite',
      description: 'Lightning-fast build tool with HMR',
    },
    {
      icon: '🔐',
      title: 'Authentication',
      description: 'JWT-based auth with bcrypt password hashing',
    },
  ];

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Enterprise NX Monorepo
          </h1>
          <p className={styles.heroSubtitle}>
            A comprehensive full-stack application with modern technologies and best practices
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <a href="#features" className={styles.button}>
              Explore Features
            </a>
            <a
              href="https://github.com"
              className={styles.secondaryButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div id="features" className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Architecture Overview</h2>
          <div className={styles.featureCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3>Microservices Architecture</h3>
            <p>
              This monorepo includes multiple services running on different ports:
            </p>
            <ul style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li><strong>Frontend (Port 4200):</strong> React app with Vite and Vanilla Extract</li>
              <li><strong>Express API (Port 3333):</strong> Traditional REST API with authentication</li>
              <li><strong>Fastify API (Port 3334):</strong> High-performance API with OpenAPI documentation</li>
              <li><strong>PostgreSQL:</strong> Database for persistent data storage</li>
              <li><strong>Kafka:</strong> Message broker for event-driven communication</li>
              <li><strong>Redis:</strong> Caching and session storage</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
