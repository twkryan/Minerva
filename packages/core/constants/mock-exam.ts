export const MOCK_EXAM_DURATION_MINUTES = 30;

export const CLASSIFICATION_VALUES = [
  "CORRECT",
  "LUCKY_GUESS",
  "ATTENTION_MISTAKE",
  "INCORRECT",
] as const;

export const CLASSIFICATION_OPTIONS = [
  {
    value: "CORRECT",
    label: "Correta",
    description: "Eu sabia a resposta e resolvi com segurança.",
  },
  {
    value: "LUCKY_GUESS",
    label: "Acerto por sorte",
    description: "Acertei, mas não tinha certeza do raciocínio.",
  },
  {
    value: "ATTENTION_MISTAKE",
    label: "Erro de atenção",
    description: "Eu dominava o conteúdo, mas cometi um deslize.",
  },
  {
    value: "INCORRECT",
    label: "Incorreta",
    description: "Preciso revisar este conteúdo com mais profundidade.",
  },
] as const;
