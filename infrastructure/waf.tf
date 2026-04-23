# =============================================================================
# AWS WAF & SHIELD
# =============================================================================
# Web Application Firewall and DDoS protection
# =============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.app_name}-waf"
  description = "WAF rules for Planet Motors"
  scope       = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # Rate Limiting
  rule {
    name     = "RateLimit"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimit"
    }
  }
  
  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesCommonRuleSet"
    }
  }
  
  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesKnownBadInputsRuleSet"
    }
  }
  
  # AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesSQLiRuleSet"
    }
  }
  
  # Block Bad Bots
  rule {
    name     = "AWSManagedRulesBotControlRuleSet"
    priority = 5
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
        
        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "COMMON"
          }
        }
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesBotControlRuleSet"
    }
  }
  
  # Geo Blocking (optional - block high-risk countries)
  rule {
    name     = "GeoBlock"
    priority = 6
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = ["RU", "CN", "KP", "IR"] # Example high-risk countries
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name               = "GeoBlock"
    }
  }
  
  visibility_config {
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
    metric_name               = "${var.app_name}-waf"
  }
  
  tags = {
    Name = "${var.app_name}-waf"
  }
}

# AWS Shield Advanced (Enterprise DDoS Protection)
resource "aws_shield_protection" "cloudfront" {
  name         = "${var.app_name}-cloudfront-shield"
  resource_arn = aws_cloudfront_distribution.main.arn
  
  tags = {
    Name = "${var.app_name}-cloudfront-shield"
  }
}

# Shield Protection for ALB
resource "aws_shield_protection" "alb" {
  name         = "${var.app_name}-alb-shield"
  resource_arn = aws_lb.main.arn
  
  tags = {
    Name = "${var.app_name}-alb-shield"
  }
}

# Output
output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}
