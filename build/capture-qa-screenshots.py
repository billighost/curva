import asyncio
import os
import threading
import http.server
import socketserver
from playwright.async_api import async_playwright

PORT = 8999
DIRECTORY = r"c:\Users\bb201\Documents\curva"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        httpd.serve_forever()

async def capture():
    artifacts_dir = r"C:\Users\bb201\.gemini\antigravity-ide\brain\1dc32da8-3508-4bcf-b9ac-7fb1ed51836a"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    await asyncio.sleep(0.5)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        url = f"http://127.0.0.1:{PORT}/index.html"
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        
        # 1. Hero
        hero_el = page.locator(".hero")
        await hero_el.screenshot(path=os.path.join(artifacts_dir, "qa_hero_bottle_photo.png"))
        print("Captured: qa_hero_bottle_photo.png")
        
        # 2. Scroll 300px
        await page.evaluate("window.scrollTo(0, 300)")
        await page.wait_for_timeout(800)
        await hero_el.screenshot(path=os.path.join(artifacts_dir, "qa_hero_oil_pouring.png"))
        print("Captured: qa_hero_oil_pouring.png")
        
        # 3. Statement Section
        stmt_el = page.locator(".statement")
        await page.evaluate("document.querySelector('.statement').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await stmt_el.screenshot(path=os.path.join(artifacts_dir, "qa_statement_section.png"))
        print("Captured: qa_statement_section.png")
        
        # 4. Product Section
        product_el = page.locator(".product")
        await page.evaluate("document.querySelector('.product').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await product_el.screenshot(path=os.path.join(artifacts_dir, "qa_product_section.png"))
        print("Captured: qa_product_section.png")
        
        # 5. Collection Section
        collection_el = page.locator(".collection")
        await page.evaluate("document.querySelector('.collection').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await collection_el.screenshot(path=os.path.join(artifacts_dir, "qa_collection_section.png"))
        print("Captured: qa_collection_section.png")
        
        # 6. Ritual Section
        ritual_el = page.locator(".ritual")
        await page.evaluate("document.querySelector('.ritual').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await ritual_el.screenshot(path=os.path.join(artifacts_dir, "qa_ritual_section.png"))
        print("Captured: qa_ritual_section.png")
        
        # 7. Footer
        footer_el = page.locator(".footer")
        await page.evaluate("document.querySelector('.footer').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await footer_el.screenshot(path=os.path.join(artifacts_dir, "qa_footer_flood.png"))
        print("Captured: qa_footer_flood.png")
        
        await browser.close()
        print("ALL QA SCREENSHOTS CAPTURED SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(capture())
