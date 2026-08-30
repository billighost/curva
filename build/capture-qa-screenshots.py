import asyncio
import os
from playwright.async_api import async_playwright

async def capture():
    artifacts_dir = r"C:\Users\bb201\.gemini\antigravity-ide\brain\1dc32da8-3508-4bcf-b9ac-7fb1ed51836a"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Navigate to local server
        await page.goto("http://127.0.0.1:8899/index.html", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        # 1. Hero section screenshot
        hero_el = page.locator(".hero")
        await hero_el.screenshot(path=os.path.join(artifacts_dir, "qa_hero_bottle_oil.png"))
        print("Captured: qa_hero_bottle_oil.png")
        
        # 2. Scroll a bit so oil flows down from the lip
        await page.evaluate("window.scrollTo(0, 400)")
        await page.wait_for_timeout(800)
        await hero_el.screenshot(path=os.path.join(artifacts_dir, "qa_hero_oil_flowing.png"))
        print("Captured: qa_hero_oil_flowing.png")
        
        # 3. Product section with open-mouth bottle image
        product_el = page.locator(".product")
        await page.evaluate("document.querySelector('.product').scrollIntoView()")
        await page.wait_for_timeout(800)
        await product_el.screenshot(path=os.path.join(artifacts_dir, "qa_product_open_bottle.png"))
        print("Captured: qa_product_open_bottle.png")
        
        # 4. Collection / Counter section
        collection_el = page.locator(".collection")
        await page.evaluate("document.querySelector('.collection').scrollIntoView()")
        await page.wait_for_timeout(800)
        await collection_el.screenshot(path=os.path.join(artifacts_dir, "qa_collection_section.png"))
        print("Captured: qa_collection_section.png")
        
        # 5. Ritual section
        ritual_el = page.locator(".ritual")
        await page.evaluate("document.querySelector('.ritual').scrollIntoView()")
        await page.wait_for_timeout(800)
        await ritual_el.screenshot(path=os.path.join(artifacts_dir, "qa_ritual_section.png"))
        print("Captured: qa_ritual_section.png")
        
        # 6. Footer flood
        footer_el = page.locator(".footer")
        await page.evaluate("document.querySelector('.footer').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await footer_el.screenshot(path=os.path.join(artifacts_dir, "qa_footer_flood.png"))
        print("Captured: qa_footer_flood.png")
        
        await browser.close()
        print("ALL QA SCREENSHOTS CAPTURED SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(capture())
