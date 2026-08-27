import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (serious.length > 0) {
    const details = serious
      .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
      .join('\n');
    throw new Error(`Serious axe violations found:\n${details}`);
  }
}
