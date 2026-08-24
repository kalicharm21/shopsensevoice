```markdown
# ShopSense — Voice-Activated Smart Shopping Assistant

> A production-grade, AI-powered Indian grocery and pantry shopping assistant featuring natural-language voice control, dynamic multi-turn follow-ups, automated recipe decomposition, smart restock intelligence, dietary substitutions, and live deal discovery.

🔗 **Live Demo**: [https://shopsensevoice.vercel.app](https://shopsensevoice.vercel.app)

---

## 200-Word Approach & Technical Design

ShopSense is built with a resilient, voice-first architecture designed to bridge natural conversation with deterministic state management. Voice input is captured using the browser-native **Web Speech API** with continuous audio streaming, active noise decibel gates, and audio buffering to prevent premature truncation during natural pauses. Transcripts pass through a bilingual pipeline (`en-IN` / `hi-IN`) and route into a server-side **Groq LLM gateway** running high-throughput models (`gpt-oss-120b`, `gpt-oss-20b`, `qwen/qwen3.6-27b`).

The core innovation lies in **context-injected intent routing**: the backend cross-references active shopping lists, pantry inventory, and consumption intervals to handle multi-turn conversational ambiguities (e.g., asking *"How many apples?"* and resolving a follow-up answer like *"2 kg"*). Any culinary query dynamically decomposes into 4–6 catalog items with realistic ₹ pricing, category mapping, and nutritional substitutions. Cart modifications, depletion cycles, and budget bounds synchronize via **Zustand with LocalStorage persistence**. If network instability occurs, local regex fallback parsers guarantee uninterrupted offline-ready cart execution.

---

## Approach & Architecture

ShopSense is built with **Next.js (App Router), React, TypeScript, Tailwind CSS, and Zustand**.

* **Continuous Speech Capture**: Uses browser-native speech recognition configured with continuous audio capture and audio activity buffers to prevent short conversational pauses from clipping inputs.
* **Bilingual Multi-Turn Assistant**: Supports seamless language switching (`en-IN` English and `hi-IN` हिन्दी) with follow-up clarification memory (e.g., asking *"How many kgs or pieces of apples?"* when quantity is ambiguous).
* **Groq AI Inference Pipeline**: Conversational transcripts pass through an intelligent routing API (`app/api/voice/route.ts`) that decomposes complex commands, recipe requests, budget constraints, and pantry queries into deterministic, type-safe JSON objects.
* **Algorithmic Transparency & Audit Trail**: Every automated substitution, recipe breakdown, and restock alert is logged with confidence scores and source factors in the AI Decision History.
* **Deterministic Resilience**: If network instability or API rate limits occur, local regex parsers handle essential basket operations to ensure uninterrupted shopping.

---

## System Architecture & Data Flow

```text
[ User Voice Input (English / Hindi) ]
                  │
                  ▼
      [ Web Speech Recognition ]
  (Continuous Stream & Frequency Visualizer)
                  │
                  ▼
       [ Next.js API Gateway ] ◄── Context: Cart, Pantry Stock, Locales
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 [ Intent Router ]   [ Generative Agent ]
 • ADD / REMOVE      • Dynamic Recipe Decomposition
 • ADD_PANTRY        • Depletion Cycle Analysis
 • SEARCH (Budget)   • Live Deal & Discount Matching
 • CLARIFY (Turn 1)  • Dietary Swap Suggestions
        │                   │
        └─────────┬─────────┘
                  ▼
      [ Type-Safe Strict JSON ]
                  │
                  ▼
      [ Zustand Reactive Store ] ──► LocalStorage Persistence
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
[ Lists View ] [ Pantry ] [ Smart Hub ]

