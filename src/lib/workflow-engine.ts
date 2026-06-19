import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { WorkflowStep, STEP_TYPES, TriggerType, TriggerConfig, WorkflowFilter, IfElseCondition } from "./workflow-types";

export async function fireTrigger(
  userId: string,
  triggerType: TriggerType,
  supplierId: string,
  eventData: Record<string, unknown> = {}
) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId, status: "active", triggerType },
    });
    for (const workflow of workflows) {
      const config = workflow.triggerConfig as TriggerConfig;
      if (!matchesTriggerConfig(triggerType, config, eventData)) continue;
      if (config.filters && config.filters.length > 0) {
        const matches = await contactMatchesFilters(supplierId, config.filters);
        if (!matches) continue;
      }
      try {
        await prisma.workflowEnrollment.upsert({
          where: { workflowId_supplierId: { workflowId: workflow.id, supplierId } },
          create: { workflowId: workflow.id, supplierId, status: "active", currentStep: 0, nextRunAt: new Date() },
          update: {},
        });
        await prisma.workflow.update({ where: { id: workflow.id }, data: { enrollCount: { increment: 1 } } });
      } catch { /* already enrolled */ }
    }
  } catch { /* silent fail — don't break the calling action */ }
}

export async function processWorkflowQueue() {
  const now = new Date();
  const pending = await prisma.workflowEnrollment.findMany({
    where: { status: "active", nextRunAt: { lte: now } },
    include: {
      workflow: true,
      supplier: {
        include: {
          tags: { include: { tag: true } },
          fieldValues: { include: { field: true } },
        },
      },
    },
    take: 100,
  });
  for (const enrollment of pending) {
    await processEnrollmentStep(enrollment);
  }
}

type EnrollmentWithIncludes = {
  id: string;
  workflowId: string;
  supplierId: string;
  currentStep: number;
  workflow: { steps: unknown; id: string; userId: string };
  supplier: {
    id: string; companyName: string; contactName: string | null;
    email: string | null; phone: string | null; stage: string;
    tags: { tag: { name: string } }[];
    fieldValues: { field: { name: string }; value: string }[];
  };
};

