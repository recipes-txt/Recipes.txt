#!/usr/bin/env python3

import anthropic
import base64
import os
from pathlib import Path
from typing import List, Optional
import re


class RecipeExtractor:
    """Convert scanned cookbook pages to structured Markdown using Claude."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize with Anthropic API key.
        
        Args:
            api_key: Anthropic API key. If None, reads from ANTHROPIC_API_KEY env var.
        """
        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("TRANSCRIPT_API_KEY")
        )
        # self.model = "claude-sonnet-4-5-20250929"
        self.model = "claude-sonnet-4-0"
    
    def encode_image(self, image_path: str) -> tuple[str, str]:
        """
        Encode image to base64 and detect media type.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (base64_data, media_type)
        """
        with open(image_path, "rb") as f:
            data = base64.standard_b64encode(f.read()).decode("utf-8")
        
        ext = Path(image_path).suffix.lower()
        media_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        media_type = media_types.get(ext, "image/jpeg")
        
        return data, media_type
    
    def build_prompt(self, source_citation: str) -> str:
        """
        Build the extraction prompt with specific formatting instructions.
        
        Args:
            source_citation: Citation for recipe source
            
        Returns:
            Formatted prompt string
        """
        return f"""Extract the recipe from these cookbook pages and convert it to the exact Markdown format specified below.

SOURCE CITATION: {source_citation}

CRITICAL FORMATTING REQUIREMENTS:

1. YAML frontmatter with these exact fields:
   - title: Recipe title
   - subtitle: [optional] Recipe subtitle or short description   
   - prep-time: Preparation time (use recipe's format, e.g., "30 minutes" or "2 hours")
   - yield: Quantity produced (e.g., "24 cookies", "1 loaf")
   - serves: Number of people served (e.g., "4-6", "8")
   - source: "{source_citation}"

2. After frontmatter, include a brief recipe description or anecdote from the recipe author, if available. 

3. Two-column layout using ::: markers:
   - Left column (ingredients): Starts with "::: ingredients", ends with ":::"
   - Right column (instructions): Starts with "::: instructions", ends with ":::"

4. Ingredients section:
   - Use "## Ingredients" header
   - Bullet list with each ingredient on its own line
   - Format: "* Amount ingredient description"
   - If there are subsections (e.g., "For the dough:", "For the filling:"), use ### headers
   - If there's a tips/alternatives section, add "### Additional Tips" at the bottom of ingredients column

5. Instructions section:
   - Use "## Instructions" header
   - Numbered list with each step on its own line
   - Combine multi-column text flow intelligently (read left to right, top to bottom)
   - If recipe spans multiple pages, merge steps in correct order
   - If there's an anecdote or note, add it at bottom as a blockquote (> )

6. Handle multi-page recipes:
   - Merge content logically, not mechanically
   - Steps should flow in cooking order
   - Don't duplicate information that appears on multiple pages
   - Don't include page numbers or running headers / footers that appear in the scanned images

7. Preserve recipe details:
   - Keep exact ingredient amounts and measurements
   - Maintain original cooking temperatures and times
   - Retain any special technique notes or warnings
   - Keep foreign words/terms as written

EXAMPLE OUTPUT STRUCTURE:

```markdown
---
title:      Chocolate Chip Cookies
subtitle:   Grandma's classic recipe
prep-time:  20 minutes
yield:      48 cookies
serves:     12-16
source:     {source_citation}
---

Classic chocolate chip cookies with a crispy edge and chewy center. I prefer to use a mix of semi-sweet chocolate chips and butterscotch chips. 

::: ingredients
## Ingredients

* 2 1/4 cups all-purpose flour
* 1 tsp baking soda
* 1 cup butter, softened
* 3/4 cup granulated sugar
* 2 large eggs
* 2 cups chocolate chips

### Additional Tips

You can substitute dark chocolate for a richer flavor.
:::

::: instructions
## Instructions

1. Preheat oven to 375°F.
2. Mix flour and baking soda in a bowl.
3. Cream butter and sugars until fluffy.
4. Beat in eggs one at a time.
5. Gradually blend in flour mixture.
6. Stir in chocolate chips.
7. Drop rounded tablespoons onto ungreased cookie sheets.
8. Bake 9-11 minutes until golden brown.

Source: source_citation

> This recipe has been in my family for three generations.
:::
```

Now extract the recipe from the provided images. Output ONLY the formatted Markdown, no explanations or additional text."""

    def extract_recipe(
        self, 
        image_paths: List[str], 
        source_citation: str,
        max_tokens: int = 4096
    ) -> str:
        """
        Extract recipe from one or more images.
        
        Args:
            image_paths: List of paths to recipe images (in page order)
            source_citation: Citation for recipe source
            max_tokens: Maximum tokens for response
            
        Returns:
            Formatted Markdown string
        """
        content = []
        
        for img_path in image_paths:
            img_data, media_type = self.encode_image(img_path)
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": img_data,
                },
            })
        
        content.append({
            "type": "text",
            "text": self.build_prompt(source_citation)
        })
        
        message = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{
                "role": "user",
                "content": content
            }]
        )
        
        response_text = message.content[0].text
        
        # Extract markdown if wrapped in code blocks
        if "```markdown" in response_text:
            match = re.search(r"```markdown\s*\n(.*?)\n```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
        elif "```" in response_text:
            match = re.search(r"```\s*\n(.*?)\n```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
        
        return response_text.strip()
    
    def extract_title_from_yaml(self, markdown: str) -> Optional[str]:
        """
        Extract title from YAML frontmatter.
        
        Args:
            markdown: Markdown string with YAML frontmatter
            
        Returns:
            Recipe title or None if not found
        """
        match = re.search(r'^---\s*\ntitle:\s*(.+?)\s*\n', markdown, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return None
    
    def sanitize_filename(self, title: str) -> str:
        """
        Convert recipe title to CamelCase filename.
        
        Args:
            title: Recipe title
            
        Returns:
            CamelCase filename (no extension)
        """
        import unicodedata
        
        # Normalize accented characters to ASCII equivalents
        normalized = unicodedata.normalize('NFKD', title)
        ascii_title = normalized.encode('ASCII', 'ignore').decode('ASCII')
        
        # Remove special characters except spaces and hyphens
        safe = re.sub(r'[^\w\s-]', '', ascii_title)
        
        # Split on whitespace and hyphens, capitalize each word
        words = re.split(r'[\s-]+', safe)
        camel_case = ''.join(word.capitalize() for word in words if word)
        
        return camel_case
    
    def save_recipe(self, markdown: str, output_path: str) -> None:
        """
        Save extracted recipe to file.
        
        Args:
            markdown: Formatted markdown string
            output_path: Path to save file
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(markdown)


def main():
    """Command line interface for recipe extraction."""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description="Extract recipes from scanned cookbook images using Claude AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single page recipe
  python recipe_extract.py recipe.jpg -s "Joy of Cooking"
  
  # Multi-page recipe
  python recipe_extract.py page1.jpg page2.jpg -s "Julia Child"
  
  # With full citation
  python recipe_extract.py scan.jpg -s "Salt, Fat, Acid, Heat by Samin Nosrat"
  
Output file will be named based on the recipe title (e.g., "chocolate_chip_cookies.md")
and saved in the same directory as the first image file.
        """
    )
    
    parser.add_argument(
        "images",
        nargs="+",
        help="One or more image files (in page order for multi-page recipes)"
    )
    
    parser.add_argument(
        "-s", "--source",
        required=True,
        help="Citation for recipe source (e.g., 'Book Title by Author' or URL)"
    )
    
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=4096,
        help="Maximum tokens for API response (default: 4096)"
    )
    
    parser.add_argument(
        "--api-key",
        help="Anthropic API key (defaults to ANTHROPIC_API_KEY env var)"
    )
    
    args = parser.parse_args()
    
    # Validate image files exist
    missing_files = [img for img in args.images if not Path(img).exists()]
    if missing_files:
        print(f"Error: Image files not found:", file=sys.stderr)
        for f in missing_files:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)
    
    # Initialize extractor
    try:
        extractor = RecipeExtractor(api_key=args.api_key)
    except Exception as e:
        print(f"Error: Failed to initialize API client: {e}", file=sys.stderr)
        print("Make sure ANTHROPIC_API_KEY is set or use --api-key", file=sys.stderr)
        sys.exit(1)
    
    # Extract recipe
    print(f"Processing {len(args.images)} image(s)...")
    try:
        markdown = extractor.extract_recipe(
            image_paths=args.images,
            source_citation=args.source,
            max_tokens=args.max_tokens
        )
        
        # Extract title from YAML frontmatter
        title = extractor.extract_title_from_yaml(markdown)
        if not title:
            print("Error: Could not extract title from recipe YAML", file=sys.stderr)
            sys.exit(1)
        
        # Generate filename from title
        filename = extractor.sanitize_filename(title) + ".md"
        
        # Save in same directory as first image
        output_dir = Path(args.images[0]).parent
        output_path = output_dir / filename
        
        extractor.save_recipe(markdown, str(output_path))
        print(f"✓ Recipe extracted: {output_path}")
        
    except Exception as e:
        print(f"✗ Extraction failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()