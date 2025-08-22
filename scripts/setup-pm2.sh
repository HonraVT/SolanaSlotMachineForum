#!/bin/bash
# scripts/setup-pm2.sh - Script para configurar PM2

set -e  # Exit on any error

echo "🚀 Setting up Solana Slot Machine Bot with PM2"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 is already installed"
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

print_success ".env file found"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Stop any existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 delete slot-server slot-scheduler 2>/dev/null || true
print_success "Cleaned up existing processes"

# Start applications using PM2
print_status "Starting applications with PM2..."
pm2 start ecosystem.config.json

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup (optional - for production servers)
echo ""
print_warning "To enable PM2 auto-startup on system boot, run:"
echo -e "${YELLOW}sudo pm2 startup${NC}"
echo -e "${YELLOW}pm2 save${NC}"

echo ""
print_success "Setup completed successfully!"
echo ""
echo "📊 Available commands:"
echo "  pm2 status                    - Check process status"
echo "  pm2 logs                      - View all logs"
echo "  pm2 logs slot-server          - View server logs only"
echo "  pm2 logs slot-scheduler       - View scheduler logs only"
echo "  pm2 restart slot-server       - Restart server only"
echo "  pm2 restart slot-scheduler    - Restart scheduler only"
echo "  pm2 restart all               - Restart both processes"
echo "  pm2 stop all                  - Stop all processes"
echo "  pm2 delete all                - Delete all processes"
echo "  pm2 monit                     - Monitor processes"
echo ""
print_status "Checking process status..."
pm2 status
