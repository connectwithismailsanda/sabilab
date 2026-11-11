export type Dimension =
  | "role_skill"
  | "communication"
  | "leadership"
  | "creative_thinking";

export type Level =
  | "proficient"
  | "foundation"
  | "needs_practice"
  | "insufficient_evidence";

export type SceneObject = {
  id: string;
  label: string;
  left: number;
  top: number;
  labelPosition: "above" | "below" | "left";
  title: string;
  text: string;
};

export type Persona = {
  key: string;
  name: string;
  role: string;
  tone: string;
  topics: { match: string[]; reply: string }[];
  fallback: string[];
};

export type Scenario = {
  slug: string;
  number: number;
  title: string;
  role: string;
  status: "live" | "beta";
  tagline: string;
  setting: string;
  owner: string;
  brief: { facts: string[]; task: string };
  objects: SceneObject[];
  personas: Persona[];
  opening: { author: string; body: string };
  twist: { author: string; body: string };
  taskPrompt: string;
  /** Figures a strong answer can use. Checked by code, never by the model. */
  keyNumbers: number[];
  options: string[];
};

const adaeze: Scenario = {
  slug: "adaeze-fabrics",
  number: 1,
  title: "Adaeze's Fabrics",
  role: "Accountant",
  status: "live",
  tagline: "A discount, a 2pm deadline and an overdue supplier.",
  setting: "A small Lagos fabric shop",
  owner: "Adaeze",
  brief: {
    facts: [
      "Mrs Bello has ordered 40 rolls at ₦25,000 each: ₦1,000,000 in total.",
      "She is asking for 20% off (₦200,000) and delivery by 2pm today.",
      "Cash in the business account is ₦480,000.",
      "The Kano Textiles invoice of ₦350,000 is 45 days overdue. They have paused all supply.",
      "Only 12 blue aso-oke rolls are left on the shelf. A restock takes 5 days once supply resumes.",
      "Shop rent of ₦120,000 is due on Friday.",
    ],
    task: "Read the shop, talk to your team, then write your recommendation.",
  },
  objects: [
    {
      id: "ledger",
      label: "Ledger",
      left: 60,
      top: 58,
      labelPosition: "below",
      title: "The ledger",
      text: "Cash at hand: ₦480,000. Kano Textiles receivable: ₦350,000, overdue 45 days. Rent of ₦120,000 due Friday. Two other customers owe ₦90,000 in total.",
    },
    {
      id: "order-sheet",
      label: "Order sheet",
      left: 60,
      top: 22,
      labelPosition: "below",
      title: "Mrs Bello's order",
      text: "40 rolls of blue aso-oke at ₦25,000 a roll, ₦1,000,000 total. She wants 20% off and delivery by 2pm today. The order is for a wedding.",
    },
    {
      id: "phone",
      label: "Phone",
      left: 72,
      top: 58,
      labelPosition: "above",
      title: "Adaeze's phone",
      text: "Mrs Bello's assistant: '2pm is fixed. If the fabric is late, Mrs Bello will buy elsewhere and she will tell the market.'",
    },
    {
      id: "fabric-shelf",
      label: "Fabric shelf",
      left: 25,
      top: 34,
      labelPosition: "below",
      title: "The fabric shelf",
      text: "12 blue aso-oke rolls remain. Kano Textiles is the only supplier of this blue. No supply means no blue stock for at least five days.",
    },
  ],
  personas: [
    {
      key: "tunde",
      name: "Tunde",
      role: "Finance officer",
      tone: "careful with cash, quotes figures",
      topics: [
        {
          match: ["discount", "20%", "200,000", "price"],
          reply:
            "Twenty per cent is ₦200,000 off. That is more than half our cash. I can defend ten per cent, ₦100,000, but not twenty.",
        },
        {
          match: ["kano", "invoice", "supplier", "350,000", "overdue"],
          reply:
            "Kano is owed ₦350,000 and has stopped supplying. If we pay nothing today, we have no blue stock for five days. Could we pay part today?",
        },
        {
          match: ["cash", "afford", "480,000", "rent"],
          reply:
            "We have ₦480,000. Rent of ₦120,000 is due Friday, so ₦360,000 is really free. Anything we pay Kano comes out of that.",
        },
        {
          match: ["2pm", "delivery", "bello", "deadline", "wedding"],
          reply:
            "The 2pm delivery is not negotiable. But we only have 12 blue rolls, so the order size is a problem too.",
        },
      ],
      fallback: [
        "Put the numbers in front of me: what do we pay, what do we keep, and what is left for rent?",
        "I am not against a discount. I am against a discount we cannot fund after paying Kano.",
        "Whatever we decide, I need it written down before I release any money.",
      ],
    },
    {
      key: "zainab",
      name: "Zainab",
      role: "Sales lead",
      tone: "protective of the customer relationship",
      topics: [
        {
          match: ["discount", "20%", "price", "bello"],
          reply:
            "Mrs Bello brings wedding orders every season. If we lose her over ₦200,000, we lose more than this one sale.",
        },
        {
          match: ["kano", "supplier", "invoice", "350,000"],
          reply:
            "Kano will talk if we pay something today. They said as much. Ask them what partial payment restarts the supply.",
        },
        {
          match: ["2pm", "delivery", "deadline", "wedding"],
          reply:
            "We cannot miss 2pm. Better to deliver 12 rolls on time and agree the rest for tomorrow than to deliver nothing.",
        },
        {
          match: ["stock", "12", "blue", "rolls"],
          reply:
            "Twelve rolls covers less than a third of her order. If she agrees to split it, we keep the customer and the deadline.",
        },
      ],
      fallback: [
        "What does Mrs Bello hear from us at 1pm? That is what she will remember.",
        "Can we give her something today and a firm date for the rest? A split delivery may save the relationship.",
        "I would rather tell her the truth early than surprise her at 2pm.",
      ],
    },
  ],
  opening: {
    author: "Adaeze",
    body: "Mrs Bello wants 20% off and delivery by 2pm. Sort it out between you.",
  },
  twist: {
    author: "Adaeze",
    body: "Bad news. Kano Textiles has cancelled our supply because the ₦350,000 invoice is overdue. They will talk again if we pay something today. Give me options I can afford.",
  },
  taskPrompt:
    "Write your recommendation to Adaeze in 2 to 4 sentences: what you do about the discount and the Kano invoice, with numbers, and why.",
  keyNumbers: [
    1_000_000, 200_000, 100_000, 480_000, 350_000, 150_000, 120_000, 360_000,
    12, 40, 25_000,
  ],
  options: [
    "offer a smaller discount",
    "split the delivery",
    "pay Kano part of the invoice",
    "negotiate a payment plan",
    "protect the rent",
  ],
};

