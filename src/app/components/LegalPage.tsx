import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, FileText } from 'lucide-react';
import Navigation from './Navigation';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'dmca' | 'privacy' | 'terms'>('dmca');
  const [dmcaForm, setDmcaForm] = useState({
    fullName: '',
    infringingUrl: '',
    description: '',
    sworn: false,
  });

  const handleDmcaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('DMCA takedown notice submitted. We will review your request within 48 hours.');
    setDmcaForm({ fullName: '', infringingUrl: '', description: '', sworn: false });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 lg:px-8 pt-24 pb-12 lg:pb-20 mt-4 space-y-8">
        <h1 className="text-4xl lg:text-5xl font-bold text-center">Legal & Compliance</h1>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setActiveTab('dmca')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'dmca'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#1A1A1A] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            DMCA Takedown
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#1A1A1A] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#1A1A1A] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Terms of Service
          </button>
        </div>

        {activeTab === 'dmca' && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
            <h2 className="text-3xl font-bold">DMCA Takedown Notice</h2>
            <p className="text-[#9CA3AF]">
              If you believe that content on Tagthr infringes your copyright, please submit a takedown notice using the form below.
            </p>

            <form onSubmit={handleDmcaSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={dmcaForm.fullName}
                  onChange={(e) => setDmcaForm({ ...dmcaForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  placeholder="Your full legal name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Infringing URL</label>
                <input
                  type="url"
                  required
                  value={dmcaForm.infringingUrl}
                  onChange={(e) => setDmcaForm({ ...dmcaForm, infringingUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  placeholder="https://tagthr.com/party/abc123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description of Infringement</label>
                <textarea
                  required
                  value={dmcaForm.description}
                  onChange={(e) => setDmcaForm({ ...dmcaForm, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors resize-none"
                  placeholder="Please describe the copyrighted work and how it is being infringed..."
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sworn"
                  required
                  checked={dmcaForm.sworn}
                  onChange={(e) => setDmcaForm({ ...dmcaForm, sworn: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="sworn" className="text-sm text-[#9CA3AF]">
                  I swear, under penalty of perjury, that the information in this notification is accurate
                  and that I am the copyright owner, or am authorized to act on behalf of the owner,
                  of an exclusive right that is allegedly infringed.
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-[#EF4444] to-[#DC2626] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
              >
                Submit DMCA Notice
              </button>
            </form>

            <div className="pt-6 border-t border-[#2A2A2A]">
              <p className="text-sm text-[#9CA3AF]">
                <strong>Note:</strong> Video URLs are proxied and logged for compliance.
                All takedown requests are reviewed within 48 hours.
              </p>
              <p className="text-sm text-[#9CA3AF] mt-2">
                For legal requests, contact: <a href="mailto:legal@tagthr.com" className="text-[#06B6D4] hover:underline">legal@tagthr.com</a>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
            <h2 className="text-3xl font-bold">Privacy Policy</h2>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#8B5CF6]">Information We Collect</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <p>Tagthr is committed to minimizing data collection. We collect:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>IP addresses for session management and abuse prevention</li>
                  <li>Participant tokens stored in 24-hour cookies</li>
                  <li>Video URLs shared in watch party sessions</li>
                  <li>Chat messages during active sessions</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#06B6D4]">How We Use Your Data</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>To facilitate real-time synchronized viewing experiences</li>
                  <li>To prevent abuse and enforce rate limits</li>
                  <li>To respond to legal requests and DMCA takedown notices</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#F59E0B]">Data Retention</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <p>Session data is automatically deleted after 24 hours. IP logs and video URLs are retained for 30 days for legal compliance, then permanently deleted.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#10B981]">Cookies</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <p>We use session cookies to identify participants. These cookies expire after 24 hours and contain only anonymous participant tokens.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#EF4444]">Third-Party Services</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <p>Video content is embedded from third-party services (YouTube, Vimeo). These services may set their own cookies and collect data according to their privacy policies.</p>
              </div>
            </section>

            <div className="pt-6 border-t border-[#2A2A2A]">
              <p className="text-sm text-[#9CA3AF]">
                Last updated: May 3, 2026
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
            <h2 className="text-3xl font-bold">Terms of Service</h2>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#8B5CF6]">Acceptance of Terms</h3>
              <p className="text-[#9CA3AF]">
                By using Tagthr, you agree to these Terms of Service. If you do not agree, do not use the service.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#06B6D4]">Prohibited Content</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <p>You may not share or stream:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Copyrighted movies, TV shows, or other media without proper authorization</li>
                  <li>Malware, viruses, or harmful software</li>
                  <li>Illegal, obscene, or abusive content</li>
                  <li>Content that violates third-party rights</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#F59E0B]">Age Restriction</h3>
              <p className="text-[#9CA3AF]">
                You must be at least 13 years old to use Tagthr. Users under 18 require parental consent
                in jurisdictions where applicable.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#10B981]">Service Limitations</h3>
              <div className="text-[#9CA3AF] space-y-2">
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maximum 30 participants per session</li>
                  <li>Sessions expire after 24 hours of inactivity</li>
                  <li>Rate limits apply: 3 active sessions per IP, 10 messages per 30 seconds</li>
                  <li>Video URLs must be publicly accessible embed links</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#EF4444]">Liability Waiver</h3>
              <p className="text-[#9CA3AF]">
                Tagthr is provided "as is" without warranties. We are not responsible for user-submitted
                URLs or content. You use the service at your own risk.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#8B5CF6]">Moderation & Enforcement</h3>
              <p className="text-[#9CA3AF]">
                We reserve the right to remove content, terminate sessions, and ban users who violate
                these terms. Hosts have moderation tools (kick/ban) to manage their sessions.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-[#06B6D4]">DMCA Compliance</h3>
              <p className="text-[#9CA3AF]">
                We comply with the Digital Millennium Copyright Act. Copyright holders may submit
                takedown notices through our DMCA form. Repeat infringers will be banned.
              </p>
            </section>

            <div className="pt-6 border-t border-[#2A2A2A]">
              <p className="text-sm text-[#9CA3AF]">
                Last updated: May 3, 2026
              </p>
              <p className="text-sm text-[#9CA3AF] mt-2">
                For questions, contact: <a href="mailto:legal@tagthr.com" className="text-[#06B6D4] hover:underline">legal@tagthr.com</a>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 mt-32 pb-8 text-center text-[#9CA3AF] text-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-center gap-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
