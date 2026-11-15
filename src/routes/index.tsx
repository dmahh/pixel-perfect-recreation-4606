import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Route as RouteIcon, Sparkles, Waypoints } from "lucide-react";
import heroImage from "@/assets/astana-skyline.jpg";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/site/kit";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CATEGORY_LABEL, formatKzt, formatHours } from "@/lib/astana/landmarks";
import { landmarksQueryOptions } from "@/lib/astana/landmarks.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Astana — AI Tourist Guide to the Capital" },
      {
        name: "description",
        content:
          "Plan a day in Astana with an intelligent itinerary agent, watch A* find routes between landmarks and score attractions with a Bayesian network.",
      },
      { property: "og:title", content: "Smart Astana — AI Tourist Guide to the Capital" },
      {
        property: "og:description",
        content: "Three AI fundamentals, one city: agents, A* search and Bayesian networks applied to Astana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(landmarksQueryOptions());
  },
  component: Index,
});

const CONCEPTS = [
  {
    to: "/itinerary",
    code: "01",
    icon: BrainCircuit,
    title: "Intelligent agent",
    text: "A utility-based agent perceives your budget, time and interests, then acts by choosing the best next landmark until no feasible move remains.",
    cta: "Build an itinerary",
  },
  {
    to: "/route-planner",
    code: "02",
    icon: RouteIcon,
    title: "A* route planning",
    text: "Informed search over the city road graph, using f(n) = g(n) + h(n) with a straight-line heuristic. Watch every expansion step by step.",
    cta: "Plan a route",
  },
  {
    to: "/bayesian",
    code: "03",
    icon: Waypoints,
    title: "Bayesian network",
    text: "Weather and season propagate through comfort and crowd nodes to give each attraction a probability of being a good visit today.",
    cta: "Score attractions",
  },
] as const;

const STEPS = [
  "Tell the agent your budget, time and interests",
  "Get a custom itinerary on the map",
  "Trace the A* path between any two landmarks",
  "Check which attractions suit today's weather",
];

function Index() {
  const { data: kb } = useSuspenseQuery(landmarksQueryOptions());
  const LANDMARKS = kb.landmarks;
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy">
        <img
          src={heroImage}
          alt="Astana skyline at blue hour with Bayterek Tower and Khan Shatyr"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_center]"
        />
        <div className="bg-hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <p className="eyebrow flex items-center gap-2 text-primary-glow">
            <Sparkles className="h-3.5 w-3.5" /> AI fundamentals · Astana, Kazakhstan
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-primary-foreground sm:text-6xl">
            Explore the capital with <span className="text-gradient">smart</span> reasoning.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-foreground sm:text-lg">
            An interactive guide to ten Astana landmarks, built to show how agents, search and probability
            turn a city into a solvable problem.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/itinerary">
                Plan my day <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link to="/route-planner">See A* in action</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="eyebrow text-primary">Three modules</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold">One city, three ways an AI can think about it.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CONCEPTS.map(({ to, code, icon: Icon, title, text, cta }) => (
            <Link
              key={to}
              to={to}
              className="surface group flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{code}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
                {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold">From preferences to a plan.</h2>
            <ol className="mt-8 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-xs text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Knowledge base · {LANDMARKS.length} landmarks</p>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
              {LANDMARKS.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold">{l.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CategoryDot category={l.category} /> {CATEGORY_LABEL[l.category]} · ★ {l.rating} · {formatHours(l.visitHours)} · popularity {l.popularity}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatKzt(l.cost)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
