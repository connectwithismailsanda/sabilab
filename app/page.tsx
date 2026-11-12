"use client";

import Link from "next/link";
import { useState } from "react";
import { scenarios, upcomingScenarios } from "@/content/scenarios";

const brandMark = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className="block"
  >
    <path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3" />
    <path d="M7.5 16h9" />
  </svg>
);

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleChoice = (n: number) => {
    setSelectedChoice(n);
  };

  const feedbackText =
    selectedChoice === 1
      ? "Good first move. You are gathering facts before making a commitment. Check the stock, confirm the supplier&rsquo;s timing, then communicate a realistic update to the customer."
      : "Think about what information you need before making a promise. A useful response starts by checking what is available and confirming the revised supply timing.";

  return (
    <div className="min-h-dvh bg-white text-ink">
      <nav className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="wrap flex h-20 items-center justify-between px-4">
          <Link
            href="#top"
            className="brand flex items-center gap-2.5 font-display font-extrabold text-2xl tracking-tighter"
          >
            <span className="mark flex size-9.5 rounded-[13px] bg-gradient-to-tr from-[#a855f7] to-[#4c1d95] place-items-center text-white shadow-[0_8px_20px_#6d28d944]">
              {brandMark}
            </span>
            Sabi<em className="text-[#6d28d9]">Lab</em>
          </Link>
          <div className="navlinks hidden md:flex gap-8 text-[#594c6e] text-sm font-bold">
            <a href="#scenarios" className="hover:text-[#6d28d9]">
              Explore scenarios
            </a>
            <a href="#how" className="hover:text-[#6d28d9]">
              How it works
            </a>
            <a href="#preview" className="hover:text-[#6d28d9]">
              Try a preview
            </a>
          </div>
          <div className="navright flex items-center gap-3">
            <button
              className="nav-cta rounded-[14px] bg-gradient-to-tr from-[#8b35eb] to-[#6d28d9] px-5 py-3 text-white font-black shadow-[0_9px_22px_#6d28d933] hover:-translate-y-[2px] hover:shadow-[0_14px_28px_#6d28d944] transition"
              onClick={openModal}
            >
              Enter SabiLab&nbsp; →
            </button>
            <button
              className="menu md:hidden rounded-[12px] bg-[#F5F0FF] px-3 py-2.5"
              aria-label="Open navigation"
              onClick={() => {
                const el = document.getElementById("navlinks-mobile");
                el?.classList.toggle("open");
              }}
            >
              ☰
            </button>
          </div>
        </div>
        <div
          id="navlinks-mobile"
          className="navlinks-mobile hidden absolute top-full left-0 right-0 bg-white border-b border-[#eee8f6] flex flex-col gap-5 px-4 pb-4"
        >
          <a href="#scenarios" className="text-[#594c6e] text-sm font-bold hover:text-[#6d28d9]">
            Explore scenarios
          </a>
          <a href="#how" className="text-[#594c6e] text-sm font-bold hover:text-[#6d28d9]">
            How it works
          </a>
          <a href="#preview" className="text-[#594c6e] text-sm font-bold hover:text-[#6d28d9]">
            Try a preview
          </a>
        </div>
      </nav>

      <main id="top">
        <header className="hero relative overflow-hidden bg-gradient-to-b from-[#1d064b] via-[#2e1065] to-[#4c1d95] text-white py-[86px] pb-20">
          <div className="wrap hero-grid grid grid-cols-1 md:grid-cols-2 gap-9.5 items-center relative z-10 max-w-[1160px] mx-auto px-4">
            <div>
              <div className="eyebrow inline-flex items-center gap-2.25 border border-white/22 bg-white/12 px-3.5 py-2 rounded-full text-[12px] font-black tracking-wider text-[#ead7ff]">
                <span className="pulse inline-block size-[7px] rounded-full bg-[#d8b4fe] shadow-[0_0_0_5px_#d8b4fe25]" aria-hidden="true" />
                LEARNING THAT FEELS LIKE REAL WORK
              </div>
              <h1 className="font-display font-extrabold text-[clamp(43px,5.5vw,70px)] leading-[1.02] tracking-[-3.5px] mt-[23px] mb-[20px] max-w-[650px] text-balance">
                Step into the workplace.{" "}
                <span className="text-[#d8b4fe] italic">
                  Make decisions that matter.
                </span>
              </h1>
              <div className="actions flex flex-wrap items-center gap-3 mt-[30px]">
                <button
                  className="primary rounded-[13px] bg-gradient-to-tr from-[#8b35eb] to-[#6d28d9] px-6 py-[14px] text-white font-black shadow-[0_9px_22px_#6d28d933] hover:-translate-y-[2px] hover:shadow-[0_14px_28px_#6d28d944] transition"
                  onClick={() => {
                    document.getElementById("scenarios")?.scrollIntoView();
                  }}
                >
                  Start your journey&nbsp; →
                </button>
                <a
                  href="#how"
                  className="secondary rounded-[13px] border border-white/55 bg-white/10 px-5.5 py-[13px] text-white font-black hover:bg-white/20 transition"
                >
                  Discover how it works
                </a>
              </div>
              <div className="trustline flex items-center gap-2.75 mt-[28px] text-[#d5c4eb] text-[12px]">
                <div className="avatars flex">
                  <span className="size-6.75 rounded-full border-2 border-[#35136d] bg-gradient-to-tr from-[#a7f3d0] to-[#22c55e]" aria-hidden="true" />
                  <span className="size-6.75 rounded-full border-2 border-[#35136d] bg-gradient-to-tr from-[#fdba74] to-[#f97316] -ml-[7px]" aria-hidden="true" />
                  <span className="size-6.75 rounded-full border-2 border-[#35136d] bg-gradient-to-tr from-[#bfdbfe] to-[#6366f1] -ml-[7px]" aria-hidden="true" />
                </div>
                <span>Explore. Investigate. Decide. Grow.</span>
              </div>
            </div>
            <div className="scene min-h-[390px] relative grid place-items-center">
              <div className="glow absolute w-[330px] h-[330px] rounded-full bg-[#a855f744] blur-[35px]" />
              <div className="workcard relative w-[min(440px,100%)] bg-gradient-to-br from-white/90 to-[#f4eaff] border border-white/aa text-ink rounded-[28px] p-5 shadow-[0_35px_90px_#12042f77] rotate-[2deg] animate-float">
                <div className="worktop flex justify-between items-center text-[11px] font-black text-[#78638f]">
                  <span>YOUR WORKPLACE, YOUR CALL</span>
                  <span className="live text-[#16865c] bg-[#d9fbe9] rounded-full px-[9px] py-[6px]">
                    ● SIMULATION
                  </span>
                </div>
                <div className="scene-art h-[205px] my-[14px] bg-gradient-to-br from-[#e9d5ff] to-[#c4b5fd] rounded-[19px] relative overflow-hidden">
                  <div className="office-window absolute right-[18px] top-[18px] w-[125px] h-[130px] rounded-[12px] bg-gradient-to-br from-white to-[#c4b5fd] border-[6px] border-white shadow-[0_5px_20px_#57318a22]">
                    <div className="absolute w-[5px] h-full left-1/2 bg-[#a78bfa]" />
                    <div className="absolute h-[5px] w-full top-1/2 bg-[#a78bfa]" />
                  </div>
                  <div className="sticky absolute top-[23px] left-[22px] bg-white rounded-[12px] px-[10px] py-[7px] text-[10px] font-black text-[#5b268d] shadow-sm">
                    Today&rsquo;s challenge<br />
                    is waiting for you ✦
                  </div>
                  <div className="desk absolute bottom-[25px] left-[18px] w-[230px] h-[13px] rounded-[8px] bg-[#6d28d9]">
                    <div className="absolute left-[24px] top-[10px] w-[9px] h-[48px] bg-[#6d28d9] shadow-[160px_0_#6d28d9]" />
                  </div>
                  <div className="person absolute bottom-[38px] left-[83px] w-[80px] h-[112px]">
                    <div className="head absolute top-0 left-[19px] w-[43px] h-[48px] rounded-[48%_48%_45%_45%] bg-[#9a573f] shadow-[0_-10px_0_3px_#24152d]" />
                    <div className="body absolute bottom-0 left-[4px] w-[73px] h-[70px] rounded-[25px_25px_8px_8px] bg-[#6d28d9]">
                      <div className="absolute top-[14px] left-[31px] w-[12px] h-[42px] rounded-[8px] bg-[#f5f0ff]" />
                    </div>
                  </div>
                  <div className="plant absolute right-[24px] bottom-[28px] text-[42px]" aria-hidden="true">
                    🌿
                  </div>
                </div>
                <div className="scene-foot flex items-start gap-4 pt-2">
                  <div>
                    <strong className="block">Ready to make your move?</strong>
                    <small className="text-[#78638f]">
                      Every decision moves the story forward.
                    </small>
                  </div>
                  <span className="tag ml-auto text-[#6d28d9] text-[12px] font-black">
                    LET'S GO ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="strip relative -mt-[1px] bg-white">
          <div className="wrap featurebar grid grid-cols-3 border border-[#e9e0f7] shadow-[0_24px_70px_#30105c1a] rounded-[22px] px-3 py-[25px] -translate-y-[30px] relative z-10 mx-auto max-w-[1160px] px-4">
            {[
              {
                icon: "◈",
                title: "Real-world scenarios",
                desc: "Practise with realistic challenges",
              },
              {
                icon: "♧",
                title: "Collaborative learning",
                desc: "Work with a team and make choices",
              },
              {
                icon: "✧",
                title: "Evidence of learning",
                desc: "Show how you think and decide",
              },
            ].map((feature, i) => (
              <div
                key={feature.icon}
                className="feature flex items-center justify-center gap-3.25 px-[15px] py-[6px] border-r border-[#e9e0f7] last:border-0"
              >
                <div className="ficon size-[43px] rounded-[14px] bg-[#F5F0FF] place-items-center text-[#6d28d9] text-[20px]">
                  {feature.icon}
                </div>
                <div>
                  <b className="font-display font-bold text-[15px]">
                    {feature.title}
                  </b>
                  <small className="block mt-[4px] text-[#756b86] text-[11px]">
                    {feature.desc}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section
          className="scenarios bg-gradient-to-b from-white to-[#faf7ff] py-[74px]"
          id="scenarios"
        >
          <div className="wrap mx-auto max-w-[1160px] px-4">
            <div className="center text-center">
              <div className="section-kicker text-[#6d28d9] text-[11px] tracking-[1.6px] font-bold uppercase">
                CHOOSE YOUR EXPERIENCE
              </div>
              <h2 className="section-title font-display font-extrabold text-[clamp(31px,4vw,46px)] leading-[1.12] tracking-[-1.8px] mt-[12px] text-[#24113e]">
                Every workplace has a story.
              </h2>
              <p className="section-sub text-[#756b86] leading-1.7 max-w-[590px] mx-auto">
                Step into a role, explore the situation and work out what needs
                to happen next.
              </p>
            </div>
            <div className="scenario-grid grid grid-cols-3 gap-[19px] mt-[37px]">
              {scenarios.map((scenario) => {
                const visualBg =
                  scenario.slug === "adaeze-fabrics"
                    ? "linear-gradient(135deg,#fce7f3,#e9d5ff)"
                    : scenario.slug === "funke-kitchen"
                      ? "linear-gradient(135deg,#ffedd5,#fde68a)"
                      : "linear-gradient(135deg,#dbeafe,#ddd6fe)";
                const icon =
                  scenario.slug === "adaeze-fabrics"
                    ? "🧵"
                    : scenario.slug === "funke-kitchen"
                      ? "🍱"
                      : "💻";
                const label =
                  scenario.slug === "adaeze-fabrics"
                    ? "ACCOUNTING · RETAIL"
                    : scenario.slug === "funke-kitchen"
                      ? "OPERATIONS · FOOD SERVICE"
                      : "PROJECT MANAGEMENT · AGENCY";
                return (
                  <article
                    key={scenario.slug}
                    className="scenario bg-white border border-[#e9e0f7] rounded-[21px] overflow-hidden shadow-[0_9px_28px_#30105c0a] hover:-translate-y-[7px] hover:shadow-[0_22px_45px_#30105c18] hover:border-[#d6b8ff] transition duration-250"
                  >
                    <div className="scenario-visual h-[170px] relative overflow-hidden grid place-items-center" style={{ background: visualBg }}>
                      <span className="scene-label absolute top-[14px] left-[14px] bg-white/dc rounded-full px-[10px] py-[7px] text-[10px] font-bold text-[#5b268d]">
                        {label}
                      </span>
                      <span className="illustration text-[76px] drop-shadow-[0_12px_8px_#43205b22] transition duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
                        {icon}
                      </span>
                    </div>
                    <div className="scenario-body p-5">
                      <h3 className="font-display font-bold text-[20px]">{scenario.title}</h3>
                      <p className="mt-[8px] text-[13px] leading-1.6 text-[#756b86] min-h-[63px] mb-[18px]">
                        {scenario.tagline}
                      </p>
                      <a
                        href={`/start/${scenario.slug}`}
                        className="scenario-link flex justify-between items-center text-[#6d28d9] text-[13px] font-bold"
                      >
                        Explore this scenario
                        <span className="arrow size-[30px] rounded-full bg-[#F5F0FF] place-items-center text-[#6d28d9] text-xs font-bold">
                          ↗
                        </span>
                      </a>
                    </div>
                  </article>
                );
              })}
              {upcomingScenarios.map((scenario) => (
                <article
                  key={scenario.title}
                  className="scenario bg-white border border-[#e9e0f7] rounded-[21px] overflow-hidden shadow-[0_9px_28px_#30105c0a] opacity-70"
                >
                  <div className="scenario-visual h-[170px] relative overflow-hidden grid place-items-center bg-[#f5f0ff]">
                    <span className="scene-label absolute top-[14px] left-[14px] bg-white/dc rounded-full px-[10px] py-[7px] text-[10px] font-bold text-[#5b268d]">
                      COMING SOON
                    </span>
                    <span className="illustration text-[76px] drop-shadow-[0_12px_8px_#43205b22]">💻</span>
                  </div>
                  <div className="scenario-body p-5">
                    <h3 className="font-display font-bold text-[20px]">
                      {scenario.title}
                    </h3>
                    <p className="mt-[8px] text-[13px] leading-1.6 text-[#756b86] min-h-[63px] mb-[18px]">
                      {scenario.tagline}
                    </p>
                    <span className="mt-[4px] text-sm font-bold text-[#756b86]">
                      Arriving after the demo
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="py-[74px]">
          <div className="wrap how-grid mx-auto max-w-[1160px] px-4 grid grid-cols-1 md:grid-cols-2 gap-[70px] items-start">
            <div>
              <div className="section-kicker text-[#6d28d9] text-[11px] tracking-[1.6px] font-bold uppercase">
                YOUR JOURNEY
              </div>
              <h2 className="section-title font-display font-extrabold text-[clamp(31px,4vw,46px)] leading-[1.12] tracking-[-1.8px] mt-[12px] text-[#24113e]">
                Learn by stepping into the situation.
              </h2>
              <p className="section-sub text-[#756b86] leading-1.7">
                SabiLab turns workplace concepts into experiences. You don&rsquo;t
                just read about a challenge&mdash;you investigate it and decide
                how to respond.
              </p>
            </div>
            <div className="steps grid gap-[13px]">
              {[
                {
                  num: "01",
                  title: "Enter the workplace",
                  desc: "Understand your role, meet your colleagues and explore your environment.",
                },
                {
                  num: "02",
                  title: "Investigate the situation",
                  desc: "Inspect records, messages and workplace objects to uncover what is happening.",
                },
                {
                  num: "03",
                  title: "Work with your team",
                  desc: "Communicate with colleagues and respond when new information changes the situation.",
                },
                {
                  num: "04",
                  title: "Make your recommendation",
                  desc: "Explain your decision and reflect on the evidence behind it.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="step grid grid-cols-[42px_1fr] gap-[15px] p-[18px] border border-[#e9e0f7] rounded-[17px] hover:bg-[#faf7ff] hover:border-[#d8b4fe] hover:translate-x-[4px] transition duration-200"
                >
                  <div className="stepnum size-[38px] rounded-[12px] bg-[#F5F0FF] text-[#6d28d9] place-items-center font-display font-black text-[15px]">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[16px] mt-[1px] mb-[5px]">
                      {step.title}
                    </h3>
                    <p className="text-[13px] leading-1.55 text-[#756b86] m-0">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="preview" className="py-[74px] bg-[#faf7ff]">
          <div className="wrap how-grid mx-auto max-w-[1160px] px-4 grid grid-cols-1 md:grid-cols-2 gap-[70px] items-start">
            <div>
              <div className="section-kicker text-[#6d28d9] text-[11px] tracking-[1.6px] font-bold uppercase">
                TRY A QUICK DECISION
              </div>
              <h2 className="section-title font-display font-extrabold text-[clamp(31px,4vw,46px)] leading-[1.12] tracking-[-1.8px] mt-[12px] text-[#24113e]">
                A little taste of the workplace.
              </h2>
              <p className="section-sub text-[#756b86] leading-1.7">
                Try this short decision preview. There may be more than one
                reasonable response&mdash;what matters is how you think through
                the situation.
              </p>
            </div>
            <div className="preview bg-[#2E1065] text-white rounded-[28px] p-[34px] relative overflow-hidden">
              <div className="absolute w-[230px] h-[230px] rounded-full bg-[#8b35eb55] blur-[40px] right-[-80px] top-[-80px]" />
              <div className="relative z-10">
                <h3 className="font-display font-bold text-[23px] m-0 mb-[8px]">
                  You&rsquo;re on the team.
                </h3>
                <p className="text-[13px] text-[#d9c8ed] leading-1.6 mb-[22px]">
                  A customer needs an order urgently, but your supplier has
                  delayed delivery.
                </p>
                <div className="question font-bold mt-[22px] mb-[13px] text-[14px]">
                  What would be a useful first step?
                </div>
                <button
                  className={`choice block w-full text-left px-[15px] py-[13px] border border-white/35 bg-white/10 text-white rounded-[12px] mb-[9px] text-[13px] transition hover:bg-white/20 hover:border-[#c084fc] ${selectedChoice === 0 ? "bg-[#6d28d944] border-[#c084fc]" : ""}`}
                  onClick={() => handleChoice(0)}
                >
                  A. Promise the customer the original delivery time.
                </button>
                <button
                  className={`choice block w-full text-left px-[15px] py-[13px] border border-white/35 bg-white/10 text-white rounded-[12px] mb-[9px] text-[13px] transition hover:bg-white/20 hover:border-[#c084fc] ${selectedChoice === 1 ? "bg-[#6d28d944] border-[#c084fc]" : ""}`}
                  onClick={() => handleChoice(1)}
                >
                  B. Check available stock and confirm the supplier&rsquo;s revised timing.
                </button>
                <button
                  className={`choice block w-full text-left px-[15px] py-[13px] border border-white/35 bg-white/10 text-white rounded-[12px] mb-[9px] text-[13px] transition hover:bg-white/20 hover:border-[#c084fc] ${selectedChoice === 2 ? "bg-[#6d28d944] border-[#c084fc]" : ""}`}
                  onClick={() => handleChoice(2)}
                >
                  C. Ignore the supplier and wait for the customer to call again.
                </button>
                <div
                  className={`feedback mt-[14px] p-[13px] rounded-[12px] bg-white/10 text-[#eee2ff] text-[13px] leading-1.55 ${selectedChoice !== null ? "show" : ""}`}
                >
                  {feedbackText}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta pb-[85px]">
          <div className="wrap mx-auto max-w-[1160px] px-4">
            <div className="cta-panel rounded-[28px] p-[48px] bg-gradient-to-br from-[#240046] to-[#4c1d95] text-white flex items-center justify-between gap-[25px] overflow-hidden">
              <div>
                <h2 className="font-display font-extrabold text-[clamp(28px,4vw,42px)] leading-[1.1] tracking-[-1.4px] mb-[12px]">
                  Ready to make your first move?
                </h2>
                <p className="text-[#e5d6f5] leading-1.65 max-w-[570px] m-0">
                  Real situations. Thoughtful decisions. Practical learning.
                  Step into SabiLab and see what you can do.
                </p>
              </div>
              <button
                className="primary bg-[#d8b4fe] text-[#2E1065] shadow-none whitespace-nowrap rounded-[13px] px-6 py-[14px] font-black"
                onClick={openModal}
              >
                Enter SabiLab&nbsp; →
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#190638] text-[#d7c7e9] px-4 py-[35px]">
        <div className="wrap footerrow mx-auto max-w-[1160px] flex justify-between items-center gap-[20px]">
          <Link href="#top" className="brand footerbrand flex items-center gap-2.5 font-display font-extrabold text-2xl tracking-tighter text-white">
            <span className="mark flex size-9.5 rounded-[13px] bg-white place-items-center text-[#2E1065]">
              ✦
            </span>
            Sabi<em className="text-white">Lab</em>
          </Link>
          <small className="text-[#ad9ac4]">
            Learn. Decide. Grow. &nbsp;·&nbsp; ©{" "}
            <span id="year" />
            SabiLab
          </small>
        </div>
      </footer>

      <div
        className={`modal fixed inset-0 bg-[#16052dcc] z-50 flex items-center justify-center p-5 ${modalOpen ? "open" : "hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modalbox bg-white rounded-[22px] p-[30px] max-w-[440px] w-full shadow-[0_30px_90px_#10021e88] relative">
          <button
            className="close absolute right-[17px] top-[15px] border-0 bg-[#F5F0FF] rounded-[9px] px-2 py-[8px]"
            aria-label="Close"
            onClick={closeModal}
          >
            ✕
          </button>
          <h2 id="modal-title" className="font-display font-extrabold text-[26px] m-0 mb-[10px]">
            Your workplace awaits.
          </h2>
          <p className="text-[#756b86] leading-1.6 text-[14px]">
            This landing page is a front-end prototype. Connect this action to
            your SabiLab sign-in or simulation entry flow when it is ready.
          </p>
          <label htmlFor="email" className="block text-[13px] font-bold">
            Email address (optional demo field)
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="field mt-[8px] mb-[15px]"
          />
          <button
            className="btn-primary w-full"
            onClick={closeModal}
          >
            Got it &mdash; let&rsquo;s explore
          </button>
        </div>
      </div>

      <script>
        document.getElementById("year").textContent = new Date().getFullYear();
      </script>
    </div>
  );
}
