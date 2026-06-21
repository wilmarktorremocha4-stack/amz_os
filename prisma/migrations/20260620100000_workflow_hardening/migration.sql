CREATE TABLE IF NOT EXISTS "WorkflowExecutionLog" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "supplierId" TEXT,
    "supplierName" TEXT,
    "stepId" TEXT,
    "stepType" TEXT,
    "stepLabel" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "errorDetail" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowExecutionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowNote" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowVersion" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "savedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowExecutionLog_workflowId_createdAt_idx" ON "WorkflowExecutionLog"("workflowId", "createdAt");

ALTER TABLE "WorkflowExecutionLog" ADD CONSTRAINT "WorkflowExecutionLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowNote" ADD CONSTRAINT "WorkflowNote_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
