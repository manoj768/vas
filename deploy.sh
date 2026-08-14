# Valuation Studio Deployment & Git Workflow Script
# Automated environment deployer for Development, Staging, and Production.

set -e

ENV_TARGET=${1:-"dev"}

echo "=================================================="
echo "🚀 Valuation Studio Deployer: [ $ENV_TARGET ]"
echo "=================================================="

if [ "$ENV_TARGET" = "prod" ] || [ "$ENV_TARGET" = "main" ]; then
    echo "📦 Switching to 'main' branch for Production..."
    git checkout main
    git pull origin main
    
    echo "🔨 Building and launching Production Docker stack..."
    docker compose -f docker-compose.prod.yml up --build -d
    
    echo "✅ Production deployment complete! Live on Port 3000."
    echo "📊 Database: Production MongoDB (Persistent)"
    echo "🖼️ Storage: MinIO / S3 Production Bucket"

elif [ "$ENV_TARGET" = "dev" ]; then
    echo "🧪 Switching to 'dev' branch for Testing..."
    git checkout dev
    git pull origin dev
    
    echo "🔨 Building and launching Development Docker stack..."
    docker compose -f docker-compose.dev.yml up --build -d
    
    echo "✅ Dev/Testing deployment complete! Live on Port 3001."
    echo "📊 Database: Dev Sandbox MongoDB"
    echo "🖼️ Storage: Dev Test Bucket"

else
    echo "❌ Unknown environment: $ENV_TARGET. Use './deploy.sh dev' or './deploy.sh prod'"
    exit 1
fi
