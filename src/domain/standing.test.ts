import { describe, expect, it } from "vitest";
import { assessOfficers, evaluateStanding, requirementGap } from "./standing";
import type { OfficerEmails, StandingInput } from "./types";

function input(overrides: Partial<StandingInput> = {}): StandingInput {
  return {
    members: 12,
    events: 4,
    plan: "yes",
    planRequired: true,
    officersCount: 4,
    officersRequired: true,
    ...overrides,
  };
}

function emails(overrides: Partial<OfficerEmails> = {}): OfficerEmails {
  return {
    chair: "chair@example.com",
    viceChair: "vice@example.com",
    treasurer: "treasurer@example.com",
    secretary: "secretary@example.com",
    counselor: "counselor@example.com",
    sectionChair: "",
    sectionSac: "",
    sectionStudentRep: "",
    rsac: "",
    regionStudentRep: "",
    additionalRsac: "",
    additionalRegionStudentRep: "",
    ...overrides,
  };
}

describe("officers assessment", () => {
  it("counts ExCom officers, tracks counselor and chair presence, and assesses compliance and core leadership", () => {
    expect(assessOfficers(emails())).toEqual({
      officerCount: 4,
      hasAllOfficers: true,
      missingOfficers: [],
      hasCounselor: true,
      hasChair: true,
      hasReportedOfficers: true,
      hasCoreLeadership: true,
    });
    expect(assessOfficers(emails({ treasurer: "", counselor: "   " }))).toEqual({
      officerCount: 3,
      hasAllOfficers: false,
      missingOfficers: ["Treasurer"],
      hasCounselor: false,
      hasChair: true,
      hasReportedOfficers: true,
      hasCoreLeadership: false,
    });
    expect(
      assessOfficers(emails({ chair: "", viceChair: "", treasurer: "", secretary: "" })),
    ).toEqual({
      officerCount: 0,
      hasAllOfficers: false,
      missingOfficers: ["Chair", "Vice Chair", "Treasurer", "Secretary"],
      hasCounselor: true,
      hasChair: false,
      hasReportedOfficers: true,
      hasCoreLeadership: false,
    });
    expect(
      assessOfficers(
        emails({ chair: "", viceChair: "", treasurer: "", secretary: "", counselor: "" }),
      ),
    ).toEqual({
      officerCount: 0,
      hasAllOfficers: false,
      missingOfficers: ["Chair", "Vice Chair", "Treasurer", "Secretary"],
      hasCounselor: false,
      hasChair: false,
      hasReportedOfficers: false,
      hasCoreLeadership: false,
    });
  });
});

describe("standing", () => {
  it("requires members, events, at least one reported officer or counselor (when required), and the plan when the plan counts", () => {
    expect(evaluateStanding(input())).toBe("good");
    expect(evaluateStanding(input({ members: 11 }))).toBe("needs-support");
    expect(evaluateStanding(input({ events: 3 }))).toBe("needs-support");
    expect(evaluateStanding(input({ hasReportedOfficers: false, officersRequired: true }))).toBe(
      "needs-support",
    );
    expect(evaluateStanding(input({ officersCount: 0, officersRequired: true }))).toBe(
      "needs-support",
    );
    expect(evaluateStanding(input({ officersCount: 1, officersRequired: true }))).toBe("good");
    expect(evaluateStanding(input({ hasReportedOfficers: false, officersRequired: false }))).toBe(
      "good",
    );
    expect(evaluateStanding(input({ members: 30, events: 0 }))).toBe("needs-support");
    expect(evaluateStanding(input({ members: 30, events: 0, plan: "no" }))).toBe("inactive");
    expect(evaluateStanding(input({ members: 0, events: 0, plan: "no" }))).toBe("inactive");
    expect(evaluateStanding(input({ members: null }))).toBe("incomplete");
    expect(evaluateStanding(input({ events: null }))).toBe("incomplete");
    expect(evaluateStanding(input({ plan: "blank" }))).toBe("incomplete");
    expect(evaluateStanding(input({ plan: "unrecognized" }))).toBe("incomplete");
  });

  it("sets the open-cycle plan aside without treating a blank as zero events", () => {
    expect(evaluateStanding(input({ plan: "no", planRequired: false }))).toBe("good");
    expect(
      evaluateStanding(
        input({ plan: "no", planRequired: false, hasReportedOfficers: false }),
      ),
    ).toBe("needs-support");
    expect(evaluateStanding(input({ events: 0, plan: "yes", planRequired: false }))).toBe("inactive");
    expect(evaluateStanding(input({ events: 2, plan: "no", planRequired: false }))).toBe("needs-support");
    expect(evaluateStanding(input({ events: null, planRequired: false }))).toBe("incomplete");
  });
});

describe("requirement gaps", () => {
  it("names the single failed requirement and groups the rest", () => {
    expect(requirementGap(input({ plan: "no" }))).toBe("only-plan");
    expect(requirementGap(input({ events: 2 }))).toBe("only-events");
    expect(requirementGap(input({ members: 4 }))).toBe("only-members");
    expect(requirementGap(input({ hasReportedOfficers: false }))).toBe("only-officers");
    expect(requirementGap(input({ officersCount: 0 }))).toBe("only-officers");
    expect(requirementGap(input({ officersCount: 1 }))).toBe("good");
    expect(requirementGap(input({ hasReportedOfficers: false, plan: "no" }))).toBe("multiple");
    expect(requirementGap(input({ members: 4, events: 0, plan: "no" }))).toBe("multiple");
    expect(requirementGap(input({ events: null }))).toBe("incomplete");
    expect(requirementGap(input())).toBe("good");
  });

  it("drops the plan gap when the plan is not required", () => {
    expect(requirementGap(input({ plan: "no", planRequired: false }))).toBe("good");
    expect(
      requirementGap(input({ plan: "no", planRequired: false, hasReportedOfficers: false })),
    ).toBe("only-officers");
    expect(requirementGap(input({ events: 0, members: 20, plan: "no", planRequired: false }))).toBe(
      "only-events",
    );
  });
});
