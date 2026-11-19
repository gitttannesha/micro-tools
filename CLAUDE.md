# Micro Tools Site

## Goal
A website of small free tools. Each tool is one page. Ads and more tools get added later.

## Rules
- Stack: plain HTML, CSS and vanilla JavaScript. No framework, no build step.
- Every tool runs fully in the browser. No backend unless I say so.
- Save user data only in localStorage. Never send it anywhere.
- Mobile-first, responsive, supports dark mode, accessible (labels, keyboard use).
- Every tool page has: the tool, a "How to use" section, an FAQ, a "Related tools" block, and a commented placeholder where an ad slot can go later.
- Shared styles live in /assets/style.css. Don't repeat CSS per page.
- Each page needs a unique <title>, meta description, and canonical tag.
- Keep files small and simple. Explain what you changed in plain language.

## Structure
/index.html          home page listing all tools
/tools/<name>/index.html
/assets/style.css
/assets/common.js