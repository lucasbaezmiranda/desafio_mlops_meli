# Secretos y variables: .env vs GitHub Actions

## Terraform (infra)

- **Valores sensibles** (ID de cuenta AWS, ARN del certificado ACM) van en **`terraform.tfvars`**.
- `terraform.tfvars` está en **.gitignore** → no se sube al repo.
- En el repo solo está **`terraform.tfvars.example`** con placeholders. Quien clone el repo debe:
  1. Copiar: `cp terraform.tfvars.example terraform.tfvars`
  2. Editar `terraform.tfvars` con sus valores reales (nunca commitear ese archivo).

En CI/CD, si algún día corre Terraform desde GitHub Actions, esos valores se inyectarían con **Variables** o **Secrets** del repo (igual que hoy con `AWS_ROLE_ARN`), no leyendo un archivo `.env` del código.

---

## .env en el proyecto (frontend/backend)

Un archivo **`.env`** se usa en tu máquina para definir variables de entorno (API URLs, claves, etc.). También está en **.gitignore**, así que **nunca se sube a GitHub**.

### ¿Cómo "compila" GitHub si el .env no está?

Porque en GitHub **no se usa un .env del repo**. Hay dos casos:

1. **La app no necesita variables en build**  
   Si todo lo que necesita está hardcodeado (como la URL del API en el front hoy), el build en GitHub funciona igual: `npm run build` no lee ningún `.env`.

2. **La app sí necesita variables en build o en runtime**  
   Entonces los valores **no vienen de un .env**, sino de **GitHub**:
   - **Secrets** (Settings → Secrets and variables → Actions): para claves, tokens, ARNs.
   - **Variables** (mismo lugar): para cosas no secretas (ej. URL del API por ambiente).

   En el workflow de GitHub Actions se **inyectan** en el job, por ejemplo:
   ```yaml
   env:
     VITE_API_URL: ${{ vars.API_URL }}   # variable del repo
     AWS_ROLE_ARN: ${{ secrets.AWS_ROLE_ARN }}   # secreto
   ```
   Luego `npm run build` corre con esas variables ya definidas en el entorno; el frontend (Vite) puede leer `import.meta.env.VITE_API_URL` y compilarla en el bundle. No hace falta ningún archivo `.env` en el repo.

Resumen: **GitHub no compila “con tu .env”; o no hace falta (todo hardcodeado) o los valores se configuran en Secrets/Variables y se pasan al job.** El `.env` es solo para desarrollo local.
