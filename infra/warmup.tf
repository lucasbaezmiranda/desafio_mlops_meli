# =====================================================
# SERVICIO DE WARMUP (API DESTINATION + EVENTBRIDGE RULE)
# =====================================================

# 1. Conexión para autenticar el request
resource "aws_cloudwatch_event_connection" "warmup_conn" {
  name               = "meli-api-warmup-connection"
  authorization_type = "API_KEY"
  auth_parameters {
    api_key {
      key   = "x-warmup"
      value = "active"
    }
  }
}

# 2. Destino HTTP: El endpoint /predict de tu API
resource "aws_cloudwatch_event_api_destination" "warmup_dest" {
  name                             = "meli-api-warmup-dest"
  invocation_endpoint              = "${aws_api_gateway_deployment.prod.invoke_url}/predict"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 1
  connection_arn                   = aws_cloudwatch_event_connection.warmup_conn.arn
}

# 3. Regla: Dispara cada 1 minuto (Formato estándar)
resource "aws_cloudwatch_event_rule" "warmup_rule_1m" {
  name                = "meli-api-warmup-rule-1m"
  description         = "Trigger para warmup de API cada minuto"
  schedule_expression = "rate(5 minutes)"
  state               = "ENABLED"
}

# 4. Target: Vincula la regla con el API Destination
resource "aws_cloudwatch_event_target" "warmup_api_target" {
  rule      = aws_cloudwatch_event_rule.warmup_rule_1m.name
  target_id = "MeliApiPredictWarmup"
  arn       = aws_cloudwatch_event_api_destination.warmup_dest.arn
  role_arn  = aws_iam_role.eb_invocation_role.arn

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

# 5. IAM Role para que EventBridge pueda ejecutar la llamada
resource "aws_iam_role" "eb_invocation_role" {
  name = "meli-eb-warmup-role-new"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "events.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "eb_api_policy" {
  name = "meli-eb-api-policy-new"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "events:InvokeApiDestination"
      Effect   = "Allow"
      Resource = aws_cloudwatch_event_api_destination.warmup_dest.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eb_attach" {
  role       = aws_iam_role.eb_invocation_role.name
  policy_arn = aws_iam_policy.eb_api_policy.arn
}