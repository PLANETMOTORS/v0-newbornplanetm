# =============================================================================
# RDS POSTGRESQL
# =============================================================================
# Multi-AZ PostgreSQL 15 for Planet Motors
# =============================================================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "${var.app_name}-db-subnet"
  }
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.app_name}-pg15-params"
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking > 1 second
  }
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  tags = {
    Name = "${var.app_name}-pg15-params"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.app_name}-rds-kms"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.app_name}-db"
  
  # Engine
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.r6g.xlarge"
  
  # Storage
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn
  
  # Database
  db_name  = "planetmotors"
  username = "planetmotors_admin"
  password = var.db_password
  port     = 5432
  
  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Multi-AZ
  multi_az = true
  
  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name
  
  # Backup
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports      = ["postgresql", "upgrade"]
  
  # Protection
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.app_name}-final-snapshot"
  
  tags = {
    Name = "${var.app_name}-db"
  }
}

# Read Replica
resource "aws_db_instance" "replica" {
  identifier = "${var.app_name}-db-replica"
  
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r6g.large"
  
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Encryption — replicas must explicitly enable storage encryption (S4423)
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Backup — retain replica snapshots for 7 days (S4423)
  backup_retention_period = 7

  # Logging — export PostgreSQL logs to CloudWatch (S4423)
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.app_name}-db-replica"
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.app_name}-rds-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Variables
variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

# Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_replica_endpoint" {
  description = "RDS replica endpoint"
  value       = aws_db_instance.replica.endpoint
}
