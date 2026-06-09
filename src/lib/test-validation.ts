import type { TestItem, TestResult, TestResultStatus } from "@prisma/client";

export interface MissingTestInfo {
  missingItems: (TestItem & { result?: TestResult | null })[];
  hasMissing: boolean;
  missingCount: number;
  missingNames: string[];
}

export function getMissingRequiredTests(
  testItems: TestItem[],
  testResults: TestResult[]
): MissingTestInfo {
  const missingItems = testItems.filter((item) => {
    if (!item.isRequired) return false;
    const result = testResults.find((r) => r.testItemId === item.id);
    return (
      !result ||
      result.resultStatus === ("PENDING" as TestResultStatus) ||
      result.resultStatus === ("NOT_TESTED" as TestResultStatus)
    );
  });

  const missingItemsWithResult = missingItems.map((item) => ({
    ...item,
    result: testResults.find((r) => r.testItemId === item.id) || null,
  }));

  return {
    missingItems: missingItemsWithResult,
    hasMissing: missingItems.length > 0,
    missingCount: missingItems.length,
    missingNames: missingItems.map((i) => i.name),
  };
}

export function getFailedTests(
  testResults: TestResult[]
): TestResult[] {
  return testResults.filter(
    (r) => r.resultStatus === ("FAILED" as TestResultStatus)
  );
}

export function hasFailedTests(testResults: TestResult[]): boolean {
  return testResults.some(
    (r) => r.resultStatus === ("FAILED" as TestResultStatus)
  );
}

export function canSampleBeReleased(
  testItems: TestItem[],
  testResults: TestResult[]
): boolean {
  const { hasMissing } = getMissingRequiredTests(testItems, testResults);
  const hasFailed = hasFailedTests(testResults);
  return !hasMissing && !hasFailed;
}

export function getTestSummary(
  testItems: TestItem[],
  testResults: TestResult[]
) {
  const requiredCount = testItems.filter((i) => i.isRequired).length;
  const optionalCount = testItems.filter((i) => !i.isRequired).length;
  const { missingCount } = getMissingRequiredTests(testItems, testResults);
  const failedCount = getFailedTests(testResults).length;
  const passedCount = testResults.filter(
    (r) => r.resultStatus === ("PASSED" as TestResultStatus)
  ).length;

  return {
    total: testItems.length,
    requiredCount,
    optionalCount,
    completedCount: testItems.length - missingCount,
    passedCount,
    failedCount,
    pendingCount: missingCount,
  };
}
