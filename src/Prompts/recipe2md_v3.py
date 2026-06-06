#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "anthropic>=0.40",
# ]
# ///
"""
Convert recipe HTML files or URLs to Markdown format using Claude API.

Supports local HTML files, recipe URLs, or directories.
Uses the Anthropic API to intelligently parse any recipe format.

Usage:
    python recipe_to_markdown.py recipe.html
    python recipe_to_markdown.py https://www.seriouseats.com/best-beef-stew-recipe
    python recipe_to_markdown.py recipe1.html https://example.com/recipe
    python recipe_to_markdown.py ./recipes/
    python recipe_to_markdown.py recipe.html -o ./output/
    python recipe_to_markdown.py recipe.html --model claude-opus-4-8

Environment:
    ANTHROPIC_API_KEY - Required API key for Claude
"""

import argparse
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse

import anthropic


DEFAULT_MODEL = "claude-sonnet-4-6"


SYSTEM_PROMPT = """You are a recipe parser. Your job is to extract recipe information from HTML content and output it in a specific Markdown format.

Extract the following fields:
- title: Recipe name
- prep-time: Preparation/cook time (if available)
- yield: Quantity produced (e.g., "2 loaves", "24 cookies") (if available)
- serves: Number of servings (if available)
- source: Original URL or citation
- tags: Relevant tags based on key ingredients and cuisine type

For tags, include:
- Key proteins: #chicken, #beef, #pork, #shrimp, #fish, #seafood, #tofu, etc.
- Notable spices: #paprika, #cumin, #saffron, #turmeric, #garam-masala, etc.
- Cuisine type: #mexican, #indian, #italian, #thai, #french, etc.
- Diet tags if applicable: #vegetarian, #vegan, #gluten-free
- Always include #import and #paprika-app

Output the recipe in this EXACT format:

```
---
title:      [Title]
prep-time:  [Time if available, otherwise omit this line]
yield:      [Yield if available, otherwise omit this line]
serves:     [Servings if available, otherwise omit this line]
source:     [URL or citation]
tags:       #tag1, #tag2, #import, #paprika-app
---

[Brief description if available in the original, otherwise omit]

::: ingredients
## Ingredients

* Amount ingredient description
* Amount ingredient description

### [Subsection heading if ingredients are grouped]

* Amount ingredient description
:::

::: instructions
## Instructions

1. First step
2. Second step
3. Third step

> [Notes, tips, or anecdotes if present in original]
:::
```

IMPORTANT RULES:
1. Do NOT use bold formatting on ingredient quantities. Write them as plain text (e.g., "* 2 cups flour" not "* **2** cups flour")
2. Preserve ingredient groupings/subsections if present in the original
3. Number all instruction steps sequentially
4. Include notes/tips as a blockquote at the end of instructions if present
5. Only include front matter fields that have values (omit empty ones)
6. Output ONLY the markdown content, no explanations or commentary
7. Clean up any HTML artifacts or encoding issues in the text
"""


def is_url(s: str) -> bool:
    """Check if string is a URL."""
    try:
        result = urlparse(s)
        return result.scheme in ('http', 'https')
    except ValueError:
        return False


def fetch_url(url: str) -> str:
    """Fetch HTML content from URL."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
    }

    request = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            # Try to detect encoding
            charset = response.headers.get_content_charset() or 'utf-8'
            return response.read().decode(charset, errors='replace')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP error fetching {url}: {e.code} {e.reason}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"URL error fetching {url}: {e.reason}")


def extract_filename_from_url(url: str) -> str:
    """Generate a reasonable filename from a URL."""
    parsed = urlparse(url)
    path = parsed.path.strip('/')

    if path:
        # Use last path segment
        name = path.split('/')[-1]
        # Remove extension if present
        name = re.sub(r'\.(html?|php|aspx?)$', '', name, flags=re.IGNORECASE)
        # Clean up
        name = re.sub(r'[^\w\-]', '_', name)
        if name:
            return name

    # Fallback to domain
    return re.sub(r'[^\w\-]', '_', parsed.netloc)


def extract_text(message: anthropic.types.Message) -> str:
    """Pull the text content from a Messages API response by block type.

    Avoids assuming the text lives at content[0]; concatenates all text blocks.
    """
    parts = [block.text for block in message.content if block.type == "text"]
    if not parts:
        raise RuntimeError("Claude returned no text content")
    return "".join(parts)


def convert_with_claude(html_content: str, source: str, api_key: str, model: str) -> str:
    """Use Claude API to parse HTML and generate Markdown."""
    client = anthropic.Anthropic(api_key=api_key)

    # Truncate very long HTML to avoid token limits
    max_chars = 100000
    if len(html_content) > max_chars:
        html_content = html_content[:max_chars] + "\n... [truncated]"

    user_prompt = f"""Parse this recipe HTML and convert it to the specified Markdown format.

Source: {source}

