
import { GoogleGenAI, Type, Chat } from "@google/genai";
import {
  IngestionOutput,
  TextualAnalysisOutput,
  EmotionAnalysisOutput,
  VisualAnalysisOutput,
  SourceIntelligenceOutput,
  AnalysisResults,
  HistoryItem,
} from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export { Chat };

export const performTextualAnalysis = async (text: string): Promise<TextualAnalysisOutput> => {
  const prompt = `
    Analyze the following text content. Your response must be a single, clean JSON object.

    Text to analyze:
    ---
    ${text.substring(0, 15000)}
    ---
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: `You are an expert Textual Analysis AI. Your purpose is to dissect and understand written content with high accuracy. 
      Perform these tasks:
        1. Summarize the text in 3-4 concise sentences.
        2. Extract up to 5 of the most prominent named entities (people, organizations, locations).
        3. Determine the overall sentiment (Positive, Negative, Neutral).
        4. List the top 5 most relevant keywords or topics.
      Your output must conform to the provided JSON schema.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['summary', 'entities', 'sentiment', 'keywords'],
      },
    }
  });
  
  const jsonString = response.text;
  return JSON.parse(jsonString) as TextualAnalysisOutput;
};

export const performEmotionAnalysis = async (text: string): Promise<EmotionAnalysisOutput> => {
  const prompt = `
    Analyze the emotional tone of the following text. Your response must be a single, clean JSON object.

    Text to analyze:
    ---
    ${text.substring(0, 15000)}
    ---
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: `You are an Emotion Analysis AI specializing in detecting intent and manipulation. 
      Analyze the text to perform these tasks:
        1. Identify the dominant emotion ('Anger', 'Fear', 'Joy', 'Sadness', 'Surprise', 'Neutral', 'Mixed').
        2. Assess the level of emotional manipulation ('Low', 'Medium', 'High'). 'High' or 'Medium' should be used for content that seems designed to provoke a strong emotional reaction (e.g., outrage, fear, extreme excitement) rather than inform.
        3. Provide a brief, one-sentence 'explanation' for your assessment.
      Your output must conform to the provided JSON schema.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dominant_emotion: { type: Type.STRING, enum: ['Anger', 'Fear', 'Joy', 'Sadness', 'Surprise', 'Neutral', 'Mixed'] },
          manipulation_level: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          explanation: { type: Type.STRING },
        },
        required: ['dominant_emotion', 'manipulation_level', 'explanation'],
      },
    }
  });
  
  const jsonString = response.text;
  return JSON.parse(jsonString) as EmotionAnalysisOutput;
};


export const performVisualAnalysis = async (
  imageData: { data: string; mimeType: string } | Array<{ data: string; mimeType: string }>
): Promise<VisualAnalysisOutput> => {
  const commonSchema = {
    type: Type.OBJECT,
    properties: {
      visual_insights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            image: { type: Type.STRING },
            description: { type: Type.STRING },
            labels: { type: Type.ARRAY, items: { type: Type.STRING } },
            manipulation_flag: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          },
          required: ['image', 'description', 'labels', 'manipulation_flag'],
        },
      },
    },
    required: ['visual_insights'],
  };

  let requestBody;

  if (Array.isArray(imageData)) {
    // Video frames analysis
    const prompt = `Analyze the following sequence of frames from a short video clip. Describe the primary action or event taking place, identify key objects, and assess if there is any sign of manipulation. Your response must be a single, clean JSON object.`;
    const textPart = { text: prompt };
    const imageParts = imageData.map(frame => ({ inlineData: { data: frame.data, mimeType: frame.mimeType } }));
    
    requestBody = {
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] },
      config: {
        systemInstruction: `You are an expert digital forensics analyst specializing in video analysis. Your task is to analyze a sequence of frames and provide a structured JSON report summarizing the video's content.
        The JSON object must contain a single key "visual_insights", which is an array containing a single object with these keys:
          - "image": A constant string set to "Video Clip".
          - "description": A detailed, one-paragraph description of the actions and events occurring across the frames.
          - "labels": An array of 5-7 strings describing primary objects or concepts present throughout the video.
          - "manipulation_flag": A string assessing the likelihood of digital manipulation ('Low', 'Medium', 'High') based on consistency between frames.`,
        responseMimeType: 'application/json',
        responseSchema: commonSchema,
      },
    };
  } else {
    // Single image analysis
    const prompt = `Analyze the provided image and respond ONLY with the JSON object described in the system instruction.`;
    const imagePart = { inlineData: { mimeType: imageData.mimeType, data: imageData.data } };

    requestBody = {
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        systemInstruction: `You are an expert digital forensics analyst specializing in image verification. Your task is to analyze an image and provide a structured JSON report.
        The JSON object must contain a single key "visual_insights", which is an array containing a single object with these keys:
          - "image": A constant string set to "Uploaded Image".
          - "description": A detailed, one-paragraph description of the image's content, composition, and any notable actions.
          - "labels": An array of 5-7 strings describing primary objects or concepts.
          - "manipulation_flag": A string assessing the likelihood of digital manipulation ('Low', 'Medium', 'High') based on artifacts, shadows, and consistency.`,
        responseMimeType: 'application/json',
        responseSchema: commonSchema,
      },
    };
  }

  const response = await ai.models.generateContent(requestBody);
  const jsonString = response.text;
  return JSON.parse(jsonString) as VisualAnalysisOutput;
};

