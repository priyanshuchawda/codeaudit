from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel


class ProjectInput(BaseModel):
    project_path: str


mcp = FastMCP("python-fixture")


@mcp.tool()
def inspect_project(input: ProjectInput) -> dict[str, str]:
    """Inspect a project path."""
    return {"project_path": input.project_path}


if __name__ == "__main__":
    mcp.run()
