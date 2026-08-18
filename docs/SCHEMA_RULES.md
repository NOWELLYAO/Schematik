# Schéma rules

The SVG engine is deterministic.

## Pump branch

Every pump branch is:

**suction header → isolation valve → pump → isolation valve → check valve → discharge header**

The exact elements are enabled/disabled from the project configuration.

## Tank

The tank always contains:
- capacity
- dimensions
- access hatch
- overflow
- drain
- optional high/low level instrumentation
- optional float switch

## Design intent

The graphical engine should be extended with additional symbol families rather than replacing the deterministic renderer with image generation.