export const performSourceIntelligence = async (domain: string): Promise<SourceIntelligenceOutput> => {
    const prompt = `
        Assess the credibility of the domain: ${domain}.
        Focus on reputation for accuracy, potential biases, and fact-checking history.
        
        Your final output must be a single JSON object enclosed in a markdown code block (\`\`\`json).
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are a Source Intelligence Agent. Your goal is to assess the credibility of a web domain using Google Search and provide a structured JSON summary of your findings.
          Your analysis must include:
            1. A 'source_validity' rating: 'High' (trust score 80-100), 'Medium' (40-79), 'Low' (0-39), or 'Unknown'.
            2. An 'evidence' array, containing at least 3 objects with 'description' and 'finding' ('Positive', 'Negative', 'Neutral'). Evidence should be specific (e.g., "Rated 'Mostly Factual' by Media Bias/Fact Check.").
            3. A 'trust_score', a numerical score from 0 to 100 representing the source's overall reliability.
            4. A 'source_validity_explanation', a brief, one-sentence justification for the trust score.
          `,
          tools: [{googleSearch: {}}],
        },
    });
    
    let jsonString = response.text;
    const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);

    if (match && match[1]) {
        jsonString = match[1];
    } else {
        // Fallback for when the model doesn't use markdown fences
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }
    }

    try {
        return JSON.parse(jsonString) as SourceIntelligenceOutput;
    } catch (e) {
        console.error("Failed to parse Source Intelligence JSON:", jsonString);
        throw new Error("Could not parse the source intelligence analysis from the model's response.");
    }
};


