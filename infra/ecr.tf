resource "aws_ecr_repository" "meli_api_repo" {
  name                 = "meli-api-repo"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Permite borrar el repo aunque tenga imágenes

  image_scanning_configuration {
    scan_on_push = true
  }
}

output "repository_url" {
  description = "URL del repositorio ECR"
  value       = aws_ecr_repository.meli_api_repo.repository_url
}