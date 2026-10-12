import { cumulativeDistances, project, type LatLon } from "../core/geo";
import type { Route, Step } from "./routing";

export interface Update {
  status: "on_route" | "off_route" | "arrived";
  offsetM: number; remainingM: number; remainingS: number;
  stepIndex: number; step: Step; distanceToStepM: number;
}
export interface Fix { pos: LatLon; accuracyM?: number }

export class NavigationSession {
  private cum: number[]; private stepAlong: number[]; private strikes = 0;
  constructor(private route: Route, private opts = { offRouteM: 40, strikesToRecalc: 3, arrivalM: 25, maxAccuracyM: 50 }) {
    this.cum = cumulativeDistances(route.geometry);
    this.stepAlong = route.steps.map((s) => project(s.location, route.geometry, this.cum).along);
  }
  /** Retorna null se o fix for impreciso demais (evita recálculo falso com GPS ruim). */
  update(fix: Fix): Update | null {
    if (fix.accuracyM !== undefined && fix.accuracyM > this.opts.maxAccuracyM) return null;
    const { offset, along } = project(fix.pos, this.route.geometry, this.cum);
    const total = this.cum[this.cum.length - 1]!;
    let idx = this.stepAlong.findIndex((a) => a > along + 1);
    if (idx < 0) idx = this.route.steps.length - 1;
    const step = this.route.steps[idx]!;
    const remainingM = Math.max(0, total - along);
    const frac = total > 0 ? remainingM / total : 0;
    this.strikes = offset > this.opts.offRouteM ? this.strikes + 1 : 0;
    const status = remainingM <= this.opts.arrivalM && offset <= this.opts.offRouteM ? "arrived"
      : this.strikes >= this.opts.strikesToRecalc ? "off_route" : "on_route";
    return { status, offsetM: offset, remainingM, remainingS: this.route.duration * frac, stepIndex: idx, step, distanceToStepM: Math.max(0, (this.stepAlong[idx] ?? total) - along) };
  }
}