export const generateFinalBrief = async function* (
  results: AnalysisResults
): AsyncGenerator<string> {
  const { textual, source, visual } = results;
  
  const formattedEvidence = source?.evidence
    .map(e => `- [${e.finding}] ${e.description}`)
    .join('\n    ');

  const prompt = `
    Synthesize the findings from the structured data below into a final 'Actionable Intelligence Brief'. 
    
    Here is the data:
    ${source ? `
    **Source Credibility Assessment:**
    - Validity: ${source.source_validity}
    - Trust Score: ${source.trust_score}/100
    - Justification: ${source.source_validity_explanation}
    - Supporting Evidence:
    ${formattedEvidence}
    ` : ''}

    ${textual ? `
    **Textual Analysis:**
    - Summary: ${textual.summary}
    - Key Entities: ${textual.entities.join(', ')}
    - Sentiment: ${textual.sentiment}
    - Keywords: ${textual.keywords.join(', ')}
    ` : ''}
    
    ${visual ? `
    **Visual Analysis:**
    - Content Type: ${visual.visual_insights[0].image}
    - Description: ${visual.visual_insights[0].description}
    - Detected Labels: ${visual.visual_insights[0].labels.join(', ')}
    - Manipulation Flag: ${visual.visual_insights[0].manipulation_flag}
    ` : ''}

    ---

    Generate the brief based on the information you have. If a section of data is missing, note it where appropriate in your analysis. Your tone should be objective and analytical.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        systemInstruction: `You are a senior intelligence analyst. Your task is to write a clear, concise, and actionable intelligence brief in Markdown format based on data from various analytical agents.
        
        Structure your brief with these exact sections, using '##' for each heading:
        
        ## Executive Summary
        A 2-3 sentence "so what" conclusion for a busy decision-maker. This is the most critical part.
        
        ## Key Findings
        A bulleted list synthesizing the most important insights. Do not just list the inputs; connect them.
        
        ## Identified Risks
        A bulleted list of potential risks, including both immediate and cascading (second-order) effects. For example, beyond just misinformation, consider potential economic disruption, reputational damage to involved entities, or erosion of public trust.
        
        ## Opportunities
        A bulleted list of proactive solutions, mitigation strategies, and positive actions that could be taken in response to the findings. This should shift from just identifying a problem to suggesting a complete response plan (e.g., "Recommend issuing a policy clarification," "Advocate for independent fact-checking," "Engage corporate partners for support").
        
        ## Overall Confidence Score
        A confidence rating (High, Medium, or Low) in this analysis, with a brief justification. Justify the score by referencing the completeness and reliability of the input data (e.g., 'Confidence is Medium because the source trust score is low.').
        
        Do not include the '---' separator in your output.`
    }
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};

export const startFollowUpChat = (report: string): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a helpful intelligence analyst assistant. The user has just received the following "Actionable Intelligence Brief". Your role is to answer their follow-up questions about this specific brief. Be concise and refer only to the information contained within the brief provided below. Do not invent new information or access external tools.

---
**INTELLIGENCE BRIEF CONTEXT:**
${report}
---
`,
    },
  });
  return chat;
};

export const generateComparisonBrief = async function* (
  reports: HistoryItem[]
): AsyncGenerator<string> {

  const formattedReports = reports.map((item, index) => {
    const { url, timestamp, analysisResults } = item;
    const { textual, source, visual } = analysisResults;

    const formattedEvidence = source?.evidence
      .map(e => `- [${e.finding}] ${e.description}`)
      .join('\n      ');

    return `
    --- REPORT ${index + 1} ---
    Source URL: ${url}
    Analysis Date: ${new Date(timestamp).toUTCString()}
    ${source ? `
    **Source Credibility Assessment:**
    - Validity: ${source.source_validity}
    - Trust Score: ${source.trust_score}/100
    - Supporting Evidence:
      ${formattedEvidence}
    ` : ''}
    ${textual ? `
    **Textual Analysis:**
    - Summary: ${textual.summary}
    - Key Entities: ${textual.entities.join(', ')}
    - Sentiment: ${textual.sentiment}
    ` : ''}
    ${visual ? `
    **Visual Analysis:**
    - Manipulation Flag: ${visual.visual_insights[0].manipulation_flag}
    ` : ''}
    --- END REPORT ${index + 1} ---
    `;
  }).join('\n\n');

  const prompt = `
    Analyze and compare the following intelligence reports. Synthesize the findings into a single, comprehensive 'Comparative Intelligence Brief'.

    Here is the data:
    ${formattedReports}

    ---

    Generate the comparative brief based ONLY on the information provided. Your tone should be objective and analytical.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: `You are a senior intelligence analyst. Your task is to write a clear, concise comparative intelligence brief in Markdown format based on data from multiple reports.
      
      Structure your brief with these exact sections, using '##' for each heading:
      
      ## Comparative Summary
      A 2-3 sentence high-level synthesis of the reports. What is the main story when looking at them together?
      
      ## Key Similarities & Differences
      A bulleted list highlighting the most important overlapping findings (similarities) and conflicting or unique findings (differences). Use subheadings '### Similarities' and '### Differences'.
      
      ## Evolving Trends
      (If applicable, based on timestamps) A bulleted list identifying any trends or changes in the subject matter over time between the reports. If not applicable, state "No significant trends identified."
      
      ## Synthesized Conclusion
      A final assessment that combines the insights from all sources into a unified conclusion. What is the overall takeaway for a decision-maker?
      `,
    }
  });

  for await (const chunk of responseStream) {
    yield chunk.text;
  }
};
