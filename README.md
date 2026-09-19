# Pathlight

Pathlight is a university-planning and admissions guidance web application built to help students compare study options, understand fit, and make better decisions based on their personal profile and constraints.

This project was built by human developers for a real product concept and is not AI-generated. The code, structure, design choices, and content were created by the team working on this project, not by an automated AI system producing a final result without direct development input.

## What the site does

The app helps students:

- choose a study field and target country
- compare universities based on budget and preference
- understand whether programs match their academic profile
- review recommendations with clear explanations
- see guidance about readiness, trade-offs, and next steps
- save and compare shortlisted programs

The goal is to reduce confusion in the university application process and give a clearer, more personalized path instead of generic search results.

## Main idea behind the project

The platform takes user input such as:

- academic background
- desired field of study
- preferred countries
- budget limits
- personal priorities and constraints

Then it filters and ranks possible universities using a structured decision process rather than relying on vague or random matching.

Instead of simply listing universities, the application explains:

- why a university fits the student
- what may be a weak match
- what requirements need attention
- what the next concrete action should be

## How the app is structured

This project is built with Next.js and TypeScript. It follows a modern web app structure with a frontend interface and supporting logic for recommendation generation, diagnosis, and explanation.

### Main folders

- src/app — app pages and route-level UI
- src/components — reusable interface components
- src/lib — business logic and recommendation engine
- src/data — university and profile-related data
- docs — project documentation, architecture notes, and design reasoning

## Core logic

The recommendation system is not based on a simple AI guess. It uses a deterministic scoring process that evaluates factors such as:

- academic fit
- interest fit
- budget fit
- requirement readiness
- location fit
- user preference fit

The system filters impossible matches first, then ranks valid programs according to score. This keeps the recommendations clear, explainable, and grounded in real rules rather than freeform AI output.

## AI features

The app includes optional AI-powered support for explanation and advisory flows, but the core recommendation logic remains structured and deterministic.

The AI is used as a supportive layer, not as the primary decision engine. In other words, the app does not allow AI to blindly choose what universities seem valid; the filtering and ranking logic is still handled separately and clearly.

## Data and trust model

The project includes a trust system for information quality. Data is labeled according to confidence and source quality instead of treating all values as equal.

This helps the app present information more honestly:

- verified data
- data needing verification
- demo or estimated values

That transparency matters because university applications often involve changing policies, deadlines, and requirements.

## Docs included in the project

The project documentation explains the architecture and logic in more detail:

- docs/ARCHITECTURE.md — project structure and system design
- docs/RECOMMENDATION_ENGINE.md — scoring and ranking process
- docs/AI_USAGE.md — how AI is integrated and used
- docs/DATA_AND_TRUST.md — trust and data labeling model

## Stack used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest
- Zod
- Google Gemini API integration for optional AI features

## Local setup

From the project folder run:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

There is also a Windows launcher file, START_HERE.bat, which is designed to install dependencies, build the app, and start it automatically.

## Project intent

This site is intended to be useful, practical, and understandable for students who are making important education decisions. It is not a dummy template or a generated demo without real engineering logic behind it.

## Final note

This project is a real software product concept built by developers with a clear purpose, real app logic, and structured documentation. It is not AI-generated content pretending to be hand-written work.

The codebase reflects deliberate implementation choices, app architecture, and product thinking aimed at solving a specific problem in the university application journey.
