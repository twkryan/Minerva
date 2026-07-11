type ChartSegment = {
  color: string;
  label: string;
  value: number;
};

type ClassificationPieChartProps = {
  segments: ChartSegment[];
};

function pointForAngle(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: 50 + 50 * Math.cos(radians),
    y: 50 + 50 * Math.sin(radians),
  };
}

function slicePath(startAngle: number, endAngle: number) {
  const start = pointForAngle(startAngle);
  const end = pointForAngle(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    "M 50 50",
    `L ${start.x} ${start.y}`,
    `A 50 50 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function ClassificationPieChart({ segments }: ClassificationPieChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) {
    return null;
  }

  let currentAngle = 0;
  const nonEmptySegments = segments.filter((segment) => segment.value > 0);

  return (
    <svg
      aria-label="Distribuição das classificações"
      className="mx-auto size-52 max-w-full"
      role="img"
      viewBox="0 0 100 100"
    >
      <title>Distribuição das classificações</title>
      {nonEmptySegments.length === 1 ? (
        <circle cx="50" cy="50" fill={nonEmptySegments[0].color} r="50" />
      ) : (
        nonEmptySegments.map((segment) => {
          const startAngle = currentAngle;
          const endAngle = startAngle + (segment.value / total) * 360;
          currentAngle = endAngle;

          return (
            <path
              d={slicePath(startAngle, endAngle)}
              fill={segment.color}
              key={segment.label}
            />
          );
        })
      )}
    </svg>
  );
}
