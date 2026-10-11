'use strict';
exports.dismissBriefing=async page=>{await page.locator('.briefing-modal').waitFor();await page.locator('.briefing-modal [data-action="close-modal"]').last().click();};
