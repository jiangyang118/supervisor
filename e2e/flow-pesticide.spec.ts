import { test, expect } from '@playwright/test';

test.describe('业务流: 学校端农残不合格 -> 监管端可见', () => {
  test('创建不合格记录并在监管端出现', async ({ page, context }) => {
    const sampleName = `E2E-菠菜-${Date.now()}`;
    // 学校端：进入农残页面并新建不合格
    await page.goto('http://localhost:4200/pesticide-tests', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('农残快检管理')).toBeVisible();
    await page.getByRole('button', { name: '新建' }).click();
    await page.getByTestId('dlg-sample').fill(sampleName);
    await page.getByTestId('dlg-device').fill('PRT-TEST');
    await page.getByTestId('dlg-result').click();
    await page.getByRole('option', { name: '不合格' }).first().click();
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText(sampleName)).toBeVisible();

    // 监管端：进入农残台账，读取 cookie 注入的数据
    const page2 = await context.newPage();
    await page2.goto('http://localhost:4300/ledgers/pesticide', { waitUntil: 'domcontentloaded' });
    await expect(page2.getByText('农残台账')).toBeVisible();
    await expect(page2.getByText(sampleName)).toBeVisible();
  });
});