HTML Content:
{html_content}"""

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[
            {"role": "user", "content": user_prompt}
        ],
        system=SYSTEM_PROMPT
    )

    response_text = extract_text(message)

    # Clean up response - remove markdown code fences if present
    response_text = re.sub(r'^```(?:markdown)?\s*\n', '', response_text)
    response_text = re.sub(r'\n```\s*$', '', response_text)

    return response_text.strip()


def process_input(
    input_source: str,
    output_dir: Path | None,
    api_key: str,
    model: str,
    verbose: bool,
) -> tuple[Path | None, str | None]:
    """
    Process a single input (file or URL).
    Returns (output_path, error_message).
    """
    try:
        if is_url(input_source):
            if verbose:
                print(f"Fetching URL: {input_source}")
            html_content = fetch_url(input_source)
            base_name = extract_filename_from_url(input_source)
            source = input_source
        else:
            input_path = Path(input_source)
            if not input_path.exists():
                return None, f"File not found: {input_source}"
            if input_path.suffix.lower() not in ['.html', '.htm']:
                return None, f"Expected HTML file: {input_source}"

            if verbose:
                print(f"Reading file: {input_path}")
            html_content = input_path.read_text(encoding='utf-8', errors='replace')
            base_name = input_path.stem
            source = str(input_path)

        # Convert using Claude
        if verbose:
            print(f"Parsing with Claude API ({model})...")
        markdown_content = convert_with_claude(html_content, source, api_key, model)

        # Determine output path
        if output_dir:
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{base_name}.md"
        elif is_url(input_source):
            output_path = Path(f"{base_name}.md")
        else:
            output_path = Path(input_source).with_suffix('.md')

        # Write output
        output_path.write_text(markdown_content, encoding='utf-8')

        return output_path, None

    except Exception as e:
        return None, str(e)


def collect_inputs(inputs: list[str]) -> list[str]:
    """Collect all inputs (files and URLs) from the provided arguments."""
    collected = []

    for input_str in inputs:
        if is_url(input_str):
            collected.append(input_str)
        else:
            path = Path(input_str)

            if path.is_dir():
                # Collect all HTML files in directory
                for ext in ['*.html', '*.htm']:
                    collected.extend(str(f) for f in path.glob(ext))
            elif path.exists():
                collected.append(str(path))
            else:
                # Try glob pattern
                expanded = list(Path('.').glob(input_str))
                if expanded:
                    collected.extend(str(f) for f in expanded)
                else:
                    print(f"Warning: No files found matching '{input_str}'", file=sys.stderr)

    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for item in collected:
        if item not in seen:
            seen.add(item)
            unique.append(item)

    return unique


def main():
    parser = argparse.ArgumentParser(
        description='Convert recipe HTML files or URLs to Markdown using Claude API.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s recipe.html
    %(prog)s https://www.seriouseats.com/best-beef-stew-recipe
    %(prog)s recipe1.html https://example.com/recipe
    %(prog)s ./recipes/
    %(prog)s recipe.html -o ./output/
    %(prog)s recipe.html --model claude-opus-4-8

Environment:
    ANTHROPIC_API_KEY - Required API key for Claude
        """
    )
    parser.add_argument(
        'inputs',
        nargs='+',
        help='HTML files, URLs, wildcards, or directories to process'
    )
    parser.add_argument(
        '-o', '--output-dir',
        type=Path,
        help='Output directory (default: same directory as input, or current dir for URLs)'
    )
    parser.add_argument(
        '-m', '--model',
        default=DEFAULT_MODEL,
        help=f'Anthropic model to use (default: {DEFAULT_MODEL})'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Print detailed progress'
    )
    parser.add_argument(
        '--api-key',
        help='Anthropic API key (default: ANTHROPIC_API_KEY env var)'
    )

    args = parser.parse_args()

    # Get API key. Prefer ANTHROPIC_API_KEY (matches docs); fall back to
    # TRANSCRIPT_API_KEY for compatibility with the older transcript pipeline env.
    api_key = (
        args.api_key
        or os.environ.get('ANTHROPIC_API_KEY')
        or os.environ.get('TRANSCRIPT_API_KEY')
    )
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable or --api-key required", file=sys.stderr)
        sys.exit(1)

    # Collect all inputs
    all_inputs = collect_inputs(args.inputs)

    if not all_inputs:
        print("Error: No valid inputs found to process.", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Found {len(all_inputs)} input(s) to process")

    # Process each input
    success_count = 0
    error_count = 0

    for input_source in all_inputs:
        output_path, error = process_input(
            input_source,
            args.output_dir,
            api_key,
            args.model,
            args.verbose
        )

        if error:
            error_count += 1
            print(f"\u2717 Error processing {input_source}: {error}", file=sys.stderr)
        else:
            success_count += 1
            if args.verbose:
                print(f"\u2713 {input_source} -> {output_path}")
            else:
                print(f"Converted: {output_path}")

    # Summary
    if args.verbose or error_count > 0:
        print(f"\nProcessed {success_count} input(s), {error_count} error(s)")

    sys.exit(0 if error_count == 0 else 1)


if __name__ == '__main__':
    main()
