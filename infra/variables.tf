# Variables que no deben subirse al repo con valores reales.
# Valores reales van en terraform.tfvars (está en .gitignore).

variable "aws_region" {
  description = "Región de AWS (ej: us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "ID de la cuenta de AWS (12 dígitos). Se usa para ECR y referencias."
  type        = string
  sensitive   = true
}

variable "acm_certificate_arn" {
  description = "ARN del certificado SSL en ACM para CloudFront (ej: arn:aws:acm:us-east-1:ACCOUNT:certificate/ID)"
  type        = string
  sensitive   = true
}
