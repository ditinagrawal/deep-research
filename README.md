# Deep Research

A powerful AI-driven web research tool that conducts deep, recursive research on topics by generating search queries, finding relevant information online, and learning from search results to ask intelligent follow-up questions.

## Features

- **Recursive Research:** Performs multi-level research with configurable depth and breadth
- **Intelligent Query Generation:** Creates targeted search queries based on your research topic
- **Web Search Integration:** Uses Exa Search API for live web crawling and content retrieval
- **Relevance Evaluation:** Automatically evaluates search results for relevance to your query
- **Learning & Follow-up:** Generates learnings and follow-up questions to explore topics thoroughly
- **Automatic Report Generation:** Compiles research findings into comprehensive reports

## Prerequisites

- Node.js or [Bun](https://bun.sh) runtime
- Exa Search API key
- OpenAI API key

## Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd deep-research

# Install dependencies
bun install
# or
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
EXASEARCH_API_KEY=your-exa-search-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Usage

```bash
# Run the default research example
bun run index.ts

# To use in your own projects
import { deepResearch, generateReport } from './path-to-deep-research';

const research = await deepResearch('your research query', depth, breadth);
const report = await generateReport(research);
```

### Parameters

- **prompt** (string): The research query to explore
- **depth** (number, default: 2): How many levels of recursive research to perform
- **breadth** (number, default: 2): How many search queries to generate at each level

## How It Works

1. Generates multiple search queries based on your initial prompt
2. Searches the web for each query using Exa Search API
3. Evaluates the relevance of each search result
4. Extracts learnings and generates follow-up questions from relevant results
5. Recursively researches follow-up questions to the specified depth
6. Compiles findings into a comprehensive research report

## Technologies Used

- TypeScript
- OpenAI API (GPT-4o)
- Exa Search API for web search
- AI SDK
- Zod for schema validation
- Dotenv for environment management
