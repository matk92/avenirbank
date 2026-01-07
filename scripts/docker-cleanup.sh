#!/bin/bash

# Docker Cleanup and Disk Space Management Script
# Helps manage Docker disk space consumption for AVENIR Bank

set -e

echo "🧹 Docker Cleanup and Disk Space Management"
echo "==========================================="
echo ""

# Function to show disk usage
show_disk_usage() {
    echo "📊 Current Docker Disk Usage:"
    docker system df
    echo ""
}

# Function to cleanup dangling images and build cache
cleanup_dangling() {
    echo "🗑️  Removing dangling images and build cache..."
    
    # Remove dangling images
    docker image prune -f --filter "dangling=true"
    
    # Remove unused build cache
    docker builder prune -f
    
    echo "✅ Dangling images and build cache removed"
    echo ""
}

# Function to cleanup unused volumes
cleanup_volumes() {
    echo "🗑️  Removing unused volumes..."
    docker volume prune -f
    echo "✅ Unused volumes removed"
    echo ""
}

# Function to cleanup unused networks
cleanup_networks() {
    echo "🗑️  Removing unused networks..."
    docker network prune -f
    echo "✅ Unused networks removed"
    echo ""
}

# Function to full system cleanup
full_cleanup() {
    echo "⚠️  WARNING: This will remove ALL unused Docker resources"
    echo "   - Stopped containers"
    echo "   - Dangling images"
    echo "   - Unused volumes"
    echo "   - Unused networks"
    echo "   - Build cache"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a -f
        echo "✅ Full system cleanup completed"
    else
        echo "❌ Cleanup cancelled"
    fi
    echo ""
}

# Function to show volume sizes
show_volume_sizes() {
    echo "📦 AVENIR Bank Volume Sizes:"
    echo ""
    
    for volume in avenirbank_postgres_data avenirbank_redis_data avenirbank_grafana_data avenirbank_prometheus_data; do
        if docker volume inspect "$volume" &>/dev/null; then
            size=$(docker run --rm -v "$volume":/data alpine sh -c "du -sh /data" 2>/dev/null | awk '{print $1}')
            echo "  - $volume: $size"
        fi
    done
    echo ""
}

# Function to show image sizes
show_image_sizes() {
    echo "🖼️  AVENIR Bank Image Sizes:"
    docker images --filter "reference=avenirbank*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
}

# Function to cleanup old images
cleanup_old_images() {
    echo "🗑️  Removing old/untagged AVENIR Bank images..."
    
    # Remove untagged images
    docker images | grep "^<none>" | awk '{print $3}' | xargs -r docker rmi -f
    
    echo "✅ Old images removed"
    echo ""
}

# Function to limit PostgreSQL volume growth
limit_postgres_volume() {
    echo "⚙️  Configuring PostgreSQL volume limits..."
    
    # Note: This requires stopping the container first
    echo "To limit PostgreSQL volume growth, consider:"
    echo "  1. Enable log rotation in PostgreSQL"
    echo "  2. Set up automated backups and cleanup"
    echo "  3. Monitor WAL (Write-Ahead Logs) size"
    echo ""
}

# Main menu
show_menu() {
    echo "Select cleanup option:"
    echo "  1) Show disk usage"
    echo "  2) Remove dangling images and build cache"
    echo "  3) Remove unused volumes"
    echo "  4) Remove unused networks"
    echo "  5) Show AVENIR Bank volume sizes"
    echo "  6) Show AVENIR Bank image sizes"
    echo "  7) Remove old/untagged images"
    echo "  8) Full system cleanup (AGGRESSIVE)"
    echo "  9) Show all info and exit"
    echo "  0) Exit"
    echo ""
}

# If no arguments, show interactive menu
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        read -p "Enter choice [0-9]: " choice
        
        case $choice in
            1) show_disk_usage ;;
            2) cleanup_dangling ;;
            3) cleanup_volumes ;;
            4) cleanup_networks ;;
            5) show_volume_sizes ;;
            6) show_image_sizes ;;
            7) cleanup_old_images ;;
            8) full_cleanup ;;
            9) show_disk_usage; show_volume_sizes; show_image_sizes ;;
            0) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid option" ;;
        esac
    done
else
    # Process command line arguments
    case "$1" in
        --all) full_cleanup ;;
        --dangling) cleanup_dangling ;;
        --volumes) cleanup_volumes ;;
        --networks) cleanup_networks ;;
        --old-images) cleanup_old_images ;;
        --status) show_disk_usage; show_volume_sizes; show_image_sizes ;;
        --help)
            echo "Usage: $0 [OPTION]"
            echo "Docker cleanup and disk space management for AVENIR Bank"
            echo ""
            echo "Options:"
            echo "  --all              Full system cleanup (removes all unused resources)"
            echo "  --dangling         Remove dangling images and build cache"
            echo "  --volumes          Remove unused volumes"
            echo "  --networks         Remove unused networks"
            echo "  --old-images       Remove old/untagged images"
            echo "  --status           Show disk usage and volume sizes"
            echo "  --help             Show this help message"
            echo ""
            echo "Run without arguments for interactive menu"
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run with --help for usage information"
            exit 1
            ;;
    esac
fi
