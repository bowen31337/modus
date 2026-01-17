#!/bin/bash

# ============================================================================
# m - Community Moderation System
# Development Environment Setup Script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "  m - Community Moderation System"
echo "  Development Environment Setup"
echo "=============================================="
echo -e "${NC}"

# Check for required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed.${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}Error: Node.js 18+ is required. Found v$(node -v)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}pnpm not found. Installing...${NC}"
        npm install -g pnpm
    fi
    echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

    # Check for git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: git is not installed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ git $(git --version | cut -d' ' -f3)${NC}"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Setup environment variables
setup_env() {
    echo ""
    echo -e "${YELLOW}Setting up environment...${NC}"

    # Check for .env files
    if [ -f "apps/web/.env.local" ]; then
        echo -e "${GREEN}✓ apps/web/.env.local exists${NC}"
    else
        if [ -f "apps/web/.env.example" ]; then
            cp apps/web/.env.example apps/web/.env.local
            echo -e "${YELLOW}! Created apps/web/.env.local from example. Please update with your values.${NC}"
        else
            echo -e "${YELLOW}! No .env.example found. You may need to create .env.local manually.${NC}"
        fi
    fi
}

# Run database migrations (if Supabase CLI is available)
setup_database() {
    echo ""
    echo -e "${YELLOW}Checking database setup...${NC}"

    if command -v supabase &> /dev/null; then
        echo -e "${GREEN}✓ Supabase CLI available${NC}"
        echo -e "${BLUE}To setup the database, run:${NC}"
        echo "  supabase start"
        echo "  supabase db push"
    else
        echo -e "${YELLOW}! Supabase CLI not installed.${NC}"
        echo "  Install with: npm install -g supabase"
        echo "  Or use the hosted Supabase dashboard."
    fi
}

# Build packages
build_packages() {
    echo ""
    echo -e "${YELLOW}Building packages...${NC}"
    pnpm build
    echo -e "${GREEN}✓ Packages built${NC}"
}

# Start development servers
start_dev() {
    echo ""
    echo -e "${YELLOW}Starting development server...${NC}"
    echo ""
    echo -e "${BLUE}=============================================="
    echo "  Development server starting..."
    echo "=============================================="
    echo ""
    echo "  Web App:     http://localhost:3000"
    echo ""
    echo "  Keyboard Shortcuts:"
    echo "    J/K        - Navigate queue"
    echo "    Enter      - Open & assign post"
    echo "    R          - Focus reply editor"
    echo "    Tab        - Accept AI suggestion"
    echo "    Cmd+Enter  - Post & resolve"
    echo "    Cmd+K      - Command palette"
    echo "    Esc        - Close detail view"
    echo ""
    echo "  Press Ctrl+C to stop the server"
    echo -e "=============================================="
    echo -e "${NC}"

    pnpm dev
}

# Show help
show_help() {
    echo "Usage: ./init.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Full setup (check, install, build)"
    echo "  dev      - Start development server"
    echo "  check    - Check requirements only"
    echo "  install  - Install dependencies only"
    echo "  build    - Build packages only"
    echo "  help     - Show this help message"
    echo ""
    echo "No command runs full setup + dev server"
}

# Main script
case "${1:-}" in
    setup)
        check_requirements
        install_dependencies
        setup_env
        setup_database
        build_packages
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo "Run './init.sh dev' to start the development server."
        ;;
    dev)
        start_dev
        ;;
    check)
        check_requirements
        ;;
    install)
        install_dependencies
        ;;
    build)
        build_packages
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        check_requirements
        install_dependencies
        setup_env
        setup_database
        build_packages
        start_dev
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
