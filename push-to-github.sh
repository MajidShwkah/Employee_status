#!/bin/bash

# Script to push Employee Status Dashboard to GitHub
# Repository: https://github.com/MajidShwkah/Employee_status.git

echo "🚀 Pushing Employee Status Dashboard to GitHub..."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    echo "Please install git first:"
    echo "  sudo apt install git"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the Dashboard directory"
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Check git config
if [ -z "$(git config user.name)" ]; then
    echo "⚠️  Git user name not set!"
    echo "Please run:"
    echo "  git config --global user.name 'Your Name'"
    echo "  git config --global user.email 'your.email@example.com'"
    exit 1
fi

# Add all files
echo "📝 Adding files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Create commit
    echo "💾 Creating commit..."
    git commit -m "Initial commit: Employee Status Dashboard"
fi

# Set branch to main
git branch -M main

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    echo "✅ Remote 'origin' already exists"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Current URL: $REMOTE_URL"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin https://github.com/MajidShwkah/Employee_status.git
    fi
else
    echo "🔗 Adding remote repository..."
    git remote add origin https://github.com/MajidShwkah/Employee_status.git
fi

echo ""
echo "📤 Pushing to GitHub..."
echo "⚠️  You may be prompted for your GitHub username and password/token"
echo ""
echo "Note: GitHub requires a Personal Access Token instead of password"
echo "Get one at: https://github.com/settings/tokens"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository: https://github.com/MajidShwkah/Employee_status"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Import your GitHub repository"
    echo "3. Deploy automatically!"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Common issues:"
    echo "1. Authentication: Use Personal Access Token (not password)"
    echo "   Get token at: https://github.com/settings/tokens"
    echo "2. Repository doesn't exist or you don't have access"
    echo "3. Check your internet connection"
    echo ""
    echo "For manual steps, see: PUSH_TO_GITHUB.md"
fi
