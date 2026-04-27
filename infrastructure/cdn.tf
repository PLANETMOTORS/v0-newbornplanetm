# =============================================================================
# S3 & CLOUDFRONT CDN
# =============================================================================
# S3 buckets for vehicle images and CloudFront distribution
# =============================================================================

# -----------------------------------------------------------------------------
# S3 BUCKETS
# -----------------------------------------------------------------------------

# Vehicle Images Bucket
resource "aws_s3_bucket" "vehicles" {
  bucket = "${var.app_name}-vehicle-images"
  
  tags = {
    Name = "${var.app_name}-vehicle-images"
  }
}

resource "aws_s3_bucket_versioning" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Block public access at the bucket level. CloudFront uses OAC + the bucket
# policy below to read objects; no direct public access is required.
resource "aws_s3_bucket_public_access_block" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-access logging → dedicated logs bucket (defined below)
resource "aws_s3_bucket_logging" "vehicles" {
  bucket        = aws_s3_bucket.vehicles.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3/vehicles/"
}

# Documents Bucket (private)
resource "aws_s3_bucket" "documents" {
  bucket = "${var.app_name}-documents"
  
  tags = {
    Name = "${var.app_name}-documents"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "documents" {
  bucket        = aws_s3_bucket.documents.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3/documents/"
}

# Deny non-TLS access to the documents bucket. The bucket is private (read via
# IAM only), but the explicit Deny satisfies SecureTransport audit (S6249).
resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*",
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Centralised access-log bucket (S3 server-access + CloudFront logs)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "logs" {
  bucket = "${var.app_name}-access-logs"

  tags = {
    Name = "${var.app_name}-access-logs"
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Log-of-logs: route the logs bucket's own access logs to itself under a
# dedicated prefix so we never lose the audit trail.
resource "aws_s3_bucket_logging" "logs" {
  bucket        = aws_s3_bucket.logs.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3/logs-self/"
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-access-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*",
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      },
      {
        Sid       = "AllowCloudFrontLogDelivery"
        Effect    = "Allow"
        Principal = { Service = "delivery.logs.amazonaws.com" }
        Action    = ["s3:PutObject"]
        Resource  = "${aws_s3_bucket.logs.arn}/cloudfront/*"
      }
    ]
  })
}

# KMS Key for S3
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.app_name}-s3-kms"
  }
}

# -----------------------------------------------------------------------------
# CLOUDFRONT
# -----------------------------------------------------------------------------

# Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.app_name}-oac"
  description                       = "OAC for Planet Motors S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Planet Motors CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe
  
  aliases = ["cdn.${var.domain_name}"]
  
  # S3 Origin
  origin {
    domain_name              = aws_s3_bucket.vehicles.bucket_regional_domain_name
    origin_id                = "S3-vehicles"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }
  
  # Default Cache Behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-vehicles"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400      # 1 day
    max_ttl                = 31536000   # 1 year
    compress               = true
  }
  
  # AVIF images - long cache
  ordered_cache_behavior {
    path_pattern     = "*.avif"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-vehicles"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 2592000    # 30 days
    max_ttl                = 31536000   # 1 year
    compress               = true
  }
  
  # 360 viewer frames
  ordered_cache_behavior {
    path_pattern     = "360/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-vehicles"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800     # 7 days
    max_ttl                = 2592000    # 30 days
    compress               = true
  }
  
  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # Geo Restriction (Canada focus)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  # WAF
  web_acl_id = aws_wafv2_web_acl.main.arn

  # Standard CloudFront access logs → centralised logs bucket
  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  tags = {
    Name = "${var.app_name}-cdn"
  }
}

# S3 Bucket Policy for CloudFront (read) + HTTPS-only deny (S6249)
resource "aws_s3_bucket_policy" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.vehicles.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.vehicles.arn,
          "${aws_s3_bucket.vehicles.arn}/*",
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

# Variables
variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  type        = string
}

# Outputs
output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "vehicles_bucket" {
  description = "Vehicle images S3 bucket"
  value       = aws_s3_bucket.vehicles.id
}
