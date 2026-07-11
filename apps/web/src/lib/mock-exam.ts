export function getQuestionOptions(optionsJson: unknown) {
  if (!Array.isArray(optionsJson)) {
    return [];
  }

  return optionsJson.filter(
    (option): option is string => typeof option === "string"
  );
}

export function optionLabel(options: string[], index: number) {
  if (index < 0) {
    return "Não respondida";
  }

  return options[index] ?? "Resposta indisponível";
}
