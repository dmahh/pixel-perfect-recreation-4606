import { GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "./LanguageProvider";

type Module = "agent" | "astar" | "bayes";
type Lesson = { title: string; bullets: string[]; formula?: string };
const LESSONS: Record<Module, { en: Lesson[]; kk: Lesson[] }> = {
  agent: {
    en: [
      { title: "A utility-based intelligent agent", bullets: ["An agent observes its environment and chooses actions toward a goal.", "Utility scores express how desirable an action is.", "A greedy policy chooses the best feasible next action."], formula: "U = 0.6 × interest + 0.15 × category + 0.25 × popularity/100" },
      { title: "From preferences to an itinerary", bullets: ["Inputs: budget, available time, interests and starting location.", "Reject a stop if its visit and travel would exceed your budget or time.", "Rank remaining stops by utility per visit-plus-travel hour, then repeat.", "Totals include admission costs and estimated travel time."] },
      { title: "Heuristic, not a global optimum", bullets: ["Greedy choices do not guarantee the best whole-day itinerary.", "Prices, popularity and visit durations are illustrative values.", "Travel assumes 20 km/h, a 1.3 road factor and a five-minute transfer buffer."] },
    ],
    kk: [
      { title: "Пайдалылыққа негізделген зияткерлік агент", bullets: ["Агент ортаны бақылап, мақсатқа бағытталған әрекеттерді таңдайды.", "Пайдалылық бағасы әрекеттің қаншалықты тиімді екенін көрсетеді.", "Ашкөз стратегия келесі ең тиімді қолжетімді әрекетті таңдайды."], formula: "U = 0.6 × қызығушылық + 0.15 × санат + 0.25 × танымалдық/100" },
      { title: "Қалауыңыздан саяхат жоспарына", bullets: ["Кіріс деректері: бюджет, бос уақыт, қызығушылықтар және бастапқы орын.", "Бару мен жол шығыны бюджеттен не уақыттан асса, аялдама қабылданбайды.", "Қалған орындар бару және жол сағатына шаққандағы пайдалылықпен сұрыпталады.", "Жалпы есепке кіру бағасы мен болжамды жол уақыты кіреді."] },
      { title: "Эвристика, жаһандық оңтайлы шешім емес", bullets: ["Ашкөз таңдау бүкіл күн үшін ең жақсы жоспарға кепілдік бермейді.", "Бағалар, танымалдық және бару ұзақтығы — үлгілік мәндер.", "Жол есебі: 20 км/сағ, 1.3 жол коэффициенті және бес минуттық ауысу қоры."] },
    ],
  },
  astar: {
    en: [
      { title: "A* combines cost and an estimate", bullets: ["g(n): the best known distance from the start to node n.", "h(n): a straight-line estimate from n to the goal.", "Expand the open node with the smallest f(n); update neighbours when a shorter route is found."], formula: "f(n) = g(n) + h(n)" },
      { title: "Searching the Astana landmark graph", bullets: ["Ten landmarks are nodes; fifteen undirected links are possible routes.", "Gold marks the current node, outlined nodes are open, and pale nodes are closed.", "Play or step through the queue and log; the final blue path follows cameFrom links.", "Dijkstra provides a reference cost and expansion count."] },
      { title: "Optimal within this sample graph", bullets: ["The heuristic never exceeds the graph's road cost, so the final path is optimal within this graph.", "Road links use straight-line distance × 1.2–1.5, not measured street routes.", "Traffic, road closures and live navigation are not represented."] },
    ],
    kk: [
      { title: "A* шығын мен болжамды біріктіреді", bullets: ["g(n): бастапқы нүктеден n түйініне дейінгі ең жақсы белгілі қашықтық.", "h(n): n түйінінен мақсатқа дейінгі түзу сызықты болжам.", "Ең кіші f(n) мәні бар ашық түйін қаралады; қысқа бағыт табылса, көршілер жаңартылады."], formula: "f(n) = g(n) + h(n)" },
      { title: "Астана көрікті жерлерінің графында іздеу", bullets: ["Он көрікті жер — түйіндер, он бес екіжақты байланыс — ықтимал бағыттар.", "Алтын түс — ағымдағы түйін, жиектелгендері — ашық, бозғылттары — жабық.", "Кезек пен журналды қадамдап бақылаңыз; соңғы көк бағыт cameFrom байланыстарымен құрылады.", "Дейкстра салыстыру үшін қашықтық пен қаралған түйіндер санын береді."] },
      { title: "Осы үлгілік граф ішінде оңтайлы", bullets: ["Эвристика жол құнынан аспайды, сондықтан соңғы бағыт осы графта ең қысқа болады.", "Байланыс ұзындығы — түзу қашықтық × 1.2–1.5, нақты өлшенген көше бағыты емес.", "Кептеліс, жабық жолдар және нақты уақыттағы навигация ескерілмейді."] },
    ],
  },
  bayes: {
    en: [
      { title: "A Bayesian network models uncertainty", bullets: ["Nodes represent variables; arrows express conditional dependencies.", "Weather and season influence comfort; season also influences crowd levels.", "Suitability depends on comfort, crowds and an attraction's indoor/outdoor setting."], formula: "P(S | w,s) = Σc Σr P(c | w,s) · P(r | s) · P(S | c,r,setting)" },
      { title: "Evidence becomes suitability scores", bullets: ["Choose weather and season as observed evidence.", "Exact enumeration sums over hidden comfort and crowd states.", "Unknown evidence is averaged using the variable's prior probabilities.", "Attraction scores, setting charts and map pins share the same result."] },
      { title: "Educational estimates", bullets: ["Probabilities are illustrative, not calibrated forecasts or survey findings.", "Attractions with the same setting have equal suitability; category summaries are averages.", "Personal interests, opening hours and live weather are not included."] },
    ],
    kk: [
      { title: "Байес желісі белгісіздікті модельдейді", bullets: ["Түйіндер — айнымалылар, жебелер — шартты тәуелділіктер.", "Ауа райы мен мезгіл жайлылыққа, ал мезгіл адам санына да әсер етеді.", "Қолайлылық жайлылыққа, адам санына және орынның жабық не ашық ортасына тәуелді."], formula: "P(S | w,s) = Σc Σr P(c | w,s) · P(r | s) · P(S | c,r,орта)" },
      { title: "Деректерден қолайлылық бағасына", bullets: ["Ауа райы мен мезгілді белгілі деректер ретінде таңдаңыз.", "Дәл есептеу жасырын жайлылық пен адам саны күйлерін қосады.", "Белгісіз деректер априорлық ықтималдықтармен орташаланады.", "Орын бағалары, диаграмма және карта белгілері бір нәтижені көрсетеді."] },
      { title: "Оқу мақсатындағы бағалар", bullets: ["Ықтималдықтар — үлгілік мәндер, тексерілген болжам не сауалнама нәтижесі емес.", "Ортасы бірдей орындардың бағасы бірдей; санат көрсеткіші — орташа мән.", "Жеке қызығушылықтар, жұмыс уақыты және нақты ауа райы ескерілмейді."] },
    ],
  },
};

export function AcademicTabs({ module }: { module: Module }) {
  const { language, t } = useLanguage();
  const lessons = LESSONS[module][language];
  const labels = ["Concept", "In this app", "Limitations"];
  return (
    <section className="academic-band mt-8 border-y bg-secondary" aria-label={t("Academic explanation")}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase text-primary"><GraduationCap className="h-5 w-5 shrink-0" />{t("Academic explanation")}</p>
        <Tabs defaultValue="0">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-background sm:inline-flex sm:w-auto" aria-label={t("Academic explanation")}>
            {labels.map((label, i) => <TabsTrigger key={label} value={String(i)} className="min-h-10 whitespace-normal px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:px-5 sm:text-sm">{t(label)}</TabsTrigger>)}
          </TabsList>
          {lessons.map((lesson, i) => (
            <TabsContent key={i} value={String(i)} className="mt-6 min-h-[220px]">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div className="min-w-0"><h2 className="text-xl font-semibold sm:text-2xl">{lesson.title}</h2>
                  {lesson.formula && <p className="mt-4 break-words border-l-2 border-primary pl-3 font-mono text-xs leading-relaxed text-primary sm:text-sm">{lesson.formula}</p>}
                </div>
                <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {lesson.bullets.map(bullet => <li key={bullet} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{bullet}</span></li>)}
                </ul>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}