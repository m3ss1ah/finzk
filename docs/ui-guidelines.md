ZK-Aid UI Guidelines
Product Identity

ZK-Aid is a privacy-first scholarship eligibility platform powered by Zero Knowledge proofs.

Core Message:
"Verified Eligibility. Zero Disclosure."

The platform must feel:

Premium fintech

Institutional

Trustworthy

Research-grade

Modern and minimal

Not crypto-hype

Not hacker-themed

Design Philosophy

The UI must communicate:

Privacy

Mathematical correctness

Calm confidence

Transparency without exposure

No clutter.
No visual chaos.
No over-animation.

Visual System
Background

Deep navy charcoal (#0E1117)

Not pitch black

Subtle gradient overlays

Soft radial diffusion (indigo + emerald tone)

Accent Colors

Emerald green → used for verification states

Warm amber gradient → used for primary call-to-actions

Glass Components

backdrop-blur-xl

bg-white/5

border-white/10

Soft depth shadows

Clean rounded corners (rounded-2xl)

Motion Rules

Smooth 300ms transitions

Framer Motion only

No heavy loops

No particle systems

Subtle hover glow only

Optional faint vertical green data lines in background (very low opacity)

Component Architecture

Must create reusable:

GlassCard

StatusBadge

GlowButton

MainLayout wrapper

HeroTerminal (CLI animation component)

Max container width:
1280px

Fully responsive.

Technical Constraints

Next.js App Router

Tailwind CSS

Framer Motion

Lucide icons

No external UI libraries (no MUI, Chakra, ShadCN, Bootstrap)

Clean component structure

Modular code

No unnecessary dependencies

Experience Goals

Student should feel:

Safe

Empowered

Private

Admin should feel:

In control

Efficient

Trusting of system