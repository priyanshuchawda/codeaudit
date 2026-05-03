from server import inspect_project, ProjectInput


def test_inspect_project_returns_path():
    result = inspect_project(ProjectInput(project_path="."))
    assert result["project_path"] == "."
