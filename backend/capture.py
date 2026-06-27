import asyncio
import os
import time
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        out_dir = r"d:\Desktop\5-Day AI Agents\livora\frontend\public\screenshots"
        os.makedirs(out_dir, exist_ok=True)

        print("Navigating to app...")
        await page.goto("http://localhost:5173/", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Desktop View
        print("Capturing desktop view...")
        await page.screenshot(path=os.path.join(out_dir, "desktop_view.png"))

        # 2. Mobile View
        print("Capturing mobile view...")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(out_dir, "mobile_view.png"))

        # Reset to desktop
        await page.set_viewport_size({"width": 1280, "height": 800})
        await page.wait_for_timeout(1000)

        # 3. Live Voice Mode (Focus on the mic button)
        print("Capturing live voice mode...")
        # Hover the mic button
        mic_btn = page.locator("button[title='Live Audio Connection']")
        if await mic_btn.count() > 0:
            await mic_btn.hover()
            await page.wait_for_timeout(500)
        
        # Take screenshot of the bottom half or input bar
        input_bar = page.locator("form")
        if await input_bar.count() > 0:
            await input_bar.first.screenshot(path=os.path.join(out_dir, "live_voice.png"))
        else:
            await page.screenshot(path=os.path.join(out_dir, "live_voice.png"))

        # 4. Memory In Action
        print("Triggering Memory action...")
        chat_input = page.locator("input[placeholder*='Message']")
        if await chat_input.count() > 0:
            await chat_input.fill("My husband hates zucchini")
            await chat_input.press("Enter")
            print("Waiting for Livora response...")
            await page.wait_for_timeout(5000) # give time for network and genai
            await page.screenshot(path=os.path.join(out_dir, "memory_action.png"))
        else:
            print("Chat input not found.")

        # 5. Morning Briefing
        print("Triggering Morning Briefing...")
        if await chat_input.count() > 0:
            await chat_input.fill("__TRIGGER_MORNING_BRIEFING__")
            await chat_input.press("Enter")
            print("Waiting for Morning Briefing response...")
            await page.wait_for_timeout(8000) # give time for morning briefing
            await page.screenshot(path=os.path.join(out_dir, "morning_briefing.png"))

        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