```

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

## Feature & Rubric Verification Matrix

| Requirement | Implementation Details |
| --- | --- |
| **Voice Input & NLP** | Web Speech API, continuous buffering, Groq LLM JSON classification, multi-turn follow-ups |
| **Smart Suggestions** | Depletion tracking, restock alerts, dietary swaps, seasonal recommendations |
| **Cart Management** | Voice add/remove/modify, unit-aware math, auto-categorization, LocalStorage persistence |
| **Voice Search & Filters** | Product and brand search with budget limit constraints (e.g., *"Find green tea under ₹300"*) |
| **UI & Feedback** | Responsive Tailwind CSS, real-time waveform bars, speech synthesis, and audit log tracking |
| **Error Handling** | Non-polluting intent routing, strict JSON validation, and local regex fallback recovery |

---

## Project Structure

```text
shopsense/
├── app/
│   ├── api/
│   │   └── voice/
│   │       └── route.ts             # Force-dynamic Groq AI multi-intent inference engine
│   ├── favicon.ico
│   ├── globals.css                  # Tailored themes, transitions & custom scrollbars
│   ├── layout.tsx                   # Safe root layout shell
│   └── page.tsx                     # Main tab orchestrator, hydrated guard & modals
├── components/
│   ├── ActivityView.tsx             # AI Decision Audit Log & confidence metrics
│   ├── DiscoverView.tsx             # Algorithmic recommendations with "Why?" transparency
│   ├── HomeView.tsx                 # Bento grid dashboard & quick recipe planner
│   ├── ListsView.tsx                # Dynamic multi-list manager with aisle groupings
│   ├── Navbar.tsx                   # Top navigation with live count badges
│   ├── PantryView.tsx               # Inventory depletion sliders & restock triggers
│   ├── PlanModal.tsx                # Household recipe scaler & budget calculator
│   ├── SmartHubView.tsx             # Deals discovery, seasonal produce & substitutions
│   ├── VoiceModal.tsx               # Voice assistant modal with STT/TTS & language selector
│   └── WhyModal.tsx                 # Algorithmic decision transparency modal
├── data/
│   └── products.ts                  # Mock Indian grocery catalog and pricing
├── lib/
│   ├── catalogData.ts               # Extended product catalog, deals & substitution maps
│   ├── nlp.ts                       # Client-to-API inference bridge
│   └── substitutes.ts               # Local basket optimizer math
├── store/
│   ├── useShoppingStore.ts          # Zustand store with persistent cart and purchase history
│   └── useVoiceAssistant.ts         # Speech recognition & assistant hook
└── types/
    └── index.ts                     # Central TypeScript interfaces

