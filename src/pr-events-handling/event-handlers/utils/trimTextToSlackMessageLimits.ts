export function trimTextToSlackMessageLimits(text: string, maxMessageLength = 3000): string {
    if (text.length < maxMessageLength) {
        return text;
    }
    const trimmedText = text.substring(0, maxMessageLength);
    const lastNewLineIndex = trimmedText.lastIndexOf("\n");
    if (lastNewLineIndex != -1) {
        return trimmedText.substring(0, lastNewLineIndex);
    }
    return trimmedText;
}