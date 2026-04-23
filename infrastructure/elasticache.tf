# =============================================================================
# ELASTICACHE REDIS
# =============================================================================
# Redis 7 cluster for caching and session management
# =============================================================================

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "${var.app_name}-redis-subnet"
  }
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family = "redis7"
  name   = "${var.app_name}-redis7-params"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }
  
  tags = {
    Name = "${var.app_name}-redis7-params"
  }
}

# Redis Replication Group (Cluster Mode Disabled)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.app_name}-redis"
  description          = "Redis cluster for Planet Motors"
  
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 3
  port                 = 6379
  
  engine               = "redis"
  engine_version       = "7.0"
  parameter_group_name = aws_elasticache_parameter_group.main.name
  
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  # Multi-AZ
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  # Maintenance
  maintenance_window       = "Sun:05:00-Sun:06:00"
  snapshot_retention_limit = 7
  snapshot_window         = "02:00-03:00"
  
  # Updates
  apply_immediately         = false
  auto_minor_version_upgrade = true
  
  tags = {
    Name = "${var.app_name}-redis"
  }
}

# Variables
variable "redis_auth_token" {
  description = "Redis AUTH token"
  type        = string
  sensitive   = true
}

# Outputs
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}
