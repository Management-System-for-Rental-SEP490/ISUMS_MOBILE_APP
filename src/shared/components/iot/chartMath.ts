export type Point = { x: number; y: number };

export type ChartScale = {
  toX: (value: number) => number;
  toY: (value: number) => number;
  innerWidth: number;
  innerHeight: number;
  marginLeft: number;
  marginTop: number;
};

export type ChartMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const DEFAULT_MARGINS: ChartMargins = {
  top: 12,
  right: 12,
  bottom: 24,
  left: 36,
};

export function makeScale(
  width: number,
  height: number,
  domainX: [number, number],
  domainY: [number, number],
  margins: ChartMargins = DEFAULT_MARGINS,
): ChartScale {
  const innerWidth = Math.max(1, width - margins.left - margins.right);
  const innerHeight = Math.max(1, height - margins.top - margins.bottom);
  const [x0, x1] = domainX;
  const [y0, y1] = domainY;
  const xRange = x1 - x0 || 1;
  const yRange = y1 - y0 || 1;
  return {
    innerWidth,
    innerHeight,
    marginLeft: margins.left,
    marginTop: margins.top,
    toX: (value) => margins.left + ((value - x0) / xRange) * innerWidth,
    toY: (value) => margins.top + innerHeight - ((value - y0) / yRange) * innerHeight,
  };
}

export function buildLinePath(
  points: Point[],
  scale: ChartScale,
  curve: "smooth" | "linear" | "step" = "smooth",
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${scale.toX(p.x)} ${scale.toY(p.y)}`;
  }
  const xs = points.map((p) => scale.toX(p.x));
  const ys = points.map((p) => scale.toY(p.y));
  const segments: string[] = [`M ${xs[0]} ${ys[0]}`];

  if (curve === "linear") {
    for (let i = 1; i < points.length; i += 1) {
      segments.push(`L ${xs[i]} ${ys[i]}`);
    }
    return segments.join(" ");
  }

  if (curve === "step") {
    for (let i = 1; i < points.length; i += 1) {
      const midX = (xs[i - 1] + xs[i]) / 2;
      segments.push(`L ${midX} ${ys[i - 1]} L ${midX} ${ys[i]} L ${xs[i]} ${ys[i]}`);
    }
    return segments.join(" ");
  }

  for (let i = 1; i < points.length; i += 1) {
    const x0 = xs[i - 1];
    const y0 = ys[i - 1];
    const x1 = xs[i];
    const y1 = ys[i];
    const cp1x = x0 + (x1 - x0) / 2;
    const cp1y = y0;
    const cp2x = x0 + (x1 - x0) / 2;
    const cp2y = y1;
    segments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`);
  }
  return segments.join(" ");
}

export function buildAreaPath(
  points: Point[],
  scale: ChartScale,
  curve: "smooth" | "linear" | "step" = "smooth",
): string {
  if (points.length === 0) return "";
  const linePath = buildLinePath(points, scale, curve);
  const lastX = scale.toX(points[points.length - 1].x);
  const firstX = scale.toX(points[0].x);
  const baseline = scale.marginTop + scale.innerHeight;
  return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
}

export function buildBandPath(
  upper: Point[],
  lower: Point[],
  scale: ChartScale,
  curve: "smooth" | "linear" | "step" = "smooth",
): string {
  if (upper.length === 0 || lower.length === 0) return "";
  const upperPath = buildLinePath(upper, scale, curve);
  const lowerReversed = [...lower].reverse();
  const lowerXs = lowerReversed.map((p) => scale.toX(p.x));
  const lowerYs = lowerReversed.map((p) => scale.toY(p.y));
  const lowerSegments: string[] = [`L ${lowerXs[0]} ${lowerYs[0]}`];
  for (let i = 1; i < lowerReversed.length; i += 1) {
    lowerSegments.push(`L ${lowerXs[i]} ${lowerYs[i]}`);
  }
  return `${upperPath} ${lowerSegments.join(" ")} Z`;
}

export function niceTicks(
  min: number,
  max: number,
  count = 4,
): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count <= 0) return [];
  if (min === max) return [min];
  const step = (max - min) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(step) || 1)));
  const niceStep = Math.ceil(step / magnitude) * magnitude;
  const start = Math.floor(min / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; v <= max + niceStep / 2; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}