async function processEnrollmentStep(enrollment: EnrollmentWithIncludes) {
  const steps = enrollment.workflow.steps as WorkflowStep[];
  if (enrollment.currentStep >= steps.length) {
    await prisma.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "completed", completedAt: new Date(), nextRunAt: null } });
    return;
  }

  const step = steps[enrollment.currentStep];
  const supplier = enrollment.supplier;
  const mergeVars: Record<string, string> = {
    firstName: supplier.contactName?.split(" ")[0] ?? supplier.companyName,
    lastName: supplier.contactName?.split(" ").slice(1).join(" ") ?? "",
    companyName: supplier.companyName,
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    senderName: "AMZ OS",
  };
  const render = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => mergeVars[k] ?? `{{${k}}}`);

  try {
    let nextRunAt: Date | null = new Date();
    let nextStep = enrollment.currentStep + 1;
    let shouldEnd = false;

    switch (step.type) {
      case STEP_TYPES.WAIT: {
        const a = step.waitAmount ?? 1;
        const u = step.waitUnit ?? "days";
        const ms = u === "minutes" ? a * 60_000 : u === "hours" ? a * 3_600_000 : a * 86_400_000;
        nextRunAt = new Date(Date.now() + ms);
        break;
      }
      case STEP_TYPES.WAIT_UNTIL: {
        const t = new Date();
        if (step.waitUntilDayOfWeek !== undefined) while (t.getDay() !== step.waitUntilDayOfWeek) t.setDate(t.getDate() + 1);
        if (step.waitUntilTime) {
          const [h, m] = step.waitUntilTime.split(":").map(Number);
          t.setHours(h, m, 0, 0);
          if (t <= new Date()) t.setDate(t.getDate() + 7);
        }
        nextRunAt = t;
        break;
      }
      case STEP_TYPES.SEND_EMAIL: {
        if (supplier.email && step.emailSubject && step.emailBody)
          await sendEmail({ to: supplier.email, subject: render(step.emailSubject), html: render(step.emailBody), from: step.emailFrom });
        break;
      }
      case STEP_TYPES.SEND_SMS: {
        if (supplier.phone && step.smsBody && process.env.SENDBLUE_API_KEY)
          await fetch("https://api.sendblue.co/api/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json", "sb-api-key-id": process.env.SENDBLUE_API_KEY, "sb-api-secret-key": process.env.SENDBLUE_API_SECRET ?? "" },
            body: JSON.stringify({ number: supplier.phone, content: render(step.smsBody), from_number: process.env.SENDBLUE_PHONE ?? "" }),
          });
        break;
      }
      case STEP_TYPES.SEND_INTERNAL_NOTIFY: {
        if (step.notifyTo && step.notifySubject && step.notifyBody)
          await sendEmail({ to: step.notifyTo, subject: render(step.notifySubject), html: `<p>${render(step.notifyBody)}</p>` });
        break;
      }
      case STEP_TYPES.ADD_TAG: {
        if (step.tagId)
          await prisma.contactTag.upsert({ where: { supplierId_tagId: { supplierId: supplier.id, tagId: step.tagId } }, create: { supplierId: supplier.id, tagId: step.tagId }, update: {} });
        break;
      }
      case STEP_TYPES.REMOVE_TAG: {
        if (step.tagId) await prisma.contactTag.deleteMany({ where: { supplierId: supplier.id, tagId: step.tagId } });
        break;
      }
      case STEP_TYPES.UPDATE_CONTACT_FIELD: {
        if (step.fieldId && step.fieldValue !== undefined)
          await prisma.contactFieldValue.upsert({
            where: { fieldId_supplierId: { fieldId: step.fieldId, supplierId: supplier.id } },
            create: { fieldId: step.fieldId, supplierId: supplier.id, value: render(step.fieldValue) },
            update: { value: render(step.fieldValue) },
          });
        break;
      }
      case STEP_TYPES.ADD_NOTE: {
        if (step.noteContent) await prisma.contactNote.create({ data: { supplierId: supplier.id, content: render(step.noteContent), type: step.noteType ?? "workflow" } });
        break;
      }
      case STEP_TYPES.ADD_TASK: {
        if (step.taskTitle) {
          const dueDate = step.taskDueDays ? new Date(Date.now() + step.taskDueDays * 86_400_000) : undefined;
          await prisma.task.create({ data: { userId: enrollment.workflow.userId, title: render(step.taskTitle), dueDate } });
        }
        break;
      }
      case STEP_TYPES.UPDATE_STAGE: {
        if (step.newStage) await prisma.supplier.update({ where: { id: supplier.id }, data: { stage: step.newStage as never } });
        break;
      }
      case STEP_TYPES.CREATE_OPPORTUNITY: {
        if (step.pipelineId && step.stageId)
          await prisma.opportunity.create({
            data: { userId: enrollment.workflow.userId, supplierId: supplier.id, pipelineId: step.pipelineId, stageId: step.stageId, name: step.opportunityName ? render(step.opportunityName) : supplier.companyName, value: step.opportunityValue ?? null },
          });
        break;
      }
      case STEP_TYPES.IF_ELSE: {
        const condMet = evaluateConditions(supplier, step.conditions ?? []);
        const branch = condMet ? (step.trueBranch ?? []) : (step.falseBranch ?? []);
        if (branch.length > 0) {
          const all = [...steps];
          all.splice(enrollment.currentStep + 1, 0, ...branch);
          await prisma.workflow.update({ where: { id: enrollment.workflowId }, data: { steps: all as never } });
        }
        break;
      }
      case STEP_TYPES.GO_TO: {
        if (step.goToStepId) { const idx = steps.findIndex(s => s.id === step.goToStepId); if (idx !== -1) nextStep = idx; }
        break;
      }
      case STEP_TYPES.WEBHOOK: {
        if (step.webhookUrl)
          await fetch(step.webhookUrl, {
            method: step.webhookMethod ?? "POST",
            headers: { "Content-Type": "application/json" },
            body: step.webhookBody ? render(step.webhookBody) : JSON.stringify({ supplierId: supplier.id, companyName: supplier.companyName }),
            signal: AbortSignal.timeout(5000),
          });
        break;
      }
      case STEP_TYPES.AI_ACTION: {
        if (step.aiPrompt && process.env.OPENAI_API_KEY) {
          const OpenAI = (await import("openai")).default;
          const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const res = await ai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: render(step.aiPrompt) }], max_tokens: 500 });
          const output = res.choices[0]?.message.content ?? "";
          if (output) await prisma.contactNote.create({ data: { supplierId: supplier.id, content: output, type: "ai_output" } });
        }
        break;
      }
      case STEP_TYPES.END:
      case STEP_TYPES.REMOVE_FROM_WORKFLOW:
        shouldEnd = true;
        break;
    }

    const historyEntry = { stepIndex: enrollment.currentStep, stepType: step.type, stepLabel: step.label, executedAt: new Date().toISOString() };
    if (shouldEnd) {
      await prisma.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "completed", completedAt: new Date(), nextRunAt: null } });
    } else {
      await prisma.workflowEnrollment.update({ where: { id: enrollment.id }, data: { currentStep: nextStep, nextRunAt, history: { push: historyEntry } as never } });
    }
  } catch (err) {
    await prisma.workflowEnrollment.update({ where: { id: enrollment.id }, data: { status: "error", errorMessage: err instanceof Error ? err.message : String(err), nextRunAt: null } });
  }
}

