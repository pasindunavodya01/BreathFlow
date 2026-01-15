from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")
    
    # Wait for the page to load
    page.wait_for_selector("text=BreathFlow")
    
    # Take screenshot of initial state
    page.screenshot(path="verification/1_initial.png")
    
    # Click Start (The big circular button)
    # We can target it by the path d attribute of the play icon or class
    page.click("main button.w-16") 
    
    # Wait a bit for animation
    page.wait_for_timeout(2000)
    
    # Take screenshot of active state
    page.screenshot(path="verification/2_active.png")
    
    # Stop (The second button in the controls area, which is the red-ish one)
    # The controls div has 2 buttons now. The stop button is the second one.
    page.click("main button:nth-child(2)")
    
    # Open Custom Pattern
    page.click("text=+ Custom Pattern")
    page.wait_for_selector("text=Custom Pattern")
    page.screenshot(path="verification/3_custom_modal.png")
    
    # Close modal
    page.click("text=Cancel")
    
    # Open Reports
    # Header button
    page.click("header button")
    page.wait_for_selector("text=History")
    page.screenshot(path="verification/4_reports.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
