#!/usr/bin/env python3
# Read the file
with open('/media/DATA/projects/autonomous-coding-modus/modus/tests/e2e/accessibility.spec.ts', 'r') as f:
    lines = f.readlines()

# Find and fix line 495 (0-indexed: 494)
# Line 495: const durationMatch = animationDuration.match(/([\\d.]+)s/);
lines[494] = '      const durationMatch = animationDuration.match(/([\\d.e-]+)s/);\n'

# Build new lines starting from line 496
new_lines = lines[:495]  # Keep up to line 495 (0-indexed 494)
new_lines.append('      if (durationMatch) {\n')
new_lines.append('        const durationStr = durationMatch[1];\n')
new_lines.append('        // Parse scientific notation if present (e.g., 1e-05 -> 0.00001)\n')
new_lines.append('        const duration = durationStr.includes(\'e\')\n')
new_lines.append('          ? parseFloat(durationStr)\n')
new_lines.append('          : parseFloat(durationStr);\n')
new_lines.append('        // Allow 0.01s tolerance for CSS precision (1e-05s = 0.00001s)\n')
new_lines.append('        expect(\n')
new_lines.append('          duration,\n')
new_lines.append('          `Animation duration should be 0 or very short with reduced motion, got ${animationDuration}`\n')
new_lines.append('        ).toBeLessThanOrEqual(0.01);\n')
new_lines.append('      }\n')
# Skip old lines 496-502, continue with rest of file starting from line 503
new_lines.extend(lines[503:])

with open('/media/DATA/projects/autonomous-coding-modus/modus/tests/e2e/accessibility.spec.ts', 'w') as f:
    f.writelines(new_lines)

print("Fixed reduced motion test")
