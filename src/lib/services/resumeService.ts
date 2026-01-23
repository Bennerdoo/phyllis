import { UserProfile, Job } from "@/lib/types";
import { generateText } from "@/lib/gemini";

export class ResumeService {
    /**
     * Generates a tailored version of the user profile based on the job description.
     */
    static async tailorResume(profile: UserProfile, job: Job): Promise<UserProfile> {
        const prompt = `
    You are an expert Resume Writer and ATS Optimizer.
    I will provide you with a User Profile (skills, experience) and a Job Description.
    Your task is to rewrite the User Profile's "summary" and "experience descriptions" to highlight relevant skills for this specific job.
    Do NOT lie, but emphasize relevant parts.
    
    Job Title: ${job.title} at ${job.company}
    Job Description:
    ${job.description.slice(0, 5000)}

    User Profile:
    ${JSON.stringify(profile)}

    Return ONLY a valid JSON object matching the UserProfile interface. Do not add markdown blocks.
    `;

        const result = await generateText(prompt);

        // Clean up markdown block if present
        const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const tailoredProfile = JSON.parse(cleanJson);
            return { ...profile, ...tailoredProfile }; // Merge safely
        } catch (e) {
            console.error("Failed to parse tailored resume JSON", e, result);
            return profile; // Fallback to original
        }
    }
}