```

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| **Next.js (App Router)** | Application framework & serverless dynamic routes |
| **React** | Component interface & UI state |
| **TypeScript** | Type-safe data structures and props |
| **Tailwind CSS** | Styling and responsive UI design |
| **Zustand** | Global persistent state management with LocalStorage |
| **Web Speech API** | Browser-native speech recognition & synthesis |
| **Groq SDK** | Fast NLP inference (`gpt-oss-120b`, `qwen3.6-27b`) |
| **Framer Motion** | Animated modal overlays and transitions |
| **Lucide React** | UI icon library |

---

## Getting Started

### Prerequisites

* Node.js 18.x or higher
* npm
* A Groq Cloud API key from [Groq Console](https://console.groq.com)
* Google Chrome, Microsoft Edge, or Safari for voice features

---

### Installation

#### 1. Clone the repository

```bash
git clone [https://github.com/your-username/shopsense.git](https://github.com/your-username/shopsense.git)
cd shopsense

```

#### 2. Install dependencies

```bash
npm install

```

#### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

```

#### 4. Start the development server

```bash
npm run dev

```

The application will be available at:

```text
http://localhost:3000

```

---

## Voice Test Suite

| Category | Example Voice Prompt | Expected Behavior |
| --- | --- | --- |
| **Multi-Item Add** | `"Add 2 kg potatoes and 3 packets of milk"` | Adds both products with quantities, units, and correct categories. |
| **Recipe Breakdown** | `"Add ingredients for Pav Bhaji"` | Decomposes dish into 4–6 core grocery ingredients with estimated pricing. |
| **Clarification Loop** | `"Add apple"` | Assistant asks *"How many kgs or pieces?"*, mic re-opens, and user replies *"2 kg"*. |
| **Pantry Direct Add** | `"Add 5 kg rice to pantry"` | Automatically stores item directly in pantry inventory at 100% capacity. |
| **Price Filtering** | `"Find green tea under ₹300"` | Filters catalog items matching the search query and price cap. |
| **Dietary Substitutions** | `"Add 1 kg of white sugar"` | Adds product and surfaces organic jaggery alternative swap. |
| **Restock Inquiries** | `"What am I running low on?"` | Cross-references purchase cycle timestamps and returns depletion warnings. |
| **Live Deals** | `"Show today's deals and discounts"` | Surfaces active discounted grocery products. |
| **Conversational Query** | `"Will I get free delivery?"` | Answers informationally without altering active shopping lists. |

---

## Future Scope & Production Roadmap

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                           SHOPSENSE ROADMAP                               │
├──────────────────────────┬────────────────────────────────────────────────┤
│ Phase 1: Near-Term       │ • Edge AI Whisper Integration                  │
│ (0 - 3 Months)           │ • Quick-Commerce Price Comparison Engine       │
│                          │ • Multi-Regional Dialect Support (Tamil, etc.) │
├──────────────────────────┼────────────────────────────────────────────────┤
│ Phase 2: Medium-Term     │ • Barcode & Receipt Optical Scanning (OCR)     │
│ (3 - 6 Months)           │ • Collaborative Shared Family Baskets          │
│                          │ • Real-Time On-Device Voice (WebAssembly)      │
├──────────────────────────┼────────────────────────────────────────────────┤
│ Phase 3: Long-Term       │ • Autonomous Re-Ordering via Open Protocols    │
│ (6 - 12 Months)          │ • Personalized Glycemic & Allergen Guardrails  │
│                          │ • Offline-First Edge Sync Engine               │
└──────────────────────────┴────────────────────────────────────────────────┘

```

### 1. Multi-Platform Quick-Commerce Price Aggregation

* **Real-Time Price Scraping & API Hooks**: Integrate with quick-commerce platforms (Blinkit, Zepto, Instamart) to fetch real-time stock levels, delivery times, and price differentials across competing vendors.
* **Smart Basket Splitting**: Automatically route items to specific vendors based on total cost and availability to optimize savings per order.

### 2. Edge AI & On-Device Voice Transcription

* **WebAssembly Whisper Integration**: Run lightweight speech recognition (`whisper.tflite` or `transformers.js`) in-browser using WebAssembly, enabling 100% offline voice command processing.
* **Zero-Latency Intent Matching**: Local embedding matching with indexed vector stores to execute common actions without internet access.

### 3. Optical Barcode & Receipt Scanning (Vision AI)

* **Computer Vision Pantry Ingestion**: Allow users to point their mobile camera at grocery receipts or product barcodes to automatically update pantry inventory in bulk.
* **Expiry Date Extraction**: Parse expiry dates from packaging labels to calculate automated decay curves and alert users before food spoils.

### 4. Collaborative Shared Household Baskets

* **WebSocket Real-Time Sync**: Implement multi-user synchronizations using Supabase Realtime or WebSockets so family members can modify the same grocery list concurrently.
* **Role-Based Permissions**: Support shared household profiles where spending caps, approval requests, and allergy restrictions are managed centrally.

### 5. Health & Nutrition Guardrails

* **Allergen & Diet Profiling**: Allow users to define dietary profiles (e.g., Diabetic-friendly, Gluten-Free, Vegan, Renal Diet).
* **Automated Ingredient Warning**: If a user attempts to add an item containing allergens or refined ingredients, the voice engine will notify them immediately and offer certified alternative suggestions.

---

## License

This project is open-source and intended for evaluation and development purposes by Ishaan Mittal.

```

```