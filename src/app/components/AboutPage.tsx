import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Users, LogIn, Repeat, Shield, Search, Crown, Globe, Play } from 'lucide-react';
import Navigation from './Navigation';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-12 lg:py-20 space-y-16">
        <section className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold">What is Tagthr?</h1>
          <p className="text-xl text-[#9CA3AF]">
            Real‑time viewing. Zero friction. Total togetherness.
          </p>
        </section>

        <section className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
          <h2 className="text-3xl font-bold">The Name & Meaning</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-semibold text-[#8B5CF6] mb-2">Tagthr</h3>
              <p className="text-[#9CA3AF]">(pronounced tag-ger)</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-[#06B6D4]" />
                  <h4 className="text-xl font-semibold text-[#06B6D4]">Tag</h4>
                </div>
                <p className="text-[#9CA3AF]">
                  Like tagging a friend in a post. Invite, nudge, include.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-[#F59E0B]" />
                  <h4 className="text-xl font-semibold text-[#F59E0B]">thr</h4>
                </div>
                <p className="text-[#9CA3AF]">
                  Short for together. Because watching alone is silent; watching together is magic.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center py-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] rounded-full flex items-center justify-center animate-pulse">
                <Play className="w-12 h-12 fill-white" />
              </div>
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#F59E0B] rounded-full"></div>
              <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-[#10B981] rounded-full"></div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Mission Statement</h2>
            <p className="text-xl text-[#E5E7EB] max-w-3xl mx-auto">
              "To make shared media as easy as sharing a link. No accounts, no downloads, no excuses.
              Just you, your friends, and perfect sync."
            </p>
          </div>

          <div className="text-center space-y-4 pt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-[#06B6D4]" />
              <h2 className="text-3xl font-bold">Vision</h2>
            </div>
            <p className="text-xl text-[#E5E7EB]">
              "A global living room where distance disappears – frame by frame."
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Core Goals</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <LogIn className="w-10 h-10 text-[#8B5CF6]" />
              <h3 className="text-xl font-semibold">Zero‑barrier entry</h3>
              <p className="text-[#9CA3AF]">No registration, ever.</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <Repeat className="w-10 h-10 text-[#06B6D4]" />
              <h3 className="text-xl font-semibold">Perfect sync</h3>
              <p className="text-[#9CA3AF]">Real‑time playback across 30 participants.</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <Shield className="w-10 h-10 text-[#10B981]" />
              <h3 className="text-xl font-semibold">Safe & responsible</h3>
              <p className="text-[#9CA3AF]">Private rooms, moderation, and DMCA compliance.</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <Search className="w-10 h-10 text-[#F59E0B]" />
              <h3 className="text-xl font-semibold">Smart Search</h3>
              <p className="text-[#9CA3AF]">Find movies & series using our free media API.</p>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A3A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-3xl font-bold">The Problem We Solve</h2>
          </div>
          <p className="text-lg text-[#E5E7EB]">
            Synchronizing a movie over a video call is clunky. Services require logins.
            Tagthr removes the friction. Share a link, press play, and everyone's in sync –
            instantly and effortlessly.
          </p>
        </section>

        <section className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 lg:p-12 space-y-6">
          <div className="flex items-center gap-3">
            <Crown className="w-10 h-10 text-[#F59E0B]" />
            <h2 className="text-3xl font-bold">Meet the Host</h2>
          </div>
          <p className="text-lg text-[#E5E7EB]">
            Every watch party has a host – the person who controls playback. But what if they have to leave?
          </p>
          <div className="bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] p-6">
            <p className="text-[#06B6D4]">
              <span className="font-semibold">Automatic host promotion:</span> If the host leaves,
              the next active person takes over. The show goes on.
            </p>
          </div>
        </section>

        <section className="text-center space-y-6 py-12">
          <h2 className="text-3xl font-bold">Ready to watch together?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Find a Movie to Watch
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start a Public Party
            </button>
          </div>
        </section>
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
