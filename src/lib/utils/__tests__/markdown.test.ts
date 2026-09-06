import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../markdown";

describe("renderMarkdown", () => {
  it("returns empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("sanitizes script tags out", () => {
    const output = renderMarkdown('<script>alert("xss")</script>hello');
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("alert");
    expect(output).toContain("hello");
  });

  it("renders bold as <strong>", () => {
    const output = renderMarkdown("**bold text**");
    expect(output).toContain("<strong>bold text</strong>");
  });

  it("renders links with target _blank", () => {
    const output = renderMarkdown("[OpenAI](https://openai.com)");
    expect(output).toContain('href="https://openai.com"');
    expect(output).toContain('target="_blank"');
    expect(output).toContain("OpenAI");
  });
});
