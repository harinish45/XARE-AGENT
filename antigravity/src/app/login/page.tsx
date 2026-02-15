import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function Login({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const signIn = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        return redirect("/dashboard");
    };

    const signUp = async (formData: FormData) => {
        "use server";

        const origin = headers().get("origin");
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        return redirect("/login?message=Check email to continue sign in process");
    };

    const signInWithGithub = async () => {
        "use server";

        const origin = headers().get("origin");
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        if (data.url) {
            return redirect(data.url);
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 relative z-10 mx-auto min-h-screen">
            <div className="absolute inset-0 -z-10 bg-[var(--dark-bg)]">
                <BackgroundPaths title=" " />
            </div>

            <div className="glass-heavy p-8 rounded-2xl border border-[var(--neon-cyan)]/30 shadow-2xl neon-glow-cyan">
                <h1 className="text-3xl font-bold mb-2 text-center neon-text-cyan">Welcome Back</h1>
                <p className="text-gray-400 text-center mb-6">Sign in to your Antigravity account</p>

                <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-white">
                    <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full rounded-lg px-4 py-3 glass border border-white/20 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-cyan)] focus:neon-glow-cyan transition-all"
                            name="email"
                            placeholder="you@example.com"
                            type="email"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="w-full rounded-lg px-4 py-3 glass border border-white/20 bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-purple)] focus:neon-glow-purple transition-all"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        formAction={signIn}
                        className="w-full mt-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-blue)] text-black font-semibold hover:opacity-90 transition-all neon-glow-cyan shadow-lg"
                    >
                        Sign In
                    </button>

                    <button
                        formAction={signUp}
                        className="w-full px-6 py-3 rounded-lg bg-transparent border-2 border-[var(--neon-purple)] text-[var(--neon-purple)] font-semibold hover:bg-[var(--neon-purple)] hover:text-white transition-all"
                    >
                        Sign Up
                    </button>

                    {searchParams?.message && (
                        <div className="mt-2 p-3 glass rounded-lg border border-[var(--neon-pink)]/30 text-center">
                            <p className="text-sm text-gray-300">{searchParams.message}</p>
                        </div>
                    )}
                </form>

                <div className="my-6 flex items-center justify-center">
                    <span className="h-px bg-white/20 w-full"></span>
                    <span className="px-3 text-gray-500 text-sm">Or</span>
                    <span className="h-px bg-white/20 w-full"></span>
                </div>

                <form>
                    <button
                        formAction={signInWithGithub}
                        className="w-full glass border-2 border-white/20 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-3 font-medium hover:border-white/40 hover:bg-white/10 transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Sign in with GitHub
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account? <span className="text-[var(--neon-pink)] hover:text-[var(--neon-cyan)] cursor-pointer transition-colors">Contact Sales</span>
                </p>
            </div>
        </div>
    );
}
