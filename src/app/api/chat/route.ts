import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: Request) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Claude Code, an agentic coding assistant that lives in the terminal. You help developers write, debug, and understand code. You can read files, write code, run commands, and reason about codebases. 

Key behaviors:
- Be concise and technical
- Format code with markdown code blocks including language identifiers
- When suggesting file changes, show the exact code with proper syntax highlighting
- Use tool-use style formatting when describing actions (e.g., 📖 Reading file, ✏️ Writing file, ▶️ Running command)
- Break complex tasks into clear steps
- Always explain your reasoning briefly before code suggestions
- Use relative file paths when discussing code
- Be proactive in identifying potential issues

Your responses should be helpful, accurate, and formatted for maximum readability in a terminal-like interface.`,
        },
        ...messages,
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const usage = completion.usage;

    return Response.json({
      content,
      model: model || "claude-sonnet-4",
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
          }
        : undefined,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
