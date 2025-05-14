import { google } from '@ai-sdk/google';
import { generateObject, generateText, tool } from 'ai';
import dotenv from 'dotenv';
import Exa from "exa-js";
import fs from 'fs';
import { z } from 'zod';

dotenv.config();

const model = google('gemini-2.0-flash');
const exa = new Exa(process.env.EXASEARCH_API_KEY);

type SearchResult = {
    title: string;
    url: string;
    content: string;
}

type Learning = {
    learning: string;
    followUpQuestion: string[];
}

type Research = {
    query: string | undefined;
    queries: string[];
    searchResults: SearchResult[];
    learnings: Learning[];
    completedQueries: string[];
}

const accumulatedResearch: Research = {
    query: undefined,
    queries: [],
    searchResults: [],
    learnings: [],
    completedQueries: [],
}

const generateSearchQueries = async (query: string , n: number = 3) => {
    const { object : { queries } } = await generateObject({
        model,
        prompt: `Generate ${n} search queries for the following query: ${query}`,
        schema: z.object({
            queries: z.array(z.string()).min(1).max(5),
        }),
    })
    console.log(queries);
    return queries;
}

const searchWeb = async (query: string) => {
    const { results } = await exa.searchAndContents(query, {
        numResults: 1,
        livecrawl: 'always'
    })
    return results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text,
    }) as SearchResult);
}

const searchAndProcess = async (query: string, accumulatedSources: SearchResult[]) => {
    const pendingSearchResults: SearchResult[] = [];
    const finalResults: SearchResult[] = [];
    await generateText({
        model,
        prompt: `Search the web for the following query: ${query}`,
        system: `You are a researcher. You are given a query and you need to search the web for the most relevant results and then evaluate them to determine if they are relevant to the query`,
        maxSteps: 5,
        tools: {
            searchWeb: tool({
                description: 'Search the web for the most relevant results for the given query',
                parameters: z.object({
                    query: z.string().min(1),
                }),
                execute: async ({ query }) => {
                    const results = await searchWeb(query);
                    pendingSearchResults.push(...results);
                    return results;
                }
            }),
            evaluate: tool({
                description: 'Evaluate the relevance of the given search results to the query',
                parameters: z.object({}),
                execute: async () => {
                    const pendingResults = pendingSearchResults.pop()!;
                    const { object: evaluation } = await generateObject({
                        model,
                        prompt: `Evaluate whether the following search result is relevant to the query: ${query}. If the page already exist in the existing sources, then it is irrelevant.
                            
                        <search_result>
                            ${JSON.stringify(pendingResults)}
                        </search_result>

                        <existing_results>
                            ${JSON.stringify(accumulatedSources.map((result) => result.url))}
                        </existing_results>
                        `,
                        output: 'enum',
                        enum: ['relevant', 'irrelevant'],
                    })
                    if (evaluation === 'relevant') {
                        finalResults.push(pendingResults);
                    }
                    return evaluation === 'irrelevant' ? 'Search results are irrelevant. Please search again.' : 'Search results are relevant. End research.';
                }
            })
        }
    })
    return finalResults;
}

const generateLearnings = async (query: string, searchResult: SearchResult) => {
    const { object } = await generateObject({
        model,
        prompt: `The user is researching "${query}". The following search result seemed relevant. Generate a learning and follow-up question from the following search result.
        
        <search_result>
            ${JSON.stringify(searchResult)}
        </search_result>
        `,
        schema: z.object({
            learning: z.string(),
            followUpQuestion: z.array(z.string()),
        })
    })
    return object;
}

export const deepResearch = async (
    prompt: string,
    depth: number = 2,
    breadth: number = 2,
) => {
    if(!accumulatedResearch.query){
        accumulatedResearch.query = prompt;
    }
    if(depth === 0){
        return accumulatedResearch;
    }
    const queries = await generateSearchQueries(prompt, breadth);
    accumulatedResearch.queries = queries;
    for(const query of queries){
        console.log(`Searching for ${query}`);
        const searchResults = await searchAndProcess(query, accumulatedResearch.searchResults);
        accumulatedResearch.searchResults.push(...searchResults);
        for(const result of searchResults){
            console.log(`Generating learning and follow-up question for ${result.url}`);
            const learnings = await generateLearnings(query, result);
            accumulatedResearch.learnings.push(learnings);
            accumulatedResearch.completedQueries.push(query);

            const newQuery = `Overall research goal: ${prompt}
                    Previous queries: ${accumulatedResearch.queries.join(', ')}
                    Follow-up question: ${learnings.followUpQuestion.join(', ')}
                `
            await deepResearch(newQuery, depth - 1, Math.ceil(breadth / 2));
        }
    }
    return accumulatedResearch;
}

export const generateReport = async (research: Research) => {
    const { text } = await generateText({
        model,
        prompt: `Generate a report for the following research: \n\n ${JSON.stringify(research, null, 2)}`,
    })
    return text;
}


const main = async () => {
    const query = 'what do you need to be a fullstack developer using javascript as your primary language.';
    const research = await deepResearch(query);
    const report = await generateReport(research);
    fs.writeFileSync('report.md', report);
}

main();