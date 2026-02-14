# 1. Bucket S3 para el contenido estático
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "meli-frontend-luke-2026"
}

# 2. Configuración de Hosting Web para S3
resource "aws_s3_bucket_website_configuration" "frontend_config" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# 3. Desactivar bloqueo de acceso público del bucket
resource "aws_s3_bucket_public_access_block" "frontend_block" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 4. Política para que los archivos sean públicos (necesaria para CloudFront/Web hosting)
resource "aws_s3_bucket_policy" "public_read_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend_block]
}

# 5. Distribución de CloudFront para tasador.lukebm.com
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # El subdominio que querés usar
  aliases = ["tasador.lukebm.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:196861675915:certificate/2395ff60-feb1-4480-80fb-693864f95c8b"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Environment = "prod"
    Project     = "MeliMLOps"
  }
}

# --- OUTPUTS ---

output "s3_website_url" {
  value = "http://${aws_s3_bucket_website_configuration.frontend_config.website_endpoint}"
}

output "cloudfront_dns_name" {
  description = "DNS de CloudFront. Usá este valor para el alias A en Route 53"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}