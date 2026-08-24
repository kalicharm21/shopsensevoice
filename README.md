# ShopSense — Voice-Activated Smart Shopping Assistant

> A production-grade, AI-powered Indian grocery and pantry shopping assistant featuring natural-language voice control, dynamic multi-turn follow-ups, automated recipe decomposition, smart restock intelligence, dietary substitutions, and live deal discovery.

---

## Overview

ShopSense is a voice-first smart shopping companion designed to streamline grocery management and meal preparation.

Users can speak naturally to add items, modify quantities, request recipe ingredients for any dish, discover seasonal discounts, track pantry runout timelines, and receive contextual voice feedback.

The platform integrates the **Web Speech API**, **Groq Cloud LLM inference**, **Zustand state persistence**, and deterministic recovery logic to deliver an authentic, conversational shopping workflow.

---

## Approach & Architecture

ShopSense is built with **Next.js (App Router), React, TypeScript, Tailwind CSS, and Zustand**.

* **Continuous Speech Capture**: Uses browser-native speech recognition configured with continuous audio capture and audio activity buffers to prevent short conversational pauses from clipping inputs.
* **Bilingual Multi-Turn Assistant**: Supports seamless language switching (`en-IN` English and `hi-IN` हिन्दी) with follow-up clarification memory (e.g., asking *"How many kgs or pieces of apples?"* when quantity is ambiguous).
* **Groq AI Inference Pipeline**: Conversational transcripts pass through an intelligent routing API (`app/api/voice/route.ts`) that decomposes complex commands, recipe requests, budget constraints, and pantry queries into deterministic, type-safe JSON objects.
* **Algorithmic Transparency & Audit Trail**: Every automated substitution, recipe breakdown, and restock alert is logged with confidence scores and source factors in the AI Decision History.
* **Deterministic Resilience**: If network instability or API rate limits occur, local regex parsers handle essential basket operations to ensure uninterrupted shopping.

---

## Key Features

### Voice Shopping & Multi-Turn Clarifications
* Natural-language grocery commands in English and Hindi.
* Multi-item voice additions (e.g., *"Add 2 kg potatoes and 3 packets of milk"*).
* Clarification follow-up memory across turns (e.g., *"Add apple"* → *"How many kgs?"* → *"2 kg"*).
* Live audio visualizer with dynamic decibel frequency bars.
* Voice feedback generated through speech synthesis.

### Intelligent Recipe & Pantry Management
* Universal recipe ingredient decomposition (e.g., *"Ingredients for Pav Bhaji"*, *"Biryani for 4"*, *"Pasta dinner"*).
* Automated pantry runout and consumption cycle tracking.
* Restock alerts based on purchase history and depletion timelines.
* Healthier and cost-effective dietary substitution recommendations.
* Seasonal produce suggestions and curated deal discovery.

### Cart & Budget Controls
* Voice-driven additions, item removals, unit-aware quantity modifications, and item swaps.
* Category organization (Produce, Dairy, Bakery, Pantry, Beverages, Household).
* Budget Guard monitoring in real-time.
* Save-for-later staging and automated checkout history updating.

---

## Project Structure

```text
voice-agent-main/
├── app/
│   ├── api/
│   │   └── voice/
│   │       └── route.ts             # Groq AI multi-intent NLP inference endpoint
│   ├── favicon.ico
│   ├── globals.css                  # Custom styling & soft theme utilities
│   ├── layout.tsx                   # Font-safe root shell
│   └── page.tsx                     # Main Tab Orchestrator & Modal bridge
├── components/
│   ├── ActivityView.tsx             # AI Decision Audit Log & Confidence metrics
│   ├── DiscoverView.tsx             # Algorithmic Recommendation Cards with "Why?" Explanations
│   ├── HomeView.tsx                 # Bento Grid Dashboard & Quick Planner
│   ├── ListsView.tsx                # Checklist & In-Store Aisle View
│   ├── Navbar.tsx                   # Header Navigation with Live Badges
│   ├── PantryView.tsx               # Inventory Tracking & Consumption sliders
│   ├── PlanModal.tsx                # Household Servings & Recipe Budget Scaler
│   ├── SmartHubView.tsx             # Seasonal Deals & Dietary Substitutes
│   ├── VoiceModal.tsx               # Voice Assistant Modal with Language Dropdown
│   └── WhyModal.tsx                 # Algorithmic Decision Transparency Modal
├── data/
│   └── products.ts                  # Mock Indian grocery catalog and pricing
├── lib/
│   ├── nlp.ts                       # Client-to-API inference bridge
│   └── substitutes.ts               # Local basket optimizer math
├── store/
│   ├── useShoppingStore.ts          # Zustand store with persistent cart and purchase history
│   └── useVoiceAssistant.ts         # Speech recognition & assistant hook
└── types/
    └── index.ts                     # Central TypeScript interfaces