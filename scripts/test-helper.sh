#!/bin/bash

# Test Helper Script - Guides developers on which tests to run

echo "🧪 Test Strategy Helper"
echo "======================"
echo ""

# Function to show test options
show_test_options() {
    echo "📋 Available Test Commands:"
    echo ""
    echo "🚀 Development (Fast Feedback):"
    echo "  npm run test:dev          # Quick validation (2-3 min)"
    echo ""
    echo "🎯 Feature-Specific:"
    echo "  npm run test:auth         # Authentication only"
    echo "  npm run test:core         # Core functionality only"
    echo "  npm run test:dashboard    # Dashboard only"
    echo "  npm run test:e2e          # End-to-end journeys"
    echo "  npm run test:pwa          # PWA functionality"
    echo ""
    echo "🔍 Integration:"
    echo "  npm test                  # Full regression (10-15 min)"
    echo ""
    echo "🚨 Production:"
    echo "  npm run test:all          # All browsers (45-60 min)"
    echo ""
    echo "🛠️  Debugging:"
    echo "  npm run test:debug        # Debug mode"
    echo "  npm run test:ui           # UI mode"
    echo "  npm run test:headed       # See browser"
    echo ""
}

# Function to recommend tests based on context
recommend_tests() {
    echo "💡 Recommendations:"
    echo ""
    
    case "$1" in
        "auth"|"login"|"signup"|"authentication")
            echo "🔐 Working on authentication?"
            echo "   → npm run test:auth"
            echo "   → npm run test:dev (for quick validation)"
            ;;
        "dashboard"|"user"|"profile")
            echo "📊 Working on dashboard/user features?"
            echo "   → npm run test:dashboard"
            echo "   → npm run test:dev (for quick validation)"
            ;;
        "pwa"|"offline"|"service-worker")
            echo "📱 Working on PWA features?"
            echo "   → npm run test:pwa"
            echo "   → npm run test:dev (for quick validation)"
            ;;
        "performance"|"speed"|"optimization")
            echo "⚡ Working on performance?"
            echo "   → npm run test:performance"
            echo "   → npm test (for integration)"
            ;;
        "security"|"xss"|"csrf")
            echo "🛡️ Working on security?"
            echo "   → npm run test:performance (includes security)"
            echo "   → npm test (for integration)"
            ;;
        "core"|"navigation"|"routing")
            echo "🔧 Working on core functionality?"
            echo "   → npm run test:core"
            echo "   → npm run test:dev (for quick validation)"
            ;;
        "e2e"|"user-journey"|"flow")
            echo "🔄 Working on user journeys?"
            echo "   → npm run test:e2e"
            echo "   → npm run test:dev (for quick validation)"
            ;;
        "debug"|"fix"|"bug")
            echo "🐛 Debugging an issue?"
            echo "   → npm run test:debug"
            echo "   → npm run test:ui"
            echo "   → npm run test:headed"
            ;;
        "commit"|"push"|"deploy")
            echo "🚀 Before committing/deploying?"
            echo "   → npm test (full regression)"
            echo "   → npm run test:all (production validation)"
            ;;
        *)
            echo "🤔 Not sure what to test?"
            echo "   → npm run test:dev (start here)"
            echo "   → npm test (full regression)"
            ;;
    esac
    echo ""
}

# Function to show current test status
show_status() {
    echo "📊 Current Test Status:"
    echo ""
    
    if [ -f "test-results/.last-run.json" ]; then
        echo "✅ Test results available"
        echo "📁 View report: npm run test:report"
    else
        echo "⚠️  No recent test results found"
        echo "💡 Run: npm run test:dev"
    fi
    echo ""
}

# Main script logic
case "$1" in
    "help"|"-h"|"--help")
        show_test_options
        ;;
    "status"|"s")
        show_status
        ;;
    "recommend"|"r")
        if [ -n "$2" ]; then
            recommend_tests "$2"
        else
            echo "Usage: ./scripts/test-helper.sh recommend <context>"
            echo "Examples:"
            echo "  ./scripts/test-helper.sh recommend auth"
            echo "  ./scripts/test-helper.sh recommend debug"
            echo "  ./scripts/test-helper.sh recommend commit"
        fi
        ;;
    *)
        echo "🧪 Test Strategy Helper"
        echo "======================"
        echo ""
        echo "Usage:"
        echo "  ./scripts/test-helper.sh help          # Show all options"
        echo "  ./scripts/test-helper.sh status        # Show current status"
        echo "  ./scripts/test-helper.sh recommend <context>  # Get recommendations"
        echo ""
        echo "Examples:"
        echo "  ./scripts/test-helper.sh recommend auth"
        echo "  ./scripts/test-helper.sh recommend debug"
        echo "  ./scripts/test-helper.sh recommend commit"
        echo ""
        show_test_options
        ;;
esac

