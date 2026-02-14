# 1. Regla de EventBridge: Se dispara cada 5 minutos
resource "aws_cloudwatch_event_rule" "warmup_rule" {
  name                = "meli-api-warmup-rule"
  description         = "Mantiene la lambda caliente mandando una propiedad ficticia"
  schedule_expression = "rate(5 minutes)"
}

# 2. Target: Simula un request real de la API
resource "aws_cloudwatch_event_target" "warmup_target" {
  rule      = aws_cloudwatch_event_rule.warmup_rule.name
  target_id = "MeliApiLambda"
  arn       = aws_lambda_function.api_lambda.arn
  
  # Mandamos un JSON con el formato exacto que espera tu modelo
  # Esto evita que FastAPI tire error de validación
  input = jsonencode({
    "lat": -34.6037, 
    "lon": -58.3816, 
    "l2": "Capital Federal", 
    "property_type": "Departamento", 
    "rooms": 2, 
    "bedrooms": 1, 
    "bathrooms": 1, 
    "surface_total": 50.0, 
    "surface_covered": 45.0
  })
}

# 3. Permiso: Abrir la puerta a EventBridge
resource "aws_lambda_permission" "allow_eventbridge_warmup" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.warmup_rule.arn
}