import type {
  EngineEvidence,
  EvidenceType,
  MasteryConfig,
  MasteryDerivation,
  MasteryStatus,
} from "./types.mts";

const STATE_RANK: Record<Exclude<MasteryStatus, "lapsed">, number> = {
  unseen: 0,
  introduced: 1,
  developing: 2,
  functional: 3,
  secure: 4,
};

function stateAffecting(evidence: EngineEvidence, config: MasteryConfig): boolean {
  return (
    evidence.trusted &&
    evidence.isScored &&
    config.state_affecting.allowed_evaluator_confidence.includes(
      evidence.evaluatorConfidence,
    ) &&
    config.state_affecting.allowed_content_kinds.includes(evidence.contentKind)
  );
}

function promotionEligible(evidence: EngineEvidence, config: MasteryConfig): boolean {
  return (
    stateAffecting(evidence, config) &&
    evidence.rating >= config.promotion_eligible.minimum_rating &&
    config.promotion_eligible.allowed_assistance.includes(evidence.assistance) &&
    config.promotion_eligible.allowed_evaluator_confidence.includes(
      evidence.evaluatorConfidence,
    ) &&
    config.promotion_eligible.allowed_content_kinds.includes(evidence.contentKind)
  );
}

function calendarDay(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function maxSuccessDelayDays(events: EngineEvidence[], config: MasteryConfig): number {
  const successes = events
    .filter((event) => promotionEligible(event, config))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  let maximum = 0;
  for (let index = 1; index < successes.length; index += 1) {
    const current = Date.parse(successes[index].occurredAt);
    const previous = Date.parse(successes[index - 1].occurredAt);
    maximum = Math.max(maximum, Math.floor((current - previous) / 86_400_000));
  }
  return maximum;
}

function chooseHighest(
  previous: Exclude<MasteryStatus, "lapsed">,
  current: Exclude<MasteryStatus, "lapsed">,
): Exclude<MasteryStatus, "lapsed"> {
  return STATE_RANK[current] > STATE_RANK[previous] ? current : previous;
}

export interface DeriveMasteryInput {
  requiredEvidenceTypes: EvidenceType[];
  evidence: EngineEvidence[];
  config: MasteryConfig;
  previousState?: MasteryStatus;
  previousHighestState?: Exclude<MasteryStatus, "lapsed">;
  contextual?: boolean;
}

export function deriveMasteryState({
  requiredEvidenceTypes,
  evidence,
  config,
  previousState = "unseen",
  previousHighestState = previousState === "lapsed" ? "functional" : previousState,
  contextual = false,
}: DeriveMasteryInput): MasteryDerivation {
  const ordered = [...evidence].sort((a, b) =>
    a.occurredAt === b.occurredAt
      ? (a.id ?? a.attemptId).localeCompare(b.id ?? b.attemptId)
      : a.occurredAt.localeCompare(b.occurredAt),
  );
  const affecting = ordered.filter((event) => stateAffecting(event, config));
  const eligible = affecting.filter((event) => promotionEligible(event, config));
  const independent = eligible.filter((event) => event.assistance === "independent");

  const sessions = new Set(affecting.map((event) => event.lessonInstanceId));
  const days = new Set(affecting.map((event) => calendarDay(event.occurredAt)));
  const scenarios = new Set(
    affecting
      .map((event) => event.scenarioTag)
      .filter((tag): tag is string => Boolean(tag)),
  );

  const dimensionSummaries: MasteryDerivation["dimensionSummaries"] = {};
  const evidenceTypes = new Set<EvidenceType>([
    ...requiredEvidenceTypes,
    ...affecting.map((event) => event.evidenceType),
  ]);
  for (const evidenceType of evidenceTypes) {
    const dimension = affecting.filter(
      (event) => event.evidenceType === evidenceType,
    );
    const dimensionEligible = dimension.filter((event) =>
      promotionEligible(event, config),
    );
    const latest = dimension.at(-1) ?? null;
    const lastSuccess = dimensionEligible.at(-1) ?? null;
    dimensionSummaries[evidenceType] = {
      scoredEvents: dimension.length,
      eligibleSuccesses: dimensionEligible.length,
      independentSuccesses: dimensionEligible.filter(
        (event) => event.assistance === "independent",
      ).length,
      latestRating: latest?.rating ?? null,
      lastEventAt: latest?.occurredAt ?? null,
      lastSuccessAt: lastSuccess?.occurredAt ?? null,
    };
  }

  const everyRequiredHasEligibleSuccess = requiredEvidenceTypes.every(
    (evidenceType) =>
      (dimensionSummaries[evidenceType]?.eligibleSuccesses ?? 0) >= 1,
  );
  const latestRequiredMeetsFloor = requiredEvidenceTypes.every(
    (evidenceType) =>
      (dimensionSummaries[evidenceType]?.latestRating ?? -1) >=
      config.functional_gate.latest_required_rating_floor,
  );

  const functional =
    affecting.length >= config.functional_gate.minimum_scored_events &&
    eligible.length >=
      config.functional_gate.minimum_promotion_eligible_successes &&
    independent.length >= config.functional_gate.minimum_independent_successes &&
    sessions.size >= config.functional_gate.minimum_distinct_sessions &&
    (!config.functional_gate.required_evidence_types_each_need_success ||
      everyRequiredHasEligibleSuccess) &&
    latestRequiredMeetsFloor;

  const delayedDays = maxSuccessDelayDays(affecting, config);
  const spontaneousRequired = requiredEvidenceTypes.includes("spontaneous_reuse");
  const spontaneousSuccess =
    (dimensionSummaries.spontaneous_reuse?.eligibleSuccesses ?? 0) >= 1;
  const secure =
    functional &&
    affecting.length >= config.secure_gate.minimum_scored_events &&
    eligible.length >= config.secure_gate.minimum_promotion_eligible_successes &&
    independent.length >= config.secure_gate.minimum_independent_successes &&
    sessions.size >= config.secure_gate.minimum_distinct_sessions &&
    days.size >= config.secure_gate.minimum_distinct_days &&
    delayedDays >= config.secure_gate.minimum_delayed_success_days &&
    (!contextual ||
      scenarios.size >= config.secure_gate.minimum_context_diversity_if_contextual) &&
    (!config.secure_gate.required_evidence_types_each_need_success ||
      everyRequiredHasEligibleSuccess) &&
    (!config.secure_gate.spontaneous_success_required_if_node_requires ||
      !spontaneousRequired ||
      spontaneousSuccess);

  let computed: Exclude<MasteryStatus, "lapsed"> = "unseen";
  if (ordered.length > 0) computed = "introduced";
  if (affecting.length > 0) computed = "developing";
  if (functional) computed = "functional";
  if (secure) computed = "secure";

  const relevantForLapse = affecting.filter((event) =>
    requiredEvidenceTypes.includes(event.evidenceType),
  );
  let consecutiveCoreFailures = 0;
  for (let index = relevantForLapse.length - 1; index >= 0; index -= 1) {
    const event = relevantForLapse[index];
    const failure =
      event.rating <= config.lapse_rule.failure_rating_max &&
      (!config.lapse_rule.failure_must_be_scored || event.isScored) &&
      config.lapse_rule.failure_evaluator_confidence_allowed.includes(
        event.evaluatorConfidence,
      ) &&
      (event.assistance === "independent" || event.assistance === "minor_prompt");
    if (!failure) break;
    consecutiveCoreFailures += 1;
  }

  const canLapse = previousState === "functional" || previousState === "secure";
  const lapsed =
    canLapse &&
    consecutiveCoreFailures >= config.lapse_rule.consecutive_core_failures;

  let state: MasteryStatus = computed;
  if (lapsed) {
    state = "lapsed";
  } else if (previousState === "secure" && STATE_RANK[computed] < STATE_RANK.secure) {
    state = "secure";
  } else if (
    previousState === "functional" &&
    STATE_RANK[computed] < STATE_RANK.functional
  ) {
    state = "functional";
  }

  const highestCurrent = state === "lapsed" ? previousHighestState : state;
  const highestStateAchieved = chooseHighest(previousHighestState, highestCurrent);
  const lastScored = affecting.at(-1) ?? null;
  const lastSuccess = eligible.at(-1) ?? null;
  const prerequisiteReady =
    state !== "lapsed" && config.hard_prerequisite_ready_states.includes(state);

  return {
    state,
    highestStateAchieved,
    prerequisiteReady,
    reviewStatus: state === "lapsed" ? "relearning" : "not_scheduled",
    summary: {
      scoredEvents: affecting.length,
      promotionEligibleSuccesses: eligible.length,
      independentSuccesses: independent.length,
      distinctSessions: sessions.size,
      distinctDays: days.size,
      maxDelayedSuccessDays: delayedDays,
      contextDiversity: scenarios.size,
      consecutiveCoreFailures,
      lastScoredAt: lastScored?.occurredAt ?? null,
      lastSuccessAt: lastSuccess?.occurredAt ?? null,
    },
    dimensionSummaries,
  };
}
