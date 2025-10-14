// services/geminiService.ts
// This service proxies requests to the backend to securely use the Gemini API.
import axios from 'axios';

const getAuthHeader = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
});

const API_ENDPOINT = '/api/index';

export const generatePhraseSuggestions = async (token: string, topic: string): Promise<string[]> => {
    try {
        const response = await axios.post(API_ENDPOINT, {
            action: 'generateSuggestions',
            topic
        }, getAuthHeader(token));

        const suggestions = response.data.suggestions;
        if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
            return suggestions.slice(0, 5); // Ensure we only return up to 5
        }
        return [];
    } catch (error) {
        console.error("Error fetching phrase suggestions from backend:", error);
        return [];
    }
};
