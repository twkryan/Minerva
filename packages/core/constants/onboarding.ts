export const DAY_OF_WEEK_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const DAY_OF_WEEK_OPTIONS = [
  { value: "MONDAY", label: "Segunda-feira", shortLabel: "Seg" },
  { value: "TUESDAY", label: "Terça-feira", shortLabel: "Ter" },
  { value: "WEDNESDAY", label: "Quarta-feira", shortLabel: "Qua" },
  { value: "THURSDAY", label: "Quinta-feira", shortLabel: "Qui" },
  { value: "FRIDAY", label: "Sexta-feira", shortLabel: "Sex" },
  { value: "SATURDAY", label: "Sábado", shortLabel: "Sáb" },
  { value: "SUNDAY", label: "Domingo", shortLabel: "Dom" },
] as const;

export const STUDY_OBJECTIVE_VALUES = [
  "PASS_THE_VESTIBULAR",
  "IMPROVE_GRADES",
  "REVIEW_CONTENT",
] as const;

export const STUDY_OBJECTIVE_OPTIONS = [
  {
    value: "PASS_THE_VESTIBULAR",
    label: "Passar no vestibular",
    description: "Priorize a preparação para a prova que você escolheu.",
  },
  {
    value: "IMPROVE_GRADES",
    label: "Melhorar as notas",
    description: "Organize uma rotina de estudo para a escola.",
  },
  {
    value: "REVIEW_CONTENT",
    label: "Revisar conteúdos",
    description: "Retome matérias e fortaleça sua base.",
  },
] as const;

export const DISTRIBUTION_STYLE_VALUES = [
  "BALANCED",
  "FOCUSED",
  "INTENSIVE",
] as const;

export const DISTRIBUTION_STYLE_OPTIONS = [
  {
    value: "BALANCED",
    label: "Equilibrado",
    description: "Distribui o esforço de forma estável entre as matérias.",
  },
  {
    value: "FOCUSED",
    label: "Focado",
    description: "Dá mais espaço às matérias em que você tem dificuldade.",
  },
  {
    value: "INTENSIVE",
    label: "Intensivo",
    description: "Concentra mais estudo nos pontos prioritários.",
  },
] as const;
