#!/bin/bash

# Database Backup Script
# 
# Creates backups of Supabase database schema and data
# Saves with timestamp for version tracking
#
# Usage: ./scripts/backup-database.sh
# Or: bash scripts/backup-database.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DATABASE BACKUP SCRIPT - Phase 1                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Attempting manual backup via pg_dump...${NC}"
    USE_PGDUMP=true
else
    echo -e "${GREEN}✓ Supabase CLI found${NC}"
    USE_PGDUMP=false
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="./database/backups"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup directory: $BACKUP_DIR${NC}"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo -e "${BLUE}📅 Timestamp: $TIMESTAMP${NC}"

# Backup file names
SCHEMA_FILE="$BACKUP_DIR/schema_backup_$TIMESTAMP.sql"
DATA_FILE="$BACKUP_DIR/data_backup_$TIMESTAMP.sql"
FULL_FILE="$BACKUP_DIR/full_backup_$TIMESTAMP.sql"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}Starting backup process...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$USE_PGDUMP" = true ]; then
    # Manual backup using pg_dump
    echo -e "${YELLOW}Using pg_dump for backup...${NC}"
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ ERROR: DATABASE_URL not set in environment${NC}"
        echo -e "${YELLOW}Please set DATABASE_URL in your .env file${NC}"
        exit 1
    fi
    
    # Load .env if it exists
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    echo -e "${BLUE}1/3 Backing up schema...${NC}"
    pg_dump "$DATABASE_URL" --schema-only --no-owner --no-acl > "$SCHEMA_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Schema backup complete: $SCHEMA_FILE${NC}"
    else
        echo -e "${RED}❌ Schema backup failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}2/3 Backing up data...${NC}"
    pg_dump "$DATABASE_URL" --data-only --no-owner --no-acl > "$DATA_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Data backup complete: $DATA_FILE${NC}"
    else
        echo -e "${RED}❌ Data backup failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}3/3 Creating full backup...${NC}"
    pg_dump "$DATABASE_URL" --no-owner --no-acl > "$FULL_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Full backup complete: $FULL_FILE${NC}"
    else
        echo -e "${RED}❌ Full backup failed${NC}"
        exit 1
    fi
    
else
    # Backup using Supabase CLI
    echo -e "${BLUE}1/3 Backing up schema...${NC}"
    supabase db dump --schema public > "$SCHEMA_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Schema backup complete: $SCHEMA_FILE${NC}"
    else
        echo -e "${RED}❌ Schema backup failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}2/3 Backing up data...${NC}"
    supabase db dump --data-only > "$DATA_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Data backup complete: $DATA_FILE${NC}"
    else
        echo -e "${RED}❌ Data backup failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}3/3 Creating full backup...${NC}"
    supabase db dump > "$FULL_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Full backup complete: $FULL_FILE${NC}"
    else
        echo -e "${RED}❌ Full backup failed${NC}"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ BACKUP COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show file sizes
echo "📊 Backup Summary:"
echo ""
if [ -f "$SCHEMA_FILE" ]; then
    SCHEMA_SIZE=$(du -h "$SCHEMA_FILE" | cut -f1)
    echo -e "  ${BLUE}Schema:${NC} $SCHEMA_SIZE - $SCHEMA_FILE"
fi

if [ -f "$DATA_FILE" ]; then
    DATA_SIZE=$(du -h "$DATA_FILE" | cut -f1)
    echo -e "  ${BLUE}Data:${NC}   $DATA_SIZE - $DATA_FILE"
fi

if [ -f "$FULL_FILE" ]; then
    FULL_SIZE=$(du -h "$FULL_FILE" | cut -f1)
    echo -e "  ${BLUE}Full:${NC}   $FULL_SIZE - $FULL_FILE"
fi

echo ""
echo "💾 All backups saved to: $BACKUP_DIR"
echo ""

# Create a latest symlink
ln -sf "schema_backup_$TIMESTAMP.sql" "$BACKUP_DIR/schema_latest.sql"
ln -sf "data_backup_$TIMESTAMP.sql" "$BACKUP_DIR/data_latest.sql"
ln -sf "full_backup_$TIMESTAMP.sql" "$BACKUP_DIR/full_latest.sql"

echo -e "${GREEN}✓ Created 'latest' symlinks for easy access${NC}"
echo ""

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups (keeping last 10)..."
cd "$BACKUP_DIR"
ls -t schema_backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
ls -t data_backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
ls -t full_backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
cd - > /dev/null

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/full_backup_*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Cleanup complete. Total backups: $BACKUP_COUNT${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verify backup integrity:"
echo "   head -n 20 $SCHEMA_FILE"
echo ""
echo "2. To restore schema:"
echo "   psql \$DATABASE_URL < $SCHEMA_FILE"
echo ""
echo "3. To restore data:"
echo "   psql \$DATABASE_URL < $DATA_FILE"
echo ""
echo "4. To restore full backup:"
echo "   psql \$DATABASE_URL < $FULL_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

