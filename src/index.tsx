import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Homepage
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GHL SaaS Automation Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-rocket text-blue-600 text-2xl mr-3"></i>
                        <span class="font-bold text-xl text-gray-800">GHL SaaS Automation</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/catalog" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                            <i class="fas fa-th mr-2"></i>Catalog
                        </a>
                        <a href="/admin" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-cog mr-2"></i>Admin
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-extrabold text-gray-900 mb-4">
                    Transform Your GHL Snapshots into SaaS
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Automate provisioning, billing, and onboarding for 150+ GoHighLevel snapshots. 
                    One platform to rule them all.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 mb-12">
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition">
                    <div class="text-blue-600 text-4xl mb-4">
                        <i class="fas fa-download"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">1. Export Snapshots</h3>
                    <p class="text-gray-600">
                        Export your GHL snapshots to Excel for review and organization
                    </p>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition">
                    <div class="text-green-600 text-4xl mb-4">
                        <i class="fas fa-upload"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">2. Import & Generate</h3>
                    <p class="text-gray-600">
                        Upload edited Excel to create plans, descriptions, images, and Stripe links
                    </p>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition">
                    <div class="text-purple-600 text-4xl mb-4">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">3. Auto-Provision</h3>
                    <p class="text-gray-600">
                        Customers checkout → Sub-accounts created → Snapshots applied automatically
                    </p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    Key Features
                </h2>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="flex items-start">
                        <i class="fas fa-bolt text-yellow-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Bulk Operations:</strong> Process 150+ snapshots in one go
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-stripe text-blue-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Stripe Integration:</strong> 14-day free trials, payment links
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-robot text-purple-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Auto-Generated Content:</strong> Descriptions & images via AI
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-database text-indigo-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Full Audit Trail:</strong> Track every action and change
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-shield-alt text-green-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Role-Based Access:</strong> Secure admin controls
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-sync text-blue-500 mr-3 mt-1"></i>
                        <div>
                            <strong>Idempotent Jobs:</strong> Safe retries and error handling
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-12">
                <a href="/admin" class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition">
                    <i class="fas fa-arrow-right mr-2"></i>
                    Get Started
                </a>
            </div>
        </main>

        <footer class="bg-white border-t mt-16 py-8">
            <div class="max-w-7xl mx-auto px-4 text-center text-gray-600">
                <p>GHL SaaS Automation Platform &copy; 2024</p>
                <p class="text-sm mt-2">Built with Hono + Cloudflare Pages</p>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Catalog page placeholder
app.get('/catalog', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catalog - GHL SaaS Automation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-rocket text-blue-600 text-2xl mr-3"></i>
                        <a href="/" class="font-bold text-xl text-gray-800">GHL SaaS Automation</a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/catalog" class="text-blue-600 font-semibold px-3 py-2 rounded-md">
                            <i class="fas fa-th mr-2"></i>Catalog
                        </a>
                        <a href="/admin" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-cog mr-2"></i>Admin
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">
                <i class="fas fa-th mr-3"></i>
                Snapshot Catalog
            </h1>
            <div class="bg-white rounded-lg shadow p-8 text-center">
                <i class="fas fa-box-open text-6xl text-gray-400 mb-4"></i>
                <p class="text-xl text-gray-600">No plans published yet. Upload snapshots from the admin panel.</p>
                <a href="/admin" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                    Go to Admin
                </a>
            </div>
        </main>
    </body>
    </html>
  `)
})

// Admin page placeholder
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin - GHL SaaS Automation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <i class="fas fa-rocket text-blue-600 text-2xl mr-3"></i>
                        <a href="/" class="font-bold text-xl text-gray-800">GHL SaaS Automation</a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/catalog" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                            <i class="fas fa-th mr-2"></i>Catalog
                        </a>
                        <a href="/admin" class="text-blue-600 font-semibold px-3 py-2 rounded-md">
                            <i class="fas fa-cog mr-2"></i>Admin
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">
                <i class="fas fa-cog mr-3"></i>
                Admin Dashboard
            </h1>

            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-bold mb-4">
                        <i class="fas fa-download text-blue-600 mr-2"></i>
                        Export Snapshots
                    </h3>
                    <p class="text-gray-600 mb-4">Export GHL snapshots to Excel for review</p>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Export to Excel
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-bold mb-4">
                        <i class="fas fa-upload text-green-600 mr-2"></i>
                        Import & Generate Plans
                    </h3>
                    <p class="text-gray-600 mb-4">Upload Excel to create plans and Stripe links</p>
                    <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Upload Excel
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-bold mb-4">
                        <i class="fas fa-layer-group text-purple-600 mr-2"></i>
                        Manage Collections
                    </h3>
                    <p class="text-gray-600 mb-4">Create and organize plan collections</p>
                    <button class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                        Manage Collections
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-bold mb-4">
                        <i class="fas fa-users text-indigo-600 mr-2"></i>
                        View Tenants
                    </h3>
                    <p class="text-gray-600 mb-4">Monitor provisioned tenants and subscriptions</p>
                    <button class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        View Tenants
                    </button>
                </div>
            </div>

            <div class="mt-8 bg-white rounded-lg shadow p-6">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-book text-orange-600 mr-2"></i>
                    Documentation
                </h3>
                <p class="text-gray-600 mb-4">
                    Review the complete implementation guide and API documentation
                </p>
                <a href="/docs" class="inline-block bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                    View Documentation
                </a>
            </div>
        </main>
    </body>
    </html>
  `)
})

// API routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/snapshots', (c) => {
  // TODO: Implement GHL API integration
  return c.json({ message: 'Snapshots endpoint - to be implemented', snapshots: [] })
})

export default app
