import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

describe('CloudFormation Template Validation', () => {
  let template: any;

  beforeAll(async () => {
    const templatePath = path.join(process.cwd(), 'infrastructure/aws/cloudformation-template.yaml');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    template = yaml.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have correct CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have proper description', () => {
      expect(template.Description).toBe('Enterprise NX Monorepo Infrastructure');
    });

    it('should have environment parameter with correct values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('development');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
    });
  });

  describe('PostgreSQL RDS Configuration', () => {
    it('should have enterprise-level RDS instance configuration', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(dbInstance.Properties.Engine).toBe('postgres');
      expect(dbInstance.Properties.EngineVersion).toBe('16.2');
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.EnablePerformanceInsights).toBe(true);
    });

    it('should use conditional instance classes based on environment', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.DBInstanceClass).toEqual({
        '!If': ['IsProd', 'db.r6g.xlarge', 'db.t3.large']
      });
    });

    it('should have proper backup configuration', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.BackupRetentionPeriod).toEqual({
        '!If': ['IsProd', 30, 7]
      });
      expect(dbInstance.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(dbInstance.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    it('should have security configurations', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.PubliclyAccessible).toBe(false);
      expect(dbInstance.Properties.AutoMinorVersionUpgrade).toBe(false);
    });
  });

  describe('Database Parameter Group', () => {
    it('should have custom parameter group for PostgreSQL 16', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('postgres16');
      expect(paramGroup.Properties.Description).toBe('Enterprise PostgreSQL Parameter Group');
    });

    it('should have security parameters configured', () => {
      const params = template.Resources.DatabaseParameterGroup.Properties.Parameters;
      expect(params.ssl).toBe('on');
      expect(params.password_encryption).toBe('scram-sha-256');
      expect(params.ssl_ciphers).toBe('HIGH:MEDIUM:+3DES:!aNULL');
    });

    it('should have performance extensions enabled', () => {
      const params = template.Resources.DatabaseParameterGroup.Properties.Parameters;
      expect(params.shared_preload_libraries).toBe('pg_stat_statements,pg_hint_plan,auto_explain');
      expect(params['pg_stat_statements.max']).toBe('10000');
      expect(params['pg_stat_statements.track']).toBe('all');
    });

    it('should have comprehensive logging configured', () => {
      const params = template.Resources.DatabaseParameterGroup.Properties.Parameters;
      expect(params.log_statement).toBe('mod');
      expect(params.log_connections).toBe('on');
      expect(params.log_disconnections).toBe('on');
      expect(params.log_checkpoints).toBe('on');
    });
  });

  describe('Security and Monitoring', () => {
    it('should have enhanced monitoring role', () => {
      const monitoringRole = template.Resources.EnhancedMonitoringRole;
      expect(monitoringRole.Type).toBe('AWS::IAM::Role');
      expect(monitoringRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    it('should have secrets manager for passwords', () => {
      const secret = template.Resources.RDSPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toBe('rds-password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    it('should place database in private subnets', () => {
      const dbSubnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Production Features', () => {
    it('should have read replica for production', () => {
      const readReplica = template.Resources.DatabaseReadReplica;
      expect(readReplica.Type).toBe('AWS::RDS::DBInstance');
      expect(readReplica.Condition).toBe('IsProd');
      expect(readReplica.Properties.DBInstanceClass).toBe('db.r6g.large');
    });

    it('should have production condition defined', () => {
      expect(template.Conditions.IsProd).toEqual({
        '!Equals': [{ '!Ref': 'Environment' }, 'production']
      });
    });

    it('should export database endpoint', () => {
      const dbOutput = template.Outputs.DatabaseEndpoint;
      expect(dbOutput.Description).toBe('RDS Database Endpoint');
      expect(dbOutput.Value).toEqual({
        '!GetAtt': ['DatabaseInstance', 'Endpoint.Address']
      });
    });
  });
});