const funke: Scenario = {
  slug: "funke-kitchen",
  number: 2,
  title: "Funke's Kitchen",
  role: "Operations Coordinator",
  status: "beta",
  tagline: "120 lunch packs, a gas shortage and a fixed 12:30.",
  setting: "A busy small commercial kitchen in Lagos",
  owner: "Funke",
  brief: {
    facts: [
      "Mr Bassey's office has ordered 120 lunch packs at ₦2,500 each: ₦300,000 in total.",
      "Delivery is due at 12:30. It is now 10:50.",
      "The gas supplier cannot refill before 3pm. Without gas, only 70 packs can be finished by 12:30.",
      "Each pack costs ₦1,600 to make. Outsourcing a pack costs ₦2,100.",
      "A refund is ₦2,500 a pack. The contract gives a 10% credit on any shortfall if we give two hours' notice.",
      "Mr Bassey's assistant says a split delivery is acceptable if every pack arrives by 1:30pm.",
    ],
    task: "Read the kitchen, talk to your team, then write your recommendation.",
  },
  objects: [
    {
      id: "order-board",
      label: "Order board",
      left: 23,
      top: 24,
      labelPosition: "below",
      title: "Today's order board",
      text: "Mr Bassey's office: 120 lunch packs at ₦2,500, ₦300,000 total, delivery 12:30. Two smaller orders are also due at 1pm.",
    },
    {
      id: "gas-cylinder",
      label: "Gas cylinder",
      left: 53,
      top: 67,
      labelPosition: "above",
      title: "The gas cylinder",
      text: "Half a cylinder left. The supplier cannot deliver a refill until 3pm. Chidi says 70 packs is the maximum we can finish by 12:30.",
    },
    {
      id: "lunch-packs",
      label: "Lunch packs",
      left: 79,
      top: 50,
      labelPosition: "above",
      title: "The lunch packs",
      text: "70 packs are prepped. 50 are short. Each pack costs ₦1,600 in ingredients and gas to make.",
    },
    {
      id: "phone",
      label: "Phone",
      left: 93,
      top: 58,
      labelPosition: "left",
      title: "Funke's phone",
      text: "Mr Bassey's assistant: 'A split delivery is fine if everything is here by 1:30pm. After that the office closes for the day.'",
    },
  ],
  personas: [
    {
      key: "chidi",
      name: "Chidi",
      role: "Head cook",
      tone: "practical, focused on the kitchen line",
      topics: [
        {
          match: ["gas", "3pm", "refill", "cylinder"],
          reply:
            "Half a cylinder is all we have. I can finish 70 packs by 12:30. More than that and I am guessing.",
        },
        {
          match: ["70", "50", "short", "packs"],
          reply:
            "Seventy is the honest number. Fifty short is better than 120 late, but it is still a broken promise.",
        },
        {
          match: ["outsource", "another kitchen", "buy", "2,100"],
          reply:
            "I know a kitchen in Yaba that can do 50 packs for ₦2,100 each. They need two hours' notice and they will not deliver.",
        },
        {
          match: ["1:30", "split", "delivery", "bassey"],
          reply:
            "A split works for me. First 70 at 12:30, the rest at 1:15, if we find the capacity and the transport.",
        },
      ],
      fallback: [
        "Tell me the number we are committing to and I will tell you if the line can do it.",
        "I would rather send 70 on time than 120 at 1pm and lose the whole order.",
        "The gas is the constraint. Everything else is planning.",
      ],
    },
    {
      key: "bisi",
      name: "Bisi",
      role: "Front of house",
      tone: "customer-first, protects the relationship",
      topics: [
        {
          match: ["bassey", "customer", "refund", "credit"],
          reply:
            "Mr Bassey's assistant is reasonable. If we call before 11:30 and explain, a split delivery with a credit keeps the account.",
        },
        {
          match: ["70", "50", "short", "packs"],
          reply:
            "Fifty people without lunch is a bad look for his office. Can we top up from another kitchen rather than refund?",
        },
        {
          match: ["outsource", "2,100", "cost"],
          reply:
            "Outsourcing at ₦2,100 still leaves ₦400 a pack. That is better than refunding ₦2,500 and losing the customer.",
        },
        {
          match: ["gas", "3pm", "refill"],
          reply:
            "If the gas comes at 3pm, the afternoon orders are safe. It is only the 12:30 delivery that is at risk.",
        },
      ],
      fallback: [
        "Call Mr Bassey before he calls us. That is the whole game.",
        "What can we promise him that we can actually keep?",
        "A refund is clean, but it teaches him to order elsewhere next time.",
      ],
    },
  ],
  opening: {
    author: "Funke",
    body: "Mr Bassey's office needs 120 lunch packs at 12:30. Today cannot go wrong. Work together and tell me what you need.",
  },
  twist: {
    author: "Funke",
    body: "Bad news. The gas supplier cannot deliver a refill until 3pm. Chidi says we can only finish 70 packs by 12:30. Mr Bassey expects all 120. What are our options?",
  },
  taskPrompt:
    "Write your recommendation to Funke in 2 to 4 sentences: how you would handle the 50-pack shortfall, comparing at least two options with numbers, and why.",
  keyNumbers: [120, 70, 50, 2_500, 300_000, 1_600, 2_100, 400, 12_500, 10],
  options: [
    "split the delivery",
    "outsource the shortfall",
    "refund the shortfall",
    "negotiate a credit",
    "call the client early",
  ],
};

export const scenarios: Scenario[] = [adaeze, funke];

export const upcomingScenarios = [
  {
    number: 3,
    title: "BrightPath Digital",
    role: "Project Lead",
    tagline: "An earlier launch and a ₦70,000 video on a fixed budget.",
  },
];

export function getScenario(slug: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.slug === slug);
}

export const dimensionLabels: Record<Dimension, string> = {
  role_skill: "Role skill",
  communication: "Communication",
  leadership: "Leadership",
  creative_thinking: "Creative thinking",
};

export const levelLabels: Record<Level, string> = {
  proficient: "Proficient",
  foundation: "Foundation",
  needs_practice: "Needs practice",
  insufficient_evidence: "Insufficient evidence",
};
