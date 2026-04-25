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

# Block ALL forms of public access — images are served exclusively via CloudFront
# Origin Access Control (OAC). The bucket policy below grants `s3:GetObject` to
# the CloudFront service principal scoped by `aws:SourceArn`, which AWS does not
# treat as a public statement, so `block_public_policy = true` and
# `restrict_public_buckets = true` are compatible with OAC and recommended (S6281).
resource "aws_s3_bucket_public_access_block" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "vehicles" {
  bucket = aws_s3_bucket.vehicles.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 access logging for the vehicles bucket — logs stored in the ALB logs bucket
resource "aws_s3_bucket_logging" "vehicles" {
  bucket        = aws_s3_bucket.vehicles.id
  target_bucket = aws_s3_bucket.vehicles.id
  target_prefix = "access-logs/"
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
  
  tags = {
    Name = "${var.app_name}-cdn"
  }
}

# S3 Bucket Policy for CloudFront
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