function matchesTriggerConfig(triggerType: TriggerType, config: TriggerConfig, eventData: Record<string, unknown>): boolean {
  if ((triggerType === "contact.tag_added" || triggerType === "contact.tag_removed") && config.tagId) return eventData.tagId === config.tagId;
  if (triggerType === "contact.stage_changed" && config.toStage) return eventData.toStage === config.toStage;
  if (triggerType === "opportunity.stage_changed" && config.pipelineId) return eventData.pipelineId === config.pipelineId;
  if (triggerType === "opportunity.stale" && config.daysStale) return ((Date.now() - Number(eventData.lastMovedAt)) / 86_400_000) >= config.daysStale;
  if (triggerType === "contact.custom_field_updated" && config.fieldId) {
    if (eventData.fieldId !== config.fieldId) return false;
    if (config.fieldValue && eventData.newValue !== config.fieldValue) return false;
  }
  return true;
}

async function contactMatchesFilters(supplierId: string, filters: WorkflowFilter[]): Promise<boolean> {
  const s = await prisma.supplier.findUnique({ where: { id: supplierId }, include: { tags: { include: { tag: true } }, fieldValues: true } });
  if (!s) return false;
  for (const f of filters) {
    const val = String(
      f.field === "stage" ? s.stage : f.field === "email" ? (s.email ?? "") :
      f.field === "companyName" ? s.companyName : f.field === "tag" ? s.tags.map((t: { tag: { name: string } }) => t.tag.name).join(",") :
      s.fieldValues.find((fv: { fieldId: string; value: string }) => fv.fieldId === f.field)?.value ?? ""
    );
    const match = f.operator === "equals" ? val === f.value : f.operator === "not_equals" ? val !== f.value :
      f.operator === "contains" ? val.toLowerCase().includes((f.value ?? "").toLowerCase()) :
      f.operator === "not_contains" ? !val.toLowerCase().includes((f.value ?? "").toLowerCase()) :
      f.operator === "is_empty" ? !val.trim() : !!val.trim();
    if (!match) return false;
  }
  return true;
}

function evaluateConditions(
  supplier: { stage: string; email: string | null; companyName: string; tags: { tag: { name: string } }[]; fieldValues: { field: { name: string }; value: string }[] },
  conditions: IfElseCondition[]
): boolean {
  if (!conditions.length) return true;
  let result = true;
  for (let i = 0; i < conditions.length; i++) {
    const c = conditions[i];
    const val = String(
      c.field === "stage" ? supplier.stage : c.field === "email" ? (supplier.email ?? "") :
      c.field === "companyName" ? supplier.companyName : c.field === "tag" ? supplier.tags.map(t => t.tag.name).join(",") :
      supplier.fieldValues.find(fv => fv.field.name === c.field)?.value ?? ""
    );
    const r = c.operator === "equals" ? val === c.value : c.operator === "not_equals" ? val !== c.value :
      c.operator === "contains" ? val.toLowerCase().includes((c.value ?? "").toLowerCase()) :
      c.operator === "not_contains" ? !val.toLowerCase().includes((c.value ?? "").toLowerCase()) :
      c.operator === "is_empty" ? !val.trim() : c.operator === "is_not_empty" ? !!val.trim() :
      c.operator === "greater_than" ? parseFloat(val) > parseFloat(c.value ?? "0") :
      parseFloat(val) < parseFloat(c.value ?? "0");
    result = i === 0 ? r : (c.join === "OR" ? result || r : result && r);
  }
  return result;
}
