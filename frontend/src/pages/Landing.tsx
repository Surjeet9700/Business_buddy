import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, FileText, Share2, ShieldCheck, Zap, Star } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                            <Zap className="h-5 w-5" />
                        </div>
                        <span>Business Buddy</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="font-medium">Sign In</Button>
                        </Link>
                        <Link to="/register">
                            <Button className="font-medium shadow-md shadow-primary/20">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pb-16 pt-16 md:pb-32 md:pt-24 lg:py-32">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -z-10" />

                    <div className="container relative z-10 flex max-w-[64rem] flex-col items-center gap-6 text-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/5 text-primary rounded-full animate-fade-in">
                            New: AI-Powered Workflow Analysis ✨
                        </Badge>
                        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60">
                            Automate your <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-500">entire business.</span>
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 font-light">
                            Business Buddy is the operating system for modern enterprises. Build forms, design workflows, and manage teams with zero code.
                        </p>
                        <div className="space-x-4 pt-4">
                            <Link to="/register">
                                <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-lg border-primary/20 hover:bg-primary/5">
                                    Live Demo
                                </Button>
                            </Link>
                        </div>

                        {/* Hero Image/Preview Mockup Placeholder */}
                        {/* <div className="mt-16 rounded-xl border bg-card p-2 shadow-2xl shadow-primary/10 w-full max-w-5xl overflow-hidden animate-slide-up">
                            <div className="rounded-lg bg-muted/50 aspect-video flex items-center justify-center border border-dashed">
                                <div className="text-muted-foreground font-medium">Dashboard Preview</div>
                            </div>
                        </div> */}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="container space-y-16 py-16 md:py-32">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Join thousands of efficient teams already using Business Buddy.
                        </p>
                        {/* Mock Logos */}
                        <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 mt-10">
                            <div className="flex items-center gap-2 font-bold text-2xl"><Zap className="h-8 w-8 text-yellow-500" /> Acme Corp</div>
                            <div className="flex items-center gap-2 font-bold text-2xl"><CheckCircle2 className="h-8 w-8 text-green-500" /> GlobalTech</div>
                            <div className="flex items-center gap-2 font-bold text-2xl"><ShieldCheck className="h-8 w-8 text-blue-500" /> SecureNet</div>
                            <div className="flex items-center gap-2 font-bold text-2xl"><Share2 className="h-8 w-8 text-purple-500" /> ConnectFlow</div>
                        </div>
                    </div>
                    <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <FeatureCard
                            icon={<FileText className="h-10 w-10 text-blue-500" />}
                            title="Dynamic Forms"
                            description="Build complex forms with drag-and-drop ease. Support for validation,conditional logic, and more."
                        />
                        <FeatureCard
                            icon={<Share2 className="h-10 w-10 text-green-500" />}
                            title="Workflow Automation"
                            description="Design multi-step approval flows. Route submissions dynamically based on data."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-10 w-10 text-purple-500" />}
                            title="Role-Based Access"
                            description="Granular permissions ensure the right people see the right data at the right time."
                        />
                        <FeatureCard
                            icon={<Zap className="h-10 w-10 text-yellow-500" />}
                            title="Real-time Analytics"
                            description="Track KPIs, bottlenecks, and performance metrics instantly."
                        />
                        <FeatureCard
                            icon={<CheckCircle2 className="h-10 w-10 text-pink-500" />}
                            title="Audit Logs"
                            description="Full traceability of every action taken within the platform."
                        />
                        <FeatureCard
                            icon={<Star className="h-10 w-10 text-orange-500" />}
                            title="Premium Support"
                            description="24/7 dedicated support for enterprise customers."
                        />
                    </div>
                </section>


            </main>

            <footer className="py-8 border-t bg-muted/20">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Zap className="h-5 w-5 text-primary" />
                        <span>Business Buddy</span>
                    </div>
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2025 Business Buddy Inc. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group relative overflow-hidden rounded-xl border bg-background p-2 transition-all hover:shadow-lg hover:border-primary/20">
            <div className="flex flex-col justify-between rounded-md p-6 h-full">
                <div className="mb-4">{icon}</div>
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{description}</p>
                </div>
            </div>
        </div>
    );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <Card className="border-none shadow-sm bg-background">
            <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-muted-foreground mb-6">"{quote}"</p>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>{author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{author}</p>
                        <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
