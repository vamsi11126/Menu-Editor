import Link from 'next/link'
import { ArrowRight, Palette, QrCode, Download, Cloud, Zap, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Palette className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Menu Editor
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Beautiful Menus
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              In Minutes
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional drag-and-drop menu editor with QR code generation. Perfect for restaurants, cafes, and food businesses.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-lg">
              Start Creating Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/signin" className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-lg">
              View Demo
            </Link>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-16 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Palette className="w-24 h-24 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Interactive Menu Editor Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Palette className="w-12 h-12 text-blue-600" />}
            title="Drag & Drop Editor"
            description="Intuitive visual editor with real-time preview. Position items exactly where you want them."
          />
          <FeatureCard
            icon={<QrCode className="w-12 h-12 text-purple-600" />}
            title="QR Code Generation"
            description="Instantly generate QR codes for your menus. Perfect for contactless dining."
          />
          <FeatureCard
            icon={<Download className="w-12 h-12 text-green-600" />}
            title="HD Export"
            description="Download print-ready images at 300+ DPI. Perfect for professional printing."
          />
          <FeatureCard
            icon={<Cloud className="w-12 h-12 text-indigo-600" />}
            title="Cloud Storage"
            description="Your menus are safely stored in the cloud. Access from anywhere, anytime."
          />
          <FeatureCard
            icon={<Zap className="w-12 h-12 text-yellow-600" />}
            title="Auto-Save"
            description="Never lose your work. Changes are automatically saved every 30 seconds."
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-red-600" />}
            title="Secure & Private"
            description="Your data is encrypted and secure. Share publicly or keep it private."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Create Your Menu?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of restaurants using our platform
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-lg">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 Menu Editor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
