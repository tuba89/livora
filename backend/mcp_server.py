from mcp.server.fastmcp import FastMCP
import datetime
import platform

# Initialize the FastMCP Server
mcp = FastMCP("LIVORA Utility MCP Server")

@mcp.tool()
def get_weather(city: str) -> str:
    """Gets the current weather for a specific city via wttr.in."""
    import requests
    try:
        response = requests.get(f"https://wttr.in/{city}?format=j1", timeout=5)
        data = response.json()
        temp = data['current_condition'][0]['temp_C']
        return f"Weather in {city}: {temp}°C, {data['current_condition'][0]['weatherDesc'][0]['value']}"
    except:
        return "Weather unavailable."

@mcp.tool()
def get_news(query: str) -> str:
    """Fetches live top headlines from NewsAPI based on user interests."""
    import requests, os
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key: return "News API key missing."
    try:
        res = requests.get(f"https://newsapi.org/v2/top-headlines?q={query}&apiKey={api_key}&pageSize=3").json()
        headlines = [a['title'] for a in res.get('articles', [])]
        return "News:\n" + "\n".join(headlines)
    except:
        return "News unavailable."

if __name__ == "__main__":
    # In production, this would use stdio or SSE. 
    # For testing, we run a local dev server.
    mcp.run(transport='sse')
