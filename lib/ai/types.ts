export type Brief = {
  directive: string;
  why: string;
  mustGoOut: string;
  doNow: string[];
  source: "ai" | "template";
  model?: string;
  city: string;
  generatedAt: string;
};

export type AskResult = {
  answer: string;
  source: "ai" | "template";
  model?: string;
  generatedAt: string;
};
